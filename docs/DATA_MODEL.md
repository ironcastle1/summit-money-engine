# MERLIN V5 data model

Core records include machines, capabilities, products, product revisions, product assets, product BOMs, inventory items, inventory movements, suppliers, purchases, orders, order lines, production runs, sales events, expenses, business events, intake records, research sources, collected market items, market observations and UI preferences.

`intake_records` stores every Tell MERLIN parse before/after commitment. `product_assets` stores files attached to the immutable product record. The database is the authoritative business state; product folders are the file companion to that state.
