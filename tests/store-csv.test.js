import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, normaliseStoreCsv } from '../src/stores/csv.js';

test('store CSV maps workshop code and financial fields', () => {
  const rows = parseCsv('Order ID,SKU,Title,Quantity,Total,Fees,Shipping Cost,Date\nE1,JOK-001,Joker,2,80.00,8.00,5.00,2026-09-01');
  assert.equal(rows.length, 1);
  const row = normaliseStoreCsv('etsy', rows)[0];
  assert.equal(row.product_code, 'JOK-001');
  assert.equal(row.quantity, 2);
  assert.equal(row.gross_revenue, 80);
  assert.equal(row.fees, 8);
  assert.equal(row.shipping_cost, 5);
});

test('store CSV parser handles quoted commas', () => {
  const rows = parseCsv('Order ID,Title,Quantity,Total\nE2,"House sign, large",1,55.50');
  assert.equal(rows[0].title, 'House sign, large');
  const row = normaliseStoreCsv('ebay', rows)[0];
  assert.equal(row.gross_revenue, 55.5);
});
