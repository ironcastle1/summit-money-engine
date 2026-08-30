# Implementing V4 in the existing GitHub repository

The old MERLIN V25 branch should remain preserved. V4 replaces the active CNC branch files but upgrades the existing live data in place.

1. Extract the V4 ZIP.
2. Copy everything inside the ZIP directly into the local GitHub repository root.
3. Replace same-named files.
4. Do not delete the `.git` directory.
5. Commit the V4 replacement in GitHub Desktop and push `main`.
6. For the private AI-enabled instance, run `SETUP_MERLIN.bat` locally once.
7. Then run `START_MERLIN.bat` to use MERLIN.

The Render copy may continue to deploy automatically from GitHub, but it is not the primary V4 AI runtime. Use the localhost instance for local AI.
