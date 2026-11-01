
from collections import defaultdict
from datetime import date, timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from core.models import Country, City, CountryEvent
from core.event_sources.ticketmaster import (
    COUNTRY_CODES,
    fetch_events,
    fetch_event_image,
)


def event_importance(event):
    """Heuristic ranking for events relevant to travelers."""
    title = (event.get("title") or "").casefold()
    category = (event.get("category") or "").casefold()
    genre = (event.get("genre") or "").casefold()
    subgenre = (event.get("subgenre") or "").casefold()

    text = f"{title} {category} {genre} {subgenre}"
    score = 0

    major_terms = {
        "international": 35,
        "uluslararası": 35,
        "world tour": 35,
        "festival": 30,
        "festivali": 30,
        "championship": 28,
        "şampiyona": 28,
        "exhibition": 25,
        "fuar": 25,
        "live in istanbul": 20,
    }

    for term, points in major_terms.items():
        if term in title:
            score += points

    category_scores = {
        "music": 35,
        "müzik": 35,
        "sports": 25,
        "sport": 25,
        "arts & theatre": 10,
        "arts & theater": 10,
        "film": 10,
        "miscellaneous": 0,
    }

    score += category_scores.get(category, 0)

    for term in [
        "concert", "konser", "live",
        "rock", "pop", "jazz",
        "classical", "klasik",
        "opera", "orchestra",
        "orkestra", "ballet",
    ]:
        if term in text:
            score += 7

    for term in [
        "stand up", "stand-up",
        "open mic", "quiz", "karaoke",
        "workshop", "atölye",
        "children", "çocuk",
        "tiyatro", "theatre", "theater",
    ]:
        if term in text:
            score -= 20

    if event.get("source_image_url"):
        score += 25

    if event.get("venue"):
        score += 3

    if event.get("city", "").casefold() in {
        "istanbul", "i̇stanbul", "antalya",
        "izmir", "i̇zmir", "ankara",
    }:
        score += 5

    return score


def event_identity(event):
    """Avoid repeating the same show in the same city."""
    return (
        event["title"].casefold().strip(),
        (event.get("city") or "").casefold().strip(),
    )


class Command(BaseCommand):
    help = (
        "Preview or synchronize important Turkey events "
        "with verified non-fallback artwork."
    )

    def add_arguments(self, parser):
        parser.add_argument("--country", required=True)
        parser.add_argument(
            "--source",
            choices=["ticketmaster"],
            default="ticketmaster",
        )
        parser.add_argument(
            "--limit", type=int, default=30
        )
        parser.add_argument(
            "--apply", action="store_true"
        )

    def handle(self, *args, **options):
        slug = options["country"]
        limit = options["limit"]

        if not 1 <= limit <= 30:
            raise CommandError(
                "--limit must be between 1 and 30"
            )

        country = Country.objects.filter(
            slug=slug
        ).first()

        if not country:
            raise CommandError(
                f'Country "{slug}" not found.'
            )

        country_code = COUNTRY_CODES.get(slug)

        if not country_code:
            raise CommandError(
                "Unsupported country."
            )

        api_key = getattr(
            settings, "TICKETMASTER_API_KEY", ""
        )

        if not api_key:
            raise CommandError(
                "TICKETMASTER_API_KEY is missing."
            )

        candidates = fetch_events(
            api_key, country_code
        )

        today = timezone.localdate()
        earliest = today + timedelta(days=3)
        latest = earliest + timedelta(days=180)

        groups = defaultdict(list)

        for event in candidates:
            try:
                start = date.fromisoformat(
                    event["start_date"]
                )
            except (ValueError, TypeError, KeyError):
                continue

            if not earliest <= start < latest:
                continue

            window = min(
                (start - earliest).days // 30,
                5,
            )

            groups[window].append(event)

        for window in groups:
            groups[window].sort(
                key=lambda e: (
                    -event_importance(e),
                    e["start_date"],
                )
            )

        # For each month, inspect up to 20 leading
        # candidates. Missing images are rechecked
        # through the official event-image endpoint.
        eligible = defaultdict(list)

        for window in range(6):
            checked = 0

            for event in groups.get(window, []):
                if checked >= 20:
                    break

                checked += 1

                if not event["source_image_url"]:
                    try:
                        event["source_image_url"] = (
                            fetch_event_image(
                                api_key,
                                event["source_id"],
                            )
                        )
                    except RuntimeError as exc:
                        self.stderr.write(
                            f'Image check failed for '
                            f'{event["title"]}: {exc}'
                        )
                        # Never replace published data
                        # following an incomplete check.
                        raise CommandError(
                            "Image verification failed; "
                            "database unchanged."
                        ) from exc

                # Real artwork is mandatory.
                if not event["source_image_url"]:
                    continue

                eligible[window].append(event)

            eligible[window].sort(
                key=lambda e: (
                    -event_importance(e),
                    e["start_date"],
                )
            )

        # Round-robin selection keeps the six-month
        # distribution balanced.
        selected = []
        seen_titles = set()
        seen_ids = set()

        while len(selected) < limit:
            added = False

            for window in range(6):
                for event in eligible[window]:
                    identity = event_identity(event)

                    if identity in seen_titles:
                        continue

                    if event["source_id"] in seen_ids:
                        continue

                    seen_titles.add(identity)
                    seen_ids.add(event["source_id"])
                    selected.append(event)
                    added = True
                    break

                if len(selected) >= limit:
                    break

            if not added:
                break

        selected.sort(
            key=lambda e: e["start_date"]
        )

        mode = (
            "APPLY" if options["apply"]
            else "PREVIEW"
        )

        self.stdout.write(
            f"\nCandidates: {len(candidates)}"
        )
        self.stdout.write(
            f"Selected: {len(selected)} / {limit}"
        )
        self.stdout.write(f"Mode: {mode}\n")

        for event in selected:
            self.stdout.write(
                f'{event["start_date"]} | '
                f'{event["title"]} | '
                f'{event["city"]} | '
                f'{event["source_image_url"]}'
            )

        if not options["apply"]:
            self.stdout.write(
                self.style.WARNING(
                    "\nPreview only. Database unchanged."
                )
            )
            return

        # Do not clear a functioning website if
        # Ticketmaster returns insufficient results.
        minimum = min(limit, 12)

        if len(selected) < minimum:
            raise CommandError(
                f"Only {len(selected)} suitable events "
                f"found; at least {minimum} required. "
                "Database unchanged."
            )

        created = 0
        updated = 0

        selected_ids = {
            event["source_id"]
            for event in selected
        }

        with transaction.atomic():
            for event in selected:
                city = None

                if event.get("city"):
                    city = City.objects.filter(
                        country=country,
                        name__iexact=event["city"],
                        is_active=True,
                    ).first()

                start = date.fromisoformat(
                    event["start_date"]
                )

                end = None

                if event.get("end_date"):
                    try:
                        end = date.fromisoformat(
                            event["end_date"]
                        )
                    except (ValueError, TypeError):
                        pass

                defaults = {
                    "country": country,
                    "city": city,
                    "title": event["title"],
                    "category": event["category"][:100],
                    "description": event["description"],
                    "start_date": start,
                    "end_date": end,
                    "external_url": event["external_url"],
                    "source_image_url": (
                        event["source_image_url"]
                    ),
                    "venue": event["venue"][:255],
                    "last_synced_at": timezone.now(),
                }

                obj, was_created = (
                    CountryEvent.objects.get_or_create(
                        country=country,
                        source="ticketmaster",
                        source_id=event["source_id"],
                        defaults={
                            **defaults,
                            "is_published": True,
                        },
                    )
                )

                if was_created:
                    created += 1
                else:
                    for field, value in defaults.items():
                        setattr(obj, field, value)

                    obj.is_published = True
                    obj.save(
                        update_fields=[
                            *defaults.keys(),
                            "is_published",
                        ]
                    )
                    updated += 1

            obsolete = CountryEvent.objects.filter(
                country=country,
                source="ticketmaster",
                is_published=True,
            ).exclude(
                source_id__in=selected_ids
            )

            unpublished = obsolete.update(
                is_published=False
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nCreated: {created} | "
                f"Updated: {updated} | "
                f"Unpublished: {unpublished}"
            )
        )
