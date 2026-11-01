from datetime import date
from urllib.parse import urlencode
import pycountry
from django.shortcuts import render
from .travel_buddy import request_data, TravelBuddyError

COUNTRIES = sorted(((c.alpha_2, c.name) for c in pycountry.countries), key=lambda x:x[1])
CODES = {code for code, _ in COUNTRIES}
WEIGHTS = {
    'Visa-free': 2, 'Visa on arrival': 1, 'Visa required': 0,
    'eVisa': 1, 'eTA': 1, 'Tourist card': 0,
    'Freedom of movement': 3, 'Not admitted': -1,
}

def base(request, page):
    passport = request.GET.get('passport', 'TR').upper()
    destination = request.GET.get('destination', 'KZ').upper()
    return {
        'page': page, 'countries': COUNTRIES,
        'passport': passport if passport in CODES else 'TR',
        'destination': destination if destination in CODES else 'KZ',
        'submitted': 'check' in request.GET,
    }

def visa_regulations(request):
    ctx = base(request, 'visa')
    if ctx['submitted']:
        if ctx['passport'] == ctx['destination']:
            ctx['error'] = 'Choose different passport and destination countries.'
        else:
            try:
                response = request_data('/visa/check', {'passport':ctx['passport'], 'destination':ctx['destination']})
                ctx['result'] = response['data']
                rules = ctx['result'].get('visa_rules') or {}
                primary = rules.get('primary_rule') or {}
                secondary = rules.get('secondary_rule') or {}
                ctx['primary'] = primary
                ctx['secondary'] = secondary
                ctx['exceptions'] = rules.get('exception_rules') or ([rules['exception_rule']] if rules.get('exception_rule') else [])
                ctx['registrations'] = ctx['result'].get('mandatory_registrations') or ([ctx['result']['mandatory_registration']] if ctx['result'].get('mandatory_registration') else [])
                ctx['rule_line'] = ' / '.join(filter(None, [primary.get('name'), secondary.get('name')]))
                ctx['duration'] = primary.get('duration') or secondary.get('duration')
                ctx['meta'] = response['meta']
            except TravelBuddyError as exc:
                ctx['error'] = str(exc)
    return render(request, 'travel_tools/visa.html', ctx)

def visa_map(request):
    ctx = base(request, 'map')
    if ctx['submitted']:
        try:
            data = request_data('/visa/map', {'passport':ctx['passport']})['data']
            colors = data.get('colors') or {}
            ctx['map_colors'] = {color: [c.strip() for c in value.split(',') if c.strip()] if isinstance(value, str) else value for color, value in colors.items()}
            ctx['map_entries'] = [{'code':code, 'name':dict(COUNTRIES).get(code, code), 'color':color} for color, codes in ctx['map_colors'].items() for code in codes]
        except TravelBuddyError as exc:
            ctx['error'] = str(exc)
    return render(request, 'travel_tools/map.html', ctx)

def passport_rankings(request):
    ctx = base(request, 'rankings')
    weights = {}
    for name, default in WEIGHTS.items():
        try:
            weight = float(request.GET.get(name, default))
            if not -10 <= weight <= 10: raise ValueError()
            weights[name] = weight
        except (ValueError, TypeError):
            weights[name] = float(default)
    ctx['weights'] = list(weights.items())
    if ctx['submitted']:
        try:
            ctx['ranking'] = request_data('/passport/rank/custom', {'weights':weights})['data']
        except TravelBuddyError as exc:
            ctx['error'] = str(exc)
    return render(request, 'travel_tools/rankings.html', ctx)

def visa_history(request):
    ctx = base(request, 'history')
    since = request.GET.get('since', '2024-01-01')
    ctx['since'] = since
    if ctx['submitted']:
        try:
            date.fromisoformat(since)
            if ctx['passport'] == ctx['destination']:
                raise ValueError()
            response = request_data(f"/visa/check/history/{ctx['passport']}/{ctx['destination']}/{since}", ttl=86400)
            ctx['history'] = response['data']
            ctx['meta'] = response['meta']
            ctx['is_demo'] = response['meta'].get('is_demo', True) or response['meta'].get('data_mode') == 'demo'
        except ValueError:
            ctx['error'] = 'Enter a valid date and two different countries.'
        except TravelBuddyError as exc:
            ctx['error'] = str(exc)
    return render(request, 'travel_tools/history.html', ctx)
