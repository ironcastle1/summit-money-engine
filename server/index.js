const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

const liveDataRoutes = require("./liveDataRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

app.use(express.static(path.join(__dirname, "..", "web"), { etag: false, maxAge: 0 }));

app.get("/health", (req, res) => {
  res.json({ ok: true, version: "summit-money-engine-open-intel-v3", ts: new Date().toISOString() });
});

app.use("/api", liveDataRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "web", "index.html"));
});

app.listen(PORT, () => {
  console.log(`[summit] open-intel-v3 listening on ${PORT}`);
});
