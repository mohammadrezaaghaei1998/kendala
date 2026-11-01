
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q


class UsernameOrEmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        User = get_user_model()

        if username is None or password is None:
            return None

        identifier = username.strip()

        # Prefer an exact username match.
        user = User.objects.filter(
            username__iexact=identifier
        ).first()

        # Otherwise, allow login using email.
        if user is None:
            matches = User.objects.filter(
                email__iexact=identifier
            )

            # Never select an arbitrary account if emails are duplicated.
            if matches.count() != 1:
                return None

            user = matches.first()

        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None
