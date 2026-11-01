from django.core.management.base import BaseCommand, CommandError
from core.viator_api import list_destinations, ViatorError

class Command(BaseCommand):
    help = 'Find Viator destination IDs for cities; makes one cached API request.'

    def add_arguments(self, parser):
        parser.add_argument('--query', required=True)

    def handle(self, *args, **options):
        try:
            data = list_destinations()
        except ViatorError as exc:
            raise CommandError(str(exc)) from exc
        items = data.get('destinations', []) if isinstance(data, dict) else []
        q = options['query'].casefold()
        found = 0
        for item in items:
            name = str(item.get('destinationName', item.get('name', '')))
            if q in name.casefold():
                self.stdout.write(f"{name} -> {item.get('destinationId', item.get('id'))}")
                found += 1
        if not found:
            self.stdout.write('No matching destination. Check the city spelling or API response.')
