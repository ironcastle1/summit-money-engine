const { refreshState } = require("./stateStore");
let started = false;
function startScheduler() {
  if (started) return;
  started = true;
  refreshState(true).catch(err => console.warn("Initial refresh failed", err.message));
  setInterval(() => refreshState(true).catch(err => console.warn("Scheduled refresh failed", err.message)), 5 * 60 * 1000);
}
module.exports = { startScheduler };
