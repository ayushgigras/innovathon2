"""
Telegram Bot Integration Service for AAPDA Grid.
Sends real-time emergency dispatch notifications to authorized DDMA officers' channels.
Reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from configuration.
Provides graceful offline fallback logging when tokens are not configured.
"""

import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_telegram_notification(
    title: str,
    message: str,
    report_id: Optional[str] = None,
    category: Optional[str] = None,
    location: Optional[str] = None,
    severity: Optional[str] = None,
    admin_dashboard_url: str = "http://localhost:3000/admin/dashboard",
    timeout_seconds: float = 4.0,
) -> Dict[str, Any]:
    """
    Sends an authorized notification to the DDMA officers' Telegram notification channel.
    Fails gracefully if Telegram credentials are not set or if network is offline.
    """
    token = getattr(settings, "TELEGRAM_BOT_TOKEN", "") or ""
    chat_id = getattr(settings, "TELEGRAM_CHAT_ID", "") or ""

    timestamp_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Format Telegram Markdown message
    severity_emoji = "🚨" if severity == "critical" else "⚠️" if severity == "high" else "ℹ️"
    
    text_lines = [
        f"{severity_emoji} *AAPDA GRID EOC ALERT*",
        f"*Event:* {title}",
    ]
    if report_id:
        text_lines.append(f"*Report ID:* `{report_id}`")
    if category:
        text_lines.append(f"*Category:* {category.upper()}")
    if location:
        text_lines.append(f"*Location:* {location}")
    if severity:
        text_lines.append(f"*Urgency:* {severity.upper()}")
    
    text_lines.extend([
        f"*Time:* {timestamp_str}",
        f"*Advisory:* {message}",
        f"\n[Open Admin Control Room]({admin_dashboard_url})",
    ])

    formatted_text = "\n".join(text_lines)

    if not token or not chat_id:
        logger.info(
            "Telegram bot token or chat ID not configured. Simulated dispatch logged:\n%s",
            formatted_text,
        )
        return {
            "status": "simulated",
            "channel": "@AAPDA_JK_Disaster_Alerts",
            "dispatched_at": timestamp_str,
            "preview": formatted_text,
            "message": "Telegram credentials not set; simulated notification logged.",
        }

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": formatted_text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": False,
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
            if resp.status == 200:
                result = json.loads(resp.read().decode("utf-8"))
                return {
                    "status": "delivered",
                    "channel": str(chat_id),
                    "dispatched_at": timestamp_str,
                    "telegram_message_id": result.get("result", {}).get("message_id"),
                }
    except Exception as exc:
        logger.warning("Telegram dispatch failed: %s; falling back to local audit.", exc)
        return {
            "status": "fallback_error",
            "channel": str(chat_id),
            "dispatched_at": timestamp_str,
            "error": str(exc),
            "preview": formatted_text,
        }
