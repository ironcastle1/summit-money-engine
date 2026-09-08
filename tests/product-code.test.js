import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { migrateDatabase } from '../src/db/database.js';
import { migrateLegacyProductCodes, shortPrefix } from '../src/products/product-service.js';

test('short product prefixes are workshop friendly',()=>{
  assert.equal(shortPrefix('Joker'),'JOK');
  assert.equal(shortPrefix('Napoleon'),'NAP');
  assert.equal(shortPrefix('Modern House Numbers'),'MHN');
});

test('legacy long product code migrates without changing internal product id',()=>{
  const db=new Database(':memory:');migrateDatabase(db);
  db.prepare(`INSERT INTO products (id,product_code,name) VALUES ('internal-uuid','MER-WALLART-000001','Joker')`).run();
  migrateLegacyProductCodes(db);
  const p=db.prepare('SELECT id,product_code FROM products WHERE id=?').get('internal-uuid');
  assert.equal(p.id,'internal-uuid');
  assert.equal(p.product_code,'JOK-001');
});
