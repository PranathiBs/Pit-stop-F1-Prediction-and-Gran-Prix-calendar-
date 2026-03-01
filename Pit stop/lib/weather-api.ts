// Weather API Service - OpenWeatherMap

const WEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '';
const WEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    wind_deg: number;
    description: string;
    icon: string;
    main: string;
    rain_probability: number;
    clouds: number;
    visibility: number;
}

export interface ForecastDay {
    date: string;
    day_name: string;
    temp_max: number;
    temp_min: number;
    weather: WeatherData;
    hourly: HourlyForecast[];
}

export interface HourlyForecast {
    time: string;
    temp: number;
    weather: string;
    icon: string;
    rain_probability: number;
    wind_speed: number;
    humidity: number;
}

// Get current weather for a location
export async function getCurrentWeather(lat: string, lon: string): Promise<WeatherData | null> {
    try {
        if (!WEATHER_API_KEY) {
            return getMockWeather();
        }

        const response = await fetch(
            `${WEATHER_BASE}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`,
            { next: { revalidate: 600 } }
        );

        if (!response.ok) return getMockWeather();

        const data = await response.json();

        return {
            temp: Math.round(data.main.temp),
            feels_like: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            wind_speed: data.wind?.speed || 0,
            wind_deg: data.wind?.deg || 0,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            main: data.weather[0].main,
            rain_probability: data.rain ? 80 : data.clouds?.all > 70 ? 40 : 10,
            clouds: data.clouds?.all || 0,
            visibility: data.visibility || 10000,
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        return getMockWeather();
    }
}

// Get 5-day forecast
export async function getForecast(lat: string, lon: string): Promise<ForecastDay[]> {
    try {
        if (!WEATHER_API_KEY) {
            return getMockForecast();
        }

        const response = await fetch(
            `${WEATHER_BASE}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`,
            { next: { revalidate: 1800 } }
        );

        if (!response.ok) return getMockForecast();

        const data = await response.json();

        // Group by day
        const days: { [key: string]: ForecastDay } = {};

        data.list.forEach((item: Record<string, unknown>) => {
            const date = (item.dt_txt as string).split(' ')[0];
            const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

            if (!days[date]) {
                const weather = (item.weather as Array<{ description: string; icon: string; main: string }>)[0];
                const main = item.main as { temp: number; temp_max: number; temp_min: number; feels_like: number; humidity: number };
                const wind = item.wind as { speed: number; deg: number };
                const clouds = item.clouds as { all: number };

                days[date] = {
                    date,
                    day_name: dayOfWeek,
                    temp_max: Math.round(main.temp_max),
                    temp_min: Math.round(main.temp_min),
                    weather: {
                        temp: Math.round(main.temp),
                        feels_like: Math.round(main.feels_like),
                        humidity: main.humidity,
                        wind_speed: wind?.speed || 0,
                        wind_deg: wind?.deg || 0,
                        description: weather.description,
                        icon: weather.icon,
                        main: weather.main,
                        rain_probability: item.pop ? (item.pop as number) * 100 : 0,
                        clouds: clouds?.all || 0,
                        visibility: (item.visibility as number) || 10000,
                    },
                    hourly: []
                };
            }

            const weather = (item.weather as Array<{ description: string; icon: string; main: string }>)[0];
            const main = item.main as { temp: number; humidity: number };
            const wind = item.wind as { speed: number };

            days[date].hourly.push({
                time: (item.dt_txt as string).split(' ')[1].substring(0, 5),
                temp: Math.round(main.temp),
                weather: weather.main,
                icon: weather.icon,
                rain_probability: item.pop ? (item.pop as number) * 100 : 0,
                wind_speed: wind?.speed || 0,
                humidity: main.humidity,
            });

            // Update max/min
            const tempMax = (item.main as { temp_max: number }).temp_max;
            const tempMin = (item.main as { temp_min: number }).temp_min;
            if (Math.round(tempMax) > days[date].temp_max) {
                days[date].temp_max = Math.round(tempMax);
            }
            if (Math.round(tempMin) < days[date].temp_min) {
                days[date].temp_min = Math.round(tempMin);
            }
        });

        return Object.values(days).slice(0, 5);
    } catch (error) {
        console.error('Error fetching forecast:', error);
        return getMockForecast();
    }
}

// Get weather icon emoji
export function getWeatherEmoji(main: string): string {
    const icons: { [key: string]: string } = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '🌨️',
        'Mist': '🌫️',
        'Fog': '🌫️',
        'Haze': '🌫️',
        'Smoke': '🌫️',
    };
    return icons[main] || '🌤️';
}

// Get weather condition for tyre strategy
export function getTrackCondition(weather: WeatherData): 'DRY' | 'DAMP' | 'WET' | 'VERY_WET' {
    if (weather.main === 'Thunderstorm' || weather.rain_probability > 80) return 'VERY_WET';
    if (weather.main === 'Rain' || weather.rain_probability > 50) return 'WET';
    if (weather.main === 'Drizzle' || weather.rain_probability > 30) return 'DAMP';
    return 'DRY';
}

// Mock data when API key is not available
function getMockWeather(): WeatherData {
    return {
        temp: 24,
        feels_like: 26,
        humidity: 55,
        wind_speed: 3.5,
        wind_deg: 180,
        description: 'partly cloudy',
        icon: '02d',
        main: 'Clouds',
        rain_probability: 15,
        clouds: 35,
        visibility: 10000,
    };
}

function getMockForecast(): ForecastDay[] {
    const days = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday'];
    const conditions = [
        { main: 'Clear', desc: 'clear sky', icon: '01d', rainProb: 5 },
        { main: 'Clouds', desc: 'scattered clouds', icon: '03d', rainProb: 20 },
        { main: 'Rain', desc: 'light rain', icon: '10d', rainProb: 70 },
        { main: 'Clear', desc: 'clear sky', icon: '01d', rainProb: 10 },
        { main: 'Clouds', desc: 'few clouds', icon: '02d', rainProb: 15 },
    ];

    return days.map((day, i) => {
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() + i);

        return {
            date: baseDate.toISOString().split('T')[0],
            day_name: day,
            temp_max: 26 + Math.floor(Math.random() * 8),
            temp_min: 16 + Math.floor(Math.random() * 5),
            weather: {
                temp: 22 + Math.floor(Math.random() * 8),
                feels_like: 24 + Math.floor(Math.random() * 6),
                humidity: 45 + Math.floor(Math.random() * 30),
                wind_speed: 2 + Math.random() * 5,
                wind_deg: Math.floor(Math.random() * 360),
                description: conditions[i].desc,
                icon: conditions[i].icon,
                main: conditions[i].main,
                rain_probability: conditions[i].rainProb,
                clouds: 20 + Math.floor(Math.random() * 60),
                visibility: 8000 + Math.floor(Math.random() * 2000),
            },
            hourly: Array.from({ length: 8 }, (_, h) => ({
                time: `${String(h * 3).padStart(2, '0')}:00`,
                temp: 18 + Math.floor(Math.random() * 10),
                weather: conditions[i].main,
                icon: conditions[i].icon,
                rain_probability: conditions[i].rainProb + Math.floor(Math.random() * 20) - 10,
                wind_speed: 2 + Math.random() * 4,
                humidity: 50 + Math.floor(Math.random() * 25),
            })),
        };
    });
}
