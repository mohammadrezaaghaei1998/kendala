from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from .models import Notification, UserNotification


def valid_action_url(url):
    # Only allow internal absolute paths; no external redirects or protocol-relative URLs.
    return not url or (url.startswith('/') and not url.startswith('//') and not url.startswith('/\\') and '\\' not in url and '\r' not in url and '\n' not in url)


def send_notification(*, title, message, category='system', user=None, everyone=False,
                      action_url='', action_label='', event_key=None, source='automatic'):
    if not valid_action_url(action_url):
        raise ValueError('Action URL must be an internal path starting with /.')
    if everyone == (user is not None):
        raise ValueError('Provide exactly one of user or everyone=True.')
    with transaction.atomic():
        if event_key:
            notification, created = Notification.objects.get_or_create(event_key=event_key, defaults={
                'title': title, 'message': message, 'category': category, 'source': source,
                'action_url': action_url, 'action_label': action_label,
                'published_at': timezone.now(),
            })
            if not created:
                return notification
        else:
            notification = Notification.objects.create(
                title=title, message=message, category=category, source=source,
                action_url=action_url, action_label=action_label, published_at=timezone.now())
        if everyone:
            qs = get_user_model().objects.filter(is_active=True).values_list('pk', flat=True)
            UserNotification.objects.bulk_create(
                [UserNotification(notification=notification, user_id=uid) for uid in qs],
                batch_size=500, ignore_conflicts=True)
        else:
            UserNotification.objects.get_or_create(notification=notification, user=user)
    return notification


def notify_booking_paid(booking):
    if booking.status != 'PAID' or not booking.user_id:
        return
    send_notification(title='Your booking is confirmed',
        message=f'Payment received for {booking.tour_title}. Booking reference: {booking.reference}.',
        category='bookings', user=booking.user, event_key=f'booking:{booking.pk}:paid',
        action_url=reverse('user-dashboard') + '?page=bookings', action_label='View booking')


def notify_booking_failed(booking):
    if booking.status != 'FAILED' or not booking.user_id:
        return
    send_notification(title='Payment was not completed',
        message=f'We could not confirm payment for {booking.tour_title} ({booking.reference}). Please check your booking status.',
        category='bookings', user=booking.user, event_key=f'booking:{booking.pk}:failed',
        action_url=reverse('user-dashboard') + '?page=bookings', action_label='View booking')





def notify_coupon_issued(coupon):
    # Call only when a coupon is actually issued to an eligible user.
    booking = coupon.booking

    if not booking.user_id:
        return

    send_notification(
        title='A discount coupon is ready for you',
        message=f'Your coupon {coupon.code} is available for an eligible booking.',
        category='offers',
        user=booking.user,
        event_key=f'coupon:{coupon.pk}:issued',
        action_url=reverse('user-dashboard') + f'?page=bookings&booking_id={booking.pk}',
        action_label='View booking'
    )