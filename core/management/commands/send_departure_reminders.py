from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.urls import reverse
from core.models import Booking
from core.notification_service import send_notification

class Command(BaseCommand):
    help = 'Send reminders for paid bookings departing in three days.'

    def handle(self, *args, **options):
        target = timezone.localdate() + timedelta(days=3)
        count = 0
        for booking in Booking.objects.filter(status='PAID', departure_date=target, user__isnull=False).select_related('user'):
            send_notification(title='Your adventure is almost here',
                message=f'{booking.tour_title} begins in three days. Review your booking details before departure.',
                category='travel', user=booking.user, event_key=f'booking:{booking.pk}:departure-3d',
                action_url=reverse('user-dashboard') + '?page=bookings', action_label='View booking')
            count += 1
        self.stdout.write(self.style.SUCCESS(f'Checked {count} bookings.'))
