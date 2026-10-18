from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('all-destinations', views.all_destinations, name='all-destinations'),
    path('booking', views.booking, name='booking'),
    path('destinations', views.destinations, name='destinations'),
    path('tour-details', views.tour_details, name='tour-details'),
    path('user-dashboard', views.user_dashboard, name='user-dashboard'),



    # Authentication
    path('login', views.login, name='login'),
    path('signup', views.signup, name='signup'),
    
]