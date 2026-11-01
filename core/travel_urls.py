from django.urls import path
from . import travel_views

urlpatterns = [
    path('visa-regulations/', travel_views.visa_regulations, name='visa_regulations'),
    path('visa-map/', travel_views.visa_map, name='visa_map'),
    path('passport-rankings/', travel_views.passport_rankings, name='passport_rankings'),
    path('visa-history/', travel_views.visa_history, name='visa_history'),
]
