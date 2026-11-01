/**
 * Weather fetcher (Open-Meteo API)
 */

/**
 * Fetch weather for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Cache} cache - Cache instance
 * @param {Function} fetchFn - Fetch function
 * @returns {Promise<Object>} { temp, humidity, condition, signalLost?: boolean }
 */
export async function fetchWeather(lat, lon, cache, fetchFn) {
  const cacheKey = `weather:${lat},${lon}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`;
    const response = await fetchFn(url);
    if (!response.ok) throw new Error(`Weather fetch failed: ${response.status}`);

    const data = await response.json();
    const weather = {
      temp: Math.round(data.current.temperature_2m),
      humidity: data.current.relative_humidity_2m,
      condition: weatherCodeToText(data.current.weather_code)
    };

    // Cache result and save last-good
    cache.set(cacheKey, weather, 600); // 10 minutes
    cache.set(cacheKey + ':last-good', weather, 86400); // 24 hours for last-good

    return weather;
  } catch (err) {
    // Try to return last-good with signal lost flag
    const lastGood = cache.get(cacheKey + ':last-good');
    if (lastGood) {
      return { ...lastGood, signalLost: true };
    }
    throw err;
  }
}

/**
 * Convert WMO weather code to text
 * @param {number} code - WMO weather code
 * @returns {string} Weather description
 */
export function weatherCodeToText(code) {
  // WMO codes: https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM
  if (code === 0) return 'Clear sky';
  if (code === 1 || code === 2) return 'Mostly clear';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code === 95 || code === 96 || code === 99) return 'Thunderstorm';
  return 'Unknown';
}
