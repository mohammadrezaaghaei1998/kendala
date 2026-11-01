import requests
from django.conf import settings
from django.core.cache import cache

BASE = 'https://visa-requirement.p.rapidapi.com/v2'

class TravelBuddyError(Exception):
    pass

def request_data(path, payload=None, ttl=86400):
    key = 'tb2:' + path + ':' + repr(sorted((payload or {}).items()))
    cached = cache.get(key)
    if cached is not None:
        return cached
    secret = getattr(settings, 'TRAVEL_BUDDY_API_KEY', '')
    if not secret:
        raise TravelBuddyError('Travel Buddy API key is not configured.')
    try:
        response = requests.request(
            'POST' if payload is not None else 'GET', BASE + path,
            headers={
                'X-RapidAPI-Key': secret,
                'X-RapidAPI-Host': 'visa-requirement.p.rapidapi.com',
                'Content-Type': 'application/json'
            },
            json=payload, timeout=18)
        if response.status_code in (401, 403):
            raise TravelBuddyError('API authentication or subscription failed. Check RapidAPI.')
        if response.status_code == 429:
            raise TravelBuddyError('Monthly API quota or rate limit reached. Please try later.')
        response.raise_for_status()
        body = response.json()


        if not isinstance(body, dict):
            raise TravelBuddyError('Invalid response from the API.')

        if body.get('error'):
            raise TravelBuddyError(
                str(body.get('message') or 'The API returned an error.')
            )

        if not isinstance(body.get('data'), (dict, list)):
            raise TravelBuddyError('The provider returned an unexpected data format.')



        result = {'data': body['data'], 'meta': body.get('meta') or {}}
        cache.set(key, result, ttl)
        return result
    except (requests.RequestException, ValueError) as exc:
        raise TravelBuddyError('Visa information is temporarily unavailable.') from exc
