# Windows setup — MERLIN V5

V5 has no local model and no AI runtime.

1. Install Node.js 20.x if needed.
2. Extract/copy MERLIN into its working folder.
3. Double-click `SETUP_MERLIN.bat` once. It runs `npm install`, seeds/migrates the SQLite database and syntax-checks the code.
4. Double-click `START_MERLIN.bat` to start the Node service and open `http://localhost:3000`.
5. Use `BACKUP_MERLIN.bat` for a local database/product-file backup.
