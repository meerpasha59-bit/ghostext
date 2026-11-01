import { test } from 'node:test';
import assert from 'node:assert';
import { Cache } from '../src/sources/cache.js';
import { fetchRSS } from '../src/sources/rss.js';
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

// BBC RSS with CDATA fixture
const BBC_RSS_CDATA_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title><![CDATA[BBC News]]></title>
    <link>https://www.bbc.co.uk/news</link>
    <item>
      <title><![CDATA['We came back from hell', say Ukrainians]]></title>
      <description><![CDATA[One evacuated couple says they crossed minefields.]]></description>
      <link>https://www.bbc.co.uk/news/articles/test1</link>
    </item>
    <item>
      <title><![CDATA[King to address slavery during Commonwealth speech]]></title>
      <description><![CDATA[King Charles III will deliver a speech to the Commonwealth.]]></description>
      <link>https://www.bbc.co.uk/news/articles/test2</link>
    </item>
    <item>
      <title><![CDATA[Breaking: Market rallies on positive data]]></title>
      <description><![CDATA[Stock markets surge following economic report.]]></description>
      <link>https://www.bbc.co.uk/news/articles/test3</link>
    </item>
  </channel>
</rss>`;

// Plain text RSS fixture (no CDATA)
const RSS_PLAIN_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Plain News</title>
    <link>https://example.com</link>
    <item>
      <title>First headline</title>
      <link>https://example.com/1</link>
    </item>
    <item>
      <title>Second headline</title>
      <link>https://example.com/2</link>
    </item>
  </channel>
</rss>`;

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

test('fetchRSS parses CDATA-wrapped titles correctly', async () => {
  const cache = new Cache();
  
  // Mock fetch response
  const mockFetch = async (url) => ({
    ok: true,
    text: async () => BBC_RSS_CDATA_FIXTURE
  });
  
  const result = await fetchRSS('https://test.example/rss', cache, mockFetch);
  
  assert.strictEqual(result.items.length, 3);
  assert.strictEqual(result.items[0], "'We came back from hell', say Ukrainians");
  assert.strictEqual(result.items[1], 'King to address slavery during Commonwealth speech');
  assert.strictEqual(result.items[2], 'Breaking: Market rallies on positive data');
});

test('fetchRSS parses plain text titles correctly', async () => {
  const cache = new Cache();
  
  // Mock fetch response
  const mockFetch = async (url) => ({
    ok: true,
    text: async () => RSS_PLAIN_FIXTURE
  });
  
  const result = await fetchRSS('https://test.example/plain', cache, mockFetch);
  
  assert.strictEqual(result.items.length, 2);
  assert.strictEqual(result.items[0], 'First headline');
  assert.strictEqual(result.items[1], 'Second headline');
});

test('fetchRSS caches results', async () => {
  const cache = new Cache();
  let fetchCount = 0;
  
  const mockFetch = async (url) => {
    fetchCount++;
    return {
      ok: true,
      text: async () => BBC_RSS_CDATA_FIXTURE
    };
  };
  
  // First call
  const result1 = await fetchRSS('https://test.example/cache', cache, mockFetch);
  assert.strictEqual(fetchCount, 1);
  
  // Second call should use cache
  const result2 = await fetchRSS('https://test.example/cache', cache, mockFetch);
  assert.strictEqual(fetchCount, 1); // No additional fetch
  assert.deepStrictEqual(result1.items, result2.items);
});
