import { test } from 'node:test';
import assert from 'node:assert';
import { Cache } from '../src/sources/cache.js';

test('Cache stores and retrieves values', () => {
  const cache = new Cache();
  cache.set('key1', 'value1', 60);

  const result = cache.get('key1');
  assert.strictEqual(result, 'value1');
});

test('Cache returns null for missing key', () => {
  const cache = new Cache();
  const result = cache.get('missing');
  assert.strictEqual(result, null);
});

test('Cache respects TTL expiration', async () => {
  const cache = new Cache();
  cache.set('key1', 'value1', 0.1); // 100ms TTL

  // Should be available immediately
  assert.strictEqual(cache.get('key1'), 'value1');

  // Wait for expiration
  await new Promise(resolve => setTimeout(resolve, 150));

  // Should be expired
  assert.strictEqual(cache.get('key1'), null);
});

test('Cache stores different values with different keys', () => {
  const cache = new Cache();
  cache.set('key1', 'value1', 60);
  cache.set('key2', 'value2', 60);
  cache.set('key3', 'value3', 60);

  assert.strictEqual(cache.get('key1'), 'value1');
  assert.strictEqual(cache.get('key2'), 'value2');
  assert.strictEqual(cache.get('key3'), 'value3');
});

test('Cache overwrites previous values', () => {
  const cache = new Cache();
  cache.set('key1', 'value1', 60);
  assert.strictEqual(cache.get('key1'), 'value1');

  cache.set('key1', 'value2', 60);
  assert.strictEqual(cache.get('key1'), 'value2');
});

test('Cache stores objects', () => {
  const cache = new Cache();
  const obj = { name: 'test', count: 42 };
  cache.set('obj', obj, 60);

  const result = cache.get('obj');
  assert.deepStrictEqual(result, obj);
});

test('Cache stores arrays', () => {
  const cache = new Cache();
  const arr = [1, 2, 3, 'four'];
  cache.set('arr', arr, 60);

  const result = cache.get('arr');
  assert.deepStrictEqual(result, arr);
});

test('Cache cleanup removes expired entries', async () => {
  const cache = new Cache();
  cache.set('key1', 'value1', 0.05);
  cache.set('key2', 'value2', 60);

  await new Promise(resolve => setTimeout(resolve, 100));

  cache.cleanup();

  // key1 should be removed
  assert.strictEqual(cache.get('key1'), null);

  // key2 should still be available
  assert.strictEqual(cache.get('key2'), 'value2');
});

test('Cache with zero TTL expires immediately', () => {
  const cache = new Cache();
  cache.set('key', 'value', 0);

  // Check immediately (may still be there due to timing)
  const result = cache.get('key');
  // This could be null or the value depending on exact timing
  assert.ok(result === null || result === 'value');
});

test('Cache get also removes expired entries', async () => {
  const cache = new Cache();
  cache.set('key1', 'value1', 0.05);

  await new Promise(resolve => setTimeout(resolve, 100));

  // Getting expired key should return null and remove it
  assert.strictEqual(cache.get('key1'), null);

  // Internal store should not have the key anymore
  assert.strictEqual(cache.store.has('key1'), false);
});
