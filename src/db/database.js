import Database from 'better-sqlite3';
import path from 'node:path';

export function openDatabase(dbPath = process.env.MERLIN_DB_PATH || './data/merlin.sqlite') {
  const db = new Database(path.resolve(dbPath));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function hasColumn(db, table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some((r) => r.name === column);
}

function addColumn(db, table, definition) {
  const column = definition.trim().split(/\s+/)[0];
  if (!hasColumn(db, table, column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
}

export function migrateDatabase(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

    CREATE TABLE IF NOT EXISTS business_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      business_name TEXT NOT NULL DEFAULT 'MERLIN CNC Business',
      currency TEXT NOT NULL DEFAULT 'GBP',
      stage TEXT NOT NULL DEFAULT 'current_setup',
      notes TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS capabilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active','planned','retired')) DEFAULT 'active',
      details_json TEXT NOT NULL DEFAULT '{}',
      added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      retired_at TEXT
    );

    CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      manufacturer TEXT,
      model TEXT,
      working_width_mm REAL,
      working_height_mm REAL,
      max_current_a REAL,
      rules_json TEXT NOT NULL DEFAULT '{}',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      website TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE,
      kind TEXT NOT NULL CHECK(kind IN ('raw_material','consumable','packaging','finished_product','offcut','hardware','other')),
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      quantity_on_hand REAL NOT NULL DEFAULT 0,
      reorder_point REAL,
      unit_cost REAL,
      currency TEXT NOT NULL DEFAULT 'GBP',
      supplier_id TEXT REFERENCES suppliers(id),
      location TEXT,
      attributes_json TEXT NOT NULL DEFAULT '{}',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY,
      inventory_item_id TEXT NOT NULL REFERENCES inventory_items(id),
      movement_type TEXT NOT NULL CHECK(movement_type IN ('purchase','consume','adjust','reserve','release','produce','scrap','return')),
      quantity REAL NOT NULL,
      unit_cost REAL,
      reference_type TEXT,
      reference_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      supplier_id TEXT REFERENCES suppliers(id),
      total_cost REAL,
      delivery_cost REAL,
      currency TEXT NOT NULL DEFAULT 'GBP',
      purchased_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS purchase_lines (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      inventory_item_id TEXT REFERENCES inventory_items(id),
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_cost REAL,
      line_total REAL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      product_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      subcategory TEXT,
      language TEXT,
      status TEXT NOT NULL DEFAULT 'imported',
      legal_status TEXT NOT NULL DEFAULT 'review_required',
      active_revision_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_revisions (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      revision_number INTEGER NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'dxf_upload',
      original_filename TEXT,
      stored_path TEXT,
      sha256 TEXT,
      width_mm REAL,
      height_mm REAL,
      entity_count INTEGER,
      total_cut_length_mm REAL,
      pierce_estimate INTEGER,
      closed_path_count INTEGER,
      open_path_count INTEGER,
      small_feature_count INTEGER,
      duplicate_entity_count INTEGER,
      unsupported_entity_count INTEGER,
      fits_machine INTEGER,
      validation_status TEXT NOT NULL DEFAULT 'review_required',
      validation_json TEXT NOT NULL DEFAULT '{}',
      preview_path TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id, revision_number)
    );

    CREATE TABLE IF NOT EXISTS product_bom (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      inventory_item_id TEXT NOT NULL REFERENCES inventory_items(id),
      quantity_per_unit REAL NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id, inventory_item_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      external_order_id TEXT,
      channel TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      customer_reference TEXT,
      gross_total REAL,
      currency TEXT NOT NULL DEFAULT 'GBP',
      ordered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      due_at TEXT,
      dispatched_at TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS order_lines (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES products(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL,
      customisation_json TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS product_costs (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      material_cost REAL,
      consumables_cost REAL,
      paint_cost REAL,
      packaging_cost REAL,
      marketplace_fees REAL,
      labour_cost REAL,
      other_variable_cost REAL,
      selling_price REAL,
      currency TEXT NOT NULL DEFAULT 'GBP',
      notes TEXT,
      effective_from TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS production_runs (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id),
      revision_id TEXT REFERENCES product_revisions(id),
      machine_id TEXT REFERENCES machines(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      material_inventory_item_id TEXT REFERENCES inventory_items(id),
      cut_seconds REAL,
      cleanup_seconds REAL,
      finishing_seconds REAL,
      packaging_seconds REAL,
      success INTEGER NOT NULL DEFAULT 1,
      failure_reason TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales_events (
      id TEXT PRIMARY KEY,
      product_id TEXT REFERENCES products(id),
      channel TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      gross_revenue REAL,
      fees REAL,
      shipping_income REAL,
      shipping_cost REAL,
      refunds REAL,
      currency TEXT NOT NULL DEFAULT 'GBP',
      sold_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'GBP',
      occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      supplier_id TEXT REFERENCES suppliers(id),
      reference_type TEXT,
      reference_id TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS research_sources (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT,
      publisher TEXT,
      observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      source_type TEXT,
      raw_excerpt TEXT
    );

    CREATE TABLE IF NOT EXISTS market_observations (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      observation TEXT NOT NULL,
      why_valuable TEXT,
      direct_evidence_json TEXT NOT NULL DEFAULT '[]',
      supporting_evidence_json TEXT NOT NULL DEFAULT '[]',
      unknowns_json TEXT NOT NULL DEFAULT '[]',
      suggested_test TEXT,
      applicable_now INTEGER NOT NULL DEFAULT 1,
      source_ids_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS memory_facts (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      fact_key TEXT NOT NULL,
      fact_value TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'user',
      confidence TEXT NOT NULL DEFAULT 'direct',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, fact_key)
    );

    CREATE TABLE IF NOT EXISTS system_upgrade_requests (
      id TEXT PRIMARY KEY,
      trigger TEXT NOT NULL,
      reason TEXT NOT NULL,
      requested_changes_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'proposed',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ai_events (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_name TEXT,
      tool_payload_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ui_preferences (
      preference_key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_inventory_kind ON inventory_items(kind);
    CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(inventory_item_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_runs_product ON production_runs(product_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_product ON sales_events(product_id, sold_at);
    CREATE INDEX IF NOT EXISTS idx_orders_status_due ON orders(status, due_at);
    CREATE INDEX IF NOT EXISTS idx_market_created ON market_observations(created_at);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(occurred_at);
  `);

  // Backward-compatible V2 columns. Existing V1 databases are upgraded in place.
  addColumn(db, 'inventory_items', 'quantity_reserved REAL NOT NULL DEFAULT 0');
  addColumn(db, 'inventory_items', 'material_family TEXT');
  addColumn(db, 'inventory_items', 'material_grade TEXT');
  addColumn(db, 'inventory_items', 'form TEXT');
  addColumn(db, 'inventory_items', 'thickness_mm REAL');
  addColumn(db, 'inventory_items', 'width_mm REAL');
  addColumn(db, 'inventory_items', 'height_mm REAL');
  addColumn(db, 'inventory_items', 'length_mm REAL');
  addColumn(db, 'inventory_items', 'colour TEXT');
  addColumn(db, 'inventory_items', 'linked_product_id TEXT');

  addColumn(db, 'products', 'primary_material_inventory_item_id TEXT');
  addColumn(db, 'products', 'target_width_mm REAL');
  addColumn(db, 'products', 'target_height_mm REAL');
  addColumn(db, 'products', 'selling_price REAL');

  addColumn(db, 'product_revisions', 'drawing_width_units REAL');
  addColumn(db, 'product_revisions', 'drawing_height_units REAL');
  addColumn(db, 'product_revisions', 'unit_code INTEGER');
  addColumn(db, 'product_revisions', 'unit_name TEXT');
  addColumn(db, 'product_revisions', 'mm_per_unit REAL');
  addColumn(db, 'product_revisions', 'units_confirmed INTEGER NOT NULL DEFAULT 0');

  addColumn(db, 'order_lines', 'description TEXT');
  addColumn(db, 'production_runs', 'material_quantity_consumed REAL');

  db.prepare(`INSERT OR IGNORE INTO business_profile (id) VALUES (1)`).run();
}
