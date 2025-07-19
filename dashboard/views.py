from django.shortcuts import render
from django.http import HttpResponse
from tasks.models import Task
from users.models import User
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
import datetime
from django.db.models import Q
from django.contrib import messages
from .models import Message
from django.http import JsonResponse
from notifications.models import Notification

# Create your views here.

def index(request):
    return render(request, 'dashboard_index.html')

def home(request):
    return redirect('login')

@login_required
def admin_dashboard(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    tasks = Task.objects.all()
    developers = User.objects.filter(role='developer')
    total_tasks = tasks.count()
    pending = tasks.filter(status='assigned').count()
    in_progress = tasks.filter(status='completed').count()
    completed = tasks.filter(status='approved').count()
    overdue = tasks.filter(~Q(status='approved'), deadline__lt=datetime.date.today()).count()
    context = {
        'tasks': tasks,
        'developers': developers,
        'total_tasks': total_tasks,
        'pending': pending,
        'in_progress': in_progress,
        'completed': completed,
        'overdue': overdue,
    }
    return render(request, 'admin_dashboard.html', context)

@login_required
def admin_developers(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    developers = User.objects.filter(role='developer')
    return render(request, 'admin_developers.html', {'developers': developers})

@login_required
def admin_tasks(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    tasks = Task.objects.all()
    developers = User.objects.filter(role='developer')
    # Example stats, replace with real logic as needed
    context = {
        'tasks': tasks,
        'developers': developers,
        'total_tasks': tasks.count(),
        'pending': tasks.filter(status='assigned').count(),
        'in_progress': tasks.filter(status='completed').count(),
        'completed': tasks.filter(status='approved').count(),
        'overdue': tasks.filter(~Q(status='approved'), deadline__lt=datetime.date.today()).count(),
        'today': datetime.date.today(),
    }
    return render(request, 'admin_tasks.html', context)

@login_required
def admin_activity(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    from django.db.models import Count
    import datetime
    from django.utils.timezone import is_aware, make_naive
    most_active_dev = User.objects.filter(role='developer').annotate(num_tasks=Count('tasks')).order_by('-num_tasks').first()
    most_tasks_completed = User.objects.filter(role='developer').annotate(
        num_completed=Count('tasks', filter=Q(tasks__status='approved'))
    ).order_by('-num_completed').first()
    most_messages_sent = User.objects.filter(role='developer').annotate(
        num_msgs=Count('sent_messages')
    ).order_by('-num_msgs').first()
    activity = []
    recent_tasks = Task.objects.select_related('assigned_to').order_by('-assign_date')[:10]
    for t in recent_tasks:
        activity.append({
            'type': 'Task',
            'user': t.assigned_to.username,
            'action': f"assigned task '{t.name}'",
            'title': t.description[:30],
            'date': t.assign_date,
        })
    recent_completions = Task.objects.filter(status='completed').select_related('assigned_to').order_by('-deadline')[:10]
    for t in recent_completions:
        activity.append({
            'type': 'Task',
            'user': t.assigned_to.username,
            'action': f"completed task '{t.name}'",
            'title': t.description[:30],
            'date': t.deadline,
        })
    recent_approvals = Task.objects.filter(status='approved').select_related('assigned_to').order_by('-deadline')[:10]
    for t in recent_approvals:
        activity.append({
            'type': 'Task',
            'user': t.assigned_to.username,
            'action': f"approved task '{t.name}'",
            'title': t.description[:30],
            'date': t.deadline,
        })
    recent_feedback = Task.objects.exclude(feedback='').select_related('assigned_to').order_by('-deadline')[:10]
    for t in recent_feedback:
        activity.append({
            'type': 'Feedback',
            'user': t.assigned_to.username,
            'action': f"submitted feedback for '{t.name}'",
            'title': t.feedback[:30],
            'date': t.deadline,
        })
    recent_msgs = Message.objects.select_related('sender').order_by('-timestamp')[:10]
    for m in recent_msgs:
        activity.append({
            'type': 'Chat',
            'user': m.sender.username,
            'action': 'sent a message',
            'title': m.content[:30],
            'date': m.timestamp,
        })
    # Convert all dates to offset-naive datetime for sorting
    for entry in activity:
        d = entry['date']
        if isinstance(d, datetime.date) and not isinstance(d, datetime.datetime):
            d = datetime.datetime.combine(d, datetime.time.min)
        if is_aware(d):
            d = make_naive(d)
        entry['date'] = d
    activity = sorted(activity, key=lambda x: x['date'], reverse=True)[:20]
    return render(request, 'admin_activity.html', {
        'activity': activity,
        'most_active_dev': most_active_dev,
        'most_tasks_completed': most_tasks_completed,
        'most_messages_sent': most_messages_sent,
    })

@login_required
def developer_dashboard(request):
    if not request.user.is_authenticated or request.user.role != 'developer':
        return redirect('login')
    tasks = Task.objects.filter(assigned_to=request.user)
    assigned_tasks_count = tasks.filter(status='assigned').count()
    approved_tasks_count = tasks.filter(status='approved').count()
    today = datetime.date.today()
    upcoming = []
    overdue = []
    for t in tasks:
        if t.status != 'approved':
            try:
                deadline = t.deadline
                days_left = (deadline - today).days
                if 0 <= days_left <= 1:
                    upcoming.append(t)
                elif days_left < 0:
                    overdue.append(t)
            except Exception:
                pass
    context = {
        'tasks': tasks,
        'upcoming_tasks': upcoming,
        'overdue_tasks': overdue,
        'today': today,
        'assigned_tasks_count': assigned_tasks_count,
        'approved_tasks_count': approved_tasks_count,
    }
    return render(request, 'developer_dashboard.html', context)

@login_required
def developer_tasks(request):
    if not request.user.is_authenticated or request.user.role != 'developer':
        return redirect('login')
    tasks = Task.objects.filter(assigned_to=request.user)
    today = datetime.date.today()
    return render(request, 'developer_tasks.html', {'tasks': tasks, 'today': today, 'user': request.user})

@login_required
def developer_profile(request):
    user = request.user
    if request.method == 'POST':
        # Update profile picture
        if 'profile_pic' in request.FILES:
            user.profile_pic = request.FILES['profile_pic']
        # Update password
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        if new_password and new_password == confirm_password:
            user.set_password(new_password)
        user.save()
        from django.contrib import messages
        messages.success(request, 'Profile updated successfully.')
        if new_password and new_password == confirm_password:
            from django.contrib.auth import update_session_auth_hash
            update_session_auth_hash(request, user)
        return redirect('developer-profile')
    total_tasks = Task.objects.filter(assigned_to=user).count()
    completed_tasks = Task.objects.filter(assigned_to=user, status='approved').count()
    recent_tasks = Task.objects.filter(assigned_to=user).order_by('-deadline')[:5]
    return render(request, 'developer_profile.html', {
        'user': user,
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'recent_tasks': recent_tasks,
    })

@login_required
def developer_calendar(request):
    if not request.user.is_authenticated or request.user.role != 'developer':
        return redirect('login')
    username = request.user.username if request.user.is_authenticated else ''
    user = request.user if request.user.is_authenticated else None
    # Get tasks assigned to this developer, sorted by deadline
    tasks = Task.objects.filter(assigned_to=request.user).order_by('deadline')
    return render(request, 'developer_calendar.html', {'username': username, 'user': user, 'tasks': tasks})

@login_required
def profile(request):
    user = request.user
    if request.method == 'POST':
        # Update mobile (if admin)
        if user.role == 'admin':
            user.mobile = request.POST.get('mobile', user.mobile)
        # Update profile picture
        if 'profile_pic' in request.FILES:
            user.profile_pic = request.FILES['profile_pic']
        # Update password
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        if new_password and new_password == confirm_password:
            user.set_password(new_password)
        user.save()
        from django.contrib import messages
        messages.success(request, 'Profile updated successfully.')
        # Re-authenticate if password changed
        if new_password and new_password == confirm_password:
            from django.contrib.auth import update_session_auth_hash
            update_session_auth_hash(request, user)
        return redirect('profile')
    return render(request, 'profile.html', {'user': user})

@login_required
def add_developer(request):
    if request.method == 'POST' and request.user.role == 'admin':
        username = request.POST['username']
        password = request.POST['password']
        mobile = request.POST['mobile']
        role = request.POST['role']
        capacity = request.POST['capacity']
        specialization = request.POST.get('specialization', '') if role == 'developer' else ''
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Developer username already exists')
            return redirect('admin-developers')
        user = User.objects.create_user(username=username, password=password, role=role, mobile=mobile, specialization=specialization)
        user.capacity = capacity
        user.save()
        messages.success(request, 'Developer added successfully')
    return redirect('admin-developers')

@login_required
def edit_developer(request, dev_id):
    if request.method == 'POST' and request.user.role == 'admin':
        try:
            user = User.objects.get(id=dev_id)
            user.username = request.POST['username']
            user.set_password(request.POST['password'])
            user.mobile = request.POST['mobile']
            user.role = request.POST['role']
            user.capacity = request.POST['capacity']
            user.specialization = request.POST.get('specialization', '') if user.role == 'developer' else ''
            user.save()
            messages.success(request, 'Developer updated successfully')
        except User.DoesNotExist:
            messages.error(request, 'Developer not found')
    return redirect('admin-developers')

@login_required
def delete_developer(request, dev_id):
    if request.method == 'POST' and request.user.role == 'admin':
        User.objects.filter(id=dev_id).delete()
        messages.success(request, 'Developer deleted successfully')
    return redirect('admin-dashboard')

@login_required
def assign_task(request):
    if request.method == 'POST' and request.user.role == 'admin':
        title = request.POST['title']
        description = request.POST['description']
        assigned_to_username = request.POST['assigned_to']
        assign_date = request.POST['assign_date']
        deadline = request.POST['deadline']
        price = request.POST['price']
        timeline = request.POST.get('timeline', '')
        admin_name = request.user.username
        # Handle file upload for single attachment
        attachment = request.FILES.get('attachments')
        assigned_to = User.objects.get(username=assigned_to_username)
        task = Task.objects.create(
            name=title,
            description=description,
            assigned_to=assigned_to,
            assign_date=assign_date,
            deadline=deadline,
            status='assigned',
            price=price,
            timeline=timeline,
            attachment=attachment,  # Save the uploaded file
        )
        Notification.objects.create(
            user=assigned_to,
            message=f"You have been assigned a new task: {title}"
        )
        messages.success(request, 'Task assigned successfully')
    return redirect('admin-dashboard')

@login_required
def edit_task(request, task_id):
    if request.method == 'POST' and request.user.role == 'admin':
        try:
            task = Task.objects.get(id=task_id)
            task.name = request.POST['title']
            task.description = request.POST['description']
            assigned_to_username = request.POST['assigned_to']
            task.assigned_to = User.objects.get(username=assigned_to_username)
            task.assign_date = request.POST['assign_date']
            task.deadline = request.POST['deadline']
            task.price = request.POST['price']
            # Handle attachments if needed
            task.save()
            messages.success(request, 'Task updated successfully')
        except Task.DoesNotExist:
            messages.error(request, 'Task not found')
    return redirect('admin-tasks')

@login_required
def delete_task(request, task_id):
    if request.method == 'POST' and request.user.role == 'admin':
        Task.objects.filter(id=task_id).delete()
        messages.success(request, 'Task deleted successfully')
    return redirect('admin-tasks')

@login_required
def complete_task(request, task_id):
    if request.method == 'POST' and request.user.role == 'developer':
        try:
            task = Task.objects.get(id=task_id, assigned_to=request.user)
            task.status = 'completed'
            # Save uploaded attachment if present
            attachment = request.FILES.get('attachments')
            if attachment:
                task.attachment = attachment
            task.save()
            # Notify admin
            admin_user = User.objects.filter(role='admin').first()
            if admin_user:
                Notification.objects.create(
                    user=admin_user,
                    message=f"{request.user.username} marked task '{task.name}' as completed."
                )
            messages.success(request, 'Task marked as completed')
        except Task.DoesNotExist:
            messages.error(request, 'Task not found')
    return redirect('developer-tasks')

@login_required
def approve_task(request, task_id):
    if request.method == 'POST' and request.user.role == 'admin':
        try:
            task = Task.objects.get(id=task_id)
            task.status = 'approved'
            task.save()
            # Notify developer
            Notification.objects.create(
                user=task.assigned_to,
                message=f"Your task '{task.name}' has been approved."
            )
            messages.success(request, 'Task approved')
        except Task.DoesNotExist:
            messages.error(request, 'Task not found')
    # Redirect back to the previous page, or fallback to admin-tasks
    return redirect(request.META.get('HTTP_REFERER', '/dashboard/admin/tasks/'))

@login_required
def submit_feedback(request, task_id):
    if request.method == 'POST':
        try:
            task = Task.objects.get(id=task_id)
            rating = request.POST['rating']
            feedback = request.POST['feedback']
            # If you have a Feedback model, use it; else, store on task
            task.feedback = feedback
            task.rating = rating
            task.save()
            # Notify admin
            admin_user = User.objects.filter(role='admin').first()
            if admin_user:
                Notification.objects.create(
                    user=admin_user,
                    message=f"Feedback submitted for task '{task.name}' by {request.user.username}."
                )
            messages.success(request, 'Feedback submitted')
        except Task.DoesNotExist:
            messages.error(request, 'Task not found')
    return redirect('admin-tasks')

@login_required
def admin_chat(request, developer_username):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    developers = User.objects.filter(role='developer')
    developer = User.objects.get(username=developer_username)
    messages_list = Message.objects.filter(
        (Q(sender=request.user, receiver=developer) | Q(sender=developer, receiver=request.user))
    ).order_by('timestamp')
    if request.method == 'POST':
        content = request.POST['content']
        Message.objects.create(sender=request.user, receiver=developer, content=content)
        Notification.objects.create(
            user=developer,
            message=f"New chat message from {request.user.username}: {content[:40]}"
        )
        return redirect('admin_chat', developer_username=developer_username)
    return render(request, 'admin_chat.html', {
        'developers': developers,
        'messages': messages_list,
        'developer_username': developer_username,
    })

@login_required
def developer_chat(request):
    if not request.user.is_authenticated or request.user.role != 'developer':
        return redirect('login')
    admin_user = User.objects.filter(role='admin').first()
    messages_list = Message.objects.filter(
        (Q(sender=request.user, receiver=admin_user) | Q(sender=admin_user, receiver=request.user))
    ).order_by('timestamp')
    if request.method == 'POST':
        content = request.POST['content']
        Message.objects.create(sender=request.user, receiver=admin_user, content=content)
        if admin_user:
            Notification.objects.create(
                user=admin_user,
                message=f"New chat message from {request.user.username}: {content[:40]}"
            )
        return redirect('developer-chat')
    return render(request, 'developer_chat.html', {
        'messages': messages_list,
    })

@login_required
def task_ics(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return HttpResponse('Task not found', status=404)
    dtstart = task.assign_date or task.deadline
    dtend = task.deadline
    summary = task.name
    description = task.description
    ics = f"""BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Your CRM//EN\nBEGIN:VEVENT\nUID:{task.id}\nDTSTAMP:{dtstart.strftime('%Y%m%d')}T090000Z\nDTSTART;VALUE=DATE:{dtstart.strftime('%Y%m%d')}\nDTEND;VALUE=DATE:{dtend.strftime('%Y%m%d')}\nSUMMARY:{summary}\nDESCRIPTION:{description}\nEND:VEVENT\nEND:VCALENDAR\n"""
    response = HttpResponse(ics, content_type='text/calendar')
    response['Content-Disposition'] = f'attachment; filename={summary}.ics'
    return response

@login_required
def chat_unread_count(request):
    user = request.user
    if not user.is_authenticated:
        return JsonResponse({'unread_count': 0})
    if user.role == 'admin':
        developers = User.objects.filter(role='developer')
        if request.GET.get('all') == '1':
            unread_counts = {}
            for dev in developers:
                count = Message.objects.filter(sender=dev, receiver=user, read_by_admin=False).count()
                unread_counts[dev.username] = count
            return JsonResponse({'unread_counts': unread_counts})
        total_unread = sum(Message.objects.filter(sender=dev, receiver=user, read_by_admin=False).count() for dev in developers)
        return JsonResponse({'unread_count': total_unread})
    else:
        admin_user = User.objects.filter(role='admin').first()
        unread = Message.objects.filter(sender=admin_user, receiver=user, read_by_dev=False).count()
        return JsonResponse({'unread_count': unread})
