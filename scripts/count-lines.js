const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const include = new Set([".js", ".css", ".html", ".md", ".json", ".yaml"]);
let total = 0;
function walk(dir) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (item === "node_modules" || item.startsWith(".")) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (include.has(path.extname(item))) {
      const lines = fs.readFileSync(full, "utf8").split(/\r?\n/).length;
      total += lines;
      console.log(`${lines.toString().padStart(5)} ${path.relative(root, full)}`);
    }
  }
}
walk(root);
console.log(`TOTAL ${total}`);
