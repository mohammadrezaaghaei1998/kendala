import uuid
from django.db import models
from decimal import Decimal
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.urls import reverse
from django.utils.text import slugify
from django.core.validators import FileExtensionValidator
from django.utils import timezone
from django.conf import settings
from django.db.models import Q





class Country(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    tagline = models.CharField(max_length=255, blank=True)
    hero_image = models.ImageField(upload_to='countries/heroes/', blank=True, null=True)
    currency = models.CharField(max_length=100, blank=True)
    language = models.CharField(max_length=150, blank=True)
    electricity = models.CharField(max_length=150, blank=True)
    airports = models.TextField(blank=True)
    transportation = models.TextField(blank=True)
    best_time = models.CharField(max_length=150, blank=True)
    visa_information = models.TextField(blank=True)
    emergency_information = models.TextField(blank=True)
    useful_apps = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    # Hero and page-level content
    page_title = models.CharField(max_length=180, blank=True)
    hero_eyebrow = models.CharField(max_length=180, blank=True)
    hero_description = models.TextField(blank=True)
    hero_primary_label = models.CharField(max_length=80, default='Explore Tours')
    hero_primary_url = models.CharField(max_length=500, default='#tours')
    hero_secondary_label = models.CharField(max_length=80, default='Discover More')
    hero_secondary_url = models.CharField(max_length=500, default='#about')
    about_heading = models.CharField(max_length=180, blank=True)
    about_intro = models.TextField(blank=True)
    about_extra = models.TextField(blank=True)
    about_read_more_label = models.CharField(max_length=80, default='Read More')
    weather_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    weather_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    weather_location = models.CharField(max_length=120, blank=True)
    best_time_heading = models.CharField(max_length=160, blank=True)
    best_time_description = models.TextField(blank=True)
    transport_heading = models.CharField(max_length=160, blank=True)
    wide_banner_image = models.ImageField(upload_to='countries/banners/', blank=True, null=True)
    wide_banner_eyebrow = models.CharField(max_length=180, blank=True)
    wide_banner_title = models.CharField(max_length=180, blank=True)
    wide_banner_button_label = models.CharField(max_length=80, blank=True)
    wide_banner_button_url = models.CharField(max_length=500, blank=True)
    feature_banner_image = models.ImageField(upload_to='countries/features/', blank=True, null=True)
    feature_banner_eyebrow = models.CharField(max_length=180, blank=True)
    feature_banner_title = models.CharField(max_length=180, blank=True)
    feature_banner_description = models.TextField(blank=True)
    feature_banner_button_label = models.CharField(max_length=80, blank=True)
    feature_banner_button_url = models.CharField(max_length=500, blank=True)
    travel_essentials_eyebrow = models.CharField(max_length=160, blank=True)
    travel_essentials_title = models.CharField(max_length=180, blank=True)
    travel_essentials_description = models.TextField(blank=True)
    travel_essentials_index = models.CharField(max_length=80, blank=True)
    travel_essentials_note = models.TextField(blank=True)
    currency_code = models.CharField(max_length=10, blank=True)
    currency_symbol = models.CharField(max_length=10, blank=True)
    currency_display_name = models.CharField(max_length=100, blank=True)
    currency_description = models.TextField(blank=True)
    language_code = models.CharField(max_length=20, blank=True)
    language_display_name = models.CharField(max_length=100, blank=True)
    language_description = models.TextField(blank=True)
    electricity_voltage = models.CharField(max_length=40, blank=True)
    electricity_plugs = models.CharField(max_length=100, blank=True)
    electricity_description = models.TextField(blank=True)
    money_heading = models.CharField(max_length=160, blank=True)
    money_subheading = models.CharField(max_length=160, blank=True)
    money_description = models.TextField(blank=True)
    money_extra_description = models.TextField(blank=True)
    arrival_heading = models.CharField(max_length=160, blank=True)
    connectivity_heading = models.CharField(max_length=160, blank=True)
    mobile_networks_intro = models.TextField(blank=True)
    useful_apps_intro = models.TextField(blank=True)
    safety_heading = models.CharField(max_length=160, blank=True)
    visa_heading = models.CharField(max_length=160, blank=True)
    visa_description = models.TextField(blank=True)
    visa_link_label = models.CharField(max_length=150, blank=True)
    visa_link_url = models.URLField(blank=True)
    useful_links_heading = models.CharField(max_length=160, blank=True)
    faq_heading = models.CharField(max_length=160, blank=True)

    class Meta:
        ordering = ['display_order', 'name']
        verbose_name_plural = 'Countries'

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('destination_detail', kwargs={'country_slug': self.slug})


class CountryItem(models.Model):
    """Reusable icon/text/link rows for tags, transport, banks and travel essentials."""
    GROUPS = [
        ('tag', 'About tags'),
        ('best_time', 'Best time to visit'),
        ('transport', 'About transportation'),
        ('money', 'Banks, ATMs & payments'),
        ('arrival_transport', 'Airport & getting around'),
        ('essential_navigation', 'Travel essentials navigation'),
        ('other', 'Other country information'),
    ]
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='items')
    group = models.CharField(max_length=32, choices=GROUPS)
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    icon_class = models.CharField(max_length=100, blank=True, help_text='Example: fa-solid fa-car')
    image = models.ImageField(upload_to='countries/items/', blank=True, null=True)
    url = models.CharField(max_length=500, blank=True, help_text='External URL or internal path/anchor')
    link_label = models.CharField(max_length=100, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['group', 'display_order', 'id']

    def __str__(self):
        return f'{self.country} / {self.get_group_display()} / {self.title}'


class CountryArea(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='areas')
    title = models.CharField(max_length=180)
    image = models.ImageField(upload_to='countries/areas/', blank=True, null=True)
    description = models.TextField(blank=True)
    url = models.CharField(max_length=500, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return self.title


class CountryAirport(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='airport_entries')
    code = models.CharField(max_length=10)
    name = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    link_label = models.CharField(max_length=100, default='Official airport')
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return f'{self.code} - {self.name}'


class CountryMobileOperator(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='mobile_operators')
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='countries/operators/', blank=True, null=True)
    website = models.URLField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return self.name


class CountryApp(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='apps')
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='countries/apps/', blank=True, null=True)
    website = models.URLField(blank=True)
    ios_url = models.URLField(blank=True)
    android_url = models.URLField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return self.name


class CountryEmergencyContact(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='emergency_contacts')
    title = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    icon_class = models.CharField(max_length=100, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return f'{self.title}: {self.phone_number}'


class CountryUsefulLink(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='useful_links')
    title = models.CharField(max_length=180)
    url = models.URLField()
    icon_class = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return self.title


class CountryFAQ(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='faqs')
    question = models.CharField(max_length=255)
    answer = models.TextField()
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return self.question


class CountrySection(models.Model):
    """Editable section headings, labels and optional CTA links for fixed template sections."""
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='sections')
    section_key = models.SlugField(help_text='Examples: events, tours, areas, essentials, faq')
    eyebrow = models.CharField(max_length=160, blank=True)
    heading = models.CharField(max_length=180, blank=True)
    description = models.TextField(blank=True)
    link_label = models.CharField(max_length=100, blank=True)
    link_url = models.CharField(max_length=500, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'id']
        constraints = [models.UniqueConstraint(fields=['country', 'section_key'], name='unique_country_section_key')]

    def __str__(self):
        return f'{self.country}: {self.section_key}'








class City(models.Model):
    country = models.ForeignKey(
        Country, on_delete=models.PROTECT, related_name="cities"
    )
    name = models.CharField(max_length=120)
    slug = models.SlugField()
    category = models.CharField(max_length=150, blank=True)
    tagline = models.CharField(max_length=255, blank=True)
    introduction = models.TextField(blank=True)
    hero_image = models.ImageField(upload_to="cities/", blank=True, null=True)
    image = models.ImageField(upload_to="cities/cards/", blank=True, null=True)
    best_time = models.CharField(max_length=150, blank=True)
    language = models.CharField(max_length=100, blank=True)
    currency = models.CharField(max_length=100, blank=True)
    airport = models.CharField(max_length=200, blank=True)
    weather_info = models.TextField(blank=True)
    transport_info = models.TextField(blank=True)
    etiquette_info = models.TextField(blank=True)
    latitude = models.DecimalField(
        max_digits=10, decimal_places=7, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=10, decimal_places=7, null=True, blank=True
    )
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)








    hero_eyebrow = models.CharField(max_length=160, blank=True)
    overview_eyebrow = models.CharField(max_length=160, blank=True)
    highlights_eyebrow = models.CharField(max_length=160, blank=True)
    highlights_heading = models.CharField(max_length=200, blank=True)
    highlights_description = models.TextField(blank=True)
    essentials_eyebrow = models.CharField(max_length=160, blank=True)
    essentials_heading = models.CharField(max_length=200, blank=True)
    tours_eyebrow = models.CharField(max_length=160, blank=True)
    tours_description = models.TextField(blank=True)
    related_eyebrow = models.CharField(max_length=160, blank=True)
    related_description = models.TextField(blank=True)



    class Meta:
        ordering = ["display_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["country", "slug"], name="unique_city_slug_per_country"
            )
        ]

    def __str__(self):
        return f"{self.name}, {self.country.name}"

    def get_absolute_url(self):
        return reverse("city_guide_detail", kwargs={
            "country_slug": self.country.slug,
            "city_slug": self.slug,
        })

































class Tour(models.Model):
    country = models.ForeignKey(
        Country, on_delete=models.PROTECT, related_name="tours"
    )
    city = models.ForeignKey(
        City, on_delete=models.PROTECT, related_name="tours"
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    category = models.CharField(max_length=120, blank=True)
    tagline = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    overview = models.TextField(blank=True)
    image = models.ImageField(upload_to="tours/", blank=True, null=True)
    duration_days = models.PositiveIntegerField(default=1)
    travel_style = models.CharField(max_length=150, blank=True)
    experience_type = models.CharField(max_length=150, blank=True)
    price = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))]
    )
    currency = models.CharField(max_length=100, default="USD")

    is_available = models.BooleanField(default=True)
    has_offer = models.BooleanField(default=False)
    offer_percentage = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(100)]
    )
    is_published = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)



    
    # 01 — THE EXPERIENCE
    experience_heading = models.CharField(
        max_length=220, blank=True
    )
    experience_intro = models.TextField(blank=True)
    experience_description = models.TextField(blank=True)

    # 02 — THE MOMENTS
    moments_heading = models.CharField(
        max_length=220, blank=True
    )

    # 03 — YOUR ROUTE
    itinerary_heading = models.CharField(
        max_length=220, blank=True
    )
    itinerary_intro = models.TextField(blank=True)

    # Wide image banner
    story_image = models.ImageField(
        upload_to="tours/story/",
        blank=True,
        null=True
    )

    # 04 — THE DETAILS
    cancellation_policy = models.TextField(
        blank=True,
        help_text="Tour-specific cancellation and refund conditions"
    )

    # 07 — BEFORE YOU GO
    before_you_go_intro = models.TextField(blank=True)

    # 09 — PRACTICAL DETAILS
    practical_details_intro = models.TextField(blank=True)

    # Downloadable PDF brochure
    brochure = models.FileField(
        upload_to="tours/brochures/",
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(allowed_extensions=["pdf"])
        ]
    )


    coupon_enabled = models.BooleanField(
        default=False,
        verbose_name="Enable reward coupon"
    )

    coupon_percentage = models.PositiveSmallIntegerField(
        default=0,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(20),
        ],
        verbose_name="Reward coupon percentage"
    )







    class Meta:
        ordering = ["display_order", "-is_featured", "title"]

    def __str__(self):
        return f"#{self.pk} - {self.title}"

    @property
    def discounted_price(self):
        if not self.has_offer or self.offer_percentage == 0:
            return self.price
        discount = Decimal(self.offer_percentage) / Decimal("100")
        return (self.price * (Decimal("1") - discount)).quantize(
            Decimal("0.01")
        )

    def clean(self):
        from django.core.exceptions import ValidationError
        super().clean()
        if self.city_id and self.country_id:
            if self.city.country_id != self.country_id:
                raise ValidationError({
                    "city": "The selected city must belong to the selected country."
                })
        if self.has_offer and not 1 <= self.offer_percentage <= 100:
            raise ValidationError({
                "offer_percentage": "An active offer requires 1–100% discount."
            })

    def get_absolute_url(self):
        return reverse("tour_details_detail", kwargs={
            "tour_id": self.pk,
            "tour_slug": self.slug,
        })


class CountryEvent(models.Model):
    country = models.ForeignKey(
        Country, on_delete=models.CASCADE, related_name="events"
    )
    city = models.ForeignKey(
        City, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="events"
    )
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to="events/", blank=True, null=True)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    external_url = models.URLField(blank=True)
    is_published = models.BooleanField(default=True)

    source = models.CharField(max_length=50, blank=True)
    source_id = models.CharField(max_length=255, blank=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    source_image_url = models.URLField(max_length=2000, blank=True)
    venue = models.CharField(max_length=255, blank=True)


    class Meta:
        ordering = ["start_date", "title"]

    def __str__(self):
        return self.title











class CityHighlight(models.Model):
    city = models.ForeignKey(
        City, on_delete=models.CASCADE, related_name="highlights"
    )
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="city-highlights/", blank=True, null=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]







class CityEssential(models.Model):
    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name="essentials"
    )

    title = models.CharField(max_length=180)

    description = models.TextField(blank=True)

    icon_class = models.CharField(
        max_length=100,
        blank=True,
        help_text="Example: fa-solid fa-car-side"
    )

    url = models.CharField(
        max_length=500,
        blank=True,
        help_text="Optional external link or internal URL"
    )

    link_label = models.CharField(
        max_length=100,
        blank=True
    )

    display_order = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return f"{self.city.name} - {self.title}"










class TourImage(models.Model):
    tour = models.ForeignKey(
        Tour, on_delete=models.CASCADE, related_name="gallery"
    )
    image = models.ImageField(upload_to="tours/gallery/")
    alt_text = models.CharField(max_length=255, blank=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]


class TourHighlight(models.Model):
    tour = models.ForeignKey(
        Tour, on_delete=models.CASCADE, related_name="highlights"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="tours/highlights/", blank=True, null=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]


class TourItineraryDay(models.Model):
    tour = models.ForeignKey(
        Tour, on_delete=models.CASCADE, related_name="itinerary"
    )
    day_number = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField()
    activities = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["day_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["tour", "day_number"], name="unique_tour_itinerary_day"
            )
        ]


class TourInclusion(models.Model):
    tour = models.ForeignKey(
        Tour, on_delete=models.CASCADE, related_name="inclusions"
    )
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    icon_class = models.CharField(max_length=100, blank=True)
    is_included = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]


class TourFAQ(models.Model):
    tour = models.ForeignKey(
        Tour, on_delete=models.CASCADE, related_name="faqs"
    )
    question = models.CharField(max_length=255)
    answer = models.TextField()
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]









class TourTravelEssential(models.Model):
    tour = models.ForeignKey(
        Tour,
        on_delete=models.CASCADE,
        related_name="travel_essentials"
    )
    title = models.CharField(max_length=180)
    description = models.TextField()
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return self.title


class TourPracticalDetail(models.Model):
    tour = models.ForeignKey(
        Tour,
        on_delete=models.CASCADE,
        related_name="practical_details"
    )
    title = models.CharField(max_length=180)
    description = models.TextField()
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return self.title


























def generate_booking_reference():
    return "KD-" + uuid.uuid4().hex[:12].upper()


def generate_coupon_code():
    return "KD10-" + uuid.uuid4().hex[:12].upper()


class Booking(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="bookings",
        null=True,  # Preserve historical guest bookings during migration.
        blank=True,
    )


    STATUS_CHOICES = [
        ("PENDING_PAYMENT", "Pending Payment"),
        ("PAID", "Paid"),
        ("FAILED", "Payment Failed"),
        ("CANCELLED", "Cancelled"),
        ("REFUNDED", "Refunded"),
    ]

    reference = models.CharField(
        max_length=20,
        unique=True,
        default=generate_booking_reference,
        editable=False,
    )

    tour = models.ForeignKey(
        "Tour",
        on_delete=models.PROTECT,
        related_name="bookings",
    )

    tour_title = models.CharField(max_length=255)
    traveler_count = models.PositiveIntegerField()

    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    total_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
    )

    currency = models.CharField(max_length=15)

    room_preference = models.CharField(max_length=30)
    room_notes = models.TextField(blank=True)

    contact_phone = models.CharField(max_length=50)
    country_of_residence = models.CharField(
        max_length=120,
        blank=True,
    )
    special_requests = models.TextField(blank=True)

    terms_accepted_at = models.DateTimeField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING_PAYMENT",
    )

    payment_provider = models.CharField(
        max_length=50,
        blank=True,
    )

    payment_reference = models.CharField(
        max_length=255,
        blank=True,
    )


    


    thawani_session_id = models.CharField(
        max_length=255,
        blank=True,
        db_index=True,
    )

    payment_currency = models.CharField(
        max_length=3,
        blank=True,
    )

    payment_amount_minor = models.PositiveBigIntegerField(
        null=True,
        blank=True,
    )








    paid_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    departure_date = models.DateField(null=True, blank=True)  # Nullable for historical bookings.

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.reference


class BookingTraveler(models.Model):

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name="travelers",
    )

    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    date_of_birth = models.DateField()
    nationality = models.CharField(max_length=120)
    email = models.EmailField(blank=True)

    is_lead = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class BookingCoupon(models.Model):

    code = models.CharField(
        max_length=25,
        unique=True,
        default=generate_coupon_code,
        editable=False,
    )

    booking = models.OneToOneField(
        Booking,
        on_delete=models.PROTECT,
        related_name="reward_coupon",
    )

    discount_percentage = models.PositiveSmallIntegerField(
        default=0,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(20),
        ],
    )

    redeemed_booking = models.OneToOneField(
        Booking, on_delete=models.PROTECT, null=True, blank=True,
        related_name="applied_coupon",
    )

    is_used = models.BooleanField(default=False)

    used_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.code










class BookingCancellation(models.Model):
    STATES = [
        ('REQUESTED','Requested'), ('APPROVED','Approved'),
        ('REJECTED','Rejected'), ('REFUND_PENDING','Refund pending'),
        ('REFUNDED','Refunded'), ('CLOSED','Closed'),
    ]
    booking = models.OneToOneField('Booking', on_delete=models.PROTECT, related_name='cancellation')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    requested_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATES, default='REQUESTED')
    policy_version = models.CharField(max_length=80)
    policy_text = models.TextField()
    departure_date_snapshot = models.DateField()
    days_before_departure = models.IntegerField()
    fee_percent = models.PositiveSmallIntegerField()
    paid_amount = models.DecimalField(max_digits=14, decimal_places=2)
    cancellation_fee = models.DecimalField(max_digits=14, decimal_places=2)
    refund_amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=15)
    policy_accepted_at = models.DateTimeField()
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name='reviewed_cancellations')
    admin_notes = models.TextField(blank=True)
    refund_reference = models.CharField(max_length=255, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.booking.reference} / {self.get_status_display()}'















class Wishlist(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist_items"
    )

    tour = models.ForeignKey(
        Tour,
        on_delete=models.CASCADE,
        related_name="wishlist_items"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "tour"],
                name="unique_user_tour_wishlist"
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.tour.title}"












class Notification(models.Model):
    CATEGORY_CHOICES = [('bookings', 'Bookings'), ('offers', 'Offers'), ('travel', 'Travel'), ('system', 'System')]
    SOURCE_CHOICES = [('manual', 'Manual'), ('automatic', 'Automatic')]
    title = models.CharField(max_length=200)
    message = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='system')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')
    action_url = models.CharField(max_length=500, blank=True)
    action_label = models.CharField(max_length=80, blank=True)
    event_key = models.CharField(max_length=200, unique=True, null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class UserNotification(models.Model):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='deliveries')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_deliveries')
    read_at = models.DateTimeField(null=True, blank=True)
    dismissed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['notification', 'user'], name='unique_notification_recipient')]
        indexes = [models.Index(fields=['user', 'dismissed_at', 'read_at'])]
        ordering = ['-created_at']
















class CustomerProfile(models.Model):

    LANGUAGE_CHOICES = [
        ("en", "English"),
        ("ar", "العربية"),
        ("fa", "فارسی"),
    ]

    COUNTRY_CHOICES = [
        ("Oman", "Oman"),
        ("Saudi Arabia", "Saudi Arabia"),
        ("United Arab Emirates", "United Arab Emirates"),
        ("United Kingdom", "United Kingdom"),
        ("United States", "United States"),
        ("Other", "Other"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_profile"
    )

    phone = models.CharField(
        max_length=30,
        blank=True
    )

    country = models.CharField(
        max_length=100,
        choices=COUNTRY_CHOICES,
        blank=True
    )

    birthdate = models.DateField(
        null=True,
        blank=True
    )

    language = models.CharField(
        max_length=10,
        choices=LANGUAGE_CHOICES,
        default="en"
    )

    avatar = models.ImageField(
        upload_to="profile_avatars/",
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.user.username} - Customer Profile"











class TravelPublication(models.Model):
    TYPES = [('journal', 'Travel Journal'), ('guide', 'Practical Travel Guide')]
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='travel_publications')
    publication_type = models.CharField(max_length=12, choices=TYPES)
    title = models.CharField(max_length=150, blank=True)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to='travel_publications/covers/', blank=True, null=True)
    pdf_file = models.FileField(upload_to='travel_publications/pdfs/', validators=[FileExtensionValidator(['pdf'])])
    cover_subtitle = models.CharField(max_length=120, blank=True)
    edition_label = models.CharField(max_length=40, blank=True, help_text='For example VOL. 01 or ESSENTIALS')
    is_published = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
    travel_mark = models.CharField(max_length=5,blank=True,help_text='Country abbreviation, e.g. KZ, TR, OM')

    class Meta:
        ordering = ['display_order', 'id']
        constraints = [models.UniqueConstraint(fields=['country', 'publication_type'], name='unique_travel_publication_country_type')]

    def __str__(self):
        return f'{self.country.name} — {self.get_publication_type_display()}'





class TourComment(models.Model):
    tour = models.ForeignKey('Tour', on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='tour_comments')
    body = models.TextField(max_length=3000)
    is_verified_booking = models.BooleanField(default=False, editable=False)
    is_approved = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    admin_reply = models.TextField(blank=True, max_length=3000)
    replied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} — {self.tour} ({self.created_at:%Y-%m-%d})'















class HomepageHero(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()

    button_text = models.CharField(
        max_length=80,
        default="Explore Now"
    )
    button_url = models.CharField(
        max_length=500,
        blank=True
    )

    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["display_order", "id"]
        verbose_name = "Homepage Hero"
        verbose_name_plural = "Homepage Heroes"

    def __str__(self):
        return self.title


class HomepageHeroImage(models.Model):
    hero = models.ForeignKey(
        HomepageHero,
        on_delete=models.CASCADE,
        related_name="images"
    )

    image = models.ImageField(upload_to="homepage/hero/")
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return f"{self.hero.title} - Image {self.pk}"














class Attraction(models.Model):
    CATEGORY_CHOICES = [
        ("nature", "Nature"),
        ("culture", "Culture & Heritage"),
        ("adventure", "Adventure"),
        ("food", "Food & Beverages"),
        ("shopping", "Shopping"),
        ("entertainment", "Entertainment"),
        ("other", "Other"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending approval"),
        ("published", "Published"),
        ("rejected", "Rejected"),
    ]

    country = models.ForeignKey("core.Country", on_delete=models.PROTECT, related_name="attractions")
    city = models.ForeignKey("core.City", on_delete=models.SET_NULL, null=True, blank=True, related_name="attractions")
    title = models.CharField(max_length=220)
    slug = models.SlugField(max_length=240)
    subtitle = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="other")
    description = models.TextField(blank=True)
    hero_image = models.ImageField(upload_to="attractions/hero/", blank=True, null=True)
    opening_hours = models.TextField(blank=True)
    admission_info = models.CharField(max_length=255, blank=True)
    ideal_for = models.CharField(max_length=150, blank=True)
    age_guidance = models.CharField(max_length=120, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    address = models.CharField(max_length=255, blank=True)
    source = models.CharField(max_length=40, blank=True)
    source_id = models.CharField(max_length=255, blank=True)
    source_url = models.URLField(max_length=1500, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    is_featured = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    provider_name = models.CharField(max_length=180,blank=True)
    booking_url = models.URLField( max_length=1500,blank=True)


    image_credit = models.CharField(max_length=255, blank=True)
    image_license = models.CharField(max_length=100, blank=True)
    image_license_url = models.URLField(max_length=1500, blank=True)
    image_source_url = models.URLField(max_length=1500, blank=True)


    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["source", "source_id"],
                condition=(
                    ~Q(source="")
                    & ~Q(source_id="")
                ),
                name="unique_attraction_source"
            )
        ]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse("attraction-detail", kwargs={
            "country_slug": self.country.slug,
            "attraction_slug": self.slug,
        })


class AttractionImage(models.Model):
    attraction = models.ForeignKey(Attraction, on_delete=models.CASCADE, related_name="gallery")
    image = models.ImageField(upload_to="attractions/gallery/")
    alt_text = models.CharField(max_length=255, blank=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]
