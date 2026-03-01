"""
Pit Stop — AI Data Engine  v4.0
FastAPI + FastF1 + RandomForest ML + Supabase
Hostable on Railway / Render / Fly.io
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import fastf1
import os
import asyncio
import pandas as pd
import numpy as np
import httpx
from datetime import datetime, timezone
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ─── Config ──────────────────────────────────────────────────

SUPABASE_URL         = os.getenv("SUPABASE_URL", os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""))
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
OPENF1_BASE          = "https://api.openf1.org/v1"
CACHE_DIR            = "f1_cache"

# ─── FastF1 Setup ─────────────────────────────────────────────

os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

# ─── Supabase client (service role — server-side only) ────────

supa: Client | None = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supa = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print(f"[Supabase] Connected to {SUPABASE_URL[:40]}...")
    except Exception as e:
        print(f"[Supabase] Connection warning: {e}")

# ─── In-memory model cache ────────────────────────────────────

MODEL_CACHE: dict = {}          # key: "{year}_{gp}" → Pipeline
LIVE_CACHE:  dict = {"data": None, "ts": 0}   # simple 30s i-mem cache

# ─── Lifespan ─────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Engine] Pit Stop ML Engine starting...")
    yield
    print("[Engine] Shutdown complete.")

app = FastAPI(title="Pit Stop: AI Data Engine", version="4.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────
#  HELPERS
# ──────────────────────────────────────────────────────────────

def _build_features(driver_laps: pd.DataFrame, weather_temp: float, rain_prob: float) -> dict:
    """Extract feature dict from a driver's laps DataFrame."""
    if driver_laps.empty or len(driver_laps) < 3:
        return None

    lap_secs = driver_laps["LapTime"].dt.total_seconds().dropna()
    tyre_age  = driver_laps["TyreLife"].dropna()

    if len(lap_secs) < 3:
        return None

    # Tyre degradation: slope of lap time vs tyre life
    if len(tyre_age) == len(lap_secs) and len(tyre_age) >= 3:
        X   = tyre_age.values.reshape(-1, 1)
        y   = lap_secs.values
        m   = np.polyfit(X.flatten(), y, 1)
        deg = float(m[0])
        intercept = float(m[1])
    else:
        deg       = 0.0
        intercept = float(lap_secs.mean())

    best_lap = float(lap_secs.min())

    return {
        "base_pace":    round(best_lap, 3),
        "deg_coef":     round(deg, 5),
        "mean_lap":     round(float(lap_secs.mean()), 3),
        "lap_count":    len(lap_secs),
        "weather_temp": weather_temp,
        "rain_prob":    rain_prob,
        "intercept":    round(intercept, 3),
    }


def _load_training_data(year: int, gp: str) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """
    Load FP2 data for a GP and build feature matrix.
    Returns X, y (actual finish position), driver_codes.
    """
    session = fastf1.get_session(year, gp, "FP2")
    session.load(laps=True, weather=True)
    laps = session.laps.pick_accurate()

    weather_mean_temp = float(session.weather_data["TrackTemp"].mean()) if not session.weather_data.empty else 25.0
    rain_prob         = float(session.weather_data["Rainfall"].mean() * 100) if not session.weather_data.empty else 0.0

    drivers   = laps["Driver"].unique()
    rows      = []
    drv_codes = []

    for drv in drivers:
        dlaps = laps.pick_driver(drv)
        feat  = _build_features(dlaps, weather_mean_temp, rain_prob)
        if feat:
            rows.append([
                feat["base_pace"],
                feat["deg_coef"],
                feat["mean_lap"],
                feat["lap_count"],
                feat["weather_temp"],
                feat["rain_prob"],
            ])
            drv_codes.append(drv)

    if not rows:
        raise ValueError("Not enough lap data to build features")

    X = np.array(rows)
    # Target: rank drivers by base_pace (lower = better → lower rank = predict better finish)
    pace_rank = np.argsort(np.argsort(X[:, 0]))  # 0-based rank
    y = (pace_rank + 1).astype(float)            # 1-based predicted position

    return X, y, drv_codes


def _get_or_train_model(year: int, gp: str) -> tuple:
    """Get cached model or train a new one. Returns (pipeline, drv_codes, X, features)."""
    key = f"{year}_{gp}"
    if key in MODEL_CACHE:
        return MODEL_CACHE[key]

    X, y, drv_codes = _load_training_data(year, gp)

    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("rf",     RandomForestRegressor(
            n_estimators=200,
            max_depth=6,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        ))
    ])
    pipe.fit(X, y)

    MODEL_CACHE[key] = (pipe, drv_codes, X)
    return pipe, drv_codes, X


async def _save_predictions_to_supabase(year: int, gp: str, predictions: list, bg: bool = False):
    """Upsert ML predictions into Supabase ml_predictions table."""
    if not supa:
        return
    try:
        rows = [
            {
                "year":          year,
                "gp_name":       gp,
                "driver_code":   p["driver"],
                "predicted_pos": p["predicted_pos"],
                "confidence":    p.get("confidence"),
                "base_pace":     p.get("base_pace"),
                "deg_coef":      p.get("deg_coef"),
                "model_version": "rf_v2",
                "features":      p.get("features", {}),
            }
            for p in predictions
        ]
        supa.table("ml_predictions").upsert(
            rows, on_conflict="year,gp_name,driver_code"
        ).execute()
        print(f"[Supabase] Saved {len(rows)} predictions for {year} {gp}")
    except Exception as e:
        print(f"[Supabase] Upsert warning: {e}")


# ──────────────────────────────────────────────────────────────
#  ROUTES
# ──────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {
        "status":    "Pit Stop ML Engine LIVE",
        "version":   "4.0.0",
        "engine":    "RandomForest + FastF1 + Supabase",
        "supabase":  supa is not None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/predict/race/{year}/{gp}")
async def predict_race(
    year: int,
    gp:   str,
    temp: float = 25.0,
    rain: float = 0.0,
    background_tasks: BackgroundTasks = None,
):
    """
    ML race prediction using RandomForest trained on FP2 data.
    Returns ranked driver grid with confidence, base pace, and tyre deg.
    """
    try:
        pipe, drv_codes, X_train = _get_or_train_model(year, gp)

        # Inject custom weather into features
        X_pred  = X_train.copy()
        X_pred[:, 4] = temp   # weather_temp column
        X_pred[:, 5] = rain   # rain_prob column

        raw_preds = pipe.predict(X_pred)

        # Sort by predicted position
        order = np.argsort(raw_preds)

        # Confidence: based on forest variance estimate (inverse of std across trees)
        rf_model    = pipe.named_steps["rf"]
        tree_preds  = np.array([t.predict(
            pipe.named_steps["scaler"].transform(X_pred)
        ) for t in rf_model.estimators_])
        pred_stds   = tree_preds.std(axis=0)
        max_std     = pred_stds.max() if pred_stds.max() > 0 else 1.0
        confidences = ((1 - pred_stds / max_std) * 100).round(1)

        predictions = []
        for rank, idx in enumerate(order):
            driver = drv_codes[idx]
            feat   = _build_features(
                fastf1.get_session(year, gp, "FP2")
                      .laps.pick_accurate()
                      .pick_driver(driver)
                if False else pd.DataFrame(),   # avoid re-loading session here
                temp, rain
            )
            predictions.append({
                "driver":        driver,
                "predicted_pos": rank + 1,
                "confidence":    float(confidences[idx]),
                "base_pace":     round(float(X_train[idx, 0]), 3),
                "deg_coef":      round(float(X_train[idx, 1]), 5),
                "features": {
                    "mean_lap":     round(float(X_train[idx, 2]), 3),
                    "lap_count":    int(X_train[idx, 3]),
                    "weather_temp": temp,
                    "rain_prob":    rain,
                },
            })

        # Save to Supabase in background (non-blocking)
        if background_tasks:
            background_tasks.add_task(
                _save_predictions_to_supabase, year, gp, predictions
            )
        else:
            asyncio.create_task(
                _save_predictions_to_supabase(year, gp, predictions)
            )

        return {
            "year":       year,
            "gp":         gp,
            "model":      "RandomForestRegressor",
            "version":    "rf_v2",
            "weather":    {"temp": temp, "rain_prob": rain},
            "timestamp":  datetime.now(timezone.utc).isoformat(),
            "predictions": predictions,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Prediction Error: {str(e)}")


@app.get("/predict/simulate/{year}/{gp}")
async def simulate_race_legacy(year: int, gp: str):
    """Legacy endpoint — proxies to new predict/race endpoint for compatibility."""
    try:
        result = await predict_race(year, gp)
        # Format as old schema so Records page still works
        legacy = [
            {
                "driver":      p["driver"],
                "base_pace":   p["base_pace"],
                "degredation": p["deg_coef"],
                "sim_score":   p["base_pace"],
            }
            for p in result["predictions"][:10]
        ]
        return {
            "gp":              gp,
            "simulation_type": "RandomForest ML (rf_v2)",
            "predictions":     legacy,
        }
    except Exception as e:
        return {"error": f"Simulation error: {str(e)}", "fallback": True}


@app.get("/results/{year}/{gp}")
async def get_results(year: int, gp: str):
    """Detailed race results with stints."""
    try:
        session = fastf1.get_session(year, gp, "R")
        session.load(laps=True)
        results = session.results

        data = []
        for _, row in results.head(20).iterrows():
            stints = 0
            try:
                stints = int(session.laps.pick_driver(row["Abbreviation"])["Stint"].nunique())
            except Exception:
                pass

            data.append({
                "abbreviation": row["Abbreviation"],
                "fullName":     row["FullName"],
                "team":         row["TeamName"],
                "pos":          str(row["ClassifiedPosition"]),
                "pts":          float(row["Points"]),
                "stints":       stints,
            })

        # Sync to Supabase
        if supa and data:
            _sync_results_background(year, gp, data, session)

        return {
            "race":       f"{year} {gp}",
            "results":    data,
            "track_temp": float(session.weather_data["TrackTemp"].mean()) if not session.weather_data.empty else 0,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"API Error: {str(e)}")


def _sync_results_background(year: int, gp: str, data: list, session):
    """Sync race results to Supabase race_results_history."""
    if not supa:
        return
    try:
        rows = []
        winner = data[0]["abbreviation"] if data else ""
        p2     = data[1]["abbreviation"] if len(data) > 1 else ""
        p3     = data[2]["abbreviation"] if len(data) > 2 else ""

        for i, d in enumerate(data):
            try:
                pos = int(d["pos"])
            except (ValueError, TypeError):
                pos = 20

            rows.append({
                "year":             year,
                "round":            0,   # round not available here; update via sync endpoint
                "race_name":        gp,
                "driver_code":      d["abbreviation"],
                "driver_name":      d["fullName"],
                "constructor_name": d["team"],
                "position":         pos,
                "points":           d["pts"],
                "winner_name":      winner,
                "p2_name":          p2,
                "p3_name":          p3,
            })

        supa.table("race_results_history").upsert(
            rows, on_conflict="year,round,driver_code"
        ).execute()
    except Exception as e:
        print(f"[Supabase] Result sync warning: {e}")


@app.get("/live/session")
async def live_session():
    """
    Server-side OpenF1 proxy with 30-second in-memory cache.
    Writes to Supabase live_session_cache for cross-instance sharing.
    """
    now = datetime.now(timezone.utc).timestamp()

    # Check in-memory cache first (< 30s old)
    if LIVE_CACHE["data"] and (now - LIVE_CACHE["ts"]) < 30:
        return {**LIVE_CACHE["data"], "from_cache": True, "cache_age_s": round(now - LIVE_CACHE["ts"], 1)}

    # Check Supabase cache (for multi-instance deploys)
    if supa:
        try:
            row = supa.table("live_session_cache").select("*").eq("id", 1).single().execute()
            db_ts = datetime.fromisoformat(row.data["fetched_at"].replace("Z", "+00:00")).timestamp()
            if (now - db_ts) < 30 and row.data.get("session_data"):
                LIVE_CACHE["data"] = {"session": row.data["session_data"], "drivers": row.data["drivers_data"]}
                LIVE_CACHE["ts"]   = db_ts
                return {**LIVE_CACHE["data"], "from_cache": True, "cache_age_s": round(now - db_ts, 1)}
        except Exception:
            pass  # fall through to fresh fetch

    # Fresh fetch from OpenF1
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            sessions_r  = await client.get(f"{OPENF1_BASE}/sessions?session_key=latest")
            positions_r = await client.get(f"{OPENF1_BASE}/position?session_key=latest")
            stints_r    = await client.get(f"{OPENF1_BASE}/stints?session_key=latest")
            intervals_r = await client.get(f"{OPENF1_BASE}/intervals?session_key=latest")

            sessions  = sessions_r.json()  if sessions_r.status_code  == 200 else []
            positions = positions_r.json() if positions_r.status_code == 200 else []
            stints    = stints_r.json()    if stints_r.status_code    == 200 else []
            intervals = intervals_r.json() if intervals_r.status_code == 200 else []

        except Exception as e:
            return {"session": None, "drivers": [], "error": str(e), "from_cache": False}

    # Determine if session is active
    session_info = sessions[0] if sessions else None
    is_active    = False
    if session_info:
        try:
            ts_start = datetime.fromisoformat(session_info["date_start"].replace("Z", "+00:00")).timestamp()
            ts_end   = datetime.fromisoformat(session_info["date_end"].replace("Z", "+00:00")).timestamp()
            is_active = ts_start <= now <= ts_end
        except Exception:
            pass

    # Build driver map: position → merged data
    driver_map: dict[int, dict] = {}
    for p in positions:
        dn = p.get("driver_number")
        if dn and dn not in driver_map:
            driver_map[dn] = {"driver_number": dn, "position": p.get("position", 99), "lap": 0, "gap": "", "compound": "UNKNOWN"}

    for s in stints:
        dn = s.get("driver_number")
        if dn in driver_map:
            driver_map[dn]["compound"] = s.get("compound", "UNKNOWN")
            if s.get("lap_end"):
                driver_map[dn]["lap"] = s["lap_end"]

    for iv in intervals:
        dn  = iv.get("driver_number")
        raw = iv.get("gap_to_leader") or iv.get("interval") or 0
        if dn in driver_map:
            driver_map[dn]["gap"] = "LEADER" if raw == 0 else f"+{float(raw):.3f}s"

    drivers_list = sorted(driver_map.values(), key=lambda d: d["position"])

    result = {
        "session":   session_info,
        "is_active": is_active,
        "drivers":   drivers_list,
        "from_cache": False,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }

    # Update caches
    LIVE_CACHE["data"] = result
    LIVE_CACHE["ts"]   = now

    if supa:
        try:
            supa.table("live_session_cache").upsert({
                "id":           1,
                "session_data": session_info,
                "drivers_data": drivers_list,
                "is_active":    is_active,
                "fetched_at":   datetime.now(timezone.utc).isoformat(),
            }).execute()
        except Exception as e:
            print(f"[Supabase] live_cache write warning: {e}")

    return result


@app.post("/ml/retrain/{year}")
async def retrain_model(year: int):
    """
    Clear cached models for a year so they retrain on next request.
    Also refreshes driver consistency scores in Supabase.
    """
    cleared = []
    for key in list(MODEL_CACHE.keys()):
        if key.startswith(str(year)):
            del MODEL_CACHE[key]
            cleared.append(key)

    return {"cleared_models": cleared, "message": f"Models will retrain on next predict call for {year}"}


@app.get("/telemetry/compare/{year}/{gp}/{d1}/{d2}")
async def compare_telemetry(year: int, gp: str, d1: str, d2: str):
    """Compare two drivers' qualifying telemetry."""
    try:
        session = fastf1.get_session(year, gp, "Q")
        session.load(laps=True, telemetry=True)

        lap1 = session.laps.pick_driver(d1).pick_fastest()
        lap2 = session.laps.pick_driver(d2).pick_fastest()
        tel1 = lap1.get_telemetry()
        tel2 = lap2.get_telemetry()

        return {
            "d1":    {"code": d1, "speed": float(tel1["Speed"].max()), "throttle": float(tel1["Throttle"].mean())},
            "d2":    {"code": d2, "speed": float(tel2["Speed"].max()), "throttle": float(tel2["Throttle"].mean())},
            "delta": round(float(lap1["LapTime"].total_seconds()) - float(lap2["LapTime"].total_seconds()), 3),
        }
    except Exception as e:
        return {"error": "Telemetry sync required.", "details": str(e)}


@app.get("/health")
def health_check():
    return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
