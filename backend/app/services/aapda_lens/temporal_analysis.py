"""
Temporal Analysis Module for AAPDA Lens.
Evaluates timestamp consistency, chronological order, future timestamps, and stale media detection.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, Union, List


def parse_utc_timestamp(ts: Union[str, datetime, None]) -> Optional[datetime]:
    """
    Parses an ISO 8601 string or datetime object into a timezone-aware UTC datetime.
    Returns None if parsing fails.
    """
    if ts is None:
        return None
    if isinstance(ts, datetime):
        if ts.tzinfo is None:
            return ts.replace(tzinfo=timezone.utc)
        return ts.astimezone(timezone.utc)
    if isinstance(ts, str):
        try:
            # Handle common ISO formats including trailing 'Z'
            cleaned = ts.replace("Z", "+00:00")
            dt = datetime.fromisoformat(cleaned)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except (ValueError, TypeError):
            return None
    return None


def check_temporal_consistency(
    reported_at: Union[str, datetime],
    evidence_captured_at: Optional[Union[str, datetime]] = None,
    evidence_uploaded_at: Optional[Union[str, datetime]] = None,
    current_time: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Evaluates temporal consistency across incident report time, evidence capture time,
    and upload time. Detects stale evidence, future timestamps, and clock skew.

    Safety principles:
    - Photos captured hours before submission are normal in mountain disasters due to poor connectivity.
    - Media captured > 7 days earlier is flagged as potentially archived/recycled.
    - Media captured > 30 days earlier is flagged as stale.
    - Future timestamps (> 5 mins ahead of current time) indicate inaccurate device clock or manipulation.
    """
    if current_time is None:
        current_time = datetime.now(timezone.utc)
    else:
        current_time = parse_utc_timestamp(current_time) or datetime.now(timezone.utc)

    dt_reported = parse_utc_timestamp(reported_at)
    dt_captured = parse_utc_timestamp(evidence_captured_at)
    dt_uploaded = parse_utc_timestamp(evidence_uploaded_at)

    warnings: List[str] = []
    reasons: List[str] = []
    is_consistent = True
    is_stale = False
    staleness_level = "recent"  # "recent", "delayed", "moderately_stale", "stale", "unknown"
    time_diff_hours: Optional[float] = None

    if dt_reported is None:
        return {
            "is_consistent": False,
            "is_stale": False,
            "staleness_level": "unknown",
            "time_diff_hours": None,
            "warnings": ["Report timestamp is missing or invalid."],
            "reasons": ["Cannot establish temporal baseline without valid report timestamp."],
            "status": "invalid_report_time",
        }

    # 1. Check if report timestamp is in the future (> 5 min tolerance for minor NTP drift)
    future_tolerance = timedelta(minutes=5)
    if dt_reported > (current_time + future_tolerance):
        is_consistent = False
        warnings.append(
            f"Report timestamp is {(dt_reported - current_time).total_seconds() / 60:.1f} minutes in the future. "
            "Possible device clock inaccuracy or fabricated timestamp."
        )

    # 2. Check evidence capture timestamp against report and current time
    if dt_captured is not None:
        if dt_captured > (current_time + future_tolerance):
            is_consistent = False
            warnings.append(
                "Evidence capture timestamp is in the future. Camera clock may be improperly calibrated."
            )

        # Elapsed time between claimed capture and report submission
        elapsed_delta = dt_reported - dt_captured
        time_diff_hours = round(elapsed_delta.total_seconds() / 3600.0, 2)

        if elapsed_delta < timedelta(minutes=-10):
            # Evidence claims to be taken AFTER the report was submitted
            is_consistent = False
            warnings.append(
                f"Chronological anomaly: Evidence claims capture {abs(time_diff_hours):.1f} hours after the report was filed."
            )
        elif elapsed_delta <= timedelta(hours=24):
            staleness_level = "recent"
            reasons.append(f"Evidence captured {time_diff_hours:.1f} hours prior to reporting (fresh capture).")
        elif elapsed_delta <= timedelta(days=7):
            staleness_level = "delayed"
            reasons.append(
                f"Evidence captured {time_diff_hours / 24.0:.1f} days prior to report (acceptable in offline mountain areas)."
            )
        elif elapsed_delta <= timedelta(days=30):
            staleness_level = "moderately_stale"
            is_stale = True
            warnings.append(
                f"Evidence capture date is {time_diff_hours / 24.0:.1f} days old (>7 days). "
                "Verify whether image depicts a past seasonal disaster or recent event."
            )
        else:
            staleness_level = "stale"
            is_stale = True
            is_consistent = False
            warnings.append(
                f"Stale evidence warning: Media was captured {time_diff_hours / 24.0:.1f} days ago (>30 days). "
                "High probability of recycled media from prior historical disaster."
            )
    else:
        staleness_level = "unknown"
        reasons.append("No capture timestamp provided in evidence metadata.")

    # 3. Check upload delay if upload time is provided
    if dt_uploaded is not None and dt_captured is not None:
        upload_delay = dt_uploaded - dt_captured
        if upload_delay > timedelta(days=7):
            warnings.append(
                f"Upload delayed by {upload_delay.total_seconds() / 86400.0:.1f} days after claimed capture."
            )

    return {
        "is_consistent": is_consistent,
        "is_stale": is_stale,
        "staleness_level": staleness_level,
        "time_diff_hours": time_diff_hours,
        "warnings": warnings,
        "reasons": reasons,
        "status": "consistent" if is_consistent and not is_stale else "inconsistent_or_stale",
    }
