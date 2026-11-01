from django.db import transaction
from django.urls import reverse
from django.utils import timezone

from .models import Notification, UserNotification


def send_review_notification(comment, event):
    """
    event:
      approved
      replied
      approved_and_replied
    """

    titles = {
        "approved": "Your review is published",
        "replied": "Ken Dala replied to your review",
        "approved_and_replied": "Your review is published — with a reply",
    }

    messages = {
        "approved": (
            f"Your review of {comment.tour.title} has been "
            "approved and is now published."
        ),
        "replied": (
            f"Our team has replied to your review of "
            f"{comment.tour.title}."
        ),
        "approved_and_replied": (
            f"Your review of {comment.tour.title} has been "
            "published, and our team has responded."
        ),
    }

    if event not in titles:
        raise ValueError("Invalid review notification event.")

    action_url = (
        reverse("user-dashboard")
        + f"?tab=reviews&comment={comment.pk}"
    )

    with transaction.atomic():
        notification, _ = Notification.objects.get_or_create(
            event_key=f"tour-comment:{comment.pk}:{event}",
            defaults={
                "title": titles[event],
                "message": messages[event],
                "category": "system",
                "source": "automatic",
                "action_url": action_url,
                "action_label": "View review",
                "published_at": timezone.now(),
            },
        )

        UserNotification.objects.get_or_create(
            notification=notification,
            user_id=comment.user_id,
        )