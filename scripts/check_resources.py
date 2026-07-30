#!/usr/bin/env python3
"""Check public config files for dead URLs and accidentally committed secrets."""

from __future__ import annotations

import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT_EXTENSIONS = {".conf", ".list", ".md", ".yml", ".yaml", ".py"}
URL_RE = re.compile(r"https?://[^\s,)>`]+")
SECRET_PATTERNS = {
    "JMS subscription": re.compile(r"https?://[^\s,]+/members/getsub\.php\?(?!<|YOUR_)[^\s,]+", re.I),
    "MITM p12": re.compile(r"(?mi)^\s*p12\s*=\s*(?!<|YOUR_|$).+"),
    "MITM passphrase": re.compile(r"(?mi)^\s*passphrase\s*=\s*(?!<|YOUR_|$).+"),
}
SKIP_URL_PARTS = ("YOUR_SUBSCRIPTION_URL", "example.com", "localhost")


def files() -> list[Path]:
    return [
        path
        for path in ROOT.rglob("*")
        if path.is_file()
        and path.suffix.lower() in TEXT_EXTENSIONS
        and ".git" not in path.parts
    ]


def check_secrets(paths: list[Path]) -> list[str]:
    failures: list[str] = []
    for path in paths:
        text = path.read_text("utf-8", errors="replace")
        for name, pattern in SECRET_PATTERNS.items():
            if pattern.search(text):
                failures.append(f"SECRET {name}: {path.relative_to(ROOT)}")
    return failures


def check_url(url: str) -> str | None:
    if any(part in url for part in SKIP_URL_PARTS):
        return None

    headers = {"User-Agent": "QuantumultX-Pro-resource-check/1.0"}
    for method in ("HEAD", "GET"):
        try:
            request = urllib.request.Request(url, method=method, headers=headers)
            if method == "GET":
                request.add_header("Range", "bytes=0-0")
            with urllib.request.urlopen(request, timeout=20) as response:
                if response.status < 400:
                    return None
                return f"HTTP {response.status}: {url}"
        except urllib.error.HTTPError as error:
            if method == "HEAD" and error.code in (403, 405):
                continue
            return f"HTTP {error.code}: {url}"
        except Exception as error:  # noqa: BLE001
            if method == "HEAD":
                continue
            return f"ERROR {type(error).__name__}: {url} ({error})"

    return f"ERROR unknown: {url}"


def main() -> int:
    paths = files()
    failures = check_secrets(paths)
    urls = sorted(
        {
            url.rstrip(".;")
            for path in paths
            for url in URL_RE.findall(path.read_text("utf-8", errors="replace"))
        }
    )

    for url in urls:
        failure = check_url(url)
        if failure:
            failures.append(failure)
        else:
            print(f"OK {url}")

    if failures:
        print("\nFailures:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print(f"\nChecked {len(urls)} URLs and {len(paths)} text files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
