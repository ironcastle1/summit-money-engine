MERLIN V20 Render PUBLIC_ORIGIN hotfix

Upload the contents of this extracted folder into the repository root.
Allow these files to replace the existing versions:
- src/config/load-config.js
- tests/part01/startup-diagnostics.test.js

The change makes production automatically use Render's RENDER_EXTERNAL_HOSTNAME when PUBLIC_ORIGIN is absent or still set to https://example.com.
