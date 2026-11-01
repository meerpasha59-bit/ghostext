/**
 * Page 400 — Weather
 */

import { createPage, setHeader, setFastext, writeText, COLOURS } from '../grid.js';
import { fetchWeather } from '../sources/weather.js';

const CITIES = [
  { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'New York', lat: 40.7128, lon: -74.0060 }
];

/**
 * Generate page 400 (weather page)
 * @param {Object} ctx - Context with cache and fetch
 * @returns {Promise<Array>} Array with single page
 */
export async function generate400(ctx) {
  const page = createPage(400);

  // Header
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  });
  setHeader(page, 'Weather', 400, dateStr);

  let row = 2;
  let hasError = false;
  let signalLost = false;

  // Fetch weather for each city
  for (const city of CITIES) {
    if (row >= 22) break; // Leave room for Fastext row

    try {
      const result = await fetchWeather(city.lat, city.lon, ctx.cache, ctx.fetch);

      // Check for signal lost flag
      if (result.signalLost) {
        signalLost = true;
      }

      // Write city header
      writeText(page, row++, 2, city.name.toUpperCase(), COLOURS.CYAN, COLOURS.BLACK, 37);

      // Write weather info: "23°C  Clear sky  Humidity: 65%"
      const temp = Math.round(result.temp);
      const condition = result.condition;
      const humidity = Math.round(result.humidity);
      const info = `${temp}°C  ${condition}  Humidity: ${humidity}%`;
      writeText(page, row++, 2, info, COLOURS.GREEN, COLOURS.BLACK, 37);

      row++; // Spacing
    } catch (err) {
      hasError = true;
      writeText(page, row++, 2, `Error: ${city.name}`, COLOURS.RED, COLOURS.BLACK, 37);
    }
  }

  // Show signal lost banner if applicable
  if (signalLost) {
    writeText(page, 1, 1, '⚠ SIGNAL LOST - SHOWING LAST TRANSMISSION', COLOURS.RED, COLOURS.BLACK, 38);
  }

  // Fastext links: red=101, green=100 (index), yellow=500, cyan=666
  setFastext(page, 101, 100, 500, 666);

  return [page];
}
