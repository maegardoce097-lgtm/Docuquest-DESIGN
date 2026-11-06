import { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from 'lucide-react';
import './WorkspaceClockWeather.css';

const WEATHER_REFRESH_MS = 10 * 60 * 1000;

function weatherDetails(code) {
  if (code === 0) return { label: 'Clear sky', Icon: Sun };
  if (code === 1) return { label: 'Mostly clear', Icon: CloudSun };
  if (code === 2) return { label: 'Partly cloudy', Icon: CloudSun };
  if (code === 3) return { label: 'Cloudy', Icon: Cloud };
  if ([45, 48].includes(code)) return { label: 'Foggy', Icon: CloudFog };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', Icon: CloudDrizzle };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Rain', Icon: CloudRain };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snow', Icon: CloudSnow };
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', Icon: CloudLightning };
  return { label: 'Current conditions', Icon: Cloud };
}

export default function WorkspaceClockWeather() {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function refreshWeather() {
      try {
        const locationResponse = await fetch(
          'https://geocoding-api.open-meteo.com/v1/search?name=Naujan&count=1&language=en&format=json&countryCode=PH',
          { signal: controller.signal },
        );
        if (!locationResponse.ok) throw new Error(`Location lookup failed (${locationResponse.status}).`);
        const locationResult = await locationResponse.json();
        const location = locationResult.results?.[0];
        if (!location) throw new Error('Naujan weather location was not found.');

        const query = new URLSearchParams({
          latitude: String(location.latitude),
          longitude: String(location.longitude),
          current: 'temperature_2m,weather_code',
          timezone: 'Asia/Manila',
        });
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, {
          signal: controller.signal,
        });
        if (!weatherResponse.ok) throw new Error(`Weather update failed (${weatherResponse.status}).`);
        const weatherResult = await weatherResponse.json();
        const current = weatherResult.current;
        if (!current || !Number.isFinite(Number(current.temperature_2m)) || !Number.isFinite(Number(current.weather_code))) {
          throw new Error('The weather service returned incomplete current conditions.');
        }
        if (!active) return;
        setWeather({
          temperature: Math.round(Number(current.temperature_2m)),
          ...weatherDetails(Number(current.weather_code)),
        });
        setWeatherError('');
      } catch (error) {
        if (error.name === 'AbortError' || !active) return;
        console.error('Could not update Naujan weather.', error);
        setWeatherError('Weather unavailable');
      }
    }

    refreshWeather();
    const refreshTimer = window.setInterval(refreshWeather, WEATHER_REFRESH_MS);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(refreshTimer);
    };
  }, []);

  const time = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);
  const date = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(now);
  const WeatherIcon = weather?.Icon;

  return (
    <div className="workspace-clock-weather" aria-label="Naujan local date, time, and weather">
      <div className="workspace-clock">
        <strong>{time}</strong>
        <span>{date} · Philippine time</span>
      </div>
      <span className="workspace-weather-divider" aria-hidden="true" />
      <div className="workspace-weather" aria-live="polite">
        {weather ? <WeatherIcon size={20} aria-hidden="true" /> : <Cloud size={20} aria-hidden="true" />}
        <span>
          <strong>{weather ? `${weather.temperature}°C · ${weather.label}` : weatherError || 'Loading weather…'}</strong>
          <small>Naujan, Oriental Mindoro · Open-Meteo</small>
        </span>
      </div>
    </div>
  );
}
