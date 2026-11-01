from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = 'core'



    def ready(self):
        from . import notification_signals  # noqa: F401
