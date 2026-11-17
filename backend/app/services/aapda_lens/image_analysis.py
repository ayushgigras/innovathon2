"""
Image Analysis & Perceptual Hashing Module for AAPDA Lens.
Detects exact duplicates and near-duplicates using ImageHash (pHash, dHash, aHash).
Follows AI safety principles: Duplicate images do NOT imply fraud; citizens frequently share the same media.
"""

import io
from typing import Dict, Any, List, Optional, Union, Tuple
from PIL import Image
import imagehash


def compute_image_hashes(image_source: Union[bytes, str, Image.Image]) -> Dict[str, str]:
    """
    Computes multiple perceptual hashes for an image:
    - pHash (perceptual hash): robust to scaling, aspect ratio changes, minor brightness changes.
    - dHash (difference hash): tracks horizontal intensity gradients.
    - aHash (average hash): high-level structure.
    """
    if isinstance(image_source, Image.Image):
        img = image_source
    elif isinstance(image_source, bytes):
        img = Image.open(io.BytesIO(image_source))
    elif isinstance(image_source, str):
        img = Image.open(image_source)
    else:
        raise ValueError(f"Unsupported image source type: {type(image_source)}")

    # Ensure RGB/L mode for hashing
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    phash_val = str(imagehash.phash(img))
    dhash_val = str(imagehash.dhash(img))
    ahash_val = str(imagehash.average_hash(img))

    return {
        "phash": phash_val,
        "dhash": dhash_val,
        "ahash": ahash_val,
    }


def compare_image_hashes(hash1: str, hash2: str) -> Dict[str, Any]:
    """
    Calculates the Hamming distance between two hex perceptual hashes.
    Evaluates duplicate likelihood:
    - Distance 0: Exact perceptual match (identical scene/framing).
    - Distance 1 - 5: Near-duplicate (re-encoded, compressed, minor crop/watermark).
    - Distance 6 - 10: Structurally similar (possible variant / same scene different angle).
    - Distance > 10: Distinct images.
    """
    try:
        h1 = imagehash.hex_to_hash(hash1)
        h2 = imagehash.hex_to_hash(hash2)
        hamming_dist = h1 - h2
    except Exception as e:
        return {
            "hamming_distance": None,
            "match_category": "error",
            "is_duplicate": False,
            "similarity_score": 0.0,
            "error": str(e),
        }

    # Normalize similarity score from hash bit length (default 64 bits)
    hash_length = len(h1.hash.flatten()) if hasattr(h1, "hash") else 64
    similarity = max(0.0, min(1.0, 1.0 - (hamming_dist / float(hash_length))))

    if hamming_dist == 0:
        category = "exact_duplicate"
        is_dup = True
    elif hamming_dist <= 5:
        category = "near_duplicate"
        is_dup = True
    elif hamming_dist <= 10:
        category = "possible_variant"
        is_dup = False
    else:
        category = "distinct"
        is_dup = False

    return {
        "hamming_distance": hamming_dist,
        "match_category": category,
        "is_duplicate": is_dup,
        "similarity_score": round(similarity, 3),
    }


def detect_duplicate_images(
    candidate_hash: str,
    catalog: List[Dict[str, Any]],
    threshold_distance: int = 5,
) -> Dict[str, Any]:
    """
    Searches an evidence catalog for duplicate or near-duplicate media.
    Each item in catalog should contain:
    - 'evidence_id': str
    - 'incident_id': Optional[str]
    - 'phash': str

    Important AI safety principle:
    Duplicate images indicate corroborated viral sharing or redundant reports,
    NOT fraudulent reporting.
    """
    matched_duplicates: List[Dict[str, Any]] = []
    min_distance = 999
    closest_match = None

    for item in catalog:
        existing_hash = item.get("phash")
        if not existing_hash:
            continue

        comp = compare_image_hashes(candidate_hash, existing_hash)
        dist = comp["hamming_distance"]
        if dist is not None and dist < min_distance:
            min_distance = dist
            closest_match = item

        if comp["is_duplicate"] or (dist is not None and dist <= threshold_distance):
            matched_duplicates.append({
                "evidence_id": item.get("evidence_id"),
                "incident_id": item.get("incident_id"),
                "hamming_distance": dist,
                "match_category": comp["match_category"],
                "similarity_score": comp["similarity_score"],
            })

    is_duplicate_found = len(matched_duplicates) > 0
    warnings = []
    if is_duplicate_found:
        dup_ids = [m.get("evidence_id") for m in matched_duplicates]
        warnings.append(
            f"Image matches existing evidence {dup_ids}. "
            "Deduplication notice: Likely shared visual evidence across reports. Do not double-count incident impact."
        )

    return {
        "is_duplicate_found": is_duplicate_found,
        "duplicate_count": len(matched_duplicates),
        "matches": matched_duplicates,
        "closest_distance": min_distance if min_distance != 999 else None,
        "warnings": warnings,
        "safety_principle": "Duplicate images do not prove an incident is fake (citizens reshare real photos).",
    }
