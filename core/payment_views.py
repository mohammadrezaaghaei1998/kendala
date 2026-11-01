from decimal import Decimal, ROUND_CEILING, InvalidOperation
from io import BytesIO
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.db import transaction
from django.http import JsonResponse, HttpResponse, HttpResponseForbidden
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_POST
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from xml.sax.saxutils import escape
from .models import Booking, BookingCoupon
from django.views.decorators.cache import never_cache


def _owned(request, reference):
    return reference in request.session.get('kd_booking_refs', [])


def _omr_amount(booking):
    """Converts USD into OMR baisa. No silent fallback rate."""
    try:
        usd_per_omr = Decimal(str(getattr(settings, 'KD_USD_PER_OMR', '0')))
        fee_percent = Decimal(str(getattr(settings, 'KD_PAYMENT_BUFFER_PERCENT', '0')))
    except (InvalidOperation, ValueError):
        raise ValueError('Invalid payment conversion settings')
    if usd_per_omr <= 0 or not 0 <= fee_percent < 100:
        raise ValueError('Configure a valid USD/OMR rate and payment fee buffer before checkout')
    # Gross up for the percentage of fees you expect to bear.
    omr = booking.total_amount / usd_per_omr / (Decimal('1') - fee_percent / Decimal('100'))
    baisa = int((omr * Decimal('1000')).to_integral_value(rounding=ROUND_CEILING))
    if baisa <= 0:
        raise ValueError('Payment amount must be positive')
    return baisa


def _headers():
    return {'thawani-api-key': settings.THAWANI_SECRET_KEY, 'Content-Type': 'application/json'}


@require_POST
def thawani_start(request, reference):
    if not _owned(request, reference):
        return JsonResponse({'error': 'Booking not available in this browser session.'}, status=403)
    booking = get_object_or_404(Booking, reference=reference)
    if booking.status != 'PENDING_PAYMENT':
        return JsonResponse({'error': 'This booking is not awaiting payment.'}, status=409)
    if not settings.THAWANI_BASE_URL.startswith('https://'):
        return JsonResponse({'error': 'Thawani HTTPS URL required.'}, status=500)
    try:
        amount = _omr_amount(booking)
    except ValueError as exc:
        return JsonResponse({'error': str(exc)}, status=503)

    # If a session already exists, reuse the same locked amount and checkout URL.
    if booking.thawani_session_id:
        if booking.payment_amount_minor != amount or booking.payment_currency != 'OMR':
            return JsonResponse({'error': 'Payment quote changed. Please contact support.'}, status=409)
        session_id = booking.thawani_session_id
    else:
        result_url = request.build_absolute_uri(reverse('thawani-booking-result'))
        result_url += '?' + urlencode({'ref': booking.reference})
        payload = {
            'client_reference_id': booking.reference,
            'mode': 'payment',
            'products': [{'name': booking.tour_title[:40], 'quantity': 1, 'unit_amount': amount}],
            'success_url': result_url,
            'cancel_url': result_url,
        }
        try:
            response = requests.post(
                settings.THAWANI_BASE_URL.rstrip('/') + '/api/v1/checkout/session',
                headers=_headers(), json=payload, timeout=20,
            )
            response.raise_for_status()
            body = response.json()
            session_id = (body.get('data') or {}).get('session_id') if body.get('success') else None


        except requests.HTTPError:
            print("THAWANI HTTP STATUS:", response.status_code)
            print("THAWANI RESPONSE:", response.text[:2000])

            return JsonResponse({
                "error": "Thawani rejected the checkout request. Check Django terminal."
            }, status=502)

        except requests.RequestException as exc:
            print("THAWANI CONNECTION ERROR:", repr(exc))

            return JsonResponse({
                "error": "Unable to connect to Thawani. Check Django terminal."
            }, status=502)

        except ValueError as exc:
            print("THAWANI RESPONSE ERROR:", repr(exc))

            return JsonResponse({
                "error": "Invalid response from Thawani."
            }, status=502)



        if not session_id:
            return JsonResponse({'error': 'Thawani did not create a checkout session.'}, status=502)
        with transaction.atomic():
            locked = Booking.objects.select_for_update().get(pk=booking.pk)
            if locked.status != 'PENDING_PAYMENT':
                return JsonResponse({'error': 'Booking status changed.'}, status=409)
            if locked.thawani_session_id:
                session_id = locked.thawani_session_id
            else:
                locked.thawani_session_id = session_id
                locked.payment_amount_minor = amount
                locked.payment_currency = 'OMR'
                locked.save(update_fields=['thawani_session_id', 'payment_amount_minor', 'payment_currency'])

    checkout_url = (
        settings.THAWANI_BASE_URL.rstrip('/') + '/pay/' + session_id
        + '?key=' + settings.THAWANI_PUBLIC_KEY
    )
    return JsonResponse({
        'success': True, 'checkout_url': checkout_url,
        'amount_omr': f'{Decimal(amount) / Decimal(1000):.3f}',
        'amount_usd': str(booking.total_amount),
    })


@never_cache
def thawani_booking_result(request):
    reference = request.GET.get('ref', '')
    if not _owned(request, reference):
        return HttpResponseForbidden('This booking is not available in this browser session.')
    booking = get_object_or_404(Booking, reference=reference)
    verified = booking.status == 'PAID'
    error = None
    if not verified and booking.thawani_session_id:
        try:
            response = requests.get(
                settings.THAWANI_BASE_URL.rstrip('/') + '/api/v1/checkout/session/' + booking.thawani_session_id,
                headers=_headers(), timeout=20,
            )
            response.raise_for_status()
            result = response.json()
            data = result.get('data') or {}
            verified = (
                result.get('success') is True
                and data.get('session_id') == booking.thawani_session_id
                and data.get('payment_status') == 'paid'
                and data.get('currency') == 'OMR'
                and data.get('total_amount') == booking.payment_amount_minor
                and booking.payment_currency == 'OMR'
                and booking.payment_amount_minor is not None
            )
            # Check client reference when the gateway includes it in its response.
            if data.get('client_reference_id') is not None:
                verified = verified and data['client_reference_id'] == booking.reference
            if verified:
                with transaction.atomic():
                    locked = Booking.objects.select_for_update().get(pk=booking.pk)
                    if locked.status == 'PENDING_PAYMENT':
                        locked.status = 'PAID'
                        locked.paid_at = timezone.now()
                        locked.payment_reference = str(data.get('payment_id') or data.get('invoice_id') or locked.thawani_session_id)
                        locked.save(update_fields=['status', 'paid_at', 'payment_reference'])





                        tour = locked.tour

                        if tour.coupon_enabled and tour.coupon_percentage > 0:
                            BookingCoupon.objects.get_or_create(
                                booking=locked,
                                defaults={
                                    "discount_percentage": tour.coupon_percentage
                                }
                            )



                        applied = BookingCoupon.objects.select_for_update().filter(
                            redeemed_booking=locked, is_used=False).first()
                        if applied:
                            applied.is_used = True
                            applied.used_at = timezone.now()
                            applied.save(update_fields=['is_used', 'used_at'])
            else:
                error = 'Payment is not yet verified. If you paid, please refresh this page shortly.'
        except (requests.RequestException, ValueError):
            error = 'Unable to verify the payment right now. Please refresh shortly.'
    booking.refresh_from_db()
    coupon = BookingCoupon.objects.filter(booking=booking).first() if booking.status == 'PAID' else None
    return render(request, 'booking_payment_result.html', {
        'booking': booking, 'coupon': coupon, 'error': error,
        'receipt_url': reverse('booking-receipt', args=[booking.reference]),
    })














def booking_receipt(request, reference):
    if not _owned(request, reference):
        return HttpResponseForbidden(
            'Receipt not available in this browser session.'
        )

    booking = get_object_or_404(
        Booking.objects.prefetch_related('travelers'),
        reference=reference,
        status='PAID'
    )

    from django.contrib.staticfiles import finders
    from reportlab.lib.utils import ImageReader
    from reportlab.platypus import Image
    from reportlab.lib import colors
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_CENTER
    from reportlab.platypus import KeepTogether

    purple = colors.HexColor('#850078')
    ink = colors.HexColor('#25212B')
    muted = colors.HexColor('#77717D')
    line = colors.HexColor('#E9E2EB')
    pale = colors.HexColor('#F9F3F9')

    buf = BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=(595.28, 841.89),
        leftMargin=48,
        rightMargin=48,
        topMargin=45,
        bottomMargin=65
    )

    normal = ParagraphStyle(
        'kd-normal',
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        textColor=ink
    )

    small = ParagraphStyle(
        'kd-small',
        parent=normal,
        fontSize=8.5,
        leading=13,
        textColor=muted
    )

    label = ParagraphStyle(
        'kd-label',
        parent=small,
        fontSize=8,
        leading=12,
        textColor=muted
    )

    value = ParagraphStyle(
        'kd-value',
        parent=normal,
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=15
    )

    heading = ParagraphStyle(
        'kd-heading',
        parent=normal,
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=19
    )

    big = ParagraphStyle(
        'kd-big',
        parent=normal,
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=purple
    )

    coupon_code_style = ParagraphStyle(
        'kd-coupon-code',
        parent=value,
        fontSize=16,
        leading=22,
        textColor=purple,
        alignment=TA_CENTER
    )

    coupon_description_style = ParagraphStyle(
        'kd-coupon-description',
        parent=normal,
        fontSize=9,
        leading=15,
        alignment=TA_CENTER
    )

    story = []

    # =========================================
    # LOGO
    # =========================================

    logo_path = finders.find('images/logopng.png')

    if logo_path:
        try:
            iw, ih = ImageReader(logo_path).getSize()
            logo_width = 128

            logo = Image(
                logo_path,
                width=logo_width,
                height=logo_width * ih / iw
            )

            logo.hAlign = 'LEFT'
            story.append(logo)

        except Exception:
            story.append(Paragraph('KEN DALA', big))
    else:
        story.append(Paragraph('KEN DALA', big))

    # =========================================
    # RECEIPT HEADING
    # =========================================

    story.extend([
        Spacer(1, 24),
        Paragraph('PAYMENT RECEIPT', big),
        Spacer(1, 8),
        Paragraph(
            'Official record of a verified payment',
            small
        ),
        Spacer(1, 23)
    ])

    def cell(caption, text):
        return [
            Paragraph(
                escape(str(caption)).upper(),
                label
            ),
            Spacer(1, 4),
            Paragraph(
                escape(str(text)),
                value
            )
        ]

    # =========================================
    # BOOKING INFORMATION
    # =========================================

    paid_date = (
        booking.paid_at.strftime('%d %B %Y, %H:%M UTC')
        if booking.paid_at else '—'
    )

    booking_date = (
        timezone.localtime(booking.created_at).strftime('%d %B %Y')
        if booking.created_at else '—'
    )

    departure_date = (
        booking.departure_date.strftime('%d %B %Y')
        if booking.departure_date else 'Not recorded'
    )

    summary = Table([
        [
            cell('Booking reference', booking.reference),
            cell('Payment status', 'PAID')
        ],
        [
            cell('Booking date', booking_date),
            cell('Departure date', departure_date)
        ],
        [
            cell('Payment date', paid_date),
            cell('Travelers', booking.traveler_count)
        ],
    ], colWidths=[249, 249], rowHeights=[66, 66, 66])

    summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), pale),
        ('BOX', (0, 0), (-1, -1), 0.6, line),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, line),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
    ]))

    story.extend([
        summary,
        Spacer(1, 26),
        Paragraph('Experience details', heading),
        Spacer(1, 12),
        Paragraph(escape(booking.tour_title), normal),
        Spacer(1, 22),
        Paragraph('Payment summary', heading),
        Spacer(1, 10)
    ])

    # =========================================
    # PAYMENT SUMMARY
    # =========================================

    paid_omr = (
        Decimal(booking.payment_amount_minor or 0)
        / Decimal('1000')
    )

    subtotal = booking.unit_price * booking.traveler_count
    final_total = booking.total_amount
    discount = subtotal - final_total

    # Coupon used to discount THIS booking.
    applied_coupon = BookingCoupon.objects.filter(
        redeemed_booking=booking,
        is_used=True
    ).first()

    money_rows = [
        [
            Paragraph('Original tour price', normal),
            Paragraph(f'USD {subtotal:,.2f}', value)
        ]
    ]

    if applied_coupon and discount > 0:
        money_rows.append([
            Paragraph(
                escape(
                    f'Coupon ({applied_coupon.code}) '
                    f'- {applied_coupon.discount_percentage}%'
                ),
                normal
            ),
            Paragraph(
                f'- USD {discount:,.2f}',
                value
            )
        ])

    money_rows.append([
        Paragraph('Final tour price', normal),
        Paragraph(f'USD {final_total:,.2f}', value)
    ])

    money_rows.append([
        Paragraph('Charged via Thawani', normal),
        Paragraph(f'OMR {paid_omr:,.3f}', value)
    ])

    money = Table(
        money_rows,
        colWidths=[320, 178]
    )

    money.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 0.8, line),
        ('LINEBELOW', (0, -1), (-1, -1), 0.8, purple),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    story.append(money)

    # =========================================
    # NEW REWARD COUPON
    # =========================================

    # This is the NEW coupon earned from
    # successfully paying for THIS booking.
    #
    # It is different from applied_coupon above.

    reward_coupon = BookingCoupon.objects.filter(
        booking=booking
    ).first()

    if reward_coupon:

        reward_heading = Paragraph(
            'YOUR NEXT TRAVEL REWARD',
            heading
        )

        reward_code = Paragraph(
            escape(reward_coupon.code),
            coupon_code_style
        )

        reward_description = Paragraph(
            f'Enjoy {reward_coupon.discount_percentage}% off '
            'your next eligible booking with Ken Dala.',
            coupon_description_style
        )

        reward_status = Paragraph(
            'Already redeemed'
            if reward_coupon.is_used
            else 'Single-use reward coupon',
            coupon_description_style
        )

        reward_box = Table(
            [
                [reward_code],
                [reward_description],
                [reward_status]
            ],
            colWidths=[470]
        )

        reward_box.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), pale),
            ('BOX', (0, 0), (-1, -1), 0.8, purple),
            ('TOPPADDING', (0, 0), (0, 0), 18),
            ('BOTTOMPADDING', (0, 0), (0, 0), 10),
            ('TOPPADDING', (0, 1), (0, 1), 5),
            ('BOTTOMPADDING', (0, 1), (0, 1), 6),
            ('BOTTOMPADDING', (0, 2), (0, 2), 18),
            ('LEFTPADDING', (0, 0), (-1, -1), 20),
            ('RIGHTPADDING', (0, 0), (-1, -1), 20),
        ]))

        story.append(
            KeepTogether([
                Spacer(1, 25),
                reward_heading,
                Spacer(1, 12),
                reward_box
            ])
        )

    # =========================================
    # TRAVELER INFORMATION
    # =========================================

    story.extend([
        Spacer(1, 25),
        Paragraph('Traveler information', heading),
        Spacer(1, 12)
    ])

    for i, traveler in enumerate(
        booking.travelers.all(),
        start=1
    ):
        story.append(
            Paragraph(
                escape(
                    f'{i:02d}  '
                    f'{traveler.first_name} '
                    f'{traveler.last_name}'
                ),
                normal
            )
        )

        story.append(Spacer(1, 7))

    # =========================================
    # TRANSACTION REFERENCE
    # =========================================

    story.extend([
        Spacer(1, 22),
        Paragraph('Transaction reference', label),
        Spacer(1, 5),
        Paragraph(
            escape(
                booking.payment_reference
                or booking.thawani_session_id
                or '—'
            ),
            small
        ),
        Spacer(1, 24),
        Paragraph(
            'This receipt confirms payment only. '
            'Tour availability and final arrangements '
            'are confirmed separately.',
            small
        )
    ])

    # =========================================
    # FOOTER
    # =========================================

    def footer(canvas, pdf_doc):
        canvas.saveState()

        canvas.setStrokeColor(line)
        canvas.line(48, 55, 547, 55)

        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(muted)

        canvas.drawString(
            48,
            39,
            'KEN DALA  |  PAYMENT RECEIPT'
        )

        canvas.drawRightString(
            547,
            39,
            f'Page {pdf_doc.page}'
        )

        canvas.restoreState()

    # =========================================
    # GENERATE PDF
    # =========================================

    doc.build(
        story,
        onFirstPage=footer,
        onLaterPages=footer
    )

    result = HttpResponse(
        buf.getvalue(),
        content_type='application/pdf'
    )

    result['Content-Disposition'] = (
        f'attachment; filename="Ken-Dala-{booking.reference}-receipt.pdf"'
    )

    result['Cache-Control'] = 'private, no-store'

    return result
