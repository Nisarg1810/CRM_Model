from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.http import HttpResponse

# Create your views here.

def index(request):
    return HttpResponse('Users app index')

def user_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            if user.role == 'admin':
                return redirect('admin-dashboard')
            else:
                return redirect('developer-dashboard')
        else:
            messages.error(request, 'Invalid username or password')
    return render(request, 'login.html')

def user_logout(request):
    logout(request)
    return redirect('login')
