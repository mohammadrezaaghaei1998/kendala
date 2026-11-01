from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.utils import timezone
from .models import UserNotification


def serialize_notification(item):
    n = item.notification
    return {'id': item.pk, 'type': n.category, 'title': n.title, 'text': n.message,
            'time': item.created_at.isoformat(), 'unread': item.read_at is None,
            'url': n.action_url, 'action_label': n.action_label}


@login_required
@require_POST
def notification_action(request, action, pk=None):
    qs = UserNotification.objects.filter(user=request.user, dismissed_at__isnull=True)
    now = timezone.now()
    if action == 'read' and pk is not None:
        qs.filter(pk=pk, read_at__isnull=True).update(read_at=now)
    elif action == 'dismiss' and pk is not None:
        qs.filter(pk=pk).update(dismissed_at=now)
    elif action == 'read-all' and pk is None:
        qs.filter(read_at__isnull=True).update(read_at=now)
    elif action == 'clear-read' and pk is None:
        qs.filter(read_at__isnull=False).update(dismissed_at=now)
    else:
        return JsonResponse({'error': 'Unknown action'}, status=400)
    return JsonResponse({'success': True})
