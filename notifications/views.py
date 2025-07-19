from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import Notification
from django.views.decorators.http import require_GET

# Create your views here.

def index(request):
    return HttpResponse('Notifications app index')

@login_required
def mark_read(request):
    if request.method == 'POST':
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)

@require_GET
@login_required
def user_notifications(request):
    notifications = Notification.objects.filter(user=request.user).order_by('-timestamp')
    data = [
        {
            'message': n.message,
            'is_read': n.is_read,
            'timestamp': n.timestamp.isoformat()
        }
        for n in notifications
    ]
    return JsonResponse(data, safe=False)
