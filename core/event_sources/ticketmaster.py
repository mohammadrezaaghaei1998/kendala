
"""Ticketmaster Discovery API adapter. No database writes."""

from datetime import datetime, timedelta, timezone
import requests

ENDPOINT = "https://app.ticketmaster.com/discovery/v2/events.json"
IMAGE_ENDPOINT = (
    "https://app.ticketmaster.com/discovery/v2/events/{event_id}/images.json"
)

COUNTRY_CODES = {
    "turkey": "TR",
    "turkiye": "TR",
    "kazakhstan": "KZ",
    "oman": "OM",
}


def request_json(url, params):
    try:
        response = requests.get(
            url,
            params=params,
            timeout=25,
            headers={"Accept": "application/json"},
        )
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as exc:
        raise RuntimeError(
            f"Ticketmaster API request failed: {exc}"
        ) from exc


def select_real_image(images):
    """
    Prefer a genuine event image, not a category fallback.
    The API's 'fallback' flag is the primary criterion.
    """
    suitable = []

    for img in images or []:
        if not isinstance(img, dict):
            continue

        url = str(img.get("url") or "")
        if not url.startswith("https://"):
            continue

        if img.get("fallback") is not False:
            continue

        suitable.append(img)

    suitable.sort(
        key=lambda img: (
            img.get("ratio") == "16_9",
            min(int(img.get("width") or 0), 2048),
        ),
        reverse=True,
    )

    return suitable[0]["url"] if suitable else ""


def fetch_event_image(api_key, event_id):
    """Check the official image endpoint for an event."""
    url = IMAGE_ENDPOINT.format(event_id=event_id)

    payload = request_json(
        url,
        {"apikey": api_key},
    )

    return select_real_image(payload.get("images", []))


def fetch_events(api_key, country_code, limit=150):
    """
    Search a broad event pool across six 30-day windows.

    Unlike the old implementation, do not stop after
    the first 25 chronologically earliest events.
    """
    now = datetime.now(timezone.utc)
    collected = []
    seen_ids = set()

    # Three pages of 100 per window, up to 1800 candidates.
    # This remains within Ticketmaster's documented
    # deep-pagination boundary for each search.
    pages_per_window = 3
    page_size = 100

    for window in range(6):
        start = now + timedelta(days=3 + window * 30)
        end = now + timedelta(days=3 + (window + 1) * 30)

        for page in range(pages_per_window):
            params = {
                "apikey": api_key,
                "countryCode": country_code,
                "size": page_size,
                "page": page,
                "sort": "relevance,desc",
                "startDateTime": start.strftime(
                    "%Y-%m-%dT%H:%M:%SZ"
                ),
                "endDateTime": end.strftime(
                    "%Y-%m-%dT%H:%M:%SZ"
                ),
            }

            payload = request_json(ENDPOINT, params)
            items = payload.get("_embedded", {}).get(
                "events", []
            )

            if not items:
                break

            for item in items:
                event_id = str(item.get("id") or "")
                title = (item.get("name") or "").strip()

                if not event_id or not title:
                    continue

                if event_id in seen_ids:
                    continue

                dates = item.get("dates") or {}
                start_date = (
                    dates.get("start") or {}
                ).get("localDate")

                if not start_date:
                    continue

                status = (
                    dates.get("status") or {}
                ).get("code", "").lower()

                if status in {
                    "cancelled",
                    "canceled",
                    "postponed",
                    "rescheduled",
                }:
                    continue

                seen_ids.add(event_id)

                venues = (
                    (item.get("_embedded") or {})
                    .get("venues") or [{}]
                )
                venue = venues[0]

                classifications = (
                    item.get("classifications") or [{}]
                )
                classification = classifications[0]

                segment = (
                    classification.get("segment") or {}
                ).get("name") or ""

                genre = (
                    classification.get("genre") or {}
                ).get("name") or ""

                subgenre = (
                    classification.get("subGenre") or {}
                ).get("name") or ""

                image_url = select_real_image(
                    item.get("images", [])
                )

                collected.append({
                    "source": "ticketmaster",
                    "source_id": event_id,
                    "title": title,
                    "start_date": start_date,
                    "end_date": (
                        (dates.get("end") or {})
                        .get("localDate")
                    ),
                    "city": (
                        (venue.get("city") or {})
                        .get("name", "")
                    ),
                    "venue": venue.get("name") or "",
                    "category": segment,
                    "genre": genre,
                    "subgenre": subgenre,
                    "external_url": item.get("url") or "",
                    "source_image_url": image_url,
                    "description": (
                        item.get("info")
                        or item.get("pleaseNote")
                        or ""
                    )[:10000],
                    "window": window,
                })

            total_pages = (
                payload.get("page") or {}
            ).get("totalPages", 1)

            if page + 1 >= total_pages:
                break

    return collected
