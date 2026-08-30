# GitHub implementation

GitHub is the source-code home for MERLIN V4. It is not the AI computer.

1. Preserve any legacy branch you want to keep.
2. On `main`, copy the contents of the V4 GitHub-root ZIP directly into the repository root.
3. Replace same-named source files.
4. Do not delete `.git`.
5. Commit in GitHub Desktop.
6. Push `main`.
7. Run `SETUP_MERLIN.bat` locally once.
8. Use `START_MERLIN.bat` for the AI-enabled system.

A connected Render service may still redeploy the repository. Treat that as an optional remote/non-AI deployment unless you deliberately provide it its own model server. The private AI-enabled instance is `http://localhost:3000` on the Windows machine.
