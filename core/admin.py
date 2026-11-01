from django.contrib import admin, messages
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from django import forms
from .notification_service import valid_action_url

from .models import (
    Country, CountryItem, CountryArea, CountryAirport,
    CountryMobileOperator, CountryApp, CountryEmergencyContact,
    CountryUsefulLink, CountryFAQ, CountrySection,
    City, CityHighlight,CityEssential, Tour,
    TourImage,
    TourHighlight,
    TourItineraryDay,
    TourInclusion,
    TourTravelEssential,
    TourPracticalDetail,
    Booking, BookingTraveler, BookingCoupon,
    CustomerProfile,CountryEvent,
    BookingCancellation,
    Notification, UserNotification,
    TravelPublication,
    TourComment,
    HomepageHero, 
    HomepageHeroImage,
    Attraction, 
    AttractionImage,
)




from django.db import transaction
from .review_notifications import send_review_notification


# =========================================================
# Destination Detail 
# =========================================================


class OrderedInline(admin.TabularInline):
    extra = 0
    show_change_link = True


class CountryItemInline(OrderedInline):
    model = CountryItem
    fields = ('group', 'title', 'subtitle', 'icon_class', 'url', 'display_order', 'is_active')


class CountryAreaInline(OrderedInline):
    model = CountryArea
    fields = ('title', 'image', 'url', 'display_order', 'is_active')


class CountryAirportInline(OrderedInline):
    model = CountryAirport
    fields = ('code', 'name', 'website', 'display_order', 'is_active')


class CountryMobileOperatorInline(OrderedInline):
    model = CountryMobileOperator
    fields = ('name', 'logo', 'website', 'display_order', 'is_active')


class CountryAppInline(OrderedInline):
    model = CountryApp
    fields = ('name', 'category', 'logo', 'website', 'ios_url', 'android_url', 'display_order', 'is_active')


class CountryEmergencyContactInline(OrderedInline):
    model = CountryEmergencyContact
    fields = ('title', 'phone_number', 'icon_class', 'display_order', 'is_active')


class CountryUsefulLinkInline(OrderedInline):
    model = CountryUsefulLink
    fields = ('title', 'url', 'icon_class', 'display_order', 'is_active')


class CountryFAQInline(OrderedInline):
    model = CountryFAQ
    fields = ('question', 'display_order', 'is_active')


class CountrySectionInline(OrderedInline):
    model = CountrySection
    fields = ('section_key', 'eyebrow', 'heading', 'link_label', 'link_url', 'display_order', 'is_active')


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'display_order')
    list_editable = ('is_active', 'display_order')
    list_filter = ('is_active',)
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [
        CountrySectionInline, CountryItemInline, CountryAreaInline,
        CountryAirportInline, CountryMobileOperatorInline, CountryAppInline,
        CountryEmergencyContactInline, CountryUsefulLinkInline, CountryFAQInline,
    ]
    fieldsets = (
        ('Identity', {'fields': ('name', 'slug', 'is_active', 'display_order')}),
        ('Hero', {'fields': (
            'page_title', 'hero_eyebrow', 'tagline', 'hero_description', 'hero_image',
            'hero_primary_label', 'hero_primary_url', 'hero_secondary_label', 'hero_secondary_url'
        )}),
        ('About', {'fields': ('about_heading', 'description', 'about_intro', 'about_extra', 'about_read_more_label')}),
        ('Weather API configuration (no live values)', {'fields': ('weather_location', 'weather_latitude', 'weather_longitude')}),
        ('Best time and transportation copy', {'fields': ('best_time', 'best_time_heading', 'best_time_description', 'transport_heading', 'transportation')}),
        ('Wide banner', {'fields': ('wide_banner_image', 'wide_banner_eyebrow', 'wide_banner_title', 'wide_banner_button_label', 'wide_banner_button_url')}),
        ('Featured banner', {'fields': ('feature_banner_image', 'feature_banner_eyebrow', 'feature_banner_title', 'feature_banner_description', 'feature_banner_button_label', 'feature_banner_button_url')}),
        ('Travel essentials introduction', {'fields': ('travel_essentials_eyebrow', 'travel_essentials_title', 'travel_essentials_description', 'travel_essentials_index', 'travel_essentials_note')}),
        ('Currency', {'fields': ('currency', 'currency_code', 'currency_symbol', 'currency_display_name', 'currency_description')}),
        ('Language', {'fields': ('language', 'language_code', 'language_display_name', 'language_description')}),
        ('Electricity', {'fields': ('electricity', 'electricity_voltage', 'electricity_plugs', 'electricity_description')}),
        ('Banks & payments', {'fields': ('money_heading', 'money_subheading', 'money_description', 'money_extra_description')}),
        ('Airports, mobile & apps', {'fields': ('airports', 'arrival_heading', 'connectivity_heading', 'mobile_networks_intro', 'useful_apps', 'useful_apps_intro')}),
        ('Emergency, visa, useful links & FAQ', {'fields': ('safety_heading', 'emergency_information', 'visa_heading', 'visa_information', 'visa_description', 'visa_link_label', 'visa_link_url', 'useful_links_heading', 'faq_heading')}),
    )


@admin.register(CountryItem)
class CountryItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'country', 'group', 'display_order', 'is_active')
    list_filter = ('country', 'group', 'is_active')
    search_fields = ('title', 'description')


for model in [CountryArea, CountryAirport, CountryMobileOperator, CountryApp,
              CountryEmergencyContact, CountryUsefulLink, CountryFAQ, CountrySection]:
    admin.site.register(model)














# =========================================================
# CITY GUIDE ADMIN
# =========================================================

class CityHighlightInline(admin.TabularInline):
    model = CityHighlight
    extra = 1
    fields = (
        'title',
        'category',
        'description',
        'image',
        'display_order',
    )
    ordering = ('display_order',)





class CityEssentialInline(admin.TabularInline):
    model = CityEssential
    extra = 1

    fields = (
        'title',
        'description',
        'icon_class',
        'url',
        'link_label',
        'display_order',
        'is_active',
    )

    ordering = ('display_order',)






@admin.register(City)
class CityAdmin(admin.ModelAdmin):

    list_display = (
        'name',
        'country',
        'slug',
        'is_active',
        'display_order',
    )

    list_display_links = ('name',)

    list_editable = (
        'is_active',
        'display_order',
    )

    list_filter = (
        'country',
        'is_active',
    )

    search_fields = (
        'name',
        'country__name',
    )

    prepopulated_fields = {
        'slug': ('name',),
    }

    autocomplete_fields = ('country',)

    ordering = (
        'country__name',
        'display_order',
        'name',
    )

    inlines = [
        CityHighlightInline,
        CityEssentialInline,
    ]

    fieldsets = (

        ('City Identity', {
            'fields': (
                'country',
                'name',
                'slug',
                'category',
                'is_active',
                'display_order',
            )
        }),

        ('Hero Section', {
            'fields': (
                'tagline',
                'hero_image',
                'image',
            )
        }),

        ('City Overview', {
            'fields': (
                'introduction',
                'best_time',
                'language',
                'currency',
                'airport',
            )
        }),

        ('Travel Essentials', {
            'fields': (
                'weather_info',
                'transport_info',
                'etiquette_info',
            )
        }),

        ('Location / Weather API', {
            'fields': (
                'latitude',
                'longitude',
            ),
            'classes': ('collapse',),
        }),

    )








# =========================================================
# TOUR DETAIL INLINES
# =========================================================

class TourImageInline(admin.TabularInline):
    model = TourImage
    extra = 1
    fields = ("image", "alt_text", "display_order")


class TourHighlightInline(admin.TabularInline):
    model = TourHighlight
    extra = 1
    fields = ("title", "description", "image", "display_order")


class TourItineraryInline(admin.StackedInline):
    model = TourItineraryDay
    extra = 1
    fields = ("day_number", "title", "description", "activities")


class TourInclusionInline(admin.TabularInline):
    model = TourInclusion
    extra = 1
    fields = (
        "title",
        "description",
        "icon_class",
        "is_included",
        "display_order",
    )


class TourTravelEssentialInline(admin.TabularInline):
    model = TourTravelEssential
    extra = 1
    fields = ("title", "description", "display_order")


class TourPracticalDetailInline(admin.TabularInline):
    model = TourPracticalDetail
    extra = 1
    fields = ("title", "description", "display_order")









# =========================================================
# TOUR ADMIN
# =========================================================

@admin.register(Tour)
class TourAdmin(admin.ModelAdmin):

    list_display = (
        'title',
        'country',
        'city',
        'price',
        'currency',
        'is_available',
        'is_published',
    )

    list_filter = (
        'country',
        'city',
        'is_available',
        'is_published',
    )

    search_fields = (
        'title',
        'country__name',
        'city__name',
    )

    prepopulated_fields = {
        'slug': ('title',),
    }

    autocomplete_fields = (
        'country',
        'city',
    )


    inlines = [
        TourImageInline,
        TourHighlightInline,
        TourItineraryInline,
        TourInclusionInline,
        TourTravelEssentialInline,
        TourPracticalDetailInline,
    ]

   
    fieldsets = (


        ("Customer Reward Coupons", {
            "description": "Reward customers after successful payment for this tour.",
            "fields": (
                "coupon_enabled",
                "coupon_percentage",
            ),
        }),



        ("Basic Tour Information", {
            "fields": (
                "country",
                "city",
                "title",
                "slug",
                "category",
                "tagline",
                "duration_days",
                "travel_style",
                "experience_type",
                "image",
            )
        }),

        ("01 — THE EXPERIENCE", {
            "fields": (
                "experience_heading",
                "experience_intro",
                "experience_description",
            )
        }),

        ("02 — THE MOMENTS", {
            "description": "Add highlight cards below in Tour Highlights.",
            "fields": ("moments_heading",)
        }),

        ("03 — YOUR ROUTE", {
            "description": "Add itinerary days below.",
            "fields": (
                "itinerary_heading",
                "itinerary_intro",
            )
        }),

        ("Wide Image — Go Further, Feel More", {
            "fields": ("story_image",)
        }),

        ("04 — THE DETAILS", {
            "description": "Use Tour Inclusions below to mark included or excluded services.",
            "fields": ("cancellation_policy",)
        }),

        ("07 — BEFORE YOU GO", {
            "fields": ("before_you_go_intro",)
        }),

        ("09 — PRACTICAL DETAILS", {
            "fields": ("practical_details_intro",)
        }),

        ("Tour Brochure", {
            "fields": ("brochure",)
        }),

        ("Pricing & Offers", {
            "fields": (
                "price",
                "currency",
                "has_offer",
                "offer_percentage",
            )
        }),

        ("Publication & Availability", {
            "fields": (
                "is_available",
                "is_published",
                "is_featured",
                "display_order",
            )
        }),

    )




from django.contrib import admin
from .models import Booking, BookingTraveler, BookingCoupon


class BookingTravelerInline(admin.TabularInline):
    model = BookingTraveler
    extra = 0
    readonly_fields = (
        "first_name",
        "last_name",
        "date_of_birth",
        "nationality",
        "email",
        "is_lead",
    )

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):

    list_display = (
        "reference",
        "tour_title",
        "traveler_count",
        "total_amount",
        "currency",
        "status",
        "created_at",
    )

    list_filter = ("status", "currency", "created_at")
    search_fields = ("reference", "tour_title", "payment_reference")

    readonly_fields = (
        "reference",
        "tour",
        "tour_title",
        "traveler_count",
        "unit_price",
        "total_amount",
        "currency",
        "room_preference",
        "room_notes",
        "contact_phone",
        "country_of_residence",
        "special_requests",
        "terms_accepted_at",
        "status",
        "payment_provider",
        "payment_reference",
        "paid_at",
        "created_at",
    )

    inlines = [BookingTravelerInline]

    def has_add_permission(self, request):
        return False


@admin.register(BookingCoupon)
class BookingCouponAdmin(admin.ModelAdmin):

    list_display = (
        "code",
        "booking",
        "discount_percentage",
        "is_used",
        "created_at",
    )

    search_fields = ("code", "booking__reference")
    list_filter = ("is_used",)

    readonly_fields = (
        "code",
        "booking",
        "discount_percentage",
        "is_used",
        "used_at",
        "created_at",
    )

    def has_add_permission(self, request):
        return False






User = get_user_model()


class CustomerProfileInline(admin.StackedInline):
    model = CustomerProfile
    can_delete = False
    extra = 0
    max_num = 1
    verbose_name_plural = "Customer Profile"


class KenDalaUserAdmin(UserAdmin):
    inlines = [CustomerProfileInline]

    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "customer_phone",
        "customer_country",
        "customer_language",
        "is_staff",
    )

    def customer_phone(self, obj):
        profile = getattr(obj, "customer_profile", None)
        return profile.phone if profile else "—"

    customer_phone.short_description = "Phone"

    def customer_country(self, obj):
        profile = getattr(obj, "customer_profile", None)
        return profile.country if profile else "—"

    customer_country.short_description = "Country"

    def customer_language(self, obj):
        profile = getattr(obj, "customer_profile", None)
        return profile.get_language_display() if profile else "—"

    customer_language.short_description = "Language"


admin.site.unregister(User)
admin.site.register(User, KenDalaUserAdmin)





@admin.register(CountryEvent)
class CountryEventAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "country",
        "city",
        "start_date",
        "venue",
        "source",
        "is_published",
    )

    list_filter = (
        "country",
        "is_published",
        "source",
        "start_date",
    )

    search_fields = (
        "title",
        "venue",
        "source_id",
    )

    list_editable = ("is_published",)






@admin.register(BookingCancellation)
class BookingCancellationAdmin(admin.ModelAdmin):
    list_display = ('booking', 'status', 'requested_at', 'days_before_departure',
                    'fee_percent', 'refund_amount', 'currency')
    list_filter = ('status', 'requested_at', 'currency')
    search_fields = ('booking__reference', 'booking__tour_title', 'requested_by__username')
    readonly_fields = ('booking', 'requested_by', 'requested_at', 'reason',
        'policy_version', 'policy_text', 'departure_date_snapshot',
        'days_before_departure', 'fee_percent', 'paid_amount', 'cancellation_fee',
        'refund_amount', 'currency', 'policy_accepted_at', 'reviewed_at',
        'reviewed_by', 'refunded_at')
    fields = readonly_fields + ('status', 'admin_notes', 'refund_reference')
    actions = ['approve_requests', 'reject_requests', 'mark_refunded']

    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return False

    @admin.action(description='Approve selected requests (refund pending)')
    def approve_requests(self, request, queryset):
        from django.db import transaction
        with transaction.atomic():
            for item in queryset.select_for_update().select_related('booking').filter(status='REQUESTED'):
                booking = Booking.objects.select_for_update().get(pk=item.booking_id)
                if booking.status != 'PAID': continue
                item.status = 'REFUND_PENDING' if item.refund_amount > 0 else 'APPROVED'
                item.reviewed_at = timezone.now()
                item.reviewed_by = request.user
                item.save(update_fields=['status','reviewed_at','reviewed_by'])
                booking.status = 'CANCELLED'
                booking.save(update_fields=['status'])

    @admin.action(description='Reject selected requests')
    def reject_requests(self, request, queryset):
        queryset.filter(status='REQUESTED').update(status='REJECTED', reviewed_at=timezone.now(), reviewed_by=request.user)

    @admin.action(description='Mark refund completed (requires refund reference)')
    def mark_refunded(self, request, queryset):
        from django.db import transaction
        with transaction.atomic():
            for item in queryset.select_for_update().filter(status='REFUND_PENDING').exclude(refund_reference=''):
                item.status = 'REFUNDED'
                item.refunded_at = timezone.now()
                item.save(update_fields=['status','refunded_at'])
                Booking.objects.filter(pk=item.booking_id, status='CANCELLED').update(status='REFUNDED')




















class NotificationAdminForm(forms.ModelForm):
    class Meta:
        model = Notification
        fields = ('title', 'message', 'category', 'action_url', 'action_label')

    def clean_action_url(self):
        url = self.cleaned_data['action_url'].strip()
        if not valid_action_url(url):
            raise forms.ValidationError('Use an internal URL beginning with /, for example /tour-packages.')
        return url


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    form = NotificationAdminForm
    list_display = ('title', 'category', 'source', 'published_at', 'created_at')
    readonly_fields = ('source', 'event_key', 'published_at', 'created_at')
    fields = ('title', 'message', 'category', 'action_url', 'action_label', 'source', 'event_key', 'published_at', 'created_at')
    actions = ('publish_selected',)

    def get_readonly_fields(self, request, obj=None):
        fields = list(self.readonly_fields)
        if obj and obj.published_at:
            fields += ['title', 'message', 'category', 'action_url', 'action_label']
        return fields

    def save_model(self, request, obj, form, change):
        if not change:
            obj.source = 'manual'
        super().save_model(request, obj, form, change)

    @admin.action(description='Publish selected drafts to ALL registered users')
    def publish_selected(self, request, queryset):
        count = 0
        for notification in queryset.filter(published_at__isnull=True, source='manual'):
            from django.db import transaction
            with transaction.atomic():
                notification.published_at = timezone.now()
                notification.save(update_fields=['published_at'])
                users = get_user_model().objects.filter(is_active=True).values_list('pk', flat=True)
                UserNotification.objects.bulk_create(
                    [UserNotification(notification=notification, user_id=uid) for uid in users],
                    batch_size=500, ignore_conflicts=True)
            count += 1
        self.message_user(request, f'Published {count} announcement(s).', messages.SUCCESS)


@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification', 'read_at', 'dismissed_at')
    list_filter = ('notification__category',)
    search_fields = ('user__username', 'notification__title')
    readonly_fields = ('notification', 'user', 'read_at', 'dismissed_at', 'created_at')
    def has_add_permission(self, request):
        return False











@admin.register(TravelPublication)
class TravelPublicationAdmin(admin.ModelAdmin):
    list_display = ('country', 'publication_type', 'is_published', 'display_order','travel_mark')
    list_filter = ('publication_type', 'is_published', 'country')
    search_fields = ('country__name', 'title', 'description', 'travel_mark',)
    list_editable = ('is_published', 'display_order')
    fields = ('country', 'publication_type', 'title', 'description', 'cover_image', 'pdf_file', 'cover_subtitle', 'edition_label', 'is_published', 'display_order', 'travel_mark',)




class NewCommentFilter(admin.SimpleListFilter):
    title = 'inbox'
    parameter_name = 'inbox'

    def lookups(self, request, model_admin):
        return [('new', 'New comments'), ('all', 'All comments')]

    def queryset(self, request, queryset):
        if self.value() == 'new':
            return queryset.filter(is_read=False)
        return queryset

@admin.register(TourComment)
class TourCommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'tour', 'is_verified_booking', 'is_read', 'is_approved', 'created_at')
    list_filter = (NewCommentFilter, 'is_read', 'is_approved', 'is_verified_booking', 'created_at')
    search_fields = ('user__username', 'user__email', 'tour__title', 'body', 'admin_reply')
    list_editable = ('is_approved',)
    readonly_fields = ('tour', 'user', 'body', 'is_verified_booking', 'created_at', 'replied_at')
    fields = ('tour', 'user', 'body', 'is_verified_booking', 'created_at', 'is_read', 'is_approved', 'admin_reply', 'replied_at')
    actions = ['mark_read', 'approve_comments']

    def has_add_permission(self, request):
        return False

    @admin.action(description='Mark selected comments as read')
    def mark_read(self, request, queryset):
        queryset.update(is_read=True)

    
    

    @admin.action(description='Approve selected comments')
    def approve_comments(self, request, queryset):
        approved_count = 0

        for comment_id in queryset.values_list("pk", flat=True):
            with transaction.atomic():
                comment = (
                    TourComment.objects
                    .select_for_update()
                    .select_related("tour")
                    .get(pk=comment_id)
                )

                if comment.is_approved:
                    continue

                comment.is_approved = True
                comment.save(update_fields=["is_approved"])

                event = (
                    "approved_and_replied"
                    if comment.admin_reply.strip()
                    else "approved"
                )

                send_review_notification(comment, event)
                approved_count += 1

        self.message_user(
            request,
            f"{approved_count} comment(s) approved.",
            messages.SUCCESS
        )






    def save_model(self, request, obj, form, change):
        with transaction.atomic():

            was_approved = False
            had_reply = False
            old_reply = ""

            if change:
                old = (
                    TourComment.objects
                    .select_for_update()
                    .get(pk=obj.pk)
                )

                was_approved = old.is_approved
                old_reply = old.admin_reply.strip()
                had_reply = bool(old_reply)

                new_reply = obj.admin_reply.strip()

                if new_reply != old_reply:
                    obj.replied_at = (
                        timezone.now() if new_reply else None
                    )

                obj.is_read = True

            super().save_model(request, obj, form, change)

            if not change:
                return

            newly_approved = (
                not was_approved and obj.is_approved
            )

            new_reply_added = (
                not had_reply and bool(obj.admin_reply.strip())
            )

            if newly_approved and obj.admin_reply.strip():
                send_review_notification(
                    obj,
                    "approved_and_replied"
                )

            elif newly_approved:
                send_review_notification(
                    obj,
                    "approved"
                )

            elif obj.is_approved and new_reply_added:
                send_review_notification(
                    obj,
                    "replied"
                )









class HomepageHeroImageInline(admin.TabularInline):
    model = HomepageHeroImage
    extra = 1
    fields = ("image", "display_order")


@admin.register(HomepageHero)
class HomepageHeroAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "display_order",
        "is_active",
    )
    list_editable = ("display_order", "is_active")
    search_fields = ("title",)
    inlines = [HomepageHeroImageInline]











class AttractionImageInline(admin.TabularInline):
    model = AttractionImage
    extra = 0


@admin.register(Attraction)
class AttractionAdmin(admin.ModelAdmin):
    list_display = ("title", "country", "city", "category", "status", "last_synced_at")
    list_filter = ("status", "country", "category", "source")
    search_fields = ("title", "source_id", "city__name")
    list_editable = ("status",)
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("source", "source_id", "last_synced_at", "created_at", "updated_at")
    inlines = [AttractionImageInline]
    actions = ("approve_selected", "reject_selected")

    @admin.action(description="Approve selected attractions")
    def approve_selected(self, request, queryset):
        count = queryset.update(status="published")
        self.message_user(request, f"Approved {count} attraction(s).")

    @admin.action(description="Reject selected attractions")
    def reject_selected(self, request, queryset):
        count = queryset.update(status="rejected")
        self.message_user(request, f"Rejected {count} attraction(s).")
