from django.shortcuts import render





def index(request):
    return render(request, "index.html")




def all_destinations(request):
    return render(request, "all-destinations.html")




def booking(request):
    return render(request, "booking.html")


def destinations(request):
    return render(request, "destinations.html")


def login(request):
    return render(request, "login.html")



def signup(request):
    return render(request, "signup.html")


def tour_details(request):
    return render(request, "tour-details.html")


def user_dashboard(request):
    return render(request, "user-dashboard.html")
