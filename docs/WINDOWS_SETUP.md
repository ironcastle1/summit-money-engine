# Windows setup

V4 is designed to run on the Windows PC that owns the CNC business files.

## One-time setup

Double-click `SETUP_MERLIN.bat`.

It will:

1. install Node.js LTS with `winget` if Node is missing;
2. install the local model runtime with `winget` if missing;
3. install JavaScript dependencies;
4. create `.env` from `.env.example` if needed;
5. detect system RAM;
6. choose a conservative local model;
7. download that model once;
8. initialise the database;
9. run code checks.

If Windows has just installed Node or the model runtime and the command is not yet visible on PATH, restart Windows and run `SETUP_MERLIN.bat` again.

## Normal use

Double-click `START_MERLIN.bat`. It starts the private local model runtime if needed, opens the dashboard in your browser and starts the Node backend.

## Always-on watcher

After normal setup, double-click `ENABLE_MERLIN_STARTUP.bat` if you want Windows Task Scheduler to start MERLIN in the background when you log in. This allows scheduled public-web market scans while the PC is on.
