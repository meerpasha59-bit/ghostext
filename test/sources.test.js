import { test } from 'node:test';
import assert from 'node:assert';
import { Cache } from '../src/sources/cache.js';
import { weatherCodeToText } from '../src/sources/weather.js';

// Mock fetch for testing
class MockFetch {
  constructor(responses = {}) {
    this.responses = responses;
    this.callCount = 0;
  }

  async call(url, options = {}) {
    this.callCount++;
    if (this.responses[url]) {
      return this.responses[url];
    }
    throw new Error(`No mock response for ${url}`);
  }
}

test('weatherCodeToText maps code 0 to "Clear sky"', () => {
  assert.strictEqual(weatherCodeToText(0), 'Clear sky');
});

test('weatherCodeToText maps code 1 to "Mostly clear"', () => {
  assert.strictEqual(weatherCodeToText(1), 'Mostly clear');
});

test('weatherCodeToText maps code 2 to "Mostly clear"', () => {
  assert.strictEqual(weatherCodeToText(2), 'Mostly clear');
});

test('weatherCodeToText maps code 3 to "Overcast"', () => {
  assert.strictEqual(weatherCodeToText(3), 'Overcast');
});

test('weatherCodeToText maps code 45 to "Foggy"', () => {
  assert.strictEqual(weatherCodeToText(45), 'Foggy');
});

test('weatherCodeToText maps code 48 to "Foggy"', () => {
  assert.strictEqual(weatherCodeToText(48), 'Foggy');
});

test('weatherCodeToText maps code 61 to "Rain"', () => {
  assert.strictEqual(weatherCodeToText(61), 'Rain');
});

test('weatherCodeToText maps code 95 to "Thunderstorm"', () => {
  assert.strictEqual(weatherCodeToText(95), 'Thunderstorm');
});

test('weatherCodeToText maps unknown code to "Unknown"', () => {
  assert.strictEqual(weatherCodeToText(9999), 'Unknown');
});

test('Cache can store RSS data', () => {
  const cache = new Cache();
  const rssData = ['Headline 1', 'Headline 2', 'Headline 3'];
  
  cache.set('rss:example', rssData, 300);
  const result = cache.get('rss:example');
  
  assert.deepStrictEqual(result, rssData);
});

test('Cache can store weather data', () => {
  const cache = new Cache();
  const weather = {
    temp: 25,
    humidity: 65,
    condition: 'Clear sky'
  };
  
  cache.set('weather:0,0', weather, 600);
  const result = cache.get('weather:0,0');
  
  assert.deepStrictEqual(result, weather);
});

test('Cache can store HN stories', () => {
  const cache = new Cache();
  const stories = [
    { title: 'Story 1', score: 500 },
    { title: 'Story 2', score: 300 }
  ];
  
  cache.set('hn:top', stories, 300);
  const result = cache.get('hn:top');
  
  assert.deepStrictEqual(result, stories);
});

test('Last-good cache key differs from main key', () => {
  const cache = new Cache();
  const data = { test: true };
  
  cache.set('rss:url', data, 300);
  cache.set('rss:url:last-good', data, 86400);
  
  assert.deepStrictEqual(cache.get('rss:url'), data);
  assert.deepStrictEqual(cache.get('rss:url:last-good'), data);
});
