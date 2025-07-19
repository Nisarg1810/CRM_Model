from django.urls import path
from . import views

urlpatterns = [
    path('admin/', views.admin_dashboard, name='admin-dashboard'),
    path('admin/developers/', views.admin_developers, name='admin-developers'),
    path('admin/tasks/', views.admin_tasks, name='admin-tasks'),
    path('admin/activity/', views.admin_activity, name='admin-activity'),
    path('admin/chat/<str:developer_username>/', views.admin_chat, name='admin_chat'),
    path('developer/', views.developer_dashboard, name='developer-dashboard'),
    path('developer/tasks/', views.developer_tasks, name='developer-tasks'),
    path('developer/profile/', views.developer_profile, name='developer-profile'),
    path('developer/calendar/', views.developer_calendar, name='developer-calendar'),
    path('developer/chat/', views.developer_chat, name='developer-chat'),
    path('profile/', views.profile, name='profile'),
    # Task/Developer CRUD
    path('add_developer/', views.add_developer, name='add_developer'),
    path('edit_developer/<int:dev_id>/', views.edit_developer, name='edit_developer'),
    path('delete_developer/<int:dev_id>/', views.delete_developer, name='delete_developer'),
    path('assign_task/', views.assign_task, name='assign_task'),
    path('edit_task/<int:task_id>/', views.edit_task, name='edit_task'),
    path('delete_task/<int:task_id>/', views.delete_task, name='delete_task'),
    path('complete_task/<int:task_id>/', views.complete_task, name='complete_task'),
    path('approve_task/<int:task_id>/', views.approve_task, name='approve_task'),
    path('feedback/<int:task_id>/', views.submit_feedback, name='submit_feedback'),
    path('task/<int:task_id>/calendar.ics', views.task_ics, name='task_ics'),
    path('chat/unread_count', views.chat_unread_count, name='chat_unread_count'),
    path('', views.index, name='dashboard-index'),
] 