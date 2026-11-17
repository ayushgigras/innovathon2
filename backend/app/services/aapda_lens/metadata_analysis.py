"""
Metadata & EXIF Extraction Module for AAPDA Lens.
Extracts GPS, timestamps, camera hardware info, and calculates SHA-256 integrity hashes.
Adheres to strict AI safety principles regarding metadata manipulation and messaging compression.
"""

import io
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Union, BinaryIO, Tuple
from PIL import Image, ExifTags


def calculate_sha256(data: Union[bytes, BinaryIO, str]) -> str:
    """
    Computes a cryptographic SHA-256 checksum for the provided byte stream or file.
    
    Safety principle:
    SHA-256 establishes file integrity AFTER ingestion (ensuring no internal tampering),
    not the authenticity of the original image scene.
    """
    sha256 = hashlib.sha256()
    if isinstance(data, bytes):
        sha256.update(data)
    elif isinstance(data, str):
        # Treat as file path
        with open(data, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha256.update(chunk)
    else:
        # File-like object
        current_pos = data.tell() if hasattr(data, "tell") else None
        for chunk in iter(lambda: data.read(65536), b""):
            sha256.update(chunk)
        if current_pos is not None and hasattr(data, "seek"):
            data.seek(current_pos)
    return sha256.hexdigest()


def _convert_dms_to_decimal(dms: Any, ref: str) -> Optional[float]:
    """Converts Degrees/Minutes/Seconds tuple/rational to decimal degrees."""
    try:
        def _to_float(v: Any) -> float:
            if hasattr(v, "numerator") and hasattr(v, "denominator"):
                return float(v.numerator) / float(v.denominator) if v.denominator != 0 else 0.0
            if isinstance(v, tuple) and len(v) == 2:
                return float(v[0]) / float(v[1]) if v[1] != 0 else 0.0
            return float(v)

        degrees = _to_float(dms[0])
        minutes = _to_float(dms[1])
        seconds = _to_float(dms[2])

        decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
        if ref.upper() in ["S", "W"]:
            decimal = -decimal
        return decimal
    except Exception:
        return None


def extract_exif_data(image: Image.Image) -> Dict[str, Any]:
    """
    Extracts raw EXIF tags from a Pillow Image object.
    Maps numeric IFD tags to human-readable strings.
    """
    raw_exif = image.getexif()
    if not raw_exif:
        return {}

    exif_dict: Dict[str, Any] = {}
    for tag_id, value in raw_exif.items():
        tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
        exif_dict[tag_name] = value

    # Check for IFD extension (DateTimeOriginal, GPSInfo, etc.)
    try:
        # Exif IFD
        if hasattr(ExifTags, "IFD") and hasattr(ExifTags.IFD, "Exif"):
            exif_ifd = raw_exif.get_ifd(ExifTags.IFD.Exif)
            for tag_id, value in exif_ifd.items():
                tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                exif_dict[tag_name] = value

        # GPS IFD
        if hasattr(ExifTags, "IFD") and hasattr(ExifTags.IFD, "GPSInfo"):
            gps_ifd = raw_exif.get_ifd(ExifTags.IFD.GPSInfo)
            gps_data: Dict[str, Any] = {}
            for tag_id, value in gps_ifd.items():
                tag_name = ExifTags.GPSTAGS.get(tag_id, str(tag_id))
                gps_data[tag_name] = value
            exif_dict["GPSInfo"] = gps_data
        elif "GPSInfo" in exif_dict and isinstance(exif_dict["GPSInfo"], dict):
            pass
    except Exception:
        pass

    return exif_dict


def parse_exif_timestamp(exif_date_str: Optional[str]) -> Optional[datetime]:
    """Parses standard EXIF date format 'YYYY:MM:DD HH:MM:SS' into UTC datetime."""
    if not exif_date_str or not isinstance(exif_date_str, str):
        return None
    try:
        dt = datetime.strptime(exif_date_str.strip(), "%Y:%m:%d %H:%M:%S")
        return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def extract_image_metadata(
    image_source: Union[bytes, BinaryIO, str, Image.Image]
) -> Dict[str, Any]:
    """
    Analyzes an image to extract provenance hashes, EXIF metadata, camera info, and GPS coords.

    Safety principles applied:
    - Missing EXIF does NOT indicate fraud or deception.
      Most instant messaging platforms (WhatsApp, Telegram, Signal) strip EXIF metadata for user privacy.
    - Software tags (e.g. Photoshop, GIMP) raise an informational advisory, not an outright rejection.
    """
    warnings: List[str] = []
    sha256_hash: Optional[str] = None
    exif_available = False
    capture_datetime: Optional[datetime] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None
    software: Optional[str] = None

    img: Optional[Image.Image] = None

    try:
        if isinstance(image_source, Image.Image):
            img = image_source
            # Generate hash from image bytes
            buf = io.BytesIO()
            img.save(buf, format=img.format or "PNG")
            sha256_hash = calculate_sha256(buf.getvalue())
        elif isinstance(image_source, bytes):
            sha256_hash = calculate_sha256(image_source)
            img = Image.open(io.BytesIO(image_source))
        elif isinstance(image_source, str):
            sha256_hash = calculate_sha256(image_source)
            img = Image.open(image_source)
        else:
            # File-like
            raw_bytes = image_source.read()
            sha256_hash = calculate_sha256(raw_bytes)
            img = Image.open(io.BytesIO(raw_bytes))

        # Extract EXIF if available
        exif = extract_exif_data(img)
        if exif:
            exif_available = True

            # Camera hardware
            camera_make = str(exif.get("Make", "")).strip() or None
            camera_model = str(exif.get("Model", "")).strip() or None
            software = str(exif.get("Software", "")).strip() or None

            # Capture timestamp
            raw_time = (
                exif.get("DateTimeOriginal")
                or exif.get("DateTimeDigitized")
                or exif.get("DateTime")
            )
            capture_datetime = parse_exif_timestamp(raw_time)

            # GPS coordinates
            gps_info = exif.get("GPSInfo")
            if isinstance(gps_info, dict):
                lat_dms = gps_info.get("GPSLatitude")
                lat_ref = gps_info.get("GPSLatitudeRef", "N")
                lng_dms = gps_info.get("GPSLongitude")
                lng_ref = gps_info.get("GPSLongitudeRef", "E")

                if lat_dms and lng_dms:
                    gps_lat = _convert_dms_to_decimal(lat_dms, lat_ref)
                    gps_lng = _convert_dms_to_decimal(lng_dms, lng_ref)

            # Editing software warning (informational)
            if software and any(app in software.lower() for app in ["photoshop", "gimp", "snapseed", "lightroom"]):
                warnings.append(
                    f"Image edited or processed by software: '{software}'. Review for visual manipulation or annotations."
                )

    except Exception as e:
        warnings.append(f"Image parsing warning: {str(e)}")

    if not exif_available:
        warnings.append(
            "No EXIF metadata present. Typical for images shared via social media or messaging platforms."
        )

    return {
        "sha256": sha256_hash,
        "exif_available": exif_available,
        "capture_datetime": capture_datetime,
        "gps_lat": round(gps_lat, 6) if gps_lat is not None else None,
        "gps_lng": round(gps_lng, 6) if gps_lng is not None else None,
        "camera_make": camera_make,
        "camera_model": camera_model,
        "software": software,
        "warnings": warnings,
        "safety_disclaimer": "Missing EXIF or GPS does not prove fraud. SHA-256 establishes post-ingestion integrity.",
    }
