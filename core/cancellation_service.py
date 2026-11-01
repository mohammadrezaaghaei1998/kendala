from decimal import Decimal, ROUND_HALF_UP
from django.utils import timezone

# Proposed default; apply only where accepted and consistent with the operator contract.
POLICY_VERSION = 'KEN-DALA-STANDARD-2026-01'
POLICY_TEXT = '''60 or more days: 0% fee; 30–59 days: 20% fee; 14–29 days: 30% fee; 7–13 days: 50% fee; 0–6 days: 100% fee. Subject to the policy agreed for your booking and applicable law.'''

def fee_percentage(days):
    if days >= 60: return 0
    if days >= 30: return 20
    if days >= 14: return 30
    if days >= 7: return 50
    return 100

def cancellation_quote(booking, paid_amount=None):
    if booking.departure_date is None:
        raise ValueError('Departure date is missing. Contact support.')
    days = (booking.departure_date - timezone.localdate()).days
    if days < 0:
        raise ValueError('Departure has already passed.')
    if booking.status != 'PAID':
        raise ValueError('Only paid bookings use this refund quotation; contact support for other statuses.')
    # IMPORTANT: total_amount is booking value, not necessarily amount captured.
    # The caller must provide the VERIFIED amount actually received in booking currency.
    if paid_amount is None:
        raise ValueError('Verified paid amount is required.')
    amount = Decimal(str(paid_amount))
    if amount < 0 or amount > booking.total_amount:
        raise ValueError('Invalid paid amount.')
    pct = fee_percentage(days)
    fee = (amount * Decimal(pct) / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return {'days': days, 'percentage': pct, 'paid': amount, 'fee': fee,
            'refund': amount-fee, 'policy_version': POLICY_VERSION, 'policy_text': POLICY_TEXT}
