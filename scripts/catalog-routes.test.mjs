/* eslint-env node */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const { categories, getCategoryLink, getCatalogProductLink } = await import(
  `data:text/javascript;base64,${Buffer.from(await readFile(new URL('./catalog-routes.js', import.meta.url))).toString('base64')}`
);

test('product routes preserve exact SKU case and reserved URL characters', () => {
  ['AEONMY-49558', 'aeon-cheesecake', 'SKU / +?#&日本'].forEach((sku) => {
    const url = new URL(getCatalogProductLink(sku), 'https://eds.example');
    assert.equal(url.origin, 'https://eds.example');
    assert.equal(url.pathname, '/products/default');
    assert.equal(url.searchParams.get('sku'), sku);
    assert.equal(url.hash, '');
  });
});

test('all current categories resolve internally with complete parent relationships', () => {
  assert.equal(categories.length, 11);
  assert.equal(new Set(categories.map((category) => category.path)).size, 11);
  categories.forEach((category) => {
    const url = new URL(getCategoryLink(category.path), 'https://eds.example');
    assert.equal(url.pathname, '/search');
    assert.equal(url.searchParams.get('category'), category.path);
    assert.ok(category.parentId === 2 || categories.some((parent) => parent.id === category.parentId));
  });
  assert.equal(new URL(getCategoryLink(), 'https://eds.example').searchParams.get('category'), 'all');
});
