const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

const api = require("./api");
const liveDataRoutes = require("./liveDataRoutes");

const { startScheduler, refreshNow } = require("./services/scheduler");
const { VERSION } = require("./services/state");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors());
app.use(compression());
app.use(express.json({ limit: "2mb" }));

app.use(
  express.static(path.join(__dirname, "..", "web"), {
    etag: false,
    maxAge: 0
  })
);

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    version: VERSION,
    patch: "live-crime-boundaries-wiki",
    ts: new Date().toISOString()
  });
});

/*
  Main existing app API.
*/
app.use("/api", api);

/*
  Added live-source patch API:
  - /api/boundaries/admin0
  - /api/crime/uk
  - /api/crime/point
  - /api/wiki/place
*/
app.use("/api", liveDataRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "web", "index.html"));
});

app.listen(PORT, async () => {
  console.log(`[summit] ${VERSION}`);
  console.log(`[summit] patch: live-crime-boundaries-wiki`);
  console.log(`[summit] listening on ${PORT}`);

  await refreshNow().catch((err) => {
    console.error("[summit] initial refresh failed", err.message);
  });

  startScheduler();
});
