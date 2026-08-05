# Upgrade and rollback

Use a canary deployment for the server and immutable versioned client assets. Apply reversible migrations first where possible. For irreversible migrations, take and verify a restorable backup before the change window. Stop the rollout on critical smoke failures, severe incidents, exhausted error budgets, data-integrity failures or material connector regressions. Roll back application artifacts before restoring data unless the migration changed persisted structure incompatibly.
