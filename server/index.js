const path = require("path");
const express = require("express");
const router = require("./api/router");
const { startScheduler } = require("./core/scheduler");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use((req, res, next) => { res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept"); res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); if (req.method === "OPTIONS") return res.sendStatus(204); next(); });
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use(express.static(path.join(__dirname, "..", "web"), { extensions: ["html"], maxAge: "5m" }));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "web", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Summit Security Companion running on ${PORT}`);
  startScheduler();
});
