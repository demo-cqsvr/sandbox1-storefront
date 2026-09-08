/* eslint-env node */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const loadModule = async (name) => import(`data:text/javascript;base64,${Buffer.from(
  await readFile(new URL(name, import.meta.url), 'utf8'),
).toString('base64')}`);
const { getCategoryContext } = await loadModule('./category-context.js');
const { applySearchStateToUrl } = await loadModule('./search-url.js');
const categories = [
  {
    id: '1', name: 'Fresh', path: 'fresh', parentId: 'root',
  },
  {
    id: '2', name: 'Fruit', path: 'fresh/fruit', parentId: '1',
  },
  {
    id: '3', name: 'Apples', path: 'fresh/fruit/apples', parentId: '2',
  },
];

test('category browsing resolves names, ancestors and direct children', () => {
  const context = getCategoryContext(new URL('https://example.com/search?category=fresh/fruit'), categories);
  assert.equal(context.title, 'Fruit');
  assert.equal(context.path, 'fresh/fruit');
  assert.deepEqual(context.ancestors.map((item) => item.name), ['Fresh']);
  assert.deepEqual(context.children.map((item) => item.name), ['Apples']);
});

test('all products is valid, while unknown or empty categories are rejected', () => {
  const all = getCategoryContext(new URL('https://example.com/search?category=all'), categories);
  assert.equal(all.isAll, true);
  assert.equal(all.path, '');
  assert.deepEqual(all.children.map((item) => item.name), ['Fresh']);
  ['unknown', ''].forEach((value) => {
    assert.equal(getCategoryContext(new URL(`https://example.com/search?category=${value}`), categories).error, true);
  });
  assert.equal(getCategoryContext(new URL('https://example.com/search?q=milk'), categories), null);
});

test('category remains on filter, sort and page URL updates without stale query', () => {
  const url = new URL('https://example.com/search?category=fresh%2Ffruit&q=milk');
  applySearchStateToUrl(url, {
    phrase: '',
    currentPage: 2,
    sort: [{ attribute: 'price', direction: 'ASC' }],
    filter: [
      { attribute: 'categoryPath', eq: 'fresh/fruit' },
      { attribute: 'visibility', in: ['Catalog', 'Catalog, Search'] },
      { attribute: 'brand', in: ['AEON'] },
    ],
  });
  assert.equal(url.searchParams.get('category'), 'fresh/fruit');
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(url.searchParams.get('sort'), 'price_ASC');
  assert.equal(url.searchParams.get('filter'), 'brand:AEON');
  assert.equal(url.searchParams.has('q'), false);
});
