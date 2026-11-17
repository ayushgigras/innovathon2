"""
Live Weather Service for AAPDA Lens using Open-Meteo API.
Fetches real-time rainfall, precipitation probability, cloud cover, soil moisture saturation,
and mountain storm conditions for Jammu & Kashmir coordinates with zero API key required.
"""

import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional


WMO_WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def get_live_weather(lat: float, lng: float, timeout_seconds: float = 3.5) -> Dict[str, Any]:
    """
    Fetches real-time atmospheric and soil conditions from Open-Meteo for the incident coordinates.
    Evaluates rainfall rate, cloud cover (for satellite pass visibility), and soil saturation for landslide risk.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat:.4f}&longitude={lng:.4f}"
        f"&current=temperature_2m,precipitation,rain,weather_code,cloud_cover,wind_gusts_10m"
        f"&hourly=temperature_2m,precipitation,rain,precipitation_probability,weather_code,cloud_cover,wind_gusts_10m,snow_depth,snowfall,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm"
        f"&timezone=Asia%2FKolkata"
    )

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "AAPDA-Grid-Disaster-Intelligence/1.0"},
        )
        with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                current = data.get("current", {})
                hourly = data.get("hourly", {})

                weather_code = current.get("weather_code", 0)
                weather_desc = WMO_WEATHER_CODES.get(weather_code, f"Code {weather_code}")

                # Current values
                temp_c = current.get("temperature_2m", 0.0)
                precip_mm = current.get("precipitation", 0.0)
                rain_mm = current.get("rain", 0.0)
                cloud_cover_pct = current.get("cloud_cover", 0)
                wind_gusts_kmh = current.get("wind_gusts_10m", 0.0)

                # Next 6-hour forecast averages / peaks
                precip_prob_max = 0
                soil_m_0_1 = 0.0
                soil_m_1_3 = 0.0
                snowfall_cm = 0.0
                snow_depth_m = 0.0

                if hourly:
                    probs = hourly.get("precipitation_probability", [])[:6]
                    precip_prob_max = max(probs) if probs else 0

                    sm1 = hourly.get("soil_moisture_0_to_1cm", [])
                    soil_m_0_1 = sm1[0] if sm1 and sm1[0] is not None else 0.0

                    sm2 = hourly.get("soil_moisture_1_to_3cm", [])
                    soil_m_1_3 = sm2[0] if sm2 and sm2[0] is not None else 0.0

                    snow_f = hourly.get("snowfall", [])
                    snowfall_cm = snow_f[0] if snow_f and snow_f[0] is not None else 0.0

                    snow_d = hourly.get("snow_depth", [])
                    snow_depth_m = snow_d[0] if snow_d and snow_d[0] is not None else 0.0

                # Mountain disaster risk heuristic
                risk = "low"
                reasons = []
                if precip_mm >= 25.0 or (precip_mm >= 10.0 and soil_m_0_1 > 0.35):
                    risk = "critical"
                    reasons.append(f"Torrential rainfall ({precip_mm} mm/h) with high soil saturation ({soil_m_0_1:.2f} m³/m³) creates critical landslide/flash flood hazard.")
                elif precip_mm >= 10.0 or wind_gusts_kmh >= 50.0:
                    risk = "high"
                    reasons.append(f"Heavy precipitation ({precip_mm} mm/h) or severe wind gusts ({wind_gusts_kmh} km/h) active in mountain sector.")
                elif precip_mm >= 2.0 or precip_prob_max >= 70:
                    risk = "moderate"
                    reasons.append(f"Moderate precipitation ({precip_mm} mm/h) with {precip_prob_max}% upcoming rain probability.")
                else:
                    risk = "low"
                    reasons.append(f"Weather stable ({weather_desc}, {temp_c}°C, no severe precipitation).")

                return {
                    "status": "live",
                    "source": "Open-Meteo API (Live)",
                    "temperature_c": temp_c,
                    "precipitation_mm_per_hour": precip_mm,
                    "rain_mm_per_hour": rain_mm,
                    "precipitation_probability_pct": precip_prob_max,
                    "cloud_cover_pct": cloud_cover_pct,
                    "wind_gusts_kmh": wind_gusts_kmh,
                    "snowfall_cm": snowfall_cm,
                    "snow_depth_m": snow_depth_m,
                    "soil_moisture_0_to_1cm": soil_m_0_1,
                    "soil_moisture_1_to_3cm": soil_m_1_3,
                    "weather_code": weather_code,
                    "weather_description": weather_desc,
                    "landslide_weather_risk": risk,
                    "reasons": reasons,
                }
    except Exception as e:
        # Graceful fallback for offline testing or network timeouts
        return {
            "status": "offline_fallback",
            "source": "Open-Meteo API (Offline Fallback)",
            "temperature_c": 18.0,
            "precipitation_mm_per_hour": 0.0,
            "rain_mm_per_hour": 0.0,
            "precipitation_probability_pct": 20,
            "cloud_cover_pct": 25,
            "wind_gusts_kmh": 15.0,
            "snowfall_cm": 0.0,
            "snow_depth_m": 0.0,
            "soil_moisture_0_to_1cm": 0.22,
            "soil_moisture_1_to_3cm": 0.24,
            "weather_code": 1,
            "weather_description": "Mainly clear (fallback)",
            "landslide_weather_risk": "low",
            "reasons": [f"Live weather lookup timed out or network offline ({str(e)}); using baseline context."],
        }
