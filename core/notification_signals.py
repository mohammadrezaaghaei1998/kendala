from django.db.models.signals import pre_save, post_save
from django.db import transaction
from django.dispatch import receiver
from django.urls import reverse
from .models import Tour, Booking, BookingCoupon
from .notification_service import send_notification, notify_booking_paid, notify_booking_failed, notify_coupon_issued


@receiver(pre_save, sender=Tour)
def capture_tour_changes(sender, instance, **kwargs):
    old = sender.objects.filter(pk=instance.pk).values('is_published', 'has_offer', 'offer_percentage').first() if instance.pk else None
    instance._notification_old = old


@receiver(post_save, sender=Tour)
def tour_notifications(sender, instance, created, **kwargs):
    old = getattr(instance, '_notification_old', None)
    new_publication = instance.is_published and (created or (old is not None and not old['is_published']))
    new_offer = (instance.is_published and instance.has_offer and instance.offer_percentage > 0
                 and (old is None or not old['has_offer'] or old['offer_percentage'] != instance.offer_percentage))
    if new_publication:
        transaction.on_commit(lambda: send_notification(
            title='Discover a new Ken Dala experience', message=f'{instance.title} is now available to explore.',
            category='travel', everyone=True, event_key=f'tour:{instance.pk}:published',
            action_url=reverse('tour_details_detail', kwargs={'tour_id': instance.pk, 'tour_slug': instance.slug}),
            action_label='Explore tour'))
    if new_offer:
        percent = instance.offer_percentage
        transaction.on_commit(lambda: send_notification(
            title=f'{percent}% off a Ken Dala experience',
            message=f'A special offer is available for {instance.title}.', category='offers', everyone=True,
            event_key=f'tour:{instance.pk}:offer:{percent}',
            action_url=reverse('tour_details_detail', kwargs={'tour_id': instance.pk, 'tour_slug': instance.slug}),
            action_label='View offer'))


@receiver(pre_save, sender=Booking)
def capture_booking_status(sender, instance, **kwargs):
    instance._notification_previous_status = (sender.objects.filter(pk=instance.pk).values_list('status', flat=True).first()
                                              if instance.pk else None)


@receiver(post_save, sender=Booking)
def booking_status_notifications(sender, instance, created, **kwargs):
    if not instance.user_id:
        return
    previous = getattr(instance, '_notification_previous_status', None)
    if instance.status == previous:
        return
    booking_pk = instance.pk
    if instance.status == 'PAID':
        transaction.on_commit(lambda: notify_booking_paid(Booking.objects.select_related('user').get(pk=booking_pk)))
    elif instance.status == 'FAILED':
        transaction.on_commit(lambda: notify_booking_failed(Booking.objects.select_related('user').get(pk=booking_pk)))
    elif created and instance.status == 'PENDING_PAYMENT':
        transaction.on_commit(lambda: _notify_pending(booking_pk))


def _notify_pending(pk):
    booking = Booking.objects.select_related('user').get(pk=pk)
    if not booking.user_id or booking.status != 'PENDING_PAYMENT':
        return
    send_notification(title='Booking request received',
        message=f'We received your booking request for {booking.tour_title}. Payment has not yet been confirmed.',
        category='bookings', user=booking.user, event_key=f'booking:{booking.pk}:created',
        action_url=reverse('user-dashboard') + '?page=bookings', action_label='View booking')


@receiver(post_save, sender=BookingCoupon)
def coupon_notifications(sender, instance, created, **kwargs):
    if created:
        pk = instance.pk
        transaction.on_commit(lambda: notify_coupon_issued(BookingCoupon.objects.select_related('booking__user').get(pk=pk)))
