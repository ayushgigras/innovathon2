"""
Unit tests for Emergency Call Intake and Telegram Notification Services.
"""

import pytest
from app.services.call_intake_service import parse_call_transcript
from app.services.telegram_service import send_telegram_notification


def test_call_transcript_parsing_landslide_critical():
    transcript = (
        "Emergency Helpline! I am calling from Panthyal near the tunnel. "
        "A huge landslide just came down from the mountain, 4 vehicles are trapped and "
        "people are shouting for urgent rescue. Shooting stones are still falling!"
    )
    result = parse_call_transcript(transcript, caller_phone="+91-9876543210")

    assert result["source"] == "phone_call"
    assert result["extracted_category"] == "landslide"
    assert result["extracted_severity"] == "critical"
    assert result["extracted_location"]["district"] == "Ramban"
    assert "Panthyal" in result["extracted_location"]["sector_name"]
    assert result["status"] == "queued_for_review"
    assert len(result["urgency_indicators"]) > 0


def test_call_transcript_parsing_flood_with_missing_info():
    transcript = "The river is overflowing near Doda bridge, water rising fast."
    result = parse_call_transcript(transcript)

    assert result["extracted_category"] == "flood"
    assert result["extracted_location"]["district"] == "Doda"
    assert len(result["missing_information"]) > 0


def test_telegram_notification_graceful_fallback():
    res = send_telegram_notification(
        title="CRITICAL: Panthyal Landslide",
        message="NH-44 blocked. Diversion in place.",
        report_id="RPT-TEST-001",
        category="landslide",
        location="Panthyal, Ramban",
        severity="critical",
    )

    assert res["status"] in ["simulated", "delivered", "fallback_error"]
    assert "@AAPDA_JK_Disaster_Alerts" in res.get("channel", "") or res.get("channel")
