import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  priorityRegionCatalog,
  focusRegionIdsForCountry,
  focusRegionIdsForText,
  buildStrategicWatchAreas,
  regionalGdeltQueries
} from '../../src/customer/priority-regions.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const countries = JSON.parse(await readFile(path.join(ROOT, 'data/countries.json'), 'utf8')).countries;

test('priority regional catalogue covers the six requested deep-coverage areas', () => {
  const catalog = priorityRegionCatalog(countries);
  assert.deepEqual(catalog.map(region => region.id), ['middle-east', 'europe', 'russia', 'major-asia', 'north-africa', 'united-states']);
  assert.ok(catalog.every(region => region.description && region.watchTopics.length && region.industries.length));
  assert.ok(catalog.find(region => region.id === 'europe').countryCodes.length > 25);
});

test('countries can remain globally visible while priority membership is explicit', () => {
  const catalog = priorityRegionCatalog(countries);
  const us = countries.find(country => country.iso2 === 'US');
  const russia = countries.find(country => country.iso2 === 'RU');
  const brazil = countries.find(country => country.iso2 === 'BR');
  assert.deepEqual(focusRegionIdsForCountry(us, catalog), ['united-states']);
  assert.deepEqual(focusRegionIdsForCountry(russia, catalog), ['russia']);
  assert.deepEqual(focusRegionIdsForCountry(brazil, catalog), []);
  assert.equal(countries.length >= 190, true);
});

test('regional text matching and source queries cover commercial and geopolitical topics', () => {
  const catalog = priorityRegionCatalog(countries);
  assert.ok(focusRegionIdsForText('Freight rates rise after Red Sea disruption', catalog).includes('middle-east'));
  assert.ok(focusRegionIdsForText('Taiwan Strait semiconductor exports', catalog).includes('major-asia'));
  const queries = regionalGdeltQueries(catalog);
  assert.equal(queries.length, 6);
  assert.ok(queries.every(query => /shipping|sanctions|commodity/i.test(query.query)));
});

test('strategic watch areas span every requested priority region', () => {
  const catalog = priorityRegionCatalog(countries);
  const areas = buildStrategicWatchAreas(catalog);
  const regionIds = new Set(areas.map(area => area.regionId));
  for (const region of catalog) assert.ok(regionIds.has(region.id), `${region.id} has a watch area`);
  assert.ok(areas.some(area => area.id === 'suez'));
  assert.ok(areas.some(area => area.id === 'taiwan-strait'));
  assert.ok(areas.some(area => area.id === 'us-gulf'));
});
