from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='notifications-index'),
    path('mark_read/', views.mark_read, name='notifications_mark_read'),
    path('user/', views.user_notifications, name='notifications_user'),
] 