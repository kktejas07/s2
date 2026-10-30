"""
Scannable QR codes for generated documents.

Every QR encodes ONE short URL to the web app's public /verify page, which shows
the document's details and re-opens the same PDF on the scanning device.

The URL must be reachable from a phone, so it never uses "localhost":
  - PUBLIC_WEB_URL / PUBLIC_API_URL env vars win when set (use these in production,
    e.g. https://portal.iqe.co.in and https://api.iqe.co.in).
  - Otherwise the machine's LAN IP is detected, so a phone on the same Wi-Fi works
    in development (web on :3000; the API is reached through its /backend proxy).
"""
from __future__ import annotations

import base64
import hashlib
import json
import socket
import threading
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import Optional
from urllib.parse import urlencode

from core.config import settings


@lru_cache(maxsize=1)
def _lan_ip() -> str:
    # Connecting a UDP socket sends no packets; it just picks the outbound interface.
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


# Short-link registry: QR codes carry /v/<code> (tiny, easy to scan) and the API
# redirects to the full verify URL. Codes are a hash of the target, so the same
# document always gets the same code; stored on disk so links survive restarts.
_LINKS_FILE = Path(__file__).resolve().parent.parent / "media" / "verify_links.json"
_links_lock = threading.Lock()


def _load_links() -> dict[str, str]:
    try:
        return json.loads(_LINKS_FILE.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def shorten(target: str) -> str:
    code = hashlib.sha256(target.encode()).hexdigest()[:10]
    with _links_lock:
        links = _load_links()
        if links.get(code) != target:
            links[code] = target
            _LINKS_FILE.parent.mkdir(parents=True, exist_ok=True)
            _LINKS_FILE.write_text(json.dumps(links, indent=0))
    # Served via the web app's /v/* proxy, so a phone only needs to reach one host
    return f"{public_web_url()}/v/{code}"


def resolve_short(code: str) -> Optional[str]:
    return _load_links().get(code)


def public_web_url() -> str:
    return (settings.public_web_url or f"http://{_lan_ip()}:3000").rstrip("/")


def public_api_url() -> str:
    # Default: the web app's /backend proxy (see apps/web/next.config.js)
    return (settings.public_api_url or f"{public_web_url()}/backend").rstrip("/")


def verify_url(
    title: str,
    ref: str = "",
    pdf_path: Optional[str] = None,
    status: str = "",
    client: str = "",
    form: str = "",
    date: str = "",
) -> str:
    """Build the (short) scan-to-verify link that a QR code points to.

    `pdf_path` is an API path (e.g. "/api/v1/reports/pdf/boq-reconciliation?site_id=X")
    that regenerates this exact document; the verify page opens it on the phone.
    """
    params = {"t": title, "ref": ref, "form": form, "client": client, "status": status, "date": date}
    if pdf_path:
        params["pdf"] = public_api_url() + pdf_path
    query = urlencode({k: v for k, v in params.items() if v})
    return shorten(f"{public_web_url()}/verify?{query}")


def qr_png(data: str, box_size: int = 8) -> BytesIO:
    """PNG QR image (for WeasyPrint, python-docx and openpyxl)."""
    import qrcode
    from qrcode.constants import ERROR_CORRECT_M

    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=box_size, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#003752", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def qr_data_uri(data: str) -> str:
    return "data:image/png;base64," + base64.b64encode(qr_png(data).getvalue()).decode()


def qr_drawing(data: str, size: float = 56):
    """ReportLab flowable QR code of `size` points square."""
    from reportlab.graphics.barcode.qr import QrCodeWidget
    from reportlab.graphics.shapes import Drawing
    from reportlab.lib import colors

    widget = QrCodeWidget(data, barLevel="M")
    widget.barFillColor = colors.HexColor("#003752")
    x1, y1, x2, y2 = widget.getBounds()
    w, h = x2 - x1, y2 - y1
    drawing = Drawing(size, size, transform=[size / w, 0, 0, size / h, 0, 0])
    drawing.add(widget)
    return drawing
