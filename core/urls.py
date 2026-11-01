from django.urls import path
from . import views, payment_views
from .notification_views import notification_action


urlpatterns = [
    path('', views.index, name='index'),
    path('all-destinations', views.all_destinations, name='all-destinations'),
    path('travel-guide', views.travel_guide, name='travel-guide'),
    path('offers', views.offers, name='offers'),
    path('search-results', views.search_results, name='search-results'),
    path('tour-packages', views.tour_packages, name='tour-packages'),
    path('partnership', views.partnership, name='partnership'),
    path('contact', views.contact, name='contact'),

    path('events', views.events, name='events'),

    


    path('booking-group', views.booking_group, name='booking-group'),
    path("booking-group/create/",views.create_group_booking,name="create-group-booking",),
    path('booking/cancel/<str:reference>/', views.request_booking_cancellation, name='booking-cancellation'),
    



    path("destination-detail/<slug:country_slug>/",views.destination_detail,name="destination-detail"),
    path('city-guide/<slug:country_slug>/<slug:city_slug>/', views.city_guide, name='city_guide_detail'),
    path("tour-details/<int:tour_id>/<slug:tour_slug>/",views.tour_details_detail,name="tour_details_detail",),



    path("wishlist/toggle/<int:tour_id>/",views.toggle_wishlist,name="toggle-wishlist"),
    path("wishlist/remove/<int:tour_id>/",views.remove_wishlist,name="remove-wishlist"),


    path("booking/coupon/validate/",views.validate_booking_coupon,name="validate-booking-coupon"),
   
    path('tour-comments/<int:tour_id>/submit/', views.submit_tour_comment, name='submit-tour-comment'),






    path('attractions/<slug:country_slug>/<slug:attraction_slug>/', views.attraction_detail, name='attraction-detail'),
    path('things-to-do/',views.viator_things_to_do,name='viator-things-to-do'),




    # User Dahboard
    path('user-dashboard', views.user_dashboard, name='user-dashboard'),
    path('dashboard/notifications/<str:action>/', notification_action, name='notification-action'),
    path('dashboard/notifications/<str:action>/<int:pk>/', notification_action, name='notification-item-action'),



    # Thawani Payment Getaway
    path('payments/thawani/start/<str:reference>/', payment_views.thawani_start, name='thawani-booking-start'),
    path('payments/thawani/result/', payment_views.thawani_booking_result, name='thawani-booking-result'),
    path('booking/receipt/<str:reference>/', payment_views.booking_receipt, name='booking-receipt'),



    # Authentication
    path('login', views.login, name='login'),
    path('signup', views.signup, name='signup'),
    path('logout/', views.logout_user, name='logout'),
    path("dashboard/change-password/",views.change_password,name="change-password"),
    
]