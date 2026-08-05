#!/usr/bin/env python3
"""Watchdog runner for the rendered Part 20 Chromium acceptance suite."""
from __future__ import annotations
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / '.tmp' / 'part20-browser' / 'report.json'
WORKER = ROOT / 'scripts' / 'browser-e2e-part20.py'
TIMEOUT_SECONDS = int(os.environ.get('MERLIN_BROWSER_RUNNER_TIMEOUT', '210'))


def stop(process: subprocess.Popen) -> None:
    if process.poll() is not None:
        return
    try:
        os.killpg(process.pid, signal.SIGTERM)
        process.wait(timeout=5)
    except Exception:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except Exception:
            process.kill()


def valid_report():
    if not REPORT.exists():
        return None
    try:
        payload = json.loads(REPORT.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError):
        return None
    if payload.get('renderedViewports') != 6 or len(payload.get('results', [])) != 6:
        return None
    return payload


def main() -> int:
    REPORT.unlink(missing_ok=True)
    process = subprocess.Popen(
        [sys.executable, str(WORKER)],
        cwd=ROOT,
        start_new_session=True,
    )
    deadline = time.time() + TIMEOUT_SECONDS
    try:
        while time.time() < deadline:
            report = valid_report()
            if report is not None:
                stop(process)
                failed = report.get('failed', [])
                print(json.dumps({
                    'renderedViewports': report['renderedViewports'],
                    'failed': failed,
                    'report': str(REPORT),
                }, indent=2), flush=True)
                return 1 if failed else 0
            if process.poll() is not None:
                report = valid_report()
                if report is not None:
                    return 1 if report.get('failed') else 0
                return process.returncode or 1
            time.sleep(0.5)
        print(f'Browser acceptance timed out before a complete report was written: {REPORT}', file=sys.stderr)
        return 1
    finally:
        stop(process)


if __name__ == '__main__':
    raise SystemExit(main())
