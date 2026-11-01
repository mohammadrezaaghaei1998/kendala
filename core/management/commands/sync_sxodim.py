
import hashlib
import json
import re
import time
from datetime import date, timedelta
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from core.models import City, Country, CountryEvent

BASE = "https://sxodim.com"
CITIES = [
    ("almaty", "Almaty", 8),
    ("astana", "Astana", 7),
    ("shymkent", "Shymkent", 2),
    ("karaganda", "Karaganda", 1),
    ("aktau", "Aktau", 1),
    ("atyrau", "Atyrau", 1),
]
HIGH_PRIORITY = ("festival", "фестиваль", "фестивал", "international", "международ", "халықаралық", "exhibition", "выстав", "көрме", "марафон", "championship", "чемпионат", "world tour")
MEDIUM_PRIORITY = ("concert", "концерт", "концерті", "orchestra", "оркестр", "симфон", "theatre", "театр", "балет", "opera", "опера", "музей", "sport", "турнир")
LOW_PRIORITY = ("квиз", "quiz", "teztap", "интеллектуал", "стендап", "stand up", "stand-up", "таро", "таролог", "киноклуб", "импровизац", "караоке", "вечеринк", "дискотек", "мастер-класс", "мастер класс")


def safe_url(url):
    if not url:
        return None
    parsed = urlparse(urljoin(BASE, url))
    if parsed.scheme != "https" or parsed.hostname not in {"sxodim.com", "www.sxodim.com"}:
        return None
    return f"https://sxodim.com{parsed.path.rstrip('/')}"


def objects(node):
    if isinstance(node, list):
        for child in node:
            yield from objects(child)
    elif isinstance(node, dict):
        types = node.get("@type", [])
        if types == "Event" or isinstance(types, list) and "Event" in types:
            yield node
        if "@graph" in node:
            yield from objects(node["@graph"])


def parse_date(value):
    if not isinstance(value, str) or not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def extract_event(html, url, city_slug, city_name, first_day, last_day):
    soup = BeautifulSoup(html, "html.parser")
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            data = json.loads(script.string or script.get_text())
        except (ValueError, TypeError):
            continue
        for event in objects(data):
            start = parse_date(event.get("startDate"))
            if not start or not (first_day <= start <= last_day):
                continue
            status = str(event.get("eventStatus", "")).lower()
            if "cancelled" in status or "postponed" in status:
                continue
            title = str(event.get("name") or "").strip()
            if not title:
                continue
            location = event.get("location") or {}
            if isinstance(location, list):
                location = location[0] if location else {}
            if not isinstance(location, dict):
                location = {}
            address = location.get("address") or {}
            if not isinstance(address, dict):
                address = {}
            venue = str(address.get("streetAddress") or location.get("name") or "").strip()
            images = event.get("image") or []
            if isinstance(images, str):
                images = [images]
            elif isinstance(images, dict):
                images = [images.get("url", "")]
            image = str(images[0] if images else "").strip()
            end = parse_date(event.get("endDate"))
            source_url = safe_url(event.get("url") or url)
            if not source_url:
                continue
            source_id = hashlib.sha256(source_url.encode("utf-8")).hexdigest()[:40]
            # Rank using the title, not the long marketing description.
            text = title.casefold()
            if any(word in text for word in LOW_PRIORITY):
                continue
            score = (sum(12 for word in HIGH_PRIORITY if word in text)
                     + sum(5 for word in MEDIUM_PRIORITY if word in text))
            # Do not fill the tourist-facing shortlist with generic listings.
            if score == 0:
                continue
            return {
                "title": title[:255], "start_date": start,
                "end_date": end if end and end >= start else None,
                "city_slug": city_slug, "city_name": city_name,
                "venue": venue[:255], "external_url": source_url,
                "source_id": source_id, "score": score,
                "image_available": bool(image),
                "source_image_url": image if image.startswith("https://") else "",
            }
    return None


class Command(BaseCommand):
    help = "Preview Sxodim Kazakhstan events, or save with --save (new events unpublished)."

    def add_arguments(self, parser):
        parser.add_argument("--save", action="store_true", help="Write to the database")
        parser.add_argument("--max-events", type=int, default=20)
        parser.add_argument("--min-days", type=int, default=3, help="Earliest event in days from today (default 3)")
        parser.add_argument("--max-days", type=int, default=90, help="Latest event in days from today (default 90)")

    def handle(self, *args, **options):
        limit = options["max_events"]
        if not 1 <= limit <= 20:
            raise CommandError("--max-events must be between 1 and 20")
        if options["min_days"] < 0 or options["max_days"] < options["min_days"]:
            raise CommandError("Require 0 <= --min-days <= --max-days")
        today = timezone.localdate()
        first_day = today + timedelta(days=options["min_days"])
        last_day = today + timedelta(days=options["max_days"])
        self.stdout.write(f"Looking for events from {first_day} through {last_day}")
        session = requests.Session()
        session.headers.update({"User-Agent": "KenDalaEventResearch/1.0 (contact site administrator)"})
        candidates = []
        extras = []
        seen = set()
        failures = 0
        for slug, city_name, quota in CITIES:
            city_url = f"{BASE}/{slug}"
            try:
                response = session.get(city_url, timeout=20)
                response.raise_for_status()
            except requests.RequestException as exc:
                self.stderr.write(f"Skipping {city_name}: {exc}")
                failures += 1
                continue
            soup = BeautifulSoup(response.text, "html.parser")
            urls = []
            for anchor in soup.select('a[href]'):
                url = safe_url(anchor.get("href"))
                if url and re.match(rf"^https://sxodim\.com/{re.escape(slug)}/event/[^/]+$", url):
                    if url not in seen:
                        seen.add(url)
                        urls.append(url)
            self.stdout.write(f"{city_name}: {len(urls)} event links")
            city_events = []
            for url in urls[:45]:
                try:
                    response = session.get(url, timeout=20)
                    response.raise_for_status()
                    event = extract_event(response.text, url, slug, city_name, first_day, last_day)
                    if event:
                        city_events.append(event)
                except requests.RequestException as exc:
                    failures += 1
                    self.stderr.write(f"Could not read {url}: {exc}")
                time.sleep(0.15)
            city_events.sort(key=lambda e: (-e["score"], e["start_date"], e["title"]))
            candidates.extend(city_events[:quota])
            extras.extend(city_events[quota:])
        # Fill unfilled city quotas from other cities, without duplicating URLs.
        chosen_ids = {e["source_id"] for e in candidates}
        for event in sorted(extras, key=lambda e: (-e["score"], e["start_date"], e["title"])):
            if len(candidates) >= limit:
                break
            if event["source_id"] not in chosen_ids:
                candidates.append(event)
                chosen_ids.add(event["source_id"])
        candidates.sort(key=lambda e: (-e["score"], e["start_date"], e["title"]))
        candidates = candidates[:limit]
        for index, event in enumerate(candidates, 1):
            self.stdout.write(f'{index:2}. {event["start_date"]} | {event["city_name"]} | {event["title"]}\n    {event["external_url"]}')
        self.stdout.write(f"Selected {len(candidates)} events. Failed requests: {failures}")
        if not options["save"]:
            self.stdout.write(self.style.WARNING("PREVIEW ONLY: no database changes. Use --save after review."))
            return
        if not candidates:
            raise CommandError("No valid upcoming events found; nothing saved.")
        country = Country.objects.filter(slug__iexact="kazakhstan").first()
        if country is None:
            country = Country.objects.filter(name__iexact="Kazakhstan").first()
        if country is None:
            raise CommandError("Kazakhstan country record not found. Create it in Django Admin first.")
        created = updated = 0
        for event in candidates:
            city = City.objects.filter(country=country, slug__iexact=event["city_slug"]).first()
            if city is None:
                city = City.objects.filter(country=country, name__iexact=event["city_name"]).first()
            defaults = {
                "country": country,
                "city": city,
                "title": event["title"],
                "start_date": event["start_date"],
                "end_date": event["end_date"],
                "venue": event["venue"],
                "external_url": event["external_url"],
                "source_image_url": event["source_image_url"],
                "last_synced_at": timezone.now(),
            }
            record = CountryEvent.objects.filter(source="sxodim", source_id=event["source_id"]).first()
            if record:
                for field, value in defaults.items():
                    setattr(record, field, value)
                record.save(update_fields=list(defaults.keys()))
                updated += 1
            else:
                CountryEvent.objects.create(source="sxodim", source_id=event["source_id"],
                                            is_published=False, **defaults)
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Created {created}; updated {updated}. New events await approval."))
