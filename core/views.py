from django.shortcuts import get_object_or_404, render, redirect
from django.db.models import Prefetch, Q
from django.utils import timezone
from .models import (
    Country,City,Tour,CountryEvent,CountryItem,Booking,BookingTraveler,CustomerProfile,BookingCancellation,Wishlist,BookingCoupon,UserNotification,TourComment,
    HomepageHero,HomepageHeroImage,
    Attraction,
)
import requests
from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from urllib.parse import urlencode
from django.views.decorators.http import require_POST
import json
from datetime import date, timedelta
from django.db import transaction
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from .forms import KenDalaSignupForm, CustomerProfileForm
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Count
from decimal import Decimal, ROUND_HALF_UP
from django.views.decorators.http import require_http_methods
from .cancellation_service import cancellation_quote
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth import update_session_auth_hash
from .notification_views import serialize_notification
from django.db.models import Case, When, Value, IntegerField


from urllib.parse import urlparse
from .viator_api import ViatorError, search_products, adventure_first, get_product
from django.http import Http404
from types import SimpleNamespace

















def destination_detail(request, country_slug):
    country = get_object_or_404(
        Country.objects.prefetch_related(
            Prefetch('items', queryset=CountryItem.objects.filter(is_active=True)),
            'sections', 'areas', 'airport_entries', 'mobile_operators',
            'apps', 'emergency_contacts', 'useful_links', 'faqs',
        ),
        slug=country_slug, is_active=True,
    )
    today = timezone.localdate()
    context = {
        'country': country,
        'cities': City.objects.filter(country=country, is_active=True),
        'tours': Tour.objects.filter(country=country, is_published=True).select_related('city'),
        'events': CountryEvent.objects.filter(country=country, is_published=True).filter(
            Q(end_date__gte=today) | Q(end_date__isnull=True, start_date__gte=today)
        ),
        'tags': country.items.filter(group='tag'),
        'best_time_items': country.items.filter(group='best_time'),
        'transport_options': country.items.filter(group='transport'),
        'money_items': country.items.filter(group='money'),
        'arrival_transport_options': country.items.filter(group='arrival_transport'),
        'areas': country.areas.filter(is_active=True),
        'airports': country.airport_entries.filter(is_active=True),
        'mobile_operators': country.mobile_operators.filter(is_active=True),
        'useful_apps': country.apps.filter(is_active=True),
        'emergency_contacts': country.emergency_contacts.filter(is_active=True),
        'useful_links': country.useful_links.filter(is_active=True),
        'faqs': country.faqs.filter(is_active=True),
        'sections': {section.section_key: section for section in country.sections.filter(is_active=True)},
    }
    return render(request, 'destination-detail.html', context)














def city_guide(request, country_slug, city_slug):
    city = get_object_or_404(
        City.objects.select_related('country'),
        country__slug=country_slug,
        country__is_active=True,
        slug=city_slug,
        is_active=True,
    )
    tours = Tour.objects.filter(
        country=city.country, is_published=True,
        city__is_active=True,
    ).select_related('country', 'city')
    context = {
        'city': city,
        'city_tours': tours.filter(city=city),
        'related_tours': tours.exclude(city=city)[:6],
        'highlights': city.highlights.all(),
        'essentials': city.essentials.filter(is_active=True),
    }
    return render(request, 'city-guide.html', context)



def tour_details_detail(request, tour_id, tour_slug):

    tour = get_object_or_404(
        Tour.objects.select_related("country", "city")
        .prefetch_related(
            "gallery",
            "highlights",
            "itinerary",
            "inclusions",
            "travel_essentials",
            "practical_details",
        ),
        pk=tour_id,
        slug=tour_slug,
        is_published=True,
    )
    is_wishlisted = False

    if request.user.is_authenticated:
        is_wishlisted = Wishlist.objects.filter(
            user=request.user,
            tour=tour
        ).exists()

    
    comments = TourComment.objects.filter(tour=tour, is_approved=True).select_related('user')
    has_paid_booking = (request.user.is_authenticated and
        Booking.objects.filter(user=request.user, tour=tour, status='PAID').exists())
    
    context = {
        "tour": tour,
        "gallery": tour.gallery.all(),
        "highlights": tour.highlights.all(),
        "itinerary": tour.itinerary.all(),
        "included_items": tour.inclusions.filter(is_included=True),
        "excluded_items": tour.inclusions.filter(is_included=False),
        "travel_essentials": tour.travel_essentials.all(),
        "practical_details": tour.practical_details.all(),
        "is_wishlisted": is_wishlisted,
        "wishlist_login_url": (
            reverse("login") + "?" +
            urlencode({"next": request.path})
        ),
        'comments': comments,
        'has_paid_booking': has_paid_booking,

    }

    return render(request, "tour-details.html", context)








def booking_group(request):
    tour_id = request.GET.get("tour")

    tour = get_object_or_404(
        Tour.objects.select_related("country", "city"),
        pk=tour_id,
        is_published=True,
        is_available=True,
    )

    draft = request.session.get("kd_booking_draft")

    if (
        not isinstance(draft, dict)
        or str(draft.get("tour_id")) != str(tour.pk)
        or draft.get("expires_at", 0) <= timezone.now().timestamp()
    ):
        draft = None
        request.session.pop("kd_booking_draft", None)

    return render(request, "booking_group.html", {
        "tour": tour,
        "booking_price": tour.discounted_price,
        "booking_currency": "USD",
        "booking_draft": draft,
        "booking_today": timezone.localdate(),
        "login_url": reverse("login"),
    })











@require_POST
def create_group_booking(request):
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse(
            {"error": "Invalid booking data."},
            status=400,
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {"error": "Invalid booking format."},
            status=400,
        )

    travelers = data.get("travelers")

    if not isinstance(travelers, list) or not 1 <= len(travelers) <= 12:
        return JsonResponse(
            {"error": "Please provide 1 to 12 travelers."},
            status=400,
        )

    if data.get("terms_accepted") is not True:
        return JsonResponse(
            {"error": "Please accept the booking terms."},
            status=400,
        )

    phone = str(data.get("contact_phone") or "").strip()

    if not phone:
        return JsonResponse(
            {"error": "Contact phone is required."},
            status=400,
        )

    room_preference = data.get("room_preference", "recommended")

    if room_preference not in {"recommended", "together", "custom"}:
        return JsonResponse(
            {"error": "Invalid room preference."},
            status=400,
        )

    validated_travelers = []

    for index, person in enumerate(travelers):
        if not isinstance(person, dict):
            return JsonResponse(
                {"error": f"Invalid traveler {index + 1}."},
                status=400,
            )

        first = str(person.get("first") or "").strip()
        last = str(person.get("last") or "").strip()
        nationality = str(person.get("nationality") or "").strip()
        email = str(person.get("email") or "").strip()

        if not first or not last or not nationality:
            return JsonResponse(
                {"error": f"Traveler {index + 1} is incomplete."},
                status=400,
            )

        try:
            dob = date.fromisoformat(str(person.get("dob") or ""))
        except ValueError:
            return JsonResponse(
                {"error": f"Invalid birth date for traveler {index + 1}."},
                status=400,
            )

        if dob > date.today():
            return JsonResponse(
                {"error": "Date of birth cannot be in the future."},
                status=400,
            )

        if index == 0 and not email:
            return JsonResponse(
                {"error": "Lead traveler email is required."},
                status=400,
            )

        if email:
            try:
                validate_email(email)
            except ValidationError:
                return JsonResponse(
                    {"error": f"Invalid email for traveler {index + 1}."},
                    status=400,
                )

        validated_travelers.append({
            "first_name": first,
            "last_name": last,
            "date_of_birth": dob,
            "nationality": nationality,
            "email": email,
            "is_lead": index == 0,
        })

    tour = get_object_or_404(
        Tour,
        pk=data.get("tour_id"),
        is_published=True,
        is_available=True,
    )

    try:
        departure_date = date.fromisoformat(str(data.get("departure_date") or ""))
    except ValueError:
        return JsonResponse({"error": "Please select a valid departure date."}, status=400)
    if departure_date <= timezone.localdate():
        return JsonResponse({"error": "Departure date must be in the future."}, status=400)

    # Always calculate prices on the server.
    # Never trust a price supplied by JavaScript.
    unit_price = tour.discounted_price
    total_amount = unit_price * len(validated_travelers)
    coupon_code = str(data.get("coupon_code") or "").strip().upper()

    # Keep the validated draft across login/signup without creating a booking.
    request.session["kd_booking_draft"] = {
        "tour_id": tour.pk,
        "coupon_code": coupon_code,
        "departure_date": departure_date.isoformat(),
        "travelers": [
            {
                "first": p["first_name"],
                "last": p["last_name"],
                "dob": p["date_of_birth"].isoformat(),
                "nationality": p["nationality"],
                "email": p["email"],
            }
            for p in validated_travelers
        ],
        "room_preference": room_preference,
        "room_notes": str(data.get("room_notes") or "")[:5000],
        "contact_phone": phone[:50],
        "country_of_residence": str(data.get("country_of_residence") or "")[:120],
        "special_requests": str(data.get("special_requests") or "")[:5000],
        "terms_accepted": True,
        "expires_at": (timezone.now() + timedelta(hours=2)).timestamp(),
    }

    if not request.user.is_authenticated:
        return_url = reverse("booking-group") + "?" + urlencode({"tour": tour.pk})
        login_url = reverse("login") + "?" + urlencode({"next": return_url})
        return JsonResponse({
            "success": False,
            "login_required": True,
            "login_url": login_url,
            "message": "Sign in or create an account to continue to secure payment.",
        })

    with transaction.atomic():
        coupon = None
        if coupon_code:
            coupon = (BookingCoupon.objects.select_for_update()
                      .filter(code__iexact=coupon_code, booking__user=request.user)
                      .first())
            if coupon is None or coupon.is_used or coupon.redeemed_booking_id is not None:
                return JsonResponse({"error": "Coupon is invalid, used, or reserved."}, status=400)
            percentage = Decimal(coupon.discount_percentage)
            if not Decimal("0") < percentage < Decimal("100"):
                return JsonResponse({"error": "Invalid coupon discount."}, status=400)
            discount = (total_amount * percentage / Decimal("100")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_amount = max(Decimal("0.00"), total_amount - discount)

        booking = Booking.objects.create(
            user=request.user,
            tour=tour,
            departure_date=departure_date,
            tour_title=tour.title,
            traveler_count=len(validated_travelers),
            unit_price=unit_price,
            total_amount=total_amount,
            currency="USD",
            room_preference=room_preference,
            room_notes=str(data.get("room_notes") or "")[:5000],
            contact_phone=phone[:50],
            country_of_residence=str(
                data.get("country_of_residence") or ""
            )[:120],
            special_requests=str(
                data.get("special_requests") or ""
            )[:5000],
            terms_accepted_at=timezone.now(),
            status="PENDING_PAYMENT",
            payment_provider="THAWANI",
        )

        if coupon:
            coupon.redeemed_booking = booking
            coupon.save(update_fields=["redeemed_booking"])

        BookingTraveler.objects.bulk_create([
            BookingTraveler(booking=booking, **person)
            for person in validated_travelers
        ])

    request.session.pop("kd_booking_draft", None)

    refs = request.session.get('kd_booking_refs', [])
    refs.append(booking.reference)
    request.session['kd_booking_refs'] = refs[-20:]

    return JsonResponse({
        "success": True,
        "booking_reference": booking.reference,
        "status": booking.status,
        "total_amount": str(booking.total_amount),
        "currency": booking.currency,
        'payment_start_url': reverse('thawani-booking-start', args=[booking.reference]),
    })









def tour_packages(request):
    tours = (
        Tour.objects
        .filter(is_published=True)
        .select_related("country", "city")
        .order_by("display_order", "-is_featured", "title")
    )

    return render(request, "tour-packages.html", {
        "tours": tours,
    })









def safe_auth_next(request):
    destination = request.POST.get("next") or request.GET.get("next") or ""
    if destination and url_has_allowed_host_and_scheme(
        url=destination,
        allowed_hosts={request.get_host()},
        require_https=request.is_secure(),
    ):
        return destination
    return reverse("index")



def signup(request):
    next_url = safe_auth_next(request)

    if request.user.is_authenticated:
        return redirect(next_url)

    if request.method == "POST":
        form = KenDalaSignupForm(request.POST)

        if form.is_valid():
            form.save()

            messages.success(
                request,
                "Your Ken Dala account has been created successfully. "
                "Please sign in to continue."
            )

            return redirect(
                reverse("login") + "?" + urlencode({"next": next_url})
            )
    else:
        form = KenDalaSignupForm()

    return render(request, "signup.html", {
        "form": form,
        "auth_next": next_url,
    })


def login(request):
    next_url = safe_auth_next(request)
    if request.user.is_authenticated:
        return redirect(next_url)

    error = None
    if request.method == "POST":
        identifier = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")
        user = auth.authenticate(request, username=identifier, password=password)
        if user is not None:
            auth.login(request, user)
            if request.POST.get("remember") == "on":
                request.session.set_expiry(60 * 60 * 24 * 30)
            else:
                request.session.set_expiry(0)
            return redirect(next_url)
        error = "Invalid username/email or password."

    return render(request, "login.html", {
        "error": error,
        "auth_next": next_url,
    })


@login_required
@require_POST
def logout_user(request):
    auth.logout(request)
    return redirect("index")



















@login_required
def user_dashboard(request):

    profile, created = CustomerProfile.objects.get_or_create(
        user=request.user
    )

    if request.method == "POST":

        if request.POST.get("form_type") == "profile":

            form = CustomerProfileForm(
                request.POST,
                request.FILES,
                instance=profile,
                user=request.user
            )

            if form.is_valid():

                with transaction.atomic():
                    form.save()

                messages.success(
                    request,
                    "Your profile has been updated successfully."
                )

                return redirect("user-dashboard")

            else:
                messages.error(
                    request,
                    "Please correct the highlighted profile fields."
                )

    else:
        form = CustomerProfileForm(
            instance=profile,
            user=request.user
        )
    
    user_bookings = (
        Booking.objects
        .filter(user=request.user)
        .select_related(
            "tour",
            "tour__country",
            "tour__city",
            "cancellation",
        )
        .order_by("-created_at")
    )
    user_wishlist = (
        Wishlist.objects
        .filter(user=request.user)
        .select_related(
            "tour",
            "tour__country",
            "tour__city"
        )
        .order_by("-created_at")
    )




    user_notifications = (
        UserNotification.objects.filter(user=request.user, dismissed_at__isnull=True,
                                        notification__published_at__isnull=False)
        .select_related('notification')[:100]
    )
    notification_data = [serialize_notification(item) for item in user_notifications]


    user_comments = (
        TourComment.objects
        .filter(user=request.user)
        .select_related("tour")
        .order_by("-created_at")
    )


    return render(request, "user-dashboard.html", {
        "profile": profile,
        "profile_form": form,
        "user_bookings": user_bookings,
        "user_wishlist": user_wishlist,
        "notification_data": notification_data,
        "user_comments": user_comments,
    })












@login_required
@require_http_methods(['GET', 'POST'])
def request_booking_cancellation(request, reference):
    booking = get_object_or_404(Booking, reference=reference, user=request.user)
    existing = BookingCancellation.objects.filter(booking=booking).first()
    if existing:
        return render(request, 'booking_cancellation.html', {'booking': booking, 'existing': existing})


    if booking.status != 'PAID':
        return render(request, 'booking_cancellation.html', {'booking': booking,
            'error': 'This booking is not marked paid. Contact support to cancel or void it.'})
    try:
        quote = cancellation_quote(booking, paid_amount=booking.total_amount)
    except ValueError as exc:
        return render(request, 'booking_cancellation.html', {'booking': booking, 'error': str(exc)})

    if request.method == 'POST':
        if request.POST.get('accept_policy') != 'yes':
            return render(request, 'booking_cancellation.html', {'booking': booking, 'quote': quote,
                'error': 'Please read and accept the cancellation policy.'}, status=400)
        with transaction.atomic():
            locked = Booking.objects.select_for_update().get(pk=booking.pk)
            if locked.status != 'PAID' or BookingCancellation.objects.filter(booking=locked).exists():
                return redirect('booking-cancellation', reference=reference)
            quote = cancellation_quote(locked, paid_amount=locked.total_amount)
            BookingCancellation.objects.create(
                booking=locked, requested_by=request.user,
                reason=request.POST.get('reason', '')[:3000],
                policy_version=quote['policy_version'], policy_text=quote['policy_text'],
                departure_date_snapshot=locked.departure_date,
                days_before_departure=quote['days'], fee_percent=quote['percentage'],
                paid_amount=quote['paid'], cancellation_fee=quote['fee'],
                refund_amount=quote['refund'], currency=locked.currency,
                policy_accepted_at=timezone.now(),
            )
        return redirect('booking-cancellation', reference=reference)
    return render(request, 'booking_cancellation.html', {'booking': booking, 'quote': quote})















@login_required
@require_POST
def toggle_wishlist(request, tour_id):
    tour = get_object_or_404(
        Tour,
        pk=tour_id,
        is_published=True
    )

    item, created = Wishlist.objects.get_or_create(
        user=request.user,
        tour=tour
    )

    if not created:
        item.delete()

    return JsonResponse({
        "success": True,
        "saved": created,
        "message": (
            "Tour added to your wishlist."
            if created else
            "Tour removed from your wishlist."
        )
    })


@login_required
@require_POST
def remove_wishlist(request, tour_id):
    deleted, _ = Wishlist.objects.filter(
        user=request.user,
        tour_id=tour_id
    ).delete()

    return JsonResponse({
        "success": True,
        "removed": deleted > 0
    })












@require_POST
@login_required
def validate_booking_coupon(request):
    try:
        data = json.loads(request.body)
        code = str(data.get("code") or "").strip().upper()
    except (ValueError, TypeError):
        return JsonResponse(
            {"valid": False, "message": "Invalid request."},
            status=400
        )

    if not code:
        return JsonResponse({
            "valid": False,
            "message": "Please enter a coupon code."
        })

    coupon = (
        BookingCoupon.objects
        .select_related("booking")
        .filter(
            code__iexact=code,
            booking__user=request.user,
        )
        .first()
    )

    if not coupon:
        return JsonResponse({
            "valid": False,
            "message": "Coupon not found or not available for your account."
        })

    if coupon.is_used or coupon.redeemed_booking_id is not None:
        return JsonResponse({
            "valid": False,
            "message": "This coupon is already used or reserved."
        })

    return JsonResponse({
        "valid": True,
        "code": coupon.code,
        "discount_percentage": coupon.discount_percentage,
        "message": "Coupon applied successfully!"
    })



















def events(request):
    today = timezone.localdate()

    # countries = Country.objects.filter(
    #     slug__in=["turkey", "turkiye", "kazakhstan", "oman"],
    #     is_active=True,
    # ).order_by("name")

    countries = Country.objects.filter(
        is_active=True,
    ).order_by("name")

    base_qs = (
        CountryEvent.objects.filter(
            country__in=countries,
            is_published=True,
        )
        .filter(
            Q(end_date__gte=today)
            | Q(end_date__isnull=True, start_date__gte=today)
        )
        .select_related("country", "city")
    )

    country_slug = request.GET.get("country", "").strip()
    city_id = request.GET.get("city", "").strip()
    category = request.GET.get("category", "").strip()
    venue = request.GET.get("venue", "").strip()
    search = request.GET.get("q", "").strip()[:150]
    from_date = request.GET.get("from", "").strip()

    # selected_country = countries.filter(slug=country_slug).first()

    # country_qs = base_qs
    # if selected_country:
    #     country_qs = country_qs.filter(country=selected_country)
    # else:
    #     country_slug = ""

    selected_country = countries.filter(slug=country_slug).first()

    country_qs = base_qs

    if country_slug:
        if selected_country:
            country_qs = country_qs.filter(country=selected_country)
        else:
            country_qs = country_qs.none()


    cities = City.objects.filter(
        country__in=countries,
        is_active=True,
    )

    if selected_country:
        cities = cities.filter(country=selected_country)

    cities = cities.order_by("country__name", "name")

    # Featured and upcoming sections
    upcoming = country_qs.order_by("start_date", "title")
    featured = list(upcoming[:12])

    happening_soon = list(
        upcoming.filter(
            start_date__lte=today + timedelta(days=30)
        )[:12]
    )

    categories = list(
        country_qs.exclude(category="")
        .order_by("category")
        .values_list("category", flat=True)
        .distinct()
    )

    venues = list(
        country_qs.exclude(venue="")
        .order_by("venue")
        .values_list("venue", flat=True)
        .distinct()
    )

    qs = country_qs

    if city_id:
        if city_id.isdigit() and cities.filter(pk=int(city_id)).exists():
            qs = qs.filter(city_id=int(city_id))
        else:
            city_id = ""

    if category:
        qs = qs.filter(category=category)

    if venue:
        qs = qs.filter(venue=venue)

    if search:
        qs = qs.filter(
            Q(title__icontains=search)
            | Q(description__icontains=search)
            | Q(venue__icontains=search)
            | Q(city__name__icontains=search)
            | Q(country__name__icontains=search)
        )

    if from_date:
        try:
            selected_date = date.fromisoformat(from_date)
            qs = qs.filter(
                Q(end_date__gte=selected_date)
                | Q(
                    end_date__isnull=True,
                    start_date__gte=selected_date,
                )
            )
        except ValueError:
            from_date = ""

    paginator = Paginator(
        qs.order_by("start_date", "title"),
        16,
    )

    events_page = paginator.get_page(request.GET.get("page"))

    params = request.GET.copy()
    params.pop("page", None)

    venue_data = list(
        upcoming.exclude(venue="")
        .values("venue", "city__name", "country__name")
        .annotate(total=Count("id"))
        .order_by("-total", "venue")[:6]
    )

    venue_cards = [
        {
            "name": item["venue"],
            "city": item["city__name"] or item["country__name"],
            "count": item["total"],
            "image_url": "",
        }
        for item in venue_data
    ]

    return render(request, "events.html", {
        "countries": countries,
        "featured": featured,
        "happening_soon": happening_soon,
        "events_page": events_page,
        "cities": cities,
        "categories": categories,
        "venues": venues,
        "venue_cards": venue_cards,
        "filter_query": params.urlencode(),
        "filters": {
            "country": country_slug,
            "city": city_id,
            "category": category,
            "venue": venue,
            "q": search,
            "from_date": from_date,
        },
    })







@login_required
@require_POST
def change_password(request):

    form = PasswordChangeForm(
        user=request.user,
        data=request.POST
    )

    if form.is_valid():

        user = form.save()

        # Keep the user logged in after changing password.
        update_session_auth_hash(request, user)

        messages.success(
            request,
            "Your password has been changed successfully."
        )

    else:

        errors = []

        for field_errors in form.errors.values():
            for error in field_errors:
                if error not in errors:
                    errors.append(str(error))

        messages.error(
            request,
            " ".join(errors) if errors
            else "Unable to change your password."
        )
    return redirect(
        reverse("user-dashboard") + "?page=profile"
    )










def search_results(request):
    query = request.GET.get("q", "").strip()[:150]
    country_slug = request.GET.get("country", "").strip()
    result_type = request.GET.get("type", "all")
    sort = request.GET.get("sort", "relevance")

    if result_type not in {"all", "tours", "destinations"}:
        result_type = "all"

    if sort not in {"relevance", "name"}:
        sort = "relevance"

    countries = Country.objects.filter(
        is_active=True
    ).order_by("name")

    tours = Tour.objects.filter(
        is_published=True,
        country__is_active=True,
        city__is_active=True
    ).select_related("country", "city")

    destinations = countries

    if country_slug:
        if countries.filter(slug=country_slug).exists():
            tours = tours.filter(country__slug=country_slug)
            destinations = destinations.filter(slug=country_slug)
        else:
            tours = tours.none()
            destinations = destinations.none()

    if query:
        tours = tours.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(tagline__icontains=query) |
            Q(category__icontains=query) |
            Q(travel_style__icontains=query) |
            Q(experience_type__icontains=query) |
            Q(country__name__icontains=query) |
            Q(city__name__icontains=query)
        )

        destinations = destinations.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(tagline__icontains=query)
        )

        tours = tours.annotate(
            search_rank=Case(
                When(title__iexact=query, then=Value(0)),
                When(title__istartswith=query, then=Value(1)),
                When(title__icontains=query, then=Value(2)),
                When(city__name__istartswith=query, then=Value(3)),
                When(country__name__istartswith=query, then=Value(4)),
                default=Value(5),
                output_field=IntegerField(),
            )
        ).order_by("search_rank", "title")

    else:
        tours = tours.order_by("display_order", "title")

    if sort == "name":
        tours = tours.order_by("title")

    results = []

    if result_type in {"all", "destinations"}:
        for country in destinations:
            results.append({
                "title": country.name,
                "description": country.description or country.tagline,
                "country": country.name,
                "type_label": "DESTINATION",
                "category": "",
                "image_url": (
                    country.hero_image.url
                    if country.hero_image else ""
                ),
                "url": reverse(
                    "destination-detail",
                    kwargs={"country_slug": country.slug}
                ),
                "rank": (
                    0 if country.name.lower() == query.lower()
                    else 1 if country.name.lower().startswith(query.lower())
                    else 4
                ) if query else 4,
            })

    if result_type in {"all", "tours"}:
        for tour in tours:
            results.append({
                "title": tour.title,
                "description": tour.description or tour.tagline,
                "country": tour.country.name,
                "type_label": "TOUR",
                "category": tour.category,
                "image_url": tour.image.url if tour.image else "",
                "url": reverse(
                    "tour_details_detail",
                    kwargs={
                        "tour_id": tour.pk,
                        "tour_slug": tour.slug,
                    }
                ),
                "rank": tour.search_rank if query and sort == "relevance" else 5,
            })

    if sort == "name":
        results.sort(key=lambda item: item["title"].lower())
    elif query:
        results.sort(key=lambda item: (item["rank"], item["title"].lower()))

    paginator = Paginator(results, 10)
    page_obj = paginator.get_page(request.GET.get("page"))

    return render(request, "search_results.html", {
        "query": query,
        "results": page_obj.object_list,
        "result_count": paginator.count,
        "page_obj": page_obj,
        "countries": countries,
        "selected_country": country_slug,
        "selected_type": result_type,
        "selected_sort": sort,
    })








def offers(request):
    offer_tours = (
        Tour.objects
        .filter(
            is_published=True,
            is_available=True,
            has_offer=True,
            offer_percentage__gt=0,
        )
        .select_related("country", "city")
        .order_by("display_order", "-is_featured", "title")
    )
    return render(request, "offers.html", {"offer_tours": offer_tours})





def all_destinations(request):
    cities = (
        City.objects
        .filter(is_active=True, country__is_active=True)
        .select_related("country")
        .order_by("country__display_order", "display_order", "name")
    )

    return render(request, "all-destinations.html", {
        "cities": cities,
    })





def travel_guide(request):
    from django.db.models import Prefetch
    from .models import TravelPublication

    publications = TravelPublication.objects.filter(is_published=True).order_by('display_order', 'id')
    countries = (Country.objects.filter(is_active=True, travel_publications__is_published=True)
                 .distinct().order_by('display_order', 'name')
                 .prefetch_related(Prefetch('travel_publications', queryset=publications, to_attr='published_travel_publications')))
    return render(request, 'travel-guide.html', {'guide_countries': countries})






@login_required(login_url="login")
@require_POST
def submit_tour_comment(request, tour_id):

    tour = get_object_or_404(
        Tour,
        pk=tour_id,
        is_published=True
    )

    def respond(message, success=False, status=200):

        # AJAX request: return JSON without refreshing the page
        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return JsonResponse({
                "success": success,
                "message": message
            }, status=status)

        # Normal request: preserve Django messages and redirects
        if success:
            messages.success(request, message)
        else:
            messages.error(request, message)

        return redirect(
            reverse(
                "tour_details_detail",
                kwargs={
                    "tour_id": tour.pk,
                    "tour_slug": tour.slug
                }
            ) + "#reviews"
        )

    body = request.POST.get("body", "").strip()

    # Validate comment
    if not 10 <= len(body) <= 3000:
        return respond(
            "Your comment must contain between 10 and 3000 characters.",
            success=False,
            status=400
        )

    # Automatically verify paid booking for this specific tour
    verified = Booking.objects.filter(
        user=request.user,
        tour=tour,
        status="PAID"
    ).exists()

    # Save comment — awaiting admin approval
    TourComment.objects.create(
        tour=tour,
        user=request.user,
        body=body,
        is_verified_booking=verified,
        is_approved=False,
        is_read=False
    )

    # Return success response
    return respond(
        "Your comment has been submitted successfully and is awaiting approval.",
        success=True,
        status=200
    )





def index(request):
    import random

    today = timezone.localdate()

    # --------------------------------------------------
    # HOMEPAGE HERO SLIDES
    # --------------------------------------------------

    hero_slides = (
        HomepageHero.objects
        .filter(is_active=True, images__isnull=False)
        .distinct()
        .prefetch_related(
            Prefetch(
                "images",
                queryset=HomepageHeroImage.objects.order_by(
                    "display_order", "id"
                )
            )
        )
        .order_by("display_order", "id")[:4]
    )

    # --------------------------------------------------
    # FEATURED CITIES
    # --------------------------------------------------

    featured_cities = (
        City.objects
        .filter(
            is_active=True,
            country__is_active=True
        )
        .select_related("country")
        .order_by("display_order", "name")[:12]
    )

    # --------------------------------------------------
    # FEATURED EVENTS
    # --------------------------------------------------

    featured_events = (
        CountryEvent.objects
        .filter(
            is_published=True,
            country__is_active=True
        )
        .filter(
            Q(end_date__gte=today)
            | Q(
                end_date__isnull=True,
                start_date__gte=today
            )
        )
        .select_related("country", "city")
        .order_by("start_date", "title")[:15]
    )

    # --------------------------------------------------
    # FEATURED TOURS
    # --------------------------------------------------

    featured_tours = (
        Tour.objects
        .filter(
            is_published=True,
            is_available=True,
            country__is_active=True,
            city__is_active=True
        )
        .select_related("country", "city")
        .order_by(
            "display_order",
            "-is_featured",
            "title"
        )[:15]
    )

    # --------------------------------------------------
    # THINGS TO DO — VIATOR EXPERIENCES
    # --------------------------------------------------

    configured = getattr(settings, "VIATOR_CITY_IDS", {})

    viator_cities = list(
        City.objects
        .filter(
            is_active=True,
            country__is_active=True,
            slug__in=configured.keys()
        )
        .select_related("country")
    )

    featured_attractions = []
    seen_codes = set()

    random.shuffle(viator_cities)

    for city in viator_cities:

        destination_id = configured.get(city.slug)

        if not destination_id:
            continue

        try:
            products = adventure_first(
                search_products(
                    destination_id,
                    count=20
                )
            )

        except (ViatorError, ValueError):
            continue

        for product in products:

            code = str(
                product.get("productCode") or ""
            ).strip()

            if not code or code in seen_codes:
                continue

            seen_codes.add(code)

            title = str(
                product.get("title") or "Experience"
            )

            detail_url = reverse(
                "attraction-detail",
                kwargs={
                    "country_slug": city.country.slug,
                    "attraction_slug": "viator-" + code,
                }
            )

            featured_attractions.append({
                "code": code,
                "title": title,
                "image": _viator_image(product),
                "category": _viator_category(title),
                "city": city.name,
                "country": city.country.name,
                "detail_url": (
                    detail_url
                    + "?"
                    + urlencode({"city": city.slug})
                ),
                "city_slug": city.slug,
            })

        

    # Mix experiences from different destinations
    random.shuffle(featured_attractions)

    # Maximum 12 experiences on homepage
    featured_attractions = featured_attractions[:42]

    things_filter_cities = [
        city for city in viator_cities
        if any(
            item["city_slug"] == city.slug
            for item in featured_attractions
        )
    ]

    # --------------------------------------------------
    # HERO DATA
    # --------------------------------------------------

    hero_data = [
        {
            "title": hero.title,
            "text": hero.description,
            "cta": hero.button_text,
            "url": hero.button_url or "#",
            "images": [
                image.image.url
                for image in hero.images.all()
                if image.image
            ],
        }
        for hero in hero_slides
    ]

    # --------------------------------------------------
    # HOMEPAGE CONTEXT
    # --------------------------------------------------

    context = {
        "featured_cities": featured_cities,
        "featured_events": featured_events,
        "featured_tours": featured_tours,
        "hero_slides": hero_slides,
        "hero_data": hero_data,
        "featured_attractions": featured_attractions,
        "things_filter_cities": things_filter_cities,
    }

    return render(request, "index.html", context)













def _kd_text(value):
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, dict):
        for key in ('description', 'text', 'summary', 'shortDescription', 'name', 'title'):
            if value.get(key):
                result = _kd_text(value[key])
                if result:
                    return result
    return ''


def _kd_items(value):
    """Read Viator's structured inclusion/exclusion descriptions without losing entries."""
    if isinstance(value, list):
        result = []
        for entry in value:
            text = _kd_text(entry)
            if text and text not in result:
                result.append(text)
        return result
    if isinstance(value, dict):
        for key in ('items', 'inclusions', 'exclusions', 'included', 'excluded'):
            if isinstance(value.get(key), list):
                return _kd_items(value[key])
    return []


def _kd_policy(product):
    policy = product.get('cancellationPolicy') or {}
    if not isinstance(policy, dict):
        return {'text': _kd_text(policy), 'free_hours': None}
    text = _kd_text(policy.get('description'))
    # Only use an explicit free-cancellation cutoff, never guess from policy type.
    free_hours = None
    for key in ('cancelIfBadWeather',):
        pass
    for item in policy.get('refundEligibility') or []:
        if not isinstance(item, dict):
            continue
        pct = item.get('percentageRefundable')
        hours = item.get('hoursBeforeStart')
        try:
            if float(pct) == 100 and float(hours) >= 0:
                hours = int(float(hours))
                if free_hours is None or hours < free_hours:
                    free_hours = hours
        except (TypeError, ValueError):
            continue
    return {'text': text, 'free_hours': free_hours}


def _kd_payment_flexibility(product):
    # Do not infer Reserve Now & Pay Later from Viator's website or general product availability.
    # An explicit product-specific boolean is required; otherwise omit the badge.
    for key in ('reserveNowPayLater', 'reserveNowPayLaterEligible'):
        if product.get(key) is True:
            return True
    return False


def _kd_photos(product):
    photos = []
    for entry in product.get('images') or []:
        if not isinstance(entry, dict):
            continue
        url = _viator_image({'images': [entry]})
        if url and url not in photos:
            photos.append(url)
    return photos


def _kd_duration(product):
    duration = product.get('duration') or {}
    if isinstance(duration, dict):
        fixed = duration.get('fixedDurationInMinutes')
        variable = duration.get('variableDurationFromMinutes')
        minutes = fixed or variable
        if minutes:
            try:
                minutes = int(minutes)
                return f'{minutes // 60}h {minutes % 60}m' if minutes >= 60 else f'{minutes} min'
            except (TypeError, ValueError):
                pass
    return ''


def _kd_itinerary(product):
    result = []
    itinerary = product.get('itinerary') or {}
    if not isinstance(itinerary, dict):
        return result
    for item in itinerary.get('itineraryItems') or []:
        if not isinstance(item, dict):
            continue
        point = item.get('pointOfInterestLocation') or {}
        poi = item.get('pointOfInterest') or {}
        # A stop name must come from a named location, not the first 60 chars of prose.
        candidates = [item.get('title'), poi.get('name') if isinstance(poi, dict) else None,
                      point.get('name') if isinstance(point, dict) else None,
                      item.get('pointOfInterestName'), item.get('locationName')]
        title = next((t for t in (_kd_text(v) for v in candidates) if t), '')
        description = _kd_text(item.get('description'))
        # Some responses supply the location as a free-text POI label.
        if not title:
            title = f'Stop {len(result) + 1}'
        duration = item.get('duration') or {}
        minutes = duration.get('fixedDurationInMinutes') if isinstance(duration, dict) else None
        admission = item.get('admissionIncluded')
        result.append({'title': title, 'description': description, 'minutes': minutes,
                       'admission': 'Admission included' if admission is True else 'Admission not included' if admission is False else ''})
    return result


def _kd_viator_context(product, country, product_code):
    photos = _kd_photos(product)
    title = _kd_text(product.get('title')) or 'Experience'

    inclusions = product.get('inclusions') or []
    exclusions = product.get('exclusions') or []
    pickup = product.get('pickup') or {}
    cancellation = product.get('cancellationPolicy') or {}

    # --------------------------------------------------
    # VIATOR REVIEWS
    # --------------------------------------------------

    reviews = product.get('reviews') or {}

    if not isinstance(reviews, dict):
        reviews = {}

    rating = reviews.get('combinedAverageRating')
    total_reviews = reviews.get('totalReviews')

    # Extract the actual 5-to-1-star rating distribution.
    rating_breakdown = {}

    review_totals = reviews.get('reviewCountTotals') or []

    if isinstance(review_totals, list):
        for item in review_totals:
            if not isinstance(item, dict):
                continue

            try:
                stars = int(item.get('rating'))
                count = int(item.get('count'))
            except (TypeError, ValueError):
                continue

            if 1 <= stars <= 5 and count >= 0:
                rating_breakdown[stars] = count

    # Only calculate percentages when distribution data exists.
    breakdown_total = sum(rating_breakdown.values())

    review_bars = []

    if breakdown_total > 0:
        for stars in range(5, 0, -1):
            count = rating_breakdown.get(stars, 0)

            review_bars.append({
                'stars': stars,
                'count': count,
                'percentage': round(
                    (count / breakdown_total) * 100,
                    2
                ),
            })

    # --------------------------------------------------
    # PICKUP INFORMATION
    # --------------------------------------------------

    if isinstance(pickup, dict):
        pickup_text = (
            _kd_text(pickup.get('description'))
            or _kd_text(pickup.get('pickupDetails'))
        )
    else:
        pickup_text = _kd_text(pickup)

    # --------------------------------------------------
    # CANCELLATION INFORMATION
    # --------------------------------------------------

    if isinstance(cancellation, dict):
        cancellation_text = _kd_text(
            cancellation.get('description')
        )
    else:
        cancellation_text = _kd_text(cancellation)

    policy = _kd_policy(product)

    # --------------------------------------------------
    # RETURN EXPERIENCE DATA
    # --------------------------------------------------

    return {
        'cancellation_free_hours': policy['free_hours'],
        'reserve_pay_later': _kd_payment_flexibility(product),

        'photos': photos,
        'duration': _kd_duration(product),

        'included': _kd_items(inclusions),
        'excluded': _kd_items(exclusions),

        'pickup': pickup_text,
        'cancellation': cancellation_text or policy['text'],

        'itinerary': _kd_itinerary(product),

        # Reviews
        'rating': rating,
        'review_count': total_reviews,
        'review_bars': review_bars,

        'additional_info': _kd_items(
            product.get('additionalInfo') or []
        ),

        'product_code': product_code,
        'country': country,
        'title': title,
    }



def _kd_related(country, product_code, city_slug):
    """Uses the existing bounded on-demand search cache, not database ingestion."""
    if not city_slug:
        return []
    destination_id = getattr(settings, 'VIATOR_CITY_IDS', {}).get(city_slug)
    if not destination_id:
        return []
    try:
        products = adventure_first(search_products(destination_id, count=50))
    except (ViatorError, ValueError):
        return []
    cards = []
    for product in products:
        code = str(product.get('productCode') or '')
        if not code or code == product_code:
            continue
        cards.append(SimpleNamespace(
            title=product.get('title') or 'Experience',
            detail_url=reverse('attraction-detail', kwargs={
                'country_slug': country.slug, 'attraction_slug': 'viator-' + code,
            }) + '?city=' + city_slug,
            hero_image_url=_viator_image(product),
            city_name=city_slug.replace('-', ' ').title(),
            category_name=_viator_category(product.get('title') or ''),
        ))
        if len(cards) == 8:
            break
    return cards












def attraction_detail(request, country_slug, attraction_slug):

    # Viator products
    if attraction_slug.lower().startswith("viator-"):
        product_code = attraction_slug[7:]

        if not product_code:
            raise Http404("Invalid Viator product code")

        return viator_attraction_detail(
            request,
            country_slug=country_slug,
            product_code=product_code,
        )

    # Original database attractions
    attraction = get_object_or_404(
        Attraction.objects
        .select_related("country", "city")
        .prefetch_related("gallery"),
        country__slug=country_slug,
        country__is_active=True,
        slug=attraction_slug,
        status="published",
    )

    related = (
        Attraction.objects
        .filter(
            status="published",
            country=attraction.country,
        )
        .exclude(pk=attraction.pk)
        .select_related("city", "country")
    )

    if attraction.city_id:
        related = related.filter(city_id=attraction.city_id)

    return render(request, "attraction-detail.html", {
        "attraction": attraction,
        "gallery": list(attraction.gallery.all()[:2]),
        "related_attractions": related.order_by(
            "display_order", "title"
        )[:8],
        "is_viator": False,
    })



def _viator_image(product):
    """Select a Viator-hosted image URL, without downloading/copying it."""
    images = product.get("images") or []
    if not isinstance(images, list):
        return ""
    for image in images:
        if not isinstance(image, dict):
            continue
        variants = image.get("variants") or []
        if isinstance(variants, list):
            options = sorted((v for v in variants if isinstance(v, dict)),
                             key=lambda v: (v.get("width") or 0), reverse=True)
            for variant in options:
                url = variant.get("url") or ""
                if isinstance(url, str) and url.startswith("https://"):
                    return url
        url = image.get("url") or ""
        if isinstance(url, str) and url.startswith("https://"):
            return url
    return ""



def _viator_price(product):
    pricing = product.get("pricing") or {}
    summary = pricing.get("summary") or {}
    value = summary.get("fromPrice") or pricing.get("fromPrice")
    try:
        return round(float(value), 2) if value is not None else None
    except (ValueError, TypeError):
        return None



def _viator_description(product):
    description = product.get("description") or ""
    if isinstance(description, dict):
        return (description.get("summary") or description.get("shortDescription")
                or description.get("description") or "")
    return description if isinstance(description, str) else ""



def _viator_category(title):
    title = title.lower()
    rules = (
        ("Water sports", ("snorkel", "scuba", "diving", "jet ski", "jetski", "kayak", "paddle", "parasail")),
        ("Adventure", ("rafting", "atv", "quad", "buggy", "zipline", "zip line", "safari", "canyon", "off-road", "off road")),
        ("Boat trips", ("boat", "cruise", "yacht", "sailing", "dolphin")),
        ("Nature", ("hiking", "trek", "mountain", "waterfall", "lake", "nature")),
        ("City tours", ("city", "walking", "sightseeing", "old town")),
        ("Food", ("food", "lunch", "dinner", "cooking", "tasting")),
    )
    for category, keywords in rules:
        if any(word in title for word in keywords):
            return category
    return "Experiences"



from urllib.parse import urlparse

def _viator_booking_url(product):
    product_code = str(product.get("productCode") or "").strip()

    if not product_code:
        return ""

    for key in ("productUrl", "bookingUrl", "webURL"):
        url = product.get(key)

        if not isinstance(url, str) or not url.startswith("https://"):
            continue

        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()

        if host not in ("viator.com", "www.viator.com") and not host.endswith(".viator.com"):
            continue

        # Accept only a URL that identifies this exact product.
        if product_code.lower() in parsed.path.lower():
            return url

    return ""


# def viator_things_to_do(request, city_slug):
#     city_slug = city_slug.lower()
#     destination_id = getattr(settings, "VIATOR_CITY_IDS", {}).get(city_slug)
#     if not destination_id:
#         raise Http404("Viator destination not configured for this city")
#     city = City.objects.filter(slug=city_slug, is_active=True,
#                                country__is_active=True).select_related("country").first()
#     country_slug = {"antalya": "turkey", "istanbul": "turkey",
#                     "almaty": "kazakhstan", "muscat": "oman"}.get(city_slug)
#     if city:
#         country_slug = city.country.slug
#     if not country_slug:
#         raise Http404("City country not configured")
#     error = None
#     cards = []
#     try:
#         products = adventure_first(search_products(destination_id, count=50))
#         for p in products:
#             code = str(p.get("productCode") or "").strip()
#             if not code:
#                 continue
#             title = str(p.get("title") or "Untitled experience")
#             cards.append({
#                 "code": code,
#                 "title": title,
#                 "description": _viator_description(p),
#                 "image": _viator_image(p),
#                 "price": _viator_price(p),
#                 "category": _viator_category(title),
#                 "city": city_slug.replace("-", " ").title(),
#                 "detail_url": reverse("attraction-detail", kwargs={
#                     "country_slug": country_slug,
#                     "attraction_slug": "viator-" + code,
#                 }),
#             })
#     except ViatorError:
#         error = "Experiences are temporarily unavailable. Please try again shortly."
#     return render(request, "viator-things-to-do.html", {
#         "city_name": city_slug.replace("-", " ").title(),
#         "products": cards,
#         "error": error,
#     })





def viator_things_to_do(request):
    import random

    configured = getattr(settings, "VIATOR_CITY_IDS", {})

    # All active cities from your database.
    cities = list(
        City.objects.filter(
            is_active=True,
            country__is_active=True
        )
        .select_related("country")
        .order_by("country__name", "name")
    )

    selected_city = request.GET.get("city", "").strip().lower()

    # Validate selected city against the database and configuration.
    selected = next(
        (
            city for city in cities
            if city.slug == selected_city
            and configured.get(city.slug)
        ),
        None
    )

    if not selected:
        selected_city = ""

    # Only cities with Viator destination IDs can supply experiences.
    available_cities = [
        city for city in cities
        if configured.get(city.slug)
    ]



    city_counts = {}

    for city in available_cities:
        try:
            city_products = adventure_first(
                search_products(configured[city.slug], count=50)
            )

            city_counts[city.slug] = len({
                str(p.get("productCode"))
                for p in city_products
                if p.get("productCode")
            })

        except (ViatorError, ValueError):
            city_counts[city.slug] = None

    total_experiences = (
        sum(count for count in city_counts.values() if count is not None)
        if all(count is not None for count in city_counts.values())
        else None
    )


    selected_city_count = (
        city_counts.get(selected_city)
        if selected_city
        else total_experiences
    )






    # Selected city: show up to 50.
    # All cities: sample up to 12 from each configured city.
    target_cities = [selected] if selected else available_cities

    cards = []
    errors = []
    seen_codes = set()

    for city in target_cities:
        destination_id = configured.get(city.slug)

        try:
            products = adventure_first(
                search_products(
                    destination_id,
                    count=50 if selected else 20
                )
            )
        except (ViatorError, ValueError):
            errors.append(city.name)
            continue

        if not selected:
            # Mix each city's results before taking a bounded sample.
            products = list(products)
            random.shuffle(products)
            products = products[:12]

        for p in products:
            code = str(p.get("productCode") or "").strip()

            if not code or code in seen_codes:
                continue

            seen_codes.add(code)

            title = str(p.get("title") or "Untitled experience")

            detail_url = reverse(
                "attraction-detail",
                kwargs={
                    "country_slug": city.country.slug,
                    "attraction_slug": "viator-" + code,
                }
            )

            cards.append({
                "code": code,
                "title": title,
                "description": _viator_description(p),
                "image": _viator_image(p),
                "price": _viator_price(p),
                "category": _viator_category(title),
                "city": city.name,
                "city_slug": city.slug,
                "country": city.country.name,
                "detail_url": (
                    detail_url + "?" + urlencode({"city": city.slug})
                ),
                
            })

    if not selected:
        random.shuffle(cards)

    error = None

    if errors and not cards:
        error = (
            "Experiences are temporarily unavailable. "
            "Please try again shortly."
        )




    print("SELECTED CITY:", selected_city or "ALL")
    print("TOTAL LOADED CARDS:", len(cards))
    print("CARDS BY CITY:", {
        city.slug: sum(card["city_slug"] == city.slug for card in cards)
        for city in target_cities
    })


    return render(request, "viator-things-to-do.html", {
        "city_name": selected.name if selected else "the world",
        "products": cards,
        "cities": cities,
        "selected_city": selected_city,
        "available_city_slugs": [
            city.slug for city in available_cities
        ],
        "error": error,
        "city_counts": city_counts,
        "total_experiences": total_experiences,
        "selected_city_count": selected_city_count,
    })









def viator_attraction_detail(request, country_slug, product_code):
    country = get_object_or_404(
        Country,
        slug=country_slug,
        is_active=True
    )

    try:
        p = get_product(product_code)

        print("PRODUCT CODE:", product_code)
        print("PRODUCT URL:", p.get("productUrl"))
        print("BOOKING URL:", p.get("bookingUrl"))
        print("WEB URL:", p.get("webURL"))

    except ViatorError:
        raise Http404("This experience is temporarily unavailable")

    details = _kd_viator_context(p, country, product_code)

    # Keep the rest of your existing function unchanged.









    # Get the starting price from the same search API
    # already used by the Things to Do page.
    starting_price = _viator_price(p)

    if starting_price is None:
        configured = getattr(settings, "VIATOR_CITY_IDS", {})

        city_slug = (request.GET.get("city") or "").lower().strip()
        destination_id = configured.get(city_slug)

        # Find the product's configured destination if no city was supplied.
        if not destination_id:
            product_destinations = {
                str(d.get("ref") or d.get("destinationId"))
                for d in p.get("destinations") or []
                if isinstance(d, dict)
            }

            for slug, dest_id in configured.items():
                if str(dest_id) in product_destinations:
                    destination_id = dest_id
                    break

        if destination_id:
            try:
                search_results = search_products(destination_id, count=50)

                for item in search_results:
                    if str(item.get("productCode")) == str(product_code):
                        starting_price = _viator_price(item)
                        break

            except ViatorError:
                pass











    photos = details['photos']
    title = details['title']
    booking_url = _viator_booking_url(p)

    city_slug = (request.GET.get('city') or '').lower().strip()
    configured = getattr(settings, 'VIATOR_CITY_IDS', {})
    if city_slug not in configured:
        city_slug = ''
    # For existing links without ?city=, infer only when product destinations
    # identify an unambiguous matching configured destination ID.
    if not city_slug:
        ids = set()
        for destination in p.get('destinations') or []:
            if isinstance(destination, dict):
                ids.add(str(destination.get('ref') or destination.get('destinationId') or ''))
        matches = [slug for slug, dest_id in configured.items() if str(dest_id) in ids]
        if len(matches) == 1:
            city_slug = matches[0]

    attraction = SimpleNamespace(
        title=title,
        subtitle='',
        description=_viator_description(p),
        country=country,
        city=None,
        hero_image_url=photos[0] if photos else '',
        hero_image=None,
        get_category_display=lambda: _viator_category(title),
        age_guidance='', ideal_for='', admission_info='',
        opening_hours='', latitude=None, longitude=None, address='',
        image_credit='', image_license_url='', image_source_url='',
        source_url='', booking_url=booking_url, provider_name='Viator',
        starting_price=starting_price,
    )
    gallery = [SimpleNamespace(image=SimpleNamespace(url=url), alt_text=title) for url in photos[1:3]]
    return render(request, 'attraction-detail.html', {
        'attraction': attraction,
        'gallery': gallery,
        'all_photos': photos,
        'viator_details': details,
        'related_attractions': _kd_related(country, product_code, city_slug),
        'related_city_name': city_slug.replace('-', ' ').title() if city_slug else '',
        'viator_experience': True,
        'viator_booking_missing': not booking_url,
    })













def partnership(request):
    return render(request, "partnership.html")


def contact(request):
    return render(request, "contact.html")
