
from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm
from django.core.exceptions import ValidationError



from django.contrib.auth import get_user_model
from .models import CustomerProfile




User = get_user_model()


class KenDalaSignupForm(UserCreationForm):
    full_name = forms.CharField(
        max_length=150,
        required=True
    )

    email = forms.EmailField(
        required=True,
        error_messages={
            "invalid": "Please enter a valid email address.",
            "required": "Email address is required.",
        }
    )

    accept_terms = forms.BooleanField(
        required=True,
        error_messages={
            "required": "You must accept the Terms and Privacy Policy."
        }
    )

    class Meta:
        model = User
        fields = (
            "full_name",
            "username",
            "email",
            "password1",
            "password2",
        )

    def clean_username(self):
        username = self.cleaned_data["username"].strip()

        if User.objects.filter(username__iexact=username).exists():
            raise ValidationError(
                "This username already exists. Please choose another username."
            )

        if "@" in username:
            raise ValidationError(
                "Username cannot contain the @ symbol."
            )

        return username


    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()

        if User.objects.filter(email__iexact=email).exists():
            raise ValidationError(
                "This email is already registered. Please use another email address."
            )

        return email

    def save(self, commit=True):
        user = super().save(commit=False)

        full_name = self.cleaned_data["full_name"].strip()
        first_name, _, last_name = full_name.partition(" ")

        user.first_name = first_name
        user.last_name = last_name
        user.email = self.cleaned_data["email"]
        user.is_active = True

        if commit:
            user.save()

        return user

















User = get_user_model()


class CustomerProfileForm(forms.ModelForm):

    first_name = forms.CharField(max_length=150, required=True)
    last_name = forms.CharField(max_length=150, required=True)
    username = forms.CharField(max_length=150, required=True)
    email = forms.EmailField(required=True)

    class Meta:
        model = CustomerProfile

        fields = [
            "phone",
            "country",
            "birthdate",
            "language",
            "avatar",
        ]

        widgets = {
            "birthdate": forms.DateInput(
                attrs={"type": "date"},
                format="%Y-%m-%d"
            ),
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop("user")
        super().__init__(*args, **kwargs)

        self.fields["first_name"].initial = self.user.first_name
        self.fields["last_name"].initial = self.user.last_name
        self.fields["username"].initial = self.user.username
        self.fields["email"].initial = self.user.email

    def clean_username(self):
        username = self.cleaned_data["username"].strip()

        if User.objects.filter(
            username__iexact=username
        ).exclude(pk=self.user.pk).exists():
            raise forms.ValidationError(
                "This username is already taken."
            )

        if "@" in username:
            raise forms.ValidationError(
                "Username cannot contain @."
            )

        return username

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()

        if User.objects.filter(
            email__iexact=email
        ).exclude(pk=self.user.pk).exists():
            raise forms.ValidationError(
                "This email address is already registered."
            )

        return email

    def clean_avatar(self):
        avatar = self.cleaned_data.get("avatar")

        if avatar and hasattr(avatar, "size"):
            if avatar.size > 5 * 1024 * 1024:
                raise forms.ValidationError(
                    "Profile picture must be smaller than 5 MB."
                )

            if getattr(avatar, "content_type", "").split("/")[0] != "image":
                raise forms.ValidationError(
                    "Please upload a valid image."
                )

        return avatar

    def save(self, commit=True):
        profile = super().save(commit=False)

        self.user.first_name = self.cleaned_data["first_name"].strip()
        self.user.last_name = self.cleaned_data["last_name"].strip()
        self.user.username = self.cleaned_data["username"].strip()
        self.user.email = self.cleaned_data["email"]

        if commit:
            self.user.save()
            profile.save()

        return profile