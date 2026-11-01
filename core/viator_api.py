"""Viator Basic Access: on-demand product search, NOT catalog ingestion."""
import hashlib
import json
import logging
import requests
from django.conf import settings
from django.core.cache import cache

LOG = logging.getLogger(__name__)
API_BASE = 'https://api.viator.com/partner'

class ViatorError(Exception):
    pass


def api_request(method, path, payload=None):
    key = getattr(settings, 'VIATOR_API_KEY', '')
    if not key:
        raise ViatorError('VIATOR_API_KEY missing from Django settings')
    headers = {
        'exp-api-key': key,
        'Accept': 'application/json;version=2.0',
        'Content-Type': 'application/json;version=2.0',
        'Accept-Language': 'en-US',
    }
    try:
        response = requests.request(method, API_BASE + path, headers=headers,
                                    json=payload, timeout=25)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        LOG.warning('Viator API request failed: %s', exc)
        raise ViatorError('Viator is temporarily unavailable') from exc


def search_products(destination_id, count=30):
    """Search an actual destination; cache a bounded page, never crawl catalog."""
    destination_id = str(destination_id).strip()
    if not destination_id.isdigit():
        raise ValueError('Viator destination ID must be numeric')
    count = max(1, min(int(count), 50))
    key = 'viator:search:' + hashlib.sha256(f'{destination_id}:{count}:usd'.encode()).hexdigest()
    cached = cache.get(key)
    if cached is not None:
        return cached
    payload = {
        'filtering': {'destination': destination_id},
        'sorting': {'sort': 'TRAVELER_RATING', 'order': 'DESCENDING'},
        'pagination': {'start': 1, 'count': count},
        'currency': 'USD',
    }
    data = api_request('POST', '/products/search', payload)
    products = data.get('products', [])
    if not isinstance(products, list):
        raise ViatorError('Unexpected product response')
    # Search summaries are not a bulk content feed; no persistent DB writes.
    cache.set(key, products, timeout=30 * 60)
    return products


def list_destinations():
    key = 'viator:destinations:v2'
    cached = cache.get(key)
    if cached is not None:
        return cached
    data = api_request('GET', '/destinations')
    cache.set(key, data, timeout=24 * 3600)
    return data


def adventure_first(products):
    """Rank adventure results ahead of sightseeing; do not invent activities."""
    strong = ('rafting', 'jet ski', 'jetski', 'atv', 'quad', 'buggy', 'zipline',
              'zip line', 'jeep safari', 'canyoning', 'hiking', 'trekking',
              'kayak', 'parasailing', 'paragliding', 'boat tour', 'boat trip',
              'cruise', 'snorkel', 'scuba', 'off-road', 'off road', 'safari')
    mild = ('nature', 'lake', 'waterfall', 'walking tour', 'city tour',
            'island', 'mountain', 'canyon', 'river')
    def score(p):
        title = str(p.get('title', '')).lower()
        return (int(any(t in title for t in strong)) * 3
                + int(any(t in title for t in mild))
                - int('museum' in title) * 10)
    return [p for p in sorted(products, key=score, reverse=True)
            if 'museum' not in str(p.get('title', '')).lower()]





def get_product(product_code):
    import re
    from urllib.parse import quote

    if not re.fullmatch(r"[A-Za-z0-9_-]{2,80}", product_code):
        raise ViatorError("Invalid Viator product code")

    # New cache version for standard product landing pages
    key = "viator:product:v2:standard:" + product_code

    result = cache.get(key)
    if result is not None:
        return result

    path = (
        "/products/"
        + quote(product_code, safe="")
        + "?target-lander=NONE"
    )

    result = api_request("GET", path)

    if not isinstance(result, dict) or not result:
        raise ViatorError("Empty Viator product detail")

    cache.set(key, result, timeout=60 * 60)

    return result






