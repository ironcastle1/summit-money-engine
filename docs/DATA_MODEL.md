# MERLIN V6 data model

The live V6 workflow is centred on products, product revisions/assets, product BOMs, inventory, inventory movements, suppliers/purchases, completed production runs, completed sales, expenses, business events, Tell MERLIN intake records, market evidence and UI preferences.

The `products.id` UUID is immutable and used for database relationships. `products.product_code` is the short human workshop code such as `JOK-001`.

`intake_records` stores every Tell MERLIN parse before/after commitment. `product_assets` stores files attached to the immutable product record. The database is the authoritative business state; product folders are the file companion to that state.

Legacy `orders` and `order_lines` tables remain in the schema only so existing data is not destroyed during an in-place upgrade. V6 does not expose the former open-order workflow in its live dashboard or API.
