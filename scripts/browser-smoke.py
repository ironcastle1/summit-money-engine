#!/usr/bin/env python3
"""Deterministic Chromium smoke test for Merlin's shipped browser client.

It injects the repository HTML, CSS and JavaScript directly into Chromium and
mocks only network responses. This bypasses CI network policy while exercising
the real startup sequence, map engine, controls, drawers and data views.
"""
from __future__ import annotations

import asyncio
import base64
import json
import re
import sys
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
BOOTSTRAP = json.loads((PUBLIC / "data/bootstrap-v18.json").read_text())
SCREENSHOT = ROOT / ".tmp/merlin-v18-browser-smoke.png"


def data_uri(path: Path, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def tile_data_uri() -> str:
    image = Image.new("RGB", (256, 256), "#dfe7e8")
    draw = ImageDraw.Draw(image)
    for value in range(0, 257, 32):
        draw.line((value, 0, value, 256), fill="#b9c9ce", width=1)
        draw.line((0, value, 256, value), fill="#b9c9ce", width=1)
    draw.line((0, 80, 256, 150), fill="#7e9ea9", width=5)
    draw.line((20, 230, 220, 10), fill="#94adb5", width=3)
    output = BytesIO()
    image.save(output, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(output.getvalue()).decode()}"


def browser_html() -> str:
    html = (PUBLIC / "index.html").read_text()
    html = re.sub(r'<link rel="stylesheet"[^>]+>', '', html)
    html = re.sub(r'<script src="[^"]+" defer></script>', '', html)
    html = html.replace('/assets/merlin-logo-inverted.png', data_uri(PUBLIC / 'assets/merlin-logo-inverted.png', 'image/png'))
    return html


def mock_script() -> str:
    payload = {
        "bootstrap": BOOTSTRAP,
        "scan": {
            "location": {"name": "Selected point", "country": "Test"},
            "metrics": {"eventProbability24h": .17, "activityIncreaseProbability": .24, "confidence": .71},
            "events": BOOTSTRAP["events"][:3], "sourceCount": 5, "coverage": .82,
            "generatedAt": BOOTSTRAP["generatedAt"]
        }
    }
    encoded = json.dumps(payload)
    return f"""
    (() => {{
      const fixture = {encoded};
      const response = value => Promise.resolve(new Response(JSON.stringify(value), {{status:200, headers:{{'content-type':'application/json'}}}}));
      window.fetch = input => {{
        const text = String(input?.url || input || '');
        if (text.includes('bootstrap-v18.json')) return response(fixture.bootstrap);
        if (text.includes('/api/events')) return response({{events:fixture.bootstrap.events, sources:{{}}, totalCount:fixture.bootstrap.events.length, generatedAt:fixture.bootstrap.generatedAt}});
        if (text.includes('/api/news')) return response(fixture.bootstrap.news);
        if (text.includes('/api/shipping/snapshot')) return response(fixture.bootstrap.shipping);
        if (text.includes('/api/markets/screener')) return response(fixture.bootstrap.markets);
        if (text.includes('/api/macro')) return response({{records:[], generatedAt:fixture.bootstrap.generatedAt}});
        if (text.includes('/api/scan')) return response(fixture.scan);
        return Promise.reject(new Error('UNMOCKED '+text));
      }};
    }})();
    """


async def main() -> int:
    page_errors: list[str] = []
    console_errors: list[str] = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path="/usr/bin/chromium", headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("pageerror", lambda error: page_errors.append(str(error)))
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        await page.set_content(browser_html(), wait_until="domcontentloaded")
        await page.add_style_tag(content=(PUBLIC / "css/merlin-v18.css").read_text())
        await page.add_script_tag(content=mock_script())

        engine = (PUBLIC / "map/merlin-map-engine.js").read_text()
        engine = engine.replace("'/assets/world-base.svg?v=18.0.0'", repr(data_uri(PUBLIC / 'assets/world-base.svg', 'image/svg+xml')))
        tile = tile_data_uri()
        engine = re.sub(r"'/api/map/tiles/(?:streets|terrain|light)/\{z\}/\{x\}/\{y\}\.png'", repr(tile), engine)
        engine = re.sub(r"'https://[^']+?/\{z\}/\{x\}/\{y\}\.png'", repr(tile), engine)
        await page.add_script_tag(content=engine)
        await page.add_script_tag(content=(PUBLIC / "merlin-v18.js").read_text())

        await page.wait_for_function("document.documentElement.dataset.bootstrap === 'ready'", timeout=15_000)
        await page.wait_for_timeout(500)

        checks = {
            "event count": int((await page.locator("#header-event-count").inner_text()).split()[0].replace(",", "")) >= 2000,
            "alert count": int((await page.locator("#header-alert-count").inner_text()).split()[0].replace(",", "")) > 0,
            "map ready": await page.locator("#world-map").evaluate("el => el.classList.contains('map-ready')"),
            "tile layer": await page.locator(".merlin-map-tile").count() > 0,
            "map markers": await page.locator("[data-map-entity]").count() > 100,
            "shipping routes": await page.locator(".map-route-line").count() >= 10,
            "ticker": await page.locator("#market-ticker-track .ticker-item").count() >= 10,
            "logo loaded": await page.locator(".merlin-brand-mark img").evaluate("img => img.naturalWidth > 0"),
            "master logo unchanged": __import__('hashlib').sha256((PUBLIC / 'assets/merlin-logo-master.png').read_bytes()).hexdigest() == '4daa09b7bb5ff4e9511fb0c60b4795b282fa69b81fabc15d320973b733dad55b',
            "no larp subtitle": "GLOBAL INTELLIGENCE" not in (await page.locator("body").inner_text()).upper(),
            "sound disabled": "AudioContext" not in (PUBLIC / "merlin-v18.js").read_text() and "merlin.sound.mode', 'OFF" in (PUBLIC / "merlin-v18.js").read_text(),
        }

        status_before = await page.locator(".merlin-map-status").inner_text()
        hit = page.locator(".merlin-map-hit-layer")
        box = await hit.bounding_box()
        assert box
        await page.mouse.move(box["x"] + box["width"] * .45, box["y"] + box["height"] * .55)
        await page.mouse.down()
        await page.mouse.move(box["x"] + box["width"] * .57, box["y"] + box["height"] * .64, steps=8)
        await page.mouse.up()
        await page.wait_for_timeout(100)
        checks["map drag"] = (await page.locator(".merlin-map-status").inner_text()) != status_before

        button = page.locator('[data-layer="news"]')
        active_before = await button.evaluate("el => el.classList.contains('active')")
        await button.click()
        active_after = await button.evaluate("el => el.classList.contains('active')")
        checks["layer toggle"] = active_before != active_after
        await button.click()

        marker_index = await page.evaluate("""() => {
          const markers = [...document.querySelectorAll('.map-entity-marker')];
          return markers.findIndex(el => {
            const box = el.getBoundingClientRect();
            if (box.width <= 0 || box.height <= 0) return false;
            const x = box.left + box.width / 2;
            const y = box.top + box.height / 2;
            const top = document.elementFromPoint(x, y);
            return top === el || el.contains(top);
          });
        }""")
        checks["clickable marker available"] = marker_index >= 0
        if marker_index >= 0:
            marker = page.locator(".map-entity-marker").nth(marker_index)
            await marker.click()
            await page.wait_for_timeout(100)
        checks["marker details"] = not await page.locator("#map-detail").evaluate("el => el.classList.contains('hidden')")
        checks["marker title"] = (await page.locator("#detail-title").inner_text()).strip() not in {"", "NO SELECTION"}

        for view, selector, minimum in [
            ("opportunities", ".money-card", 10),
            ("shipping", ".money-card", 10),
            ("markets", ".market-card", 8),
            ("places", ".place-row", 200),
        ]:
            await page.locator(f'.merlin-nav-item[data-view="{view}"]').click()
            await page.wait_for_timeout(100)
            checks[f"{view} visible"] = not await page.locator("#workspace-sheet").evaluate("el => el.classList.contains('hidden')")
            checks[f"{view} data"] = await page.locator(f"#sheet-content {selector}").count() >= minimum

        await page.locator("#sheet-close").click()
        checks["return map"] = await page.locator("#workspace-sheet").evaluate("el => el.classList.contains('hidden')")
        checks["no page errors"] = not page_errors
        checks["no console errors"] = not console_errors
        SCREENSHOT.parent.mkdir(parents=True, exist_ok=True)
        await page.screenshot(path=str(SCREENSHOT), full_page=True)
        await browser.close()

    failed = [name for name, value in checks.items() if not value]
    print(json.dumps({"checks": checks, "pageErrors": page_errors, "consoleErrors": console_errors, "screenshot": str(SCREENSHOT)}, indent=2))
    if failed:
        print("FAILED: " + ", ".join(failed), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
