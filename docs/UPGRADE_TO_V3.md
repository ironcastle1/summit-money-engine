# Upgrade to MERLIN CNC V3

V3 is an in-place replacement of the V2 application code. It does **not** require deleting the SQLite database.

1. Copy the V3 repository files over `main`.
2. Preserve `/var/data/merlin.sqlite` and the `/var/data` disk on Render.
3. Push the commit.
4. Render redeploys.
5. Database migration adds `ui_preferences` automatically.
6. Configure `OPENAI_API_KEY` on the backend if Ask MERLIN shows AI OFFLINE.
7. Within roughly 20 seconds of a configured backend starting, the automatic research scheduler checks whether a market research run is due.

The V3 main dashboard has no operational tabs. All working panels are present and can be reordered by drag and drop.
