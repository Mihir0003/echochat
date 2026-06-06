#!/usr/bin/env python3
"""
EchoChat cross-platform launcher.
Run: python run.py
"""

import os
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
VENV_DIR = BACKEND_DIR / "venv"
REQUIREMENTS = BACKEND_DIR / "requirements.txt"
UPLOADS_DIR = PROJECT_ROOT / "uploads"
PORT = int(os.environ.get("PORT", 8085))
URL = f"http://localhost:{PORT}"


def venv_python() -> Path:
    if sys.platform == "win32":
        return VENV_DIR / "Scripts" / "python.exe"
    return VENV_DIR / "bin" / "python"


def venv_pip() -> list:
    return [str(venv_python()), "-m", "pip"]


def run(cmd: list, cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess:
    print(f"> {' '.join(cmd)}")
    return subprocess.run(cmd, cwd=cwd or PROJECT_ROOT, check=check)


def main() -> int:
    print("\n========================================")
    print(" EchoChat - One-Click Launcher")
    print("========================================\n")

    if sys.version_info < (3, 10):
        print("[ERROR] Python 3.10 or newer is required.")
        return 1

    UPLOADS_DIR.mkdir(exist_ok=True)

    if not VENV_DIR.exists():
        print("[1/3] Creating virtual environment...")
        run([sys.executable, "-m", "venv", str(VENV_DIR)])
    else:
        print("[1/3] Virtual environment found.")

    py = venv_python()
    if not py.exists():
        print("[ERROR] Virtual environment Python not found.")
        return 1

    print("[2/3] Installing / updating dependencies...")
    run(venv_pip() + ["install", "--upgrade", "pip", "-q"])
    run(venv_pip() + ["install", "-r", str(REQUIREMENTS), "-q"])

    print("[3/3] Starting EchoChat server...")
    print(f"\n Local:   {URL}")
    print(" Press Ctrl+C to stop the server.")
    print("========================================\n")

    def open_browser():
        time.sleep(2)
        webbrowser.open(URL)

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    try:
        run([str(py), "server.py"], cwd=BACKEND_DIR)
    except KeyboardInterrupt:
        print("\nServer stopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
