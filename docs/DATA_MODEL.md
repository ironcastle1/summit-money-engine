# MERLIN data model

Every durable business object receives an immutable ID.

Current prefixes include:

- `PROD-` product
- `REV-` product revision
- `INV-` inventory item
- `MOV-` inventory movement
- `RUN-` production run
- `COST-` product cost record
- `FACT-` durable business fact
- `SRC-` research source
- `OBS-` market observation
- `UPG-` system evolution request
- `AI-` AI audit event

Human-readable product codes are separate from immutable UUID IDs, for example `MER-NUMBERS-000042`.

The database is authoritative. Folder/file names can change; IDs should not.
