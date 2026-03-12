from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import fastf1
import os
import pandas as pd
from datetime import datetime
from sklearn.linear_model import LinearRegression
import numpy as np

app = FastAPI(title="Pit Stop: AI Data Engine")

# Setup CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enable FastF1 Cache
if not os.path.exists('f1_cache'):
    os.makedirs('f1_cache')
fastf1.Cache.enable_cache('f1_cache')

@app.get("/")
def read_root():
    return {"status": "Pit Stop Engine LIVE", "version": "3.0.0", "engine": "FastF1 + Scikit-Learn"}

@app.get("/results/{year}/{gp}")
async def get_results(year: int, gp: str):
    """Detailed race results with telemetry summaries."""
    try:
        session = fastf1.get_session(year, gp, 'R')
        session.load(laps=True)
        results = session.results
        
        data = []
        for _, row in results.head(20).iterrows():
            data.append({
                "abbreviation": row['Abbreviation'],
                "fullName": row['FullName'],
                "team": row['TeamName'],
                "pos": row['ClassifiedPosition'],
                "pts": row['Points'],
                "stints": int(session.laps.pick_driver(row['Abbreviation'])['Stint'].nunique()) if not session.laps.empty else 0
            })

        return {
            "race": f"{year} {gp}",
            "results": data,
            "track_temp": float(session.weather_data['TrackTemp'].mean()) if not session.weather_data.empty else 0
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"API Error: {str(e)}")

@app.get("/predict/simulate/{year}/{gp}")
async def simulate_race(year: int, gp: str):
    """AI Race Simulation using Practice Data and Linear Regression."""
    try:
        session = fastf1.get_session(year, gp, 'FP2')
        session.load(laps=True)
        
        laps = session.laps.pick_accurate()
        drivers = laps['Driver'].unique()
        
        simulation_results = []
        
        for driver in drivers:
            driver_laps = laps.pick_driver(driver)
            if len(driver_laps) < 5: continue
            
            # Predictive Model: Lap Time Degredation vs Tyre Age
            X = driver_laps['TyreLife'].values.reshape(-1, 1)
            y = driver_laps['LapTime'].dt.total_seconds().values
            
            model = LinearRegression().fit(X, y)
            
            degradation = float(model.coef_[0])
            base_pace = float(model.intercept_)
            
            # Predict "Degredation" - slope of the line
            ai_score = base_pace + (degradation * 20)
            
            simulation_results.append({
                "driver": driver,
                "base_pace": round(base_pace, 3),
                "degredation": round(degradation, 4),
                "sim_score": round(ai_score, 3)
            })
            
        simulation_results = sorted(simulation_results, key=lambda x: x['sim_score'])
        
        return {
            "gp": gp,
            "simulation_type": "Tyre Degredation Model",
            "predictions": simulation_results[:10]
        }
    except Exception as e:
        return {"error": "Simulation engine starting up...", "details": str(e)}

@app.get("/telemetry/compare/{year}/{gp}/{d1}/{d2}")
async def compare_telemetry(year: int, gp: str, d1: str, d2: str):
    """Compare two drivers' live telemetry data."""
    try:
        session = fastf1.get_session(year, gp, 'Q')
        session.load(laps=True, telemetry=True)
        
        lap1 = session.laps.pick_driver(d1).pick_fastest()
        lap2 = session.laps.pick_driver(d2).pick_fastest()
        
        tel1 = lap1.get_telemetry()
        tel2 = lap2.get_telemetry()
        
        return {
            "d1": {"code": d1, "speed": float(tel1['Speed'].max()), "throttle": float(tel1['Throttle'].mean())},
            "d2": {"code": d2, "speed": float(tel2['Speed'].max()), "throttle": float(tel2['Throttle'].mean())},
            "delta": round(float(lap1['LapTime'].total_seconds()) - float(lap2['LapTime'].total_seconds()), 3)
        }
    except Exception as e:
        return {"error": "Telemetry sync required.", "details": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
