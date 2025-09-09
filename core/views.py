from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_http_methods
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib import messages
from django.db.models import Q, Count, Sum
from django.db import models
from django.utils import timezone
from django.http import JsonResponse, HttpResponse
import datetime
import json
import re
import io
import os
import zipfile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.units import inch
from PIL import Image as PILImage
from .models import User, Message, Task, Notification, Land, Advocate, District, Taluka, Village, Client, AssignedTask, TaskManage, SataPrakar, LandSale, Installment
from django.views.decorators.http import require_GET

# --- User Authentication/Profile Views ---
def user_login(request):
    # Clear any existing messages to prevent old system messages from appearing
    # This is crucial to prevent ADDland validation errors from showing on login page
    storage = messages.get_messages(request)
    storage.used = True
    
    # Also clear any persistent messages that might have been stored
    if hasattr(request, 'session'):
        if 'messages' in request.session:
            del request.session['messages']
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            # Check if employee is active (only for employee role)
            if user.role == 'employee' and user.status != 'active':
                messages.error(request, 'Your account is inactive. Please contact administrator.')
                return render(request, 'login.html', {'next': request.GET.get('next', '')})
            
            login(request, user)
            # Debug: Print user role
            print(f"User authenticated: {user.username}, Role: {user.role}, Status: {user.status}")
            
            # Check if there's a next parameter for redirect (from GET or POST)
            next_url = request.GET.get('next') or request.POST.get('next')
            if next_url and next_url.startswith('/'):
                # Redirect to the intended page
                return redirect(next_url)
            
            # Default redirect based on user role and employee type
            if user.role == 'admin':
                print("Redirecting to admin dashboard")
                return redirect('admin-dashboard')
            elif user.role == 'employee' and user.employee_type == 'marketing':
                print("Redirecting to marketing employee dashboard")
                return redirect('marketing-dashboard')
            else:
                print("Redirecting to employee dashboard")
                return redirect('employee-dashboard')
        else:
            messages.error(request, 'Invalid username or password')
    
    # Store the next parameter in the context for the login form
    context = {
        'next': request.GET.get('next', '')
    }
    return render(request, 'login.html', context)

def user_logout(request):
    # Clear all messages before logout to prevent them from appearing on login page
    storage = messages.get_messages(request)
    storage.used = True  # Mark all messages as used/read
    
    # Also clear any persistent messages in session
    if hasattr(request, 'session'):
        if 'messages' in request.session:
            del request.session['messages']
    
    logout(request)
    return redirect('login')

def index(request):
    """
    Root path handler - redirects to login if not authenticated,
    or to appropriate dashboard if authenticated
    """
    if request.user.is_authenticated:
        # User is already logged in, redirect to appropriate dashboard
        if request.user.role == 'admin':
            return redirect('admin-dashboard')
        else:
            return redirect('employee-dashboard')
    else:
        # User is not logged in, redirect to login page
        return redirect('login')

def home(request):
    """
    Home path handler - same logic as index
    """
    return index(request)

# --- Admin Views ---
@login_required
def admin_dashboard(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    
    # Get tasks using the new Task model
    tasks = Task.objects.all()
    # Sort employees by status (active first, then inactive) and then by id
    developers = User.objects.filter(role='employee').extra(
        select={'status_order': "CASE WHEN status = 'active' THEN 0 ELSE 1 END"}
    ).order_by('status_order', 'id')
    active_developers = developers.filter(status='active')
    lands = Land.objects.all()
    
    # Calculate employee type statistics (including all types)
    marketing_devs = developers.filter(employee_type='marketing').count()
    backoffice_devs = developers.filter(employee_type='backoffice').count()
    legal_devs = developers.filter(employee_type='legal_team').count()
    other_devs = developers.filter(employee_type='other').count()
    
    # Calculate task statistics using the new model
    total_tasks = tasks.count()
    default_tasks = tasks.filter(is_default=True).count()
    non_default_tasks = tasks.filter(is_default=False).count()
    
    # Calculate task status statistics from AssignedTask
    from .models import AssignedTask
    from django.utils import timezone
    from datetime import timedelta
    
    # Get all assigned tasks
    assigned_tasks = AssignedTask.objects.all().select_related('task', 'land', 'employee')
    
    # Calculate different task statuses
    pending_approval_tasks = assigned_tasks.filter(status='pending_approval').count()
    overdue_tasks = assigned_tasks.filter(
        due_date__lt=timezone.now(),
        status__in=['pending', 'in_progress']
    ).count()
    pending_tasks = assigned_tasks.filter(status='pending').count()
    in_progress_tasks = assigned_tasks.filter(status='in_progress').count()
    
    # Get detailed information for each category
    pending_approval_details = assigned_tasks.filter(status='pending_approval')[:5]  # Top 5 for display
    overdue_details = assigned_tasks.filter(
        due_date__lt=timezone.now(),
        status__in=['pending', 'in_progress']
    )[:5]
    pending_details = assigned_tasks.filter(status='pending')[:5]
    in_progress_details = assigned_tasks.filter(status='in_progress')[:5]
    
    # Filter out marketing employees for the Add Task modal
    non_marketing_employees = developers.exclude(employee_type='marketing')
    
    context = {
        'tasks': tasks,
        'developers': developers,
        'employees': non_marketing_employees,  # Exclude marketing employees for Add Task modal
        'active_developers': active_developers,
        'lands': lands,
        'marketing_devs': marketing_devs,
        'backoffice_devs': backoffice_devs,
        'legal_devs': legal_devs,
        'other_devs': other_devs,
        'total_tasks': total_tasks,
        'default_tasks': default_tasks,
        'non_default_tasks': non_default_tasks,
        # Task status statistics
        'pending_approval_tasks': pending_approval_tasks,
        'overdue_tasks': overdue_tasks,
        'pending_tasks': pending_tasks,
        'in_progress_tasks': in_progress_tasks,
        # Detailed information for each category
        'pending_approval_details': pending_approval_details,
        'overdue_details': overdue_details,
        'pending_details': pending_details,
        'in_progress_details': in_progress_details,
    }
    return render(request, 'admin_dashboard.html', context)

@login_required
def admin_employees(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    
    # Sort employees by status (active first, then inactive) and then by id
    developers = User.objects.filter(role='employee').extra(
        select={'status_order': "CASE WHEN status = 'active' THEN 0 ELSE 1 END"}
    ).order_by('status_order', 'id')
    active_developers = developers.filter(status='active')
    
    # Calculate employee type statistics (including all types)
    marketing_devs = developers.filter(employee_type='marketing').count()
    backoffice_devs = developers.filter(employee_type='backoffice').count()
    legal_devs = developers.filter(employee_type='legal_team').count()
    other_devs = developers.filter(employee_type='other').count()
    
    context = {
        'developers': developers,
        'active_developers': active_developers,
        'marketing_devs': marketing_devs,
        'backoffice_devs': backoffice_devs,
        'legal_devs': legal_devs,
        'other_devs': other_devs,
    }
    return render(request, 'admin_employees.html', context)

@login_required
def admin_assigned_tasks(request):
    """Admin view for managing all assigned tasks"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    
    return render(request, 'admin_assigned_task.html')

@login_required
def admin_land(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    
    # Get only lands that are not in inventory, in_process, or sold (workflow: active/archived only)
    # These are lands that are still being processed or haven't been sent to inventory yet
    lands = Land.objects.exclude(status__in=['inventory', 'in_process', 'sold'])
    
    # Get all employees for task assignment (excluding marketing type)
    developers = User.objects.filter(role='employee').exclude(employee_type='marketing').order_by('id')
    employees = User.objects.filter(role='employee', status='active').exclude(employee_type='marketing').order_by('full_name', 'username')
    
    # Get all tasks for task selection (ensure no duplicates) excluding marketing tasks
    from .models import Task
    all_tasks = Task.objects.filter(marketing_task=False).order_by('position', 'name').distinct()
    
    # Add assigned employee information to each task
    for task in all_tasks:
        task.assigned_employees_display = task.get_assigned_employees_display()
        task.assigned_employees_count = task.get_assigned_employees_count()
        
        # Ensure completion days is available
        if not hasattr(task, 'completion_days') or task.completion_days is None:
            task.completion_days = 0
    
    # Get all sata prakar for dropdowns
    from .models import SataPrakar
    sata_prakar_list = SataPrakar.objects.all().order_by('name')
    
    # Calculate statistics
    total_lands = lands.count()
    
    # Check for error query parameter from edit land validation
    error_message = request.GET.get('error', '')
    
    context = {
        'total_lands': total_lands,
        'lands': lands,
        'developers': developers,
        'employees': employees,
        'all_tasks': all_tasks,
        'sata_prakar_list': sata_prakar_list,
        'error_message': error_message,  # Pass error message to template
    }
    return render(request, 'admin_land.html', context)

@login_required
def land_tasks(request, land_id):
    print(f"Land tasks view called for land_id: {land_id}")
    print(f"User: {request.user.username}, Role: {request.user.role}, Authenticated: {request.user.is_authenticated}")
    
    # Allow admin and marketing employees to access land tasks
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        print("User not authenticated or not authorized, redirecting to login")
        return redirect('login')
    
    # Get the specific land
    land = get_object_or_404(Land, id=land_id)
    print(f"Land found: {land.name}")
    
    # Get assigned tasks for this land to show current status
    from .models import AssignedTask
    assigned_tasks = AssignedTask.objects.filter(land=land).select_related('task', 'employee')
    
    # Count tasks by status
    pending_approval_count = assigned_tasks.filter(status='pending_approval').count()
    in_progress_count = assigned_tasks.filter(status='in_progress').count()
    completed_count = assigned_tasks.filter(status='complete').count()
    pending_count = assigned_tasks.filter(status='pending').count()
    
    context = {
        'land': land,
        'assigned_tasks': assigned_tasks,
        'pending_approval_count': pending_approval_count,
        'in_progress_count': in_progress_count,
        'completed_count': completed_count,
        'pending_count': pending_count,
    }
    return render(request, 'land_tasks.html', context)

@login_required
def add_land(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    
    # Fetch all tasks from the database (both default and non-default) excluding marketing tasks
    from .models import Task, SataPrakar
    all_tasks = Task.objects.filter(marketing_task=False).order_by('position', 'name')
    sata_prakar_list = SataPrakar.objects.all().order_by('name')
    
    # Fetch employees for the add task modal (excluding marketing type)
    employees = User.objects.filter(role='employee', status='active').exclude(employee_type='marketing').order_by('full_name', 'username')
    
    # Add assigned employee information to each task
    for task in all_tasks:
        task.assigned_employees_display = task.get_assigned_employees_display()
        task.assigned_employees_count = task.get_assigned_employees_count()
        # Get assigned employees with their details
        task.assigned_employees_details = []
        for task_manage in task.task_manages.all():
            task.assigned_employees_details.append({
                'employee_name': task_manage.employee.get_display_name(),
                'employee_id': task_manage.employee.id
            })
    
    if request.method == 'POST':
        # Get all form data from the comprehensive form
        name = request.POST.get('name', '')
        state = request.POST.get('state', '')
        district = request.POST.get('district', '')
        taluka = request.POST.get('taluka', '')
        village = request.POST.get('village', '')
        old_sr_no = request.POST.get('old_sr_no', '')
        new_sr_no = request.POST.get('new_sr_no', '')
        sata_prakar = request.POST.get('sata_prakar', '')
        built_up_area = request.POST.get('built_up_area', '')
        unutilized_area = request.POST.get('unutilized_area', '')
        total_area = request.POST.get('total_area', '')
        past_date = request.POST.get('past_date', '')
        soda_tarikh = request.POST.get('soda_tarikh', '')
        banakhat_tarikh = request.POST.get('banakhat_tarikh', '')
        dastavej_tarikh = request.POST.get('dastavej_tarikh', '')
        broker_name = request.POST.get('broker_name', '')
        location = request.POST.get('location', '')
        remark = request.POST.get('remark', '')
        selected_tasks = request.POST.get('selected_tasks', '')
        task_completion_days = request.POST.get('task_completion_days', '{}')
        
        # Validate required fields based on the photo format
        required_fields = [
            'name', 'state', 'district', 'taluka', 'village', 
            'old_sr_no', 'new_sr_no', 'sata_prakar', 'built_up_area', 
            'unutilized_area', 'total_area', 'soda_tarikh', 
            'banakhat_tarikh', 'dastavej_tarikh', 'broker_name'
        ]
        
        # Check for missing fields and create field-level errors
        field_errors = {}
        missing_fields = []
        
        for field in required_fields:
            field_value = request.POST.get(field, '').strip()
            if not field_value:
                missing_fields.append(field)
                field_errors[field] = f'{field.replace("_", " ").title()} is required'
        
        # Validate area fields are numeric
        if built_up_area or unutilized_area:
            try:
                if built_up_area:
                    float(built_up_area)
                if unutilized_area:
                    float(unutilized_area)
            except ValueError:
                if built_up_area:
                    field_errors['built_up_area'] = 'Please enter a valid number for built-up area'
                if unutilized_area:
                    field_errors['unutilized_area'] = 'Please enter a valid number for unutilized area'
        
        if missing_fields:
            # Don't use messages.error() for form validation - it persists across pages
            # Instead, pass validation errors in context
            validation_error = f'Please fill in all required fields: {", ".join(missing_fields)}'
            
            # Pass form data back to template so user doesn't lose their input
            context = {
                'all_tasks': all_tasks,
                'sata_prakar_list': sata_prakar_list,
                'employees': employees,
                'validation_error': validation_error,  # Pass error in context instead of messages
                'form_data': {
                    'name': name,
                    'state': state,
                    'district': district,
                    'taluka': taluka,
                    'village_name': village_name,
                    'old_sr_no': old_sr_no,
                    'new_sr_no': new_sr_no,
                    'sata_prakar': sata_prakar,
                    'built_up_area': built_up_area,
                    'unutilized_area': unutilized_area,
                    'total_area': total_area,
                    'past_date': past_date,
                    'soda_tarikh': soda_tarikh,
                    'banakhat_tarikh': banakhat_tarikh,
                    'dastavej_tarikh': dastavej_tarikh,
                    'broker_name': broker_name,
                    'location': location,
                    'remark': remark,
                    'selected_tasks': selected_tasks,
                    'task_completion_days': task_completion_days,
                },
                'field_errors': field_errors,
                'selected_tasks_list': selected_tasks.split(',') if selected_tasks else [],
            }
            return render(request, 'add_land.html', context)
        
        # Handle empty tasks - allow no tasks to be selected
        if not selected_tasks or selected_tasks.strip() == '':
            selected_tasks = ''
        
        # Get task employee selections
        task_employee_selections = request.POST.get('task_employee_selections', '{}')
        try:
            task_employee_selections = json.loads(task_employee_selections)
        except json.JSONDecodeError:
            task_employee_selections = {}
        
        try:
            # Convert decimal fields
            built_up_area_decimal = float(built_up_area) if built_up_area else 0
            unutilized_area_decimal = float(unutilized_area) if unutilized_area else 0
            total_area_decimal = float(total_area) if total_area else 0
            
            # Create new land record
            land = Land.objects.create(
                name=name,
                state=state,
                district_id=district,
                taluka_id=taluka,
                village_id=village,
                old_sr_no=old_sr_no,
                new_sr_no=new_sr_no,
                sata_prakar=sata_prakar,
                built_up_area=built_up_area_decimal,
                unutilized_area=unutilized_area_decimal,    
                total_area=total_area_decimal,
                past_date=past_date if past_date else None,
                soda_tarikh=soda_tarikh,
                banakhat_tarikh=banakhat_tarikh,
                dastavej_tarikh=dastavej_tarikh,
                broker_name=broker_name,
                location=location,
                remark=remark,
                selected_tasks=selected_tasks
            )
            
            # Debug: Log created land object
            print(f"Land created successfully:")
            print(f"  Land ID: {land.id}")
            
            # Automatically assign selected tasks to employees
            assignment_success, assignment_message = auto_assign_tasks_for_land(land, selected_tasks, task_employee_selections, task_completion_days)
            
            # Create notification for all admins about new land
            admin_users = User.objects.filter(role='admin')
            for admin_user in admin_users:
                Notification.objects.create(
                    user=admin_user,
                    message=f"New land '{name}' has been added to the system"
                )
            
            if assignment_success:
                messages.success(request, f'Land "{name}" added successfully! {assignment_message}')
            else:
                messages.warning(request, f'Land "{name}" added successfully, but there was an issue with task assignment: {assignment_message}')
            
            return redirect('admin-land')
        except Exception as e:
            messages.error(request, f'Error adding land: {str(e)}')
            
            # Pass form data back to template so user doesn't lose their input
            context = {
                'all_tasks': all_tasks,
                'sata_prakar_list': sata_prakar_list,
                'employees': employees,
                'form_data': {
                    'name': name,
                    'state': state,
                    'district': district,
                    'taluka': taluka,
                    'village_name': village_name,
                    'old_sr_no': old_sr_no,
                    'new_sr_no': new_sr_no,
                    'sata_prakar': sata_prakar,
                    'built_up_area': built_up_area,
                    'unutilized_area': unutilized_area,
                    'total_area': total_area,
                    'past_date': past_date,
                    'soda_tarikh': soda_tarikh,
                    'banakhat_tarikh': banakhat_tarikh,
                    'dastavej_tarikh': dastavej_tarikh,
                    'broker_name': broker_name,
                    'location': location,
                    'remark': remark,
                    'selected_tasks': selected_tasks,
                    'task_completion_days': task_completion_days,
                },
                'field_errors': field_errors,
                'selected_tasks_list': selected_tasks.split(',') if selected_tasks else [],
            }
            return render(request, 'add_land.html', context)
    
    # GET request - show the form
    context = {
        'all_tasks': all_tasks,
        'sata_prakar_list': sata_prakar_list,
        'employees': employees,
    }
    return render(request, 'add_land.html', context)

@login_required
def edit_land(request, land_id):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    
    try:
        land = Land.objects.get(id=land_id)
    except Land.DoesNotExist:
        messages.error(request, 'Land not found')
        return redirect('admin-land')
    
    if request.method == 'POST':
        # Get all form data from the comprehensive form
        name = request.POST.get('name', '')
        state = request.POST.get('state', '')
        district = request.POST.get('district', '')
        taluka = request.POST.get('taluka', '')
        village = request.POST.get('village', '')
        old_sr_no = request.POST.get('old_sr_no', '')
        new_sr_no = request.POST.get('new_sr_no', '')
        sata_prakar = request.POST.get('sata_prakar', '')
        built_up_area = request.POST.get('built_up_area', '')
        unutilized_area = request.POST.get('unutilized_area', '')
        total_area = request.POST.get('total_area', '')
        past_date = request.POST.get('past_date', '')
        soda_tarikh = request.POST.get('soda_tarikh', '')
        banakhat_tarikh = request.POST.get('banakhat_tarikh', '')
        dastavej_tarikh = request.POST.get('dastavej_tarikh', '')
        broker_name = request.POST.get('broker_name', '')
        selected_tasks = request.POST.get('selected_tasks', '')
        task_completion_days = request.POST.get('task_completion_days', '{}')

        
        # Validate required fields
        required_fields = [
            'name', 'state', 'district', 'taluka', 'village', 
            'old_sr_no', 'new_sr_no', 'sata_prakar', 'built_up_area', 
            'unutilized_area', 'total_area', 'soda_tarikh', 
            'banakhat_tarikh', 'dastavej_tarikh', 'broker_name'
        ]
        missing_fields = [field for field in required_fields if not request.POST.get(field)]
        
        if missing_fields:
            # Don't use messages.error() for form validation - it persists across pages
            # Instead, redirect with a query parameter for error display
            error_message = f'Please fill in all required fields: {", ".join(missing_fields)}'
            return redirect(f'{reverse("admin-land")}?error={error_message}')
        
        # Handle empty tasks - allow no tasks to be selected
        if not selected_tasks or selected_tasks.strip() == '':
            selected_tasks = ''
        
        # Get task employee selections
        task_employee_selections = request.POST.get('task_employee_selections', '{}')
        try:
            task_employee_selections = json.loads(task_employee_selections)
        except json.JSONDecodeError:
            task_employee_selections = {}
        
        # Get new tasks to be created
        new_tasks = request.POST.get('new_tasks', '[]')
        try:
            new_tasks = json.loads(new_tasks)
        except json.JSONDecodeError:
            new_tasks = []
        
        print(f"New tasks to be created: {new_tasks}")
        
        try:
            # Convert decimal fields
            built_up_area_decimal = float(built_up_area) if built_up_area else 0
            unutilized_area_decimal = float(unutilized_area) if unutilized_area else 0
            total_area_decimal = float(total_area) if total_area else 0
            
            # Store old selected tasks for comparison
            old_selected_tasks = land.selected_tasks
            
            # Update land record
            land.name = name
            land.state = state
            land.district_id = district
            land.taluka_id = taluka
            land.village_id = village
            land.old_sr_no = old_sr_no
            land.new_sr_no = new_sr_no
            land.sata_prakar = sata_prakar
            land.built_up_area = built_up_area_decimal
            land.unutilized_area = unutilized_area_decimal
            land.total_area = total_area_decimal
            land.past_date = past_date if past_date else None
            land.soda_tarikh = soda_tarikh
            land.banakhat_tarikh = banakhat_tarikh
            land.dastavej_tarikh = dastavej_tarikh
            land.broker_name = broker_name
            land.selected_tasks = selected_tasks
            

            
            land.save()
            
            # Create new tasks if any
            if new_tasks:
                print(f"Creating {len(new_tasks)} new tasks")
                from .models import Task
                
                for new_task_data in new_tasks:
                    task_name = new_task_data.get('task_name', '')
                    position = new_task_data.get('position', '1')
                    is_default = new_task_data.get('is_default', False)
                    completion_days = new_task_data.get('completion_days', 0)
                    
                    # Check if task already exists
                    task, created = Task.objects.get_or_create(
                        name=task_name,
                        defaults={
                            'position': position,
                            'is_default': is_default,
                            'completion_days': completion_days
                        }
                    )
                    
                    if created:
                        print(f"  [SUCCESS] Created new task: {task_name}")
                    else:
                        print(f"  [WARNING] Task already exists: {task_name}")
                
                # Update selected_tasks to include new tasks
                if selected_tasks:
                    selected_tasks += ',' + ','.join([task['task_name'] for task in new_tasks])
                else:
                    selected_tasks = ','.join([task['task_name'] for task in new_tasks])
                
                # Update the land with new selected tasks
                land.selected_tasks = selected_tasks
                land.save()
                print(f"Updated land selected_tasks: {selected_tasks}")
            
            # Update AssignedTask records if tasks have changed OR if there are employee selections OR if completion days changed
            if old_selected_tasks != selected_tasks or task_employee_selections or task_completion_days != '{}' or new_tasks:
                print(f"Tasks, employee assignments, or completion days changed for land {land.id}")
                print(f"Tasks: '{old_selected_tasks}' -> '{selected_tasks}'")
                print(f"Employee selections: {task_employee_selections}")
                print(f"Completion days: {task_completion_days}")
                result, message = update_assigned_tasks_for_land(land, selected_tasks, task_employee_selections, task_completion_days)
                print(f"Update result: {result}, Message: {message}")
            else:
                print(f"No changes for land {land.id}")
            
            # Create notification for all admins about land update
            admin_users = User.objects.filter(role='admin')
            for admin_user in admin_users:
                Notification.objects.create(
                    user=admin_user,
                    message=f"Land '{name}' has been updated in the system"
                )
            
            messages.success(request, f'Land "{name}" updated successfully')
            return redirect('admin-land')
        except Exception as e:
            messages.error(request, f'Error updating land: {str(e)}')
            return redirect('admin-land')
    
    # GET request - redirect to admin land page
    return redirect('admin-land')

@login_required
def delete_land(request, land_id):
    if request.method == 'POST' and request.user.role == 'admin':
        try:
            # Get the land object and delete it
            land = Land.objects.get(id=land_id)
            land_name = land.name
            
            # Create notification for all admins about land deletion
            admin_users = User.objects.filter(role='admin')
            for admin_user in admin_users:
                Notification.objects.create(
                    user=admin_user,
                    message=f"Land '{land_name}' has been deleted from the system"
                )
            
            land.delete()
            messages.success(request, f'Land "{land_name}" deleted successfully')
        except Land.DoesNotExist:
            messages.error(request, 'Land not found')
        except Exception as e:
            messages.error(request, f'Error deleting land: {str(e)}')
    else:
        messages.error(request, 'Invalid request method or insufficient permissions')
    
    return redirect('admin-land')

@login_required
def bulk_delete_lands(request):
    if request.method == 'POST' and request.user.role == 'admin':
        land_ids = request.POST.getlist('land_ids')
        deleted_count = 0
        
        deleted_land_names = []
        for land_id in land_ids:
            try:
                # Get the land object and delete it
                land = Land.objects.get(id=land_id)
                deleted_land_names.append(land.name)
                land.delete()
                deleted_count += 1
            except Land.DoesNotExist:
                messages.error(request, f'Land with ID {land_id} not found')
                continue
            except Exception as e:
                messages.error(request, f'Error deleting land {land_id}: {str(e)}')
                continue
        
        # Create notification for all admins about bulk land deletion
        if deleted_land_names:
            admin_users = User.objects.filter(role='admin')
            for admin_user in admin_users:
                Notification.objects.create(
                    user=admin_user,
                    message=f"Bulk deletion: {len(deleted_land_names)} land(s) have been deleted from the system"
                )
        
        if deleted_count > 0:
            messages.success(request, f'{deleted_count} land(s) deleted successfully')
        else:
            messages.warning(request, 'No lands were deleted')
    else:
        messages.error(request, 'Invalid request method or insufficient permissions')
    
    return redirect('admin-land')

    # --- Employee Views ---
@login_required
def employee_dashboard(request):
    if not request.user.is_authenticated or request.user.role != 'employee':
        return redirect('login')
    
    # Check if employee is active
    if request.user.status != 'active':
        messages.error(request, 'Your account is inactive. Please contact administrator.')
        logout(request)
        return redirect('login')
    
    # Get only land-based assigned tasks for this employee from core_assignedtask
    from .models import AssignedTask
    from datetime import datetime, timedelta
    
    assigned_land_tasks = AssignedTask.objects.filter(
        employee=request.user
    ).select_related('land', 'task').order_by('-assigned_date')
    
    # Calculate statistics
    total_assigned_tasks = assigned_land_tasks.count()
    pending_tasks = assigned_land_tasks.filter(status='pending').count()
    in_progress_tasks = assigned_land_tasks.filter(status='in_progress').count()
    completed_tasks = assigned_land_tasks.filter(status='complete').count()
    
    # Calculate overdue tasks count using due_date field (same logic as admin dashboard)
    overdue_tasks_count = assigned_land_tasks.filter(
        due_date__lt=timezone.now(),
        status__in=['pending', 'in_progress']
    ).count()
    
    # Calculate overdue and upcoming tasks using due_date field like admin dashboard
    
    # Get detailed task information for each category (like admin dashboard)
    today = timezone.now().date()
    
    # Get pending tasks details
    pending_details = assigned_land_tasks.filter(status='pending')
    
    # Get overdue tasks details
    overdue_details = assigned_land_tasks.filter(
        due_date__lt=timezone.now(),
        status__in=['pending', 'in_progress']
    )
    
    # Calculate days overdue for each overdue task
    for task in overdue_details:
        if task.due_date:
            task.days_overdue = (timezone.now().date() - task.due_date.date()).days
        else:
            task.days_overdue = 0
    
    # Get in progress tasks details
    in_progress_details = assigned_land_tasks.filter(status='in_progress')
    
    # Get upcoming tasks details (due within next 3 days and not completed)
    upcoming_details = assigned_land_tasks.filter(
        due_date__gte=timezone.now(),
        due_date__lte=timezone.now() + timedelta(days=3),
        status__in=['pending', 'in_progress']
    )
    
    # Calculate days until due for each upcoming task
    for task in upcoming_details:
        if task.due_date:
            task.days_until_due = (task.due_date.date() - timezone.now().date()).days
        else:
            task.days_until_due = 0
    
    # Convert to list format for template (keeping backward compatibility)
    overdue_tasks = []
    upcoming_tasks = []
    
    for assigned_task in overdue_details:
                overdue_tasks.append({
                    'title': assigned_task.task.name,
            'deadline': assigned_task.due_date.strftime('%b %d, %Y') if assigned_task.due_date else 'No due date',
            'days_overdue': (today - assigned_task.due_date.date()).days if assigned_task.due_date else 0,
                    'land_name': assigned_task.land.name if assigned_task.land else 'Unknown'
                })
    
    for assigned_task in upcoming_details:
                upcoming_tasks.append({
                    'title': assigned_task.task.name,
            'deadline': assigned_task.due_date.strftime('%b %d, %Y') if assigned_task.due_date else 'No due date',
            'days_until_due': (assigned_task.due_date.date() - today).days if assigned_task.due_date else 0,
                    'land_name': assigned_task.land.name if assigned_task.land else 'Unknown'
                })
    
    # Get recent land assignments
    recent_land_assignments = assigned_land_tasks
    
    context = {
        'assigned_land_tasks': assigned_land_tasks,
        'total_assigned_tasks': total_assigned_tasks,
        'pending_tasks': pending_tasks,
        'in_progress_tasks': in_progress_tasks,
        'completed_tasks': completed_tasks,
        'overdue_tasks_count': overdue_tasks_count,
        'recent_land_assignments': recent_land_assignments,
        'overdue_tasks': overdue_tasks,
        'upcoming_tasks': upcoming_tasks,
        'today': today,
        # Detailed information for each category (like admin dashboard)
        'pending_details': pending_details,
        'overdue_details': overdue_details,
        'in_progress_details': in_progress_details,
        'upcoming_details': upcoming_details,
    }
    return render(request, 'employee_dashboard.html', context)

@login_required
def marketing_dashboard(request):
    """Marketing employee dashboard with access to inventory"""
    if not request.user.is_authenticated or request.user.role != 'employee' or request.user.employee_type != 'marketing':
        return redirect('login')
    
    # Check if employee is active
    if request.user.status != 'active':
        messages.error(request, 'Your account is inactive. Please contact administrator.')
        logout(request)
        return redirect('login')
    
    # Get only land-based assigned tasks for this marketing employee from core_assignedtask
    from .models import AssignedTask
    from datetime import datetime, timedelta
    
    assigned_land_tasks = AssignedTask.objects.filter(
        employee=request.user
    ).select_related('land', 'task').order_by('-assigned_date')
    
    # Calculate statistics
    total_assigned_tasks = assigned_land_tasks.count()
    pending_tasks = assigned_land_tasks.filter(status='pending').count()
    in_progress_tasks = assigned_land_tasks.filter(status='in_progress').count()
    completed_tasks = assigned_land_tasks.filter(status='complete').count()
    
    # Calculate overdue tasks count using due_date field (same logic as admin dashboard)
    overdue_tasks_count = assigned_land_tasks.filter(
        due_date__lt=timezone.now(),
        status__in=['pending', 'in_progress']
    ).count()
    
    # Calculate overdue and upcoming tasks using due_date field like admin dashboard
    
    # Get detailed task information for each category (like admin dashboard)
    today = timezone.now().date()
    
    # Get pending tasks details
    pending_details = assigned_land_tasks.filter(status='pending')
    
    # Get overdue tasks details
    overdue_details = assigned_land_tasks.filter(
        due_date__lt=timezone.now(),
        status__in=['pending', 'in_progress']
    )
    
    # Calculate days overdue for each overdue task
    for task in overdue_details:
        if task.due_date:
            task.days_overdue = (timezone.now().date() - task.due_date.date()).days
        else:
            task.days_overdue = 0
    
    # Get in progress tasks details
    in_progress_details = assigned_land_tasks.filter(status='in_progress')
    
    # Get upcoming tasks details (due within next 3 days and not completed)
    upcoming_details = assigned_land_tasks.filter(
        due_date__gte=timezone.now(),
        due_date__lte=timezone.now() + timedelta(days=3),
        status__in=['pending', 'in_progress']
    )
    
    # Calculate days until due for each upcoming task
    for task in upcoming_details:
        if task.due_date:
            task.days_until_due = (task.due_date.date() - timezone.now().date()).days
        else:
            task.days_until_due = 0
    
    # Convert to list format for template (keeping backward compatibility)
    overdue_tasks = []
    upcoming_tasks = []
    
    for assigned_task in overdue_details:
                overdue_tasks.append({
                    'title': assigned_task.task.name,
            'deadline': assigned_task.due_date.strftime('%b %d, %Y') if assigned_task.due_date else 'No due date',
            'days_overdue': (today - assigned_task.due_date.date()).days if assigned_task.due_date else 0,
                    'land_name': assigned_task.land.name if assigned_task.land else 'Unknown'
                })
    
    for assigned_task in upcoming_details:
                upcoming_tasks.append({
                    'title': assigned_task.task.name,
            'deadline': assigned_task.due_date.strftime('%b %d, %Y') if assigned_task.due_date else 'No due date',
            'days_until_due': (assigned_task.due_date.date() - today).days if assigned_task.due_date else 0,
                    'land_name': assigned_task.land.name if assigned_task.land else 'Unknown'
                })
    
    # Get recent land assignments
    recent_land_assignments = assigned_land_tasks
    
    # Calculate installment counts for marketing employee
    from .models import Installment, LandSale
    
    # Get installments for lands sold by this marketing employee
    marketing_installments = Installment.objects.filter(
        land_sale__marketing_employee=request.user
    ).select_related('land_sale', 'land_sale__land', 'land_sale__client')
    
    # Calculate upcoming installments (due within next 7 days and not paid)
    upcoming_installments_count = marketing_installments.filter(
        due_date__gte=timezone.now().date(),
        due_date__lte=timezone.now().date() + timedelta(days=7),
        status__in=['pending', 'partial']
    ).count()
    
    # Calculate overdue installments (past due date and not paid)
    overdue_installments_count = marketing_installments.filter(
        due_date__lt=timezone.now().date(),
        status__in=['pending', 'partial']
    ).count()
    
    context = {
        'assigned_land_tasks': assigned_land_tasks,
        'total_assigned_tasks': total_assigned_tasks,
        'pending_tasks': pending_tasks,
        'in_progress_tasks': in_progress_tasks,
        'completed_tasks': completed_tasks,
        'overdue_tasks_count': overdue_tasks_count,
        'overdue_tasks': overdue_tasks,
        'upcoming_tasks': upcoming_tasks,
        'recent_land_assignments': recent_land_assignments,
        'user': request.user,
        # Detailed information for each category (like admin dashboard)
        'pending_details': pending_details,
        'overdue_details': overdue_details,
        'in_progress_details': in_progress_details,
        'upcoming_details': upcoming_details,
        # Installment counts
        'upcoming_installments_count': upcoming_installments_count,
        'overdue_installments_count': overdue_installments_count,
    }
    return render(request, 'marketing_dashboard.html', context)

@login_required
@require_http_methods(["GET"])
def marketing_installments_api(request, installment_type):
    """API endpoint to fetch installments for marketing dashboard"""
    if request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing'):
        return JsonResponse({'success': False, 'message': 'Permission denied'})
    
    try:
        from .models import Installment, LandSale
        from datetime import timedelta
        from django.utils import timezone
        
        # Filter installments based on user role
        if request.user.role == 'admin':
            # Admin can see all installments
            base_installments = Installment.objects.all()
        else:
            # Marketing employees can only see installments for lands they sold
            base_installments = Installment.objects.filter(
                land_sale__marketing_employee=request.user
            )
        
        # Apply date and status filters based on installment type
        if installment_type == 'upcoming':
            # Get upcoming installments (due within next 7 days and not paid)
            installments = base_installments.filter(
                due_date__gte=timezone.now().date(),
                due_date__lte=timezone.now().date() + timedelta(days=7),
                status__in=['pending', 'partial']
            ).select_related('land_sale', 'land_sale__land', 'land_sale__client').order_by('due_date')
        elif installment_type == 'overdue':
            # Get overdue installments (past due date and not paid)
            installments = base_installments.filter(
                due_date__lt=timezone.now().date(),
                status__in=['pending', 'partial']
            ).select_related('land_sale', 'land_sale__land', 'land_sale__client').order_by('due_date')
        else:
            return JsonResponse({'success': False, 'message': 'Invalid installment type'})
        
        # Prepare installment data
        installment_data = []
        for installment in installments:
            # Since LandSale model doesn't have total_amount field, we'll use percentage as display
            # The actual amount calculation should be handled in the frontend or separate logic
            installment_data.append({
                'id': installment.id,
                'land_name': installment.land_sale.land.name if installment.land_sale and installment.land_sale.land else 'Unknown',
                'client_name': installment.land_sale.client.client_name if installment.land_sale and installment.land_sale.client else 'Unknown',
                'amount': float(installment.percentage),  # Using percentage as amount for now
                'due_date': installment.due_date.isoformat() if installment.due_date else None,
                'status': installment.status,
                'percentage': installment.percentage,
            })
        
        return JsonResponse({
            'success': True,
            'installments': installment_data
        })
        
    except Exception as e:
        print(f"ERROR in marketing_installments_api: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'message': f'Error fetching installments: {str(e)}'
        })

@login_required
def employee_tasks(request):
    if not request.user.is_authenticated or request.user.role != 'employee':
        return redirect('login')
    
    # Check if employee is active
    if request.user.status != 'active':
        messages.error(request, 'Your account is inactive. Please contact administrator.')
        logout(request)
        return redirect('login')
    
    # Get only land-based assigned tasks for this employee from core_assignedtask
    from .models import AssignedTask
    from datetime import datetime, timedelta
    
    # Get sort parameter from request
    sort_by = request.GET.get('sort', 'due_date')
    sort_order = request.GET.get('order', 'asc')
    
    # Base queryset
    assigned_land_tasks = AssignedTask.objects.filter(
        employee=request.user
    ).select_related('land', 'task')
    
    # Apply sorting
    if sort_by == 'due_date':
        if sort_order == 'asc':
            # Sort by due date ascending (earliest first), nulls last
            assigned_land_tasks = assigned_land_tasks.extra(
                select={'due_date_sort': 'CASE WHEN due_date IS NULL THEN 1 ELSE 0 END'}
            ).order_by('due_date_sort', 'due_date')
        else:
            # Sort by due date descending (latest first), nulls last
            assigned_land_tasks = assigned_land_tasks.extra(
                select={'due_date_sort': 'CASE WHEN due_date IS NULL THEN 1 ELSE 0 END'}
            ).order_by('due_date_sort', '-due_date')
    elif sort_by == 'assigned_date':
        if sort_order == 'asc':
            assigned_land_tasks = assigned_land_tasks.order_by('assigned_date')
        else:
            assigned_land_tasks = assigned_land_tasks.order_by('-assigned_date')
    elif sort_by == 'task_name':
        if sort_order == 'asc':
            assigned_land_tasks = assigned_land_tasks.order_by('task__name')
        else:
            assigned_land_tasks = assigned_land_tasks.order_by('-task__name')
    elif sort_by == 'land_name':
        if sort_order == 'asc':
            assigned_land_tasks = assigned_land_tasks.order_by('land__name')
        else:
            assigned_land_tasks = assigned_land_tasks.order_by('-land__name')
    elif sort_by == 'status':
        if sort_order == 'asc':
            assigned_land_tasks = assigned_land_tasks.order_by('status')
        else:
            assigned_land_tasks = assigned_land_tasks.order_by('-status')
    elif sort_by == 'completion_days':
        if sort_order == 'asc':
            assigned_land_tasks = assigned_land_tasks.order_by('completion_days')
        else:
            assigned_land_tasks = assigned_land_tasks.order_by('-completion_days')
    else:
        # Default sorting by due date ascending
        assigned_land_tasks = assigned_land_tasks.extra(
            select={'due_date_sort': 'CASE WHEN due_date IS NULL THEN 1 ELSE 0 END'}
        ).order_by('due_date_sort', 'due_date')
    
    # Calculate overdue status and remaining days using due_date field like admin dashboard
    for assigned_task in assigned_land_tasks:
        # Check if task is overdue using due_date field (same logic as admin dashboard)
        if assigned_task.due_date and assigned_task.status != 'complete':
            if assigned_task.due_date < timezone.now():
                assigned_task.is_overdue = True
                assigned_task.days_overdue = (timezone.now().date() - assigned_task.due_date.date()).days
                assigned_task.remaining_days = 0  # Overdue tasks have 0 remaining days
            else:
                assigned_task.is_overdue = False
                assigned_task.days_overdue = 0
                # Calculate remaining days until due date
                assigned_task.remaining_days = (assigned_task.due_date.date() - timezone.now().date()).days
        else:
            assigned_task.is_overdue = False
            assigned_task.days_overdue = 0
            assigned_task.remaining_days = None  # No due date set
    
    # Filter options
    status_filter = request.GET.get('status', '')
    task_filter = request.GET.get('task', '')
    land_filter = request.GET.get('land', '')
    
    if status_filter:
        assigned_land_tasks = assigned_land_tasks.filter(status=status_filter)
    
    if task_filter:
        assigned_land_tasks = assigned_land_tasks.filter(task__name__icontains=task_filter)
    
    if land_filter:
        assigned_land_tasks = assigned_land_tasks.filter(land__name__icontains=land_filter)
    
    # Calculate overdue tasks count for display
    overdue_tasks_count = assigned_land_tasks.filter(
        due_date__lt=timezone.now(),
        status__in=['pending', 'in_progress']
    ).count()
    
    context = {
        'assigned_land_tasks': assigned_land_tasks,
        'user': request.user,
        'status_filter': status_filter,
        'task_filter': task_filter,
        'land_filter': land_filter,
        'overdue_tasks_count': overdue_tasks_count,
        'sort_by': sort_by,
        'sort_order': sort_order,
    }
    return render(request, 'employee_tasks.html', context)

@login_required
def marketing_tasks(request):
    """Marketing employee tasks page - redirects to employee_tasks"""
    if not request.user.is_authenticated or request.user.role != 'employee' or request.user.employee_type != 'marketing':
        return redirect('login')
    
    # Check if employee is active
    if request.user.status != 'active':
        messages.error(request, 'Your account is inactive. Please contact administrator.')
        logout(request)
        return redirect('login')
    
    # Redirect marketing employees to use the general employee_tasks view
    from django.urls import reverse
    return redirect('employee-tasks')

@login_required
def employee_profile(request):
    user = request.user
    
    # Check if employee is active
    if user.role == 'employee' and user.status != 'active':
        messages.error(request, 'Your account is inactive. Please contact administrator.')
        logout(request)
        return redirect('login')
    
    if request.method == 'POST':
        # Handle profile picture update
        if 'profile_pic' in request.FILES:
            user.profile_pic = request.FILES['profile_pic']
        
        # Handle password change with current password verification
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        current_password = request.POST.get('current_password')
        
        if new_password or confirm_password:
            # Password change requested - verify current password
            if not current_password:
                messages.error(request, 'Current password is required to change password.')
                return redirect('employee-profile')
            
            if not user.check_password(current_password):
                messages.error(request, 'Current password is incorrect.')
                return redirect('employee-profile')
            
            if not new_password:
                messages.error(request, 'New password is required.')
                return redirect('employee-profile')
            
            if new_password != confirm_password:
                messages.error(request, 'New passwords do not match.')
                return redirect('employee-profile')
            
            # All validations passed - update password
            user.set_password(new_password)
            update_session_auth_hash(request, user)
            messages.success(request, 'Password updated successfully.')
        
        # Save user profile
        user.save()
        messages.success(request, 'Profile updated successfully.')
        return redirect('employee-profile')
    
    # Simple profile view - no need for complex task statistics
    return render(request, 'employee_profile.html', {
        'user': user,
    })



# --- Profile View (shared) ---
@login_required
def profile(request):
    user = request.user
    if request.method == 'POST':
        # Handle mobile number update for admin users
        if user.role == 'admin':
            user.mobile = request.POST.get('mobile', user.mobile)
        
        # Handle profile picture update
        if 'profile_pic' in request.FILES:
            user.profile_pic = request.FILES['profile_pic']
        
        # Handle password change with current password verification
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        current_password = request.POST.get('current_password')
        
        if new_password or confirm_password:
            # Password change requested - verify current password
            if not current_password:
                messages.error(request, 'Current password is required to change password.')
                return redirect('profile')
            
            if not user.check_password(current_password):
                messages.error(request, 'Current password is incorrect.')
                return redirect('profile')
            
            if not new_password:
                messages.error(request, 'New password is required.')
                return redirect('profile')
            
            if new_password != confirm_password:
                messages.error(request, 'New passwords do not match.')
                return redirect('profile')
            
            # All validations passed - update password
            user.set_password(new_password)
            update_session_auth_hash(request, user)
            messages.success(request, 'Password updated successfully.')
        
        # Save user profile
        user.save()
        messages.success(request, 'Profile updated successfully.')
        return redirect('profile')
    
    return render(request, 'profile.html', {'user': user})

    # --- Employee CRUD ---
@login_required
def add_employee_page(request):
    """Dedicated page for adding employees"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    return render(request, 'add_employee.html')

@login_required
def add_employee(request):
    if request.method == 'POST' and request.user.role == 'admin':
        # Get all form fields
        username = request.POST.get('username', '').strip()
        password = request.POST['password']
        full_name = request.POST.get('full_name', '')
        email = request.POST.get('email', '')
        mobile = request.POST.get('mobile', '')
        location = request.POST.get('location', '')
        address = request.POST.get('address', '')
        employee_type = request.POST.get('employee_type', '')
        status = request.POST.get('status', 'active')
        profile_pic = request.FILES.get('profile_pic')
        
        # Validate username
        if not username:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Username is required'})
            messages.error(request, 'Username is required')
            return redirect('admin-employees')
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Username already exists'})
            messages.error(request, 'Username already exists')
            return redirect('admin-employees')
        
        # Check if email already exists
        if email and User.objects.filter(email=email).exists():
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Email already exists'})
            messages.error(request, 'Email already exists')
            return redirect('admin-employees')
        
        # Ensure username meets Django requirements (max 150 chars, alphanumeric + underscore)
        if len(username) > 150:
            username = username[:150]
        username = re.sub(r'[^a-zA-Z0-9_]', '', username)
        
        # No custom employee_id generation - using default auto-incrementing ID
        
        try:
            from django.db import transaction
            
            with transaction.atomic():
                # Create user with all fields
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    full_name=full_name,
                    email=email,
                    mobile=mobile,
                    location=location,
                    address=address,
                    role='employee',  # Default role
                    employee_type=employee_type,
                    status=status,
                    profile_pic=profile_pic
                )
                
                # Handle profile picture upload
                if profile_pic:
                    user.profile_pic = profile_pic
                    user.save()
            
            # Create notification for all admins about new employee
            admin_users = User.objects.filter(role='admin')
            for admin_user in admin_users:
                Notification.objects.create(
                    user=admin_user,
                    message=f"New employee '{full_name}' ({username}) has been added to the system"
                )
            
            # Return JSON response for AJAX requests - Optimized for faster response
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True, 
                    'message': 'Employee added successfully!',
                    'employee': {
                        'id': user.id,
                        'username': user.username,
                        'full_name': user.full_name,
                        'email': user.email,
                        'role': user.role,
                        'employee_type': user.employee_type
                    }
                })
            
            messages.success(request, 'Employee added successfully')
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': True, 'message': 'Employee added successfully'})
            return redirect('admin-employees')
            
        except Exception as e:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': f'Error creating employee: {str(e)}'})
            messages.error(request, f'Error creating employee: {str(e)}')
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': f'Error creating employee: {str(e)}'})
            return redirect('admin-employees')
    
    # Handle GET requests
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    return redirect('admin-employees')

@login_required
def edit_employee(request, dev_id):
    if request.method == 'POST' and request.user.role == 'admin':
        try:
            user = User.objects.get(id=dev_id)
            
            # Update all fields
            user.username = request.POST['username']
            user.full_name = request.POST.get('full_name', '')
            user.email = request.POST.get('email', '')
            user.mobile = request.POST['mobile']
            user.location = request.POST.get('location', '')
            user.address = request.POST.get('address', '')
            user.status = request.POST.get('status', 'active')
            user.employee_type = request.POST.get('employee_type', '')
            
            # Handle password change
            if request.POST.get('password'):
                user.set_password(request.POST['password'])
            
            # Handle profile picture upload
            profile_pic = request.FILES.get('profile_pic')
            if profile_pic:
                user.profile_pic = profile_pic
            
            user.save()
            
            # Return JSON response for AJAX requests
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True, 
                    'message': 'Employee updated successfully',
                    'developer': {
                        'id': user.id,
                        'username': user.username,
                        'full_name': user.full_name or '',
                        'email': user.email or '',
                        'mobile': user.mobile,
                        'location': user.location or '',
                        'role': user.role,
                        'employee_type': user.employee_type or '',
                        'profile_pic': user.profile_pic.url if user.profile_pic else None
                    }
                })
            
            messages.success(request, 'Employee updated successfully')
        except User.DoesNotExist:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Employee not found'})
            messages.error(request, 'Employee not found')
        except Exception as e:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': f'Error updating employee: {str(e)}'})
            messages.error(request, f'Error updating employee: {str(e)}')
    
    # Handle GET requests for AJAX
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            user = User.objects.get(id=dev_id)
            return JsonResponse({
                'success': True,
                'developer': {
                    'id': user.id,
                    'username': user.username,
                    'full_name': user.full_name or '',
                    'email': user.email or '',
                    'mobile': user.mobile,
                    'location': user.location or '',
                    'address': user.address or '',
                    'role': user.role,
                    'employee_type': user.employee_type or '',
                    'profile_pic': user.profile_pic.url if user.profile_pic else None
                }
            })
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Employee not found'})
    
    return redirect('admin-employees')

@login_required
def delete_employee(request, dev_id):
    if request.method == 'POST' and request.user.role == 'admin':
        User.objects.filter(id=dev_id).delete()
        messages.success(request, 'Employee deleted successfully')
    return redirect('admin-employees')

@login_required
def bulk_delete_employees(request):
    if request.method == 'POST' and request.user.role == 'admin':
        employee_ids = request.POST.getlist('employee_ids')
        deleted_count = 0
        
        for dev_id in employee_ids:
            try:
                user = User.objects.get(id=dev_id, role='employee')
                username = user.username
                user.delete()
                deleted_count += 1
            except User.DoesNotExist:
                continue
            except Exception as e:
                messages.error(request, f'Error deleting employee: {str(e)}')
        
        if deleted_count > 0:
                    messages.success(request, f'{deleted_count} employee(s) deleted successfully')
    else:
        messages.warning(request, 'No employees were deleted')
    
    return redirect('admin-employees')

# --- 
#  Views ---
@login_required
def admin_chat_index(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    developers = User.objects.filter(role='employee')
    return render(request, 'admin_chat_index.html', {
        'developers': developers,
    })

@login_required
def admin_chat(request, developer_username):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    try:
        developer = User.objects.get(username=developer_username, role='employee')
    except User.DoesNotExist:
        messages.error(request, 'Employee not found')
        return redirect('admin_chat_index')
    
    developers = User.objects.filter(role='employee')
    messages_list = Message.objects.filter(
        (Q(sender=request.user, receiver=developer) | Q(sender=developer, receiver=request.user))
    ).order_by('timestamp')
    
    # Mark messages as read when admin visits chat page
    Message.objects.filter(sender=developer, receiver=request.user, read_by_admin=False).update(read_by_admin=True)
    
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
        'current_developer': developer,
    })

@login_required
def employee_chat(request):
    if not request.user.is_authenticated or request.user.role != 'employee':
        return redirect('login')
    
    # Check if employee is active
    if request.user.status != 'active':
        messages.error(request, 'Your account is inactive. Please contact administrator.')
        logout(request)
        return redirect('login')
    admin_user = User.objects.filter(role='admin').first()
    messages_list = Message.objects.filter(
        (Q(sender=request.user, receiver=admin_user) | Q(sender=admin_user, receiver=request.user))
    ).order_by('timestamp')
    
    # Mark messages as read when user visits chat page
    if admin_user:
        Message.objects.filter(sender=admin_user, receiver=request.user, read_by_dev=False).update(read_by_dev=True)
    
    if request.method == 'POST':
        content = request.POST['content']
        Message.objects.create(sender=request.user, receiver=admin_user, content=content)
        if admin_user:
            Notification.objects.create(
                user=admin_user,
                message=f"New chat message from {request.user.username}: {content[:40]}"
            )
        return redirect('employee-chat')
    return render(request, 'employee_chat.html', {
        'messages': messages_list,
        'admin_username': admin_user.username if admin_user else None,
    })

# --- AJAX Chat Message Sending ---
@login_required
def send_message_ajax(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            content = data.get('content', '').strip()
            receiver_username = data.get('receiver_username', '')
            
            if not content or not receiver_username:
                return JsonResponse({'success': False, 'error': 'Missing content or receiver'}, status=400)
            
            # Get receiver user
            try:
                receiver = User.objects.get(username=receiver_username)
            except User.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Receiver not found'}, status=404)
            
            # Create message
            message = Message.objects.create(
                sender=request.user,
                receiver=receiver,
                content=content
            )
            
            # Create notification
            Notification.objects.create(
                user=receiver,
                message=f"New chat message from {request.user.username}: {content[:40]}"
            )
            
            # Return message data
            return JsonResponse({
                'success': True,
                'message': {
                    'id': message.id,
                    'content': message.content,
                    'timestamp': message.timestamp.isoformat(),
                    'sender_username': message.sender.username,
                    'sender_full_name': message.sender.full_name or message.sender.username
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

# --- Get Chat Messages AJAX ---
@login_required
def get_chat_messages_ajax(request):
    if request.method == 'GET':
        try:
            other_user_username = request.GET.get('username', '')
            
            if not other_user_username:
                return JsonResponse({'success': False, 'error': 'Missing username parameter'}, status=400)
            
            # Get other user
            try:
                other_user = User.objects.get(username=other_user_username)
            except User.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
            
            # Get messages between current user and other user
            messages = Message.objects.filter(
                (Q(sender=request.user, receiver=other_user) | Q(sender=other_user, receiver=request.user))
            ).order_by('timestamp')
            
            # Mark messages as read
            if request.user.role == 'admin':
                Message.objects.filter(sender=other_user, receiver=request.user, read_by_admin=False).update(read_by_admin=True)
            else:
                Message.objects.filter(sender=other_user, receiver=request.user, read_by_dev=False).update(read_by_dev=True)
            
            # Format messages for JSON response
            messages_data = []
            for msg in messages:
                messages_data.append({
                    'id': msg.id,
                    'content': msg.content,
                    'timestamp': msg.timestamp.isoformat(),
                    'sender_username': msg.sender.username,
                    'sender_full_name': msg.sender.full_name or msg.sender.username,
                    'is_sent': msg.sender == request.user
                })
            
            return JsonResponse({
                'success': True,
                'messages': messages_data
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

# --- Chat Unread Count ---
@login_required
def chat_unread_count(request):
    user = request.user
    if not user.is_authenticated:
        return JsonResponse({'unread_count': 0})
    if user.role == 'admin':
        developers = User.objects.filter(role='employee')
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

# --- Notification Views ---
def notifications_index(request):
    return HttpResponse('Notifications app index')

@login_required
def mark_read(request):
    if request.method == 'POST':
        notification_id = request.POST.get('notification_id')
        if notification_id:
            # Mark specific notification as read
            try:
                notification = Notification.objects.get(id=notification_id, user=request.user)
                notification.is_read = True
                notification.save()
                return JsonResponse({'success': True})
            except Notification.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Notification not found'}, status=404)
        else:
            # Mark all notifications as read
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
            return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)

@login_required
def mark_chat_read(request):
    if request.method == 'POST':
        if request.user.role == 'admin':
            # Mark all messages from employees as read by admin
            developers = User.objects.filter(role='employee')
            for dev in developers:
                Message.objects.filter(sender=dev, receiver=request.user, read_by_admin=False).update(read_by_admin=True)
        else:
            # Mark all messages from admin as read by employee
            admin_user = User.objects.filter(role='admin').first()
            if admin_user:
                Message.objects.filter(sender=admin_user, receiver=request.user, read_by_dev=False).update(read_by_dev=True)
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)

@require_GET
@login_required
def user_notifications(request):
    notifications = Notification.objects.filter(user=request.user).order_by('-timestamp')
    data = [
        {
            'id': n.id,
            'message': n.message,
            'is_read': n.is_read,
            'timestamp': n.timestamp.isoformat()
        }
        for n in notifications
    ]
    return JsonResponse(data, safe=False)

# --- Simple Index Views for Tasks/Users ---
def tasks_index(request):
    return HttpResponse('Tasks app index')

def users_index(request):
    return HttpResponse('Users app index')

@login_required
def get_land_tasks(request, land_id):
    """AJAX view to get tasks for a specific land"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    try:
        land = Land.objects.get(id=land_id)
        
        # Get land's selected tasks
        land_tasks = []
        if land.selected_tasks:
            land_tasks = [task.strip() for task in land.selected_tasks.split(',') if task.strip()]
        
        # Get assigned tasks for this land using the new TaskManage model
        assigned_tasks = []
        from .models import TaskManage
        
        # Get all assigned tasks for this land
        land_assigned_tasks = TaskManage.objects.filter(task__land=land).select_related('task', 'employee')
        
        for assigned_task in land_assigned_tasks:
            assigned_tasks.append({
                'id': assigned_task.id,
                'task_id': assigned_task.task.id,
                'task_name': assigned_task.task.name,
                'employee_id': assigned_task.employee.id,
                'employee_name': assigned_task.employee.get_display_name(),
                'status': 'assigned',  # Default status for TaskManage
                'assigned_date': '',  # No date field in TaskManage
                'completed_date': None,  # No completion date in TaskManage
                'notes': '',  # No notes field in TaskManage
            })
        
        return JsonResponse({
            'success': True,
            'land_tasks': land_tasks,
            'assigned_tasks': assigned_tasks
        })
        
    except Land.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Land not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def get_land_tasks_api(request, land_id):
    """API endpoint to get tasks for a specific land with full details from core_assignedtask table"""
    print(f"API called for land_id: {land_id}")
    print(f"User: {request.user.username}, Role: {request.user.role}, Authenticated: {request.user.is_authenticated}")
    print(f"Request headers: {dict(request.headers)}")
    print(f"Session key: {request.session.session_key}")
    print(f"Cookies: {request.COOKIES}")
    
    # Allow admin and marketing employees to access land tasks API
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        print("API: User not authenticated or not authorized")
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    try:
        land = Land.objects.get(id=land_id)
        print(f"API: Land found: {land.name}")
        
        # Get assigned tasks for this land using AssignedTask model (core_assignedtask table)
        from .models import AssignedTask, LandSale
        
        # For marketing employees, filter tasks by their assignments only
        if request.user.role == 'employee' and request.user.employee_type == 'marketing':
            # Get tasks assigned to this marketing employee for this land
            assigned_tasks = AssignedTask.objects.filter(
                land=land, 
                employee=request.user
            ).select_related('task', 'employee')
            print(f"API: Marketing employee {request.user.username} - Found {assigned_tasks.count()} tasks for land {land_id}")
        else:
            # For admin users, show all tasks for this land
            assigned_tasks = AssignedTask.objects.filter(land=land).select_related('task', 'employee')
            print(f"API: Admin user - Found {assigned_tasks.count()} tasks for land {land_id}")
            
            # Also try to get tasks assigned to the marketing employee who sold this land
            try:
                land_sale = LandSale.objects.filter(land=land).first()
                if land_sale and land_sale.marketing_employee:
                    marketing_tasks = AssignedTask.objects.filter(
                        land=land,
                        employee=land_sale.marketing_employee
                    ).select_related('task', 'employee')
                    print(f"API: Found {marketing_tasks.count()} tasks for marketing employee {land_sale.marketing_employee.username}")
            except Exception as e:
                print(f"API: Error getting marketing employee tasks: {e}")
        
        tasks = []
        for assigned_task in assigned_tasks:
            print(f"API: Processing task {assigned_task.task.name} for employee {assigned_task.employee.username}")
            
            # Get employee display name and additional info
            employee_name = assigned_task.employee.get_display_name() if assigned_task.employee else 'Unassigned'
            
            # Get employee type with human-readable label
            employee_type = 'Not specified'
            if assigned_task.employee and assigned_task.employee.employee_type:
                # Get the human-readable label for the choice
                employee_type_choices = dict(User.EMPLOYEE_TYPE_CHOICES)
                employee_type = employee_type_choices.get(assigned_task.employee.employee_type, assigned_task.employee.employee_type)
            
            employee_location = assigned_task.employee.location if assigned_task.employee and assigned_task.employee.location else 'Not specified'
            
            # Get task name from core_task table via the relationship
            task_name = assigned_task.task.name if assigned_task.task else 'Unknown Task'
            
            # Get completion days from core_assignedtask table
            completion_days = assigned_task.completion_days if hasattr(assigned_task, 'completion_days') and assigned_task.completion_days else 0
            
            task_data = {
                'id': assigned_task.id,
                'name': task_name,  # Task name from core_task table
                'task_name': task_name,  # Backward compatibility
                'completion_days': completion_days,  # From core_assignedtask table
                'assigned_employee': employee_name,
                'employee_name': employee_name,
                'employee_type': employee_type,
                'employee_location': employee_location,
                'status': assigned_task.status or 'pending',
                'due_date': assigned_task.due_date.strftime('%Y-%m-%d') if assigned_task.due_date else None,
                'created_date': assigned_task.assigned_date.strftime('%Y-%m-%d') if assigned_task.assigned_date else None,
                'created_at': assigned_task.assigned_date.strftime('%Y-%m-%d') if assigned_task.assigned_date else None,
                'priority': 'medium',  # Default priority
                'description': ''  # AssignedTask doesn't have notes field
            }
            
            # Add completion workflow data if available
            task_data['completion_notes'] = assigned_task.completion_notes or ''
            task_data['completion_photos'] = assigned_task.completion_photos.url if assigned_task.completion_photos else None
            task_data['completion_pdf'] = assigned_task.completion_pdf.url if assigned_task.completion_pdf else None
            task_data['completion_submitted_date'] = assigned_task.completion_submitted_date.strftime('%Y-%m-%d') if assigned_task.completion_submitted_date else None
            task_data['completed_date'] = assigned_task.completed_date.strftime('%Y-%m-%d') if assigned_task.completed_date else None
            task_data['admin_approval_notes'] = assigned_task.admin_approval_notes or ''
            # Removed fields: work_hours, issues, materials_used (simplified form)
            
            tasks.append(task_data)
        
        print(f"API: Returning {len(tasks)} tasks")
        return JsonResponse({
            'success': True,
            'tasks': tasks
        })
        
    except Land.DoesNotExist:
        print(f"API: Land {land_id} not found")
        return JsonResponse({'success': False, 'message': 'Land not found'})
    except Exception as e:
        print(f"API: Exception occurred: {str(e)}")
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def get_employees_api(request):
    """API endpoint to get all active employees"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    try:
        # Use is_active instead of status field (excluding marketing type)
        employees = User.objects.filter(role='employee', is_active=True).exclude(employee_type='marketing').order_by('full_name', 'username')
        
        print(f"Found {employees.count()} employees in database")
        
        employee_list = []
        for employee in employees:
            employee_list.append({
                'id': employee.id,
                'full_name': employee.get_display_name(),
                'username': employee.username,
                'email': employee.email
            })
        
        print(f"Returning {len(employee_list)} employee records")
        return JsonResponse({
            'success': True,
            'employees': employee_list
        })
        
    except Exception as e:
        print(f"Error in get_employees_api: {str(e)}")
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def get_lands_api(request):
    """API endpoint to get all lands for filtering"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Unauthorized access'}, status=403)
    
    try:
        from .models import Land
        lands = Land.objects.all().order_by('name')
        
        print(f"Found {lands.count()} lands in database")
        
        lands_data = []
        for land in lands:
            land_data = {
                'id': land.id,
                'name': land.name,
                'village_name': land.village.name,
                'taluka': land.taluka.name,
                'district': land.district.name,
                'state': land.state
            }
            lands_data.append(land_data)
        
        print(f"Returning {len(lands_data)} land records")
        return JsonResponse(lands_data, safe=False)
        
    except Exception as e:
        print(f"Error in get_lands_api: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def add_task_api(request):
    """API endpoint to add a new task"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'})
    
    try:
        data = json.loads(request.body)
        
        land_id = data.get('land_id')
        task_name = data.get('task_name')
        due_date = data.get('due_date')
        priority = data.get('priority', 'medium')
        employee_id = data.get('employee_id')
        description = data.get('description', '')
        marketing_task = data.get('marketing_task', False)
        
        if not all([land_id, task_name, due_date, employee_id]):
            return JsonResponse({'success': False, 'message': 'Missing required fields'})
        
        # Get the land and employee
        land = Land.objects.get(id=land_id)
        employee = User.objects.get(id=employee_id, role='employee')
        
        # Create a new task
        from .models import Task
        task = Task.objects.create(
            name=task_name,
            description=description,
            is_default=False,
            position=0,
            marketing_task=marketing_task
        )
        
        # Create AssignedTask
        from .models import AssignedTask
        assigned_task = AssignedTask.objects.create(
            land=land,
            task=task,
            employee=employee,
            status='pending',
            due_date=due_date,
            notes=description
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Task added successfully',
            'task_id': assigned_task.id
        })
        
    except Land.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Land not found'})
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Employee not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def get_task_details_api(request, task_id):
    """API endpoint to get task details from core_assignedtask table"""
    # Allow admin and marketing employees to access task details
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    try:
        from .models import AssignedTask
        assigned_task = AssignedTask.objects.get(id=task_id)
        
        # Get employee display name and additional info
        employee_name = assigned_task.employee.get_display_name() if assigned_task.employee else 'Unassigned'
        
        # Get employee type with human-readable label
        employee_type = 'Not specified'
        if assigned_task.employee and assigned_task.employee.employee_type:
            # Get the human-readable label for the choice
            employee_type_choices = dict(User.EMPLOYEE_TYPE_CHOICES)
            employee_type = employee_type_choices.get(assigned_task.employee.employee_type, assigned_task.employee.employee_type)
        
        employee_location = assigned_task.employee.location if assigned_task.employee and assigned_task.employee.location else 'Not specified'
        
        # Get land information with safe access
        land_name = 'Unknown'
        land_location = 'Unknown'
        
        if assigned_task.land:
            try:
                land_name = assigned_task.land.name or 'Unknown'
                land_location = assigned_task.land.village.name or 'Unknown'
            except AttributeError as e:
                print(f"Warning: Land object missing expected attributes: {e}")
                land_name = 'Unknown'
                land_location = 'Unknown'
        
        task_data = {
            'id': assigned_task.id,
            'task_name': assigned_task.task.name if assigned_task.task else 'Unknown Task',
            'assigned_employee': employee_name,
            'employee_name': employee_name,
            'employee_type': employee_type,
            'employee_location': employee_location,
            'status': assigned_task.status or 'pending',
            'due_date': assigned_task.due_date.strftime('%Y-%m-%d') if assigned_task.due_date else None,
            'completion_days': assigned_task.completion_days or 0,
            'created_date': assigned_task.assigned_date.strftime('%Y-%m-%d') if assigned_task.assigned_date else None,
            'created_at': assigned_task.assigned_date.strftime('%Y-%m-%d') if assigned_task.assigned_date else None,
            'priority': 'medium',  # Default priority
            'description': assigned_task.completion_notes or '',  # Use completion notes as description
            'land_name': land_name,
            'land_location': land_location,
            'land_village': land_location
        }
        
        # Add completion workflow data if available (same as get_land_tasks_api)
        task_data['completion_notes'] = assigned_task.completion_notes or ''
        task_data['completion_photos'] = assigned_task.completion_photos.url if assigned_task.completion_photos else None
        task_data['completion_pdf'] = assigned_task.completion_pdf.url if assigned_task.completion_pdf else None
        task_data['completion_submitted_date'] = assigned_task.completion_submitted_date.strftime('%Y-%m-%d') if assigned_task.completion_submitted_date else None
        task_data['completed_date'] = assigned_task.completed_date.strftime('%Y-%m-%d') if assigned_task.completed_date else None
        task_data['admin_approval_notes'] = assigned_task.admin_approval_notes or ''
        
        # Debug logging for completion data
        print(f"API Debug - Task {task_id} completion data:")
        print(f"  - completion_notes: {task_data['completion_notes']}")
        print(f"  - completion_photos: {task_data['completion_photos']}")
        print(f"  - completion_pdf: {task_data['completion_pdf']}")
        print(f"  - completion_submitted_date: {task_data['completion_submitted_date']}")
        print(f"  - admin_approval_notes: {task_data['admin_approval_notes']}")
        
        # Debug logging for land data
        print(f"API Debug - Task {task_id} land data:")
        print(f"  - land object exists: {assigned_task.land is not None}")
        if assigned_task.land:
            print(f"  - land name: {assigned_task.land.name}")
            print(f"  - land village_name: {getattr(assigned_task.land.village, 'name', 'Attribute not found')}")
            print(f"  - land attributes: {[attr for attr in dir(assigned_task.land) if not attr.startswith('_')]}")
        
        return JsonResponse({
            'success': True,
            'task': task_data
        })
        
    except AssignedTask.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Task not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def approve_task_api(request, task_id):
    """API endpoint to approve/complete a task"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'})
    
    try:
        from .models import AssignedTask
        assigned_task = AssignedTask.objects.get(id=task_id)
        assigned_task.status = 'complete'
        assigned_task.save()
        
        # Create notification for employee
        Notification.objects.create(
            user=assigned_task.employee,
            message=f"Task '{assigned_task.task.name}' has been approved and marked as completed by admin"
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Task marked as completed'
        })
        
    except AssignedTask.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Task not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def delete_task_api(request, task_id):
    """API endpoint to delete a task"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method != 'DELETE':
        return JsonResponse({'success': False, 'message': 'Method not allowed'})
    
    try:
        from .models import AssignedTask
        assigned_task = AssignedTask.objects.get(id=task_id)
        
        # Delete the task itself if it's not a default task
        if not assigned_task.task.is_default:
            assigned_task.task.delete()
        else:
            # Just delete the assignment
            assigned_task.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Task deleted successfully'
        })
        
    except AssignedTask.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Task not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def start_task_api(request, task_id):
    """API endpoint for employee to start a task"""
    if not request.user.is_authenticated or request.user.role != 'employee':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'})
    
    try:
        from .models import AssignedTask
        assigned_task = AssignedTask.objects.get(id=task_id, employee=request.user)
        assigned_task.mark_in_progress()
        
        # Create notification for admin
        admin_users = User.objects.filter(role='admin')
        for admin_user in admin_users:
            Notification.objects.create(
                user=admin_user,
                message=f"Employee {request.user.get_display_name()} has started task '{assigned_task.task.name}'"
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Task started successfully'
        })
        
    except AssignedTask.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Task not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def submit_task_completion_api(request, task_id):
    """API endpoint for employee to submit task completion for approval"""
    if not request.user.is_authenticated or request.user.role != 'employee':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'})
    
    try:
        from .models import AssignedTask
        assigned_task = AssignedTask.objects.get(id=task_id, employee=request.user)
        
        # Get form data (simplified form)
        notes = request.POST.get('notes', '')
        photos = request.FILES.get('photos')
        pdf = request.FILES.get('pdf')
        
        # Debug logging
        print(f"Task completion submission - Task ID: {task_id}, User: {request.user.username}")
        print(f"Notes: {notes}")
        print(f"Photos: {photos}")
        print(f"PDF: {pdf}")
        
        # Validate required fields
        if not notes.strip():
            return JsonResponse({'success': False, 'message': 'Completion notes are required'})
        
        # Submit for approval with simplified data
        assigned_task.submit_for_approval(
            notes=notes,
            photos=photos,
            pdf=pdf
        )
        
        # Create notification for admin
        admin_users = User.objects.filter(role='admin')
        for admin_user in admin_users:
            Notification.objects.create(
                user=admin_user,
                message=f"Task '{assigned_task.task.name}' completion submitted for approval by {request.user.get_display_name()}"
            )
        
        print(f"Task {task_id} submitted for approval successfully")
        
        return JsonResponse({
            'success': True,
            'message': 'Task completion submitted for approval'
        })
        
    except AssignedTask.DoesNotExist:
        print(f"Task {task_id} not found for user {request.user.username}")
        return JsonResponse({'success': False, 'message': 'Task not found'})
    except Exception as e:
        print(f"Error in submit_task_completion_api: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def approve_task_completion_api(request, task_id):
    """API endpoint for admin to approve task completion"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'})
    
    try:
        from .models import AssignedTask
        assigned_task = AssignedTask.objects.get(id=task_id)
        
        # Get admin notes
        admin_notes = request.POST.get('admin_notes', '')
        
        # Approve completion
        assigned_task.approve_completion(admin_notes)
        
        # Find all other employees assigned to the same task on the same land and complete their tasks too
        same_task_assignments = AssignedTask.objects.filter(
            land=assigned_task.land,
            task=assigned_task.task,
            status__in=['pending_approval', 'in_progress', 'pending']
        ).exclude(id=assigned_task.id)
        
        # Complete all other assignments for the same task
        for other_assignment in same_task_assignments:
            other_assignment.status = 'complete'
            other_assignment.completed_date = timezone.now()
            other_assignment.admin_approval_notes = f"Auto-completed: Task approved for {assigned_task.employee.get_display_name()}"
            other_assignment.save()
            
            # Create notification for each affected employee
            Notification.objects.create(
                user=other_assignment.employee,
                message=f"Task '{other_assignment.task.name}' has been completed (approved for team member {assigned_task.employee.get_display_name()})"
            )
        
        # Create notification for the original employee
        Notification.objects.create(
            user=assigned_task.employee,
            message=f"Task '{assigned_task.task.name}' completion has been approved by admin"
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Task completion approved successfully'
        })
        
    except AssignedTask.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Task not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def reject_task_completion_api(request, task_id):
    """API endpoint for admin to reject task completion"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'})
    
    try:
        from .models import AssignedTask
        assigned_task = AssignedTask.objects.get(id=task_id)
        
        # Get admin notes
        admin_notes = request.POST.get('admin_notes', '')
        
        # Reject completion
        assigned_task.reject_completion(admin_notes)
        
        # Create notification for employee
        Notification.objects.create(
            user=assigned_task.employee,
            message=f"Task '{assigned_task.task.name}' completion has been rejected by admin. Please review and resubmit."
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Task completion rejected'
        })
        
    except AssignedTask.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Task not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def reassign_task_api(request, task_id):
    """API endpoint for admin to reassign a task to the same employee with notes"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'})
    
    try:
        from .models import AssignedTask
        assigned_task = AssignedTask.objects.get(id=task_id)
        
        # Get reassignment notes
        reassignment_notes = request.POST.get('reassignment_notes', '')
        
        # Reassign the task to the same employee but with new notes
        assigned_task.status = 'in_progress'  # Set to in_progress status
        assigned_task.assigned_date = datetime.datetime.now()
        
        # Store reassignment notes for the employee to see
        assigned_task.admin_approval_notes = f"Task reassigned with notes: {reassignment_notes}".strip()
        
        assigned_task.save()
        
        # Create notification for employee
        Notification.objects.create(
            user=assigned_task.employee,
            message=f"Task '{assigned_task.task.name}' has been reassigned to you with new instructions"
        )
        
        return JsonResponse({
            'success': True,
            'message': f'Task successfully reassigned to {assigned_task.employee.get_display_name()}'
        })
        
    except AssignedTask.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Task not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def get_land_data(request, land_id):
    """AJAX view to get land data for editing"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    try:
        land = Land.objects.get(id=land_id)
        
        # Get current task assignments for this land
        from .models import AssignedTask, TaskManage, Task
        current_assignments = AssignedTask.objects.filter(land=land).select_related('task', 'employee')
        
        # Get all available tasks with their employees from TaskManage
        all_tasks = TaskManage.objects.all().select_related('task')
        
        # Get all tasks from core_task table for completion days
        all_core_tasks = Task.objects.all()
        
        # Create a mapping of task names to current employee assignments and available employees
        task_assignments = {}
        task_employee_mapping = {}
        
        # Create a mapping of task names to completion days from core_task table
        task_completion_days = {}
        for task in all_core_tasks:
            task_completion_days[task.name] = getattr(task, 'completion_days', 0)
        
        # First, get all available employees for each task from TaskManage
        for task_manage in all_tasks:
            task_name = task_manage.task.name
            if task_name not in task_employee_mapping:
                task_employee_mapping[task_name] = {
                    'task_id': task_manage.task.id,
                    'completion_days': task_completion_days.get(task_name, 0),  # Get from core_task table
                    'available_employees': [],
                    'assigned_employees': []
                }
            
            # Add available employee
            if task_manage.employee:
                task_employee_mapping[task_name]['available_employees'].append({
                    'id': task_manage.employee.id,
                    'name': task_manage.employee.full_name
                })
        
        # Then, mark which employees are currently assigned to this land
        for assignment in current_assignments:
            task_name = assignment.task.name
            if task_name not in task_assignments:
                # Get task details from task_employee_mapping
                task_details = task_employee_mapping.get(task_name, {
                    'task_id': assignment.task.id,
                    'completion_days': task_completion_days.get(task_name, 0),  # Get from core_task table
                    'available_employees': [],
                    'assigned_employees': []
                })
                
                # For selected tasks, use completion days from core_assignedtask if available
                assigned_completion_days = getattr(assignment, 'completion_days', None)
                if assigned_completion_days is not None:
                    completion_days = assigned_completion_days
                else:
                    completion_days = task_details['completion_days']  # Fallback to core_task
                
                task_assignments[task_name] = {
                    'task_id': task_details['task_id'],
                    'completion_days': completion_days,
                    'available_employees': task_details['available_employees'],
                    'assigned_employees': [],
                    'status': assignment.status
                }
            
            # Add assigned employee
            task_assignments[task_name]['assigned_employees'].append({
                'id': assignment.employee.id,
                'name': assignment.employee.full_name
            })
        
        land_data = {
            'id': land.id,
            'name': land.name or '',
            'state': land.state or '',
            'district': {'id': land.district_id, 'name': land.district.name} if land.district else {'id': '', 'name': ''},
            'taluka': {'id': land.taluka_id, 'name': land.taluka.name} if land.taluka else {'id': '', 'name': ''},
            'village': {'id': land.village_id, 'name': land.village.name} if land.village else {'id': '', 'name': ''},
            'old_sr_no': land.old_sr_no or '',
            'new_sr_no': land.new_sr_no or '',
            'sata_prakar': land.sata_prakar or '',
            'built_up_area': str(land.built_up_area) if land.built_up_area else '',
            'unutilized_area': str(land.unutilized_area) if land.unutilized_area else '',
            'total_area': str(land.total_area) if land.total_area else '',
            'past_date': land.past_date.strftime('%Y-%m-%d') if land.past_date else '',
            'soda_tarikh': land.soda_tarikh.strftime('%Y-%m-%d') if land.soda_tarikh else '',
            'banakhat_tarikh': land.banakhat_tarikh.strftime('%Y-%m-%d') if land.banakhat_tarikh else '',
            'dastavej_tarikh': land.dastavej_tarikh.strftime('%Y-%m-%d') if land.dastavej_tarikh else '',
            'broker_name': land.broker_name or '',
            'location': land.location or '',
            'remark': land.remark or '',
            'selected_tasks': land.selected_tasks or '',
            'task_assignments': task_assignments
        }
        
        return JsonResponse({
            'success': True,
            'land': land_data
        })
        
    except Land.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Land not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def change_employee_status(request, employee_id):
    """AJAX view to change employee status"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method == 'POST':
        try:
            from .models import User
            
            employee = User.objects.get(id=employee_id, role='employee')
            old_status = employee.status
            # Toggle between 'active' and 'inactive'
            employee.status = 'inactive' if employee.status == 'active' else 'active'
            employee.save()
            
            status_text = employee.status.title()
            
            # Create notification for all admins about employee status change
            admin_users = User.objects.filter(role='admin')
            for admin_user in admin_users:
                Notification.objects.create(
                    user=admin_user,
                    message=f"Employee '{employee.get_display_name()}' status changed from {old_status.title()} to {status_text}"
                )
            
            return JsonResponse({
                'success': True, 
                'message': f'Employee status changed to {status_text}',
                'new_status': employee.status
            })
            
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Employee not found'})
        except Exception as e:
            print(f"Error in change_employee_status: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


# --- Task Management Views (Merged from Task Field and Assigned Tasks) ---

@login_required
def tasks(request):
    """View for simplified task management page"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    
    from .models import Task, User
    
    # Get all tasks with their assigned employees
    tasks = Task.objects.prefetch_related('task_manages__employee').all()
    
    # Get all employees for the dropdown (excluding marketing type)
    employees = User.objects.filter(role='employee', status='active').exclude(employee_type='marketing').order_by('full_name')
    
    context = {
        'tasks': tasks,
        'employees': employees
    }
    
    return render(request, 'task.html', context)


@login_required
def add_task(request):
    """AJAX view to add a new task"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method == 'POST':
        try:
            from .models import Task, User
            
            task_name = request.POST.get('task_name')
            position = request.POST.get('position')
            selected_employees = request.POST.get('selected_employees')
            is_default = request.POST.get('is_default')
            completion_days = request.POST.get('completion_days')
            marketing_task = request.POST.get('marketing_task', 'false')
            
            if not all([task_name, position, selected_employees, is_default, completion_days]):
                return JsonResponse({'success': False, 'message': 'All required fields must be filled'})
            
            # Convert is_default to boolean
            is_default_bool = is_default.lower() == 'true'
            
            # Convert marketing_task to boolean
            marketing_task_bool = marketing_task.lower() == 'true'
            
            # Convert completion_days to integer
            try:
                completion_days_int = int(completion_days)
                if completion_days_int < 0:
                    return JsonResponse({'success': False, 'message': 'Completion days must be 0 or greater'})
            except ValueError:
                return JsonResponse({'success': False, 'message': 'Completion days must be a valid number'})
            
            # Parse selected employees (comma-separated IDs)
            employee_ids = [eid.strip() for eid in selected_employees.split(',') if eid.strip()]
            
            # Handle special case for marketing_employee placeholder
            if employee_ids == ['marketing_employee']:
                # For marketing tasks, we don't assign to a specific employee initially
                employees = []
            else:
                if not employee_ids:
                    return JsonResponse({'success': False, 'message': 'At least one employee must be selected'})
                
                # Get the employees
                employees = []
                for employee_id_str in employee_ids:
                    # Skip marketing_employee placeholder if mixed with real IDs
                    if employee_id_str == 'marketing_employee':
                        continue
                    try:
                        employee = User.objects.get(id=employee_id_str, role='employee')
                        employees.append(employee)
                    except User.DoesNotExist:
                        return JsonResponse({'success': False, 'message': f'Employee with ID {employee_id_str} not found'})
            
            # Create the task
            task = Task.objects.create(
                name=task_name,
                position=int(position),
                is_default=is_default_bool,
                completion_days=completion_days_int,
                marketing_task=marketing_task_bool
            )
            
            # Create TaskManage records for each employee
            from .models import TaskManage
            for employee in employees:
                TaskManage.objects.create(
                    task=task,
                    employee=employee
                )
                
                # Create notification for employee about new task assignment
                Notification.objects.create(
                    user=employee,
                    message=f"New task '{task_name}' has been created and assigned to you"
                )
            
            # Create notification for all admins about new task
            admin_users = User.objects.filter(role='admin')
            for admin_user in admin_users:
                Notification.objects.create(
                    user=admin_user,
                    message=f"New task '{task_name}' has been created and assigned to {len(employees)} employee(s)"
                )
            
            return JsonResponse({
                'success': True,
                'message': f'Task created successfully and assigned to {len(employees)}) employee(s)!',
                'task_id': task.id
            })
            
        except Exception as e:
            print(f"Error in add_assigned_task: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})

@login_required
def add_task_for_land(request):
    """AJAX view to add a new task specifically for a land in edit modal"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method == 'POST':
        try:
            from .models import Task, User, AssignedTask, TaskManage
            
            task_name = request.POST.get('task_name')
            position = request.POST.get('position')
            assign_employee = request.POST.get('assign_employee')
            is_default = request.POST.get('is_default')
            completion_days = request.POST.get('completion_days')
            land_id = request.POST.get('land_id')
            marketing_task = request.POST.get('marketing_task', 'false')
            
            if not all([task_name, position, assign_employee, is_default, completion_days, land_id]):
                return JsonResponse({'success': False, 'message': 'All required fields must be filled'})
            
            # Convert is_default to boolean
            is_default_bool = is_default.lower() == 'true'
            
            # Convert marketing_task to boolean
            marketing_task_bool = marketing_task.lower() == 'true'
            
            # Convert completion_days to integer
            try:
                completion_days_int = int(completion_days)
                if completion_days_int < 0:
                    return JsonResponse({'success': False, 'message': 'Completion days must be 0 or greater'})
            except ValueError:
                return JsonResponse({'success': False, 'message': 'Completion days must be a valid number'})
            
            # Get the employee
            try:
                employee = User.objects.get(id=assign_employee, role='employee')
            except User.DoesNotExist:
                return JsonResponse({'success': False, 'message': f'Employee with ID {assign_employee} not found'})
            
            # Get the land
            try:
                land = Land.objects.get(id=land_id)
            except Land.DoesNotExist:
                return JsonResponse({'success': False, 'message': f'Land with ID {land_id} not found'})
            
            # Create the task
            task = Task.objects.create(
                name=task_name,
                position=int(position),
                is_default=is_default_bool,
                completion_days=completion_days_int,
                marketing_task=marketing_task_bool
            )
            
            # Create TaskManage record for the employee
            task_manage = TaskManage.objects.create(
                task=task,
                employee=employee
            )
            
            # Create AssignedTask record linking task to land
            assigned_task = AssignedTask.objects.create(
                land=land,
                task=task,
                employee=employee,
                status='pending',
                due_date=timezone.now() + datetime.timedelta(days=completion_days_int),
                completion_days=completion_days_int
            )
            
            # Create notification for employee about new task assignment
            Notification.objects.create(
                user=employee,
                message=f"New task '{task_name}' has been created and assigned to you for land '{land.name}'"
            )
            
            # Create notification for all admins about new task
            admin_users = User.objects.filter(role='admin')
            for admin_user in admin_users:
                Notification.objects.create(
                    user=admin_user,
                    message=f"New task '{task_name}' has been created and assigned to {employee.get_display_name()} for land '{land.name}'"
                )
            
            print(f"Task created successfully: Task ID {task.id}, TaskManage ID {task_manage.id}, AssignedTask ID {assigned_task.id}")
            print(f"Task details: name='{task.name}', position={task.position}, is_default={task.is_default}, completion_days={task.completion_days}")
            print(f"AssignedTask details: land_id={assigned_task.land.id}, task_id={assigned_task.task.id}, employee_id={assigned_task.employee.id}")
            
            return JsonResponse({
                'success': True,
                'message': f'Task "{task_name}" created successfully and assigned to {employee.get_display_name()}!',
                'task_id': task.id,
                'assigned_task_id': assigned_task.id
            })
            
        except Exception as e:
            print(f"Error in add_task_for_land: {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'success': False, 'message': f'Error creating task: {str(e)}'})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


@login_required
def get_task_employee_info(request):
    """AJAX view to get employee information for tasks from core_taskmanage and core_task"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})

    if request.method == 'GET':
        try:
            from .models import Task, TaskManage, User
            
            # Get all tasks with their assigned employees
            task_employees = {}
            
            # Query TaskManage to get task-employee relationships
            task_manages = TaskManage.objects.select_related('task', 'employee').all()
            
            for task_manage in task_manages:
                task_name = task_manage.task.name
                employee_name = task_manage.employee.get_display_name()
                employee_id = task_manage.employee.id
                employee_role = task_manage.employee.role
                completion_days = task_manage.task.completion_days
                
                if task_name not in task_employees:
                    task_employees[task_name] = {
                        'employees': [],
                        'completion_days': completion_days
                    }
                
                task_employees[task_name]['employees'].append({
                    'id': employee_id,
                    'name': employee_name,
                    'role': employee_role
                })
            
            print(f"Task employee info fetched: {len(task_employees)} tasks with employee data")
            
            return JsonResponse({
                'success': True,
                'task_employees': task_employees
            })

        except Exception as e:
            print(f"Error in get_task_employee_info: {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'success': False, 'message': f'Error fetching task employee info: {str(e)}'})

    return JsonResponse({'success': False, 'message': 'Invalid request method'})


@login_required
def get_task(request, task_id):
    """AJAX view to get task data for editing"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method == 'GET':
        try:
            from .models import Task
            
            task = Task.objects.get(id=task_id)
            
            # Get assigned employees through TaskManage model
            from .models import TaskManage
            assigned_employees = []
            assigned_tasks = TaskManage.objects.filter(task=task).select_related('employee')
            for assigned_task in assigned_tasks:
                assigned_employees.append({
                    'id': assigned_task.employee.id, 
                    'name': assigned_task.employee.full_name or assigned_task.employee.username
                })
            
            return JsonResponse({
                'success': True,
                'task': {
                    'id': task.id,
                    'name': task.name,
                    'position': task.position,
                    'assigned_employees': assigned_employees,
                    'is_default': task.is_default,
                    'completion_days': task.completion_days,
                    'marketing_task': task.marketing_task
                }
            })
            
        except Task.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Task not found'})
        except Exception as e:
            print(f"Error in get_task: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


@login_required
def update_task(request):
    """AJAX view to update an existing task"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method == 'POST':
        try:
            from .models import Task, User
            
            task_id = request.POST.get('task_id')
            task_name = request.POST.get('task_name')
            position = request.POST.get('position')
            selected_employees = request.POST.get('selected_employees')
            is_default = request.POST.get('is_default')
            completion_days = request.POST.get('completion_days')
            marketing_task = request.POST.get('marketing_task', 'false')
            
            if not all([task_id, task_name, position, selected_employees, is_default, completion_days]):
                return JsonResponse({'success': False, 'message': 'All required fields must be filled'})
            
            # Get the task
            try:
                task = Task.objects.get(id=task_id)
            except Task.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Task not found'})
            
            # Convert is_default to boolean
            is_default_bool = is_default.lower() == 'true'
            
            # Convert marketing_task to boolean
            marketing_task_bool = marketing_task.lower() == 'true'
            
            # Convert completion_days to integer
            try:
                completion_days_int = int(completion_days)
                if completion_days_int < 0:
                    return JsonResponse({'success': False, 'message': 'Completion days must be 0 or greater'})
            except ValueError:
                return JsonResponse({'success': False, 'message': 'Completion days must be a valid number'})
            
            # Parse selected employees (comma-separated IDs)
            employee_ids = [eid.strip() for eid in selected_employees.split(',') if eid.strip()]
            if not employee_ids:
                return JsonResponse({'success': False, 'message': 'At least one employee must be selected'})
            
            # Get the employees
            employees = []
            for employee_id_str in employee_ids:
                try:
                    employee = User.objects.get(id=employee_id_str, role='employee')
                    employees.append(employee)
                except User.DoesNotExist:
                    return JsonResponse({'success': False, 'message': f'Employee with ID {employee_id_str} not found'})
            
            # Get land_id if provided
            land_id = request.POST.get('land_id')
            land = None
            if land_id:
                try:
                    from .models import Land
                    land = Land.objects.get(id=land_id)
                except Land.DoesNotExist:
                    return JsonResponse({'success': False, 'message': f'Land with ID {land_id} not found'})
            
            # Update the task
            task.name = task_name
            task.position = int(position)
            task.is_default = is_default_bool
            task.completion_days = completion_days_int
            task.marketing_task = marketing_task_bool
            task.land = land
            task.save()
            
            # Update assigned employees through TaskManage model
            from .models import TaskManage
            
            # Remove existing assignments for this task
            TaskManage.objects.filter(task=task).delete()
            
            # Create new assignments for each employee
            for employee in employees:
                TaskManage.objects.create(
                    task=task,
                    employee=employee
                )
            
            return JsonResponse({
                'success': True,
                'message': f'Task updated successfully and assigned to {len(employees)} employee(s)!'
            })
            
        except Exception as e:
            print(f"Error in update_assigned_task: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})





@login_required
def delete_task(request, task_id):
    """AJAX view to delete a task"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method == 'DELETE':
        try:
            from .models import Task
            
            task = Task.objects.get(id=task_id)
            task_name = task.name
            task.delete()
            
            return JsonResponse({
                'success': True,
                'message': f'Task "{task_name}" deleted successfully!'
            })
            
        except Task.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Task not found'})
        except Exception as e:
            print(f"Error in delete_task: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


# --- Sata Prakar Management Views ---

@login_required
def sata_prakar(request):
    """View for Sata Prakar management page"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    
    from .models import SataPrakar
    
    sata_prakar_list = SataPrakar.objects.all()
    
    context = {
        'sata_prakar_list': sata_prakar_list
    }
    
    return render(request, 'Sata_prakar.html', context)


@login_required
def add_sata_prakar(request):
    """AJAX view to add a new Sata Prakar"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method == 'POST':
        try:
            from .models import SataPrakar
            
            # Debug: Log all POST data
            print(f"POST data received: {dict(request.POST)}")
            
            name = request.POST.get('sata_name')
            print(f"Extracted name: '{name}'")
            
            if not name:
                return JsonResponse({'success': False, 'message': 'Name is required'})
            
            # Check if already exists
            if SataPrakar.objects.filter(name=name).exists():
                return JsonResponse({'success': False, 'message': 'Sata Prakar with this name already exists'})
            
            sata_prakar = SataPrakar.objects.create(name=name)
            
            return JsonResponse({
                'success': True,
                'message': 'Sata Prakar added successfully!',
                'sata_id': sata_prakar.id
            })
            
        except Exception as e:
            print(f"Error in add_sata_prakar: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


@login_required
def get_sata_prakar(request, sata_id):
    """AJAX view to get Sata Prakar data for editing"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method == 'GET':
        try:
            from .models import SataPrakar
            
            sata_prakar = SataPrakar.objects.get(id=sata_id)
            
            return JsonResponse({
                'success': True,
                'sata': {
                    'id': sata_prakar.id,
                    'name': sata_prakar.name
                }
            })
            
        except SataPrakar.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Sata Prakar not found'})
        except Exception as e:
            print(f"Error in get_sata_prakar: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


@login_required
def update_sata_prakar(request):
    """AJAX view to update a Sata Prakar"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method == 'POST':
        try:
            from .models import SataPrakar
            
            # Debug: Log all POST data
            print(f"Update POST data received: {dict(request.POST)}")
            
            sata_id = request.POST.get('sata_id')
            name = request.POST.get('sata_name')
            print(f"Update - sata_id: '{sata_id}', name: '{name}'")
            
            if not all([sata_id, name]):
                return JsonResponse({'success': False, 'message': 'All fields are required'})
            
            try:
                sata_prakar = SataPrakar.objects.get(id=sata_id)
            except SataPrakar.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Sata Prakar not found'})
            
            # Check if name already exists for different record
            if SataPrakar.objects.filter(name=name).exclude(id=sata_id).exists():
                return JsonResponse({'success': False, 'message': 'Sata Prakar with this name already exists'})
            
            sata_prakar.name = name
            sata_prakar.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Sata Prakar updated successfully!'
            })
            
        except Exception as e:
            print(f"Error in update_sata_prakar: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


@login_required
def delete_sata_prakar(request, sata_id):
    """AJAX view to delete a Sata Prakar"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method == 'POST':
        try:
            from .models import SataPrakar
            
            sata_prakar = SataPrakar.objects.get(id=sata_id)
            sata_name = sata_prakar.name
            sata_prakar.delete()
            
            return JsonResponse({
                'success': True,
                'message': f'Sata Prakar "{sata_name}" deleted successfully!'
            })
            
        except SataPrakar.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Sata Prakar not found'})
        except Exception as e:
            print(f"Error in delete_sata_prakar: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


# --- TaskManage Management Views ---
@login_required
def create_task_manage(request):
    """AJAX view to create a new TaskManage"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method == 'POST':
        try:
            from .models import TaskManage, Task, User
            
            task_id = request.POST.get('task_id')
            employee_id = request.POST.get('employee_id')
            
            if not all([task_id, employee_id]):
                return JsonResponse({'success': False, 'message': 'Task and Employee are required'})
            
            # Check if assignment already exists
            if TaskManage.objects.filter(task_id=task_id, employee_id=employee_id).exists():
                return JsonResponse({'success': False, 'message': 'This task is already assigned to this employee'})
            
            # Create the assignment
            task_manage = TaskManage.objects.create(
                task_id=task_id,
                employee_id=employee_id
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Task assigned successfully!',
                'task_manage_id': task_manage.id
            })
            
        except Exception as e:
            print(f"Error in create_task_manage: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


# Note: Status updates are no longer needed with the simplified TaskManage model


@login_required
def delete_task_manage(request, task_manage_id):
    """AJAX view to delete a TaskManage"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method == 'DELETE':
        try:
            from .models import TaskManage
            
            task_manage = TaskManage.objects.get(id=task_manage_id)
            task_manage.delete()
            
            return JsonResponse({
                'success': True,
                'message': 'Task assignment deleted successfully!'
            })
            
        except TaskManage.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Assigned Task not found'})
        except Exception as e:
            print(f"Error in delete_task_manage: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


# --- Sata Prakar Management Views ---

def auto_assign_tasks_for_land(land, selected_tasks=None, task_employee_selections=None, task_completion_days=None):
    """
    Automatically assign selected tasks to employees for a newly submitted land
    based on the core_task and core_taskmanage tables
    task_employee_selections: dict mapping task names to selected employee names
    task_completion_days: dict mapping task names to completion days data
    """
    try:
        from .models import Task, TaskManage, AssignedTask, User
        
        print(f"auto_assign_tasks_for_land called with:")
        print(f"  Land: {land.name}")
        print(f"  Selected tasks: {selected_tasks}")
        print(f"  Task employee selections: {task_employee_selections}")
        print(f"  Task employee selections type: {type(task_employee_selections)}")
        if task_employee_selections:
            print(f"  Task employee selections keys: {list(task_employee_selections.keys())}")
            for key, value in task_employee_selections.items():
                print(f"    {key}: '{value}' (type: {type(value)})")
                if isinstance(value, str):
                    split_names = [name.strip() for name in value.split(',') if name.strip()]
                    print(f"      Split into: {split_names}")
        
        # Parse task completion days data
        if task_completion_days:
            try:
                task_completion_days = json.loads(task_completion_days)
                print(f"  Task completion days: {task_completion_days}")
            except json.JSONDecodeError:
                print(f"  Warning: Invalid JSON in task_completion_days: {task_completion_days}")
                task_completion_days = {}
        else:
            task_completion_days = {}
            print(f"  No task completion days provided")
        
        if not selected_tasks or selected_tasks.strip() == '':
            return True, "No tasks selected for assignment - no automatic assignments needed"
        
        # Parse selected tasks (comma-separated string)
        task_names = [task.strip() for task in selected_tasks.split(',') if task.strip()]
        print(f"Parsed task names: {task_names}")
        
        if not task_names:
            return True, "No valid tasks found - no automatic assignments needed"
        
        # Get the actual Task objects for the selected task names
        selected_task_objects = Task.objects.filter(name__in=task_names)
        print(f"Found {selected_task_objects.count()} task objects")
        
        if not selected_task_objects.exists():
            return False, f"No valid tasks found for: {', '.join(task_names)}"
        
        # Create AssignedTask records for each selected task and employee combination
        created_count = 0
        total_assignments = 0
        
        for task in selected_task_objects:
            task_name = task.name
            print(f"\nProcessing task: {task_name}")
            
            # Check if specific employees are selected for this task
            if task_employee_selections and task_name in task_employee_selections:
                # Use specifically selected employees (can be single or multiple)
                selected_employee_names = task_employee_selections[task_name]
                print(f"  Using specifically selected employees: {selected_employee_names}")
                
                # Handle both single employee (string) and multiple employees (comma-separated)
                if isinstance(selected_employee_names, str):
                    employee_name_list = [name.strip() for name in selected_employee_names.split(',') if name.strip()]
                    print(f"    Split employee names: {employee_name_list}")
                else:
                    employee_name_list = [selected_employee_names]
                    print(f"    Single employee name: {employee_name_list}")
                
                selected_employee_objects = []
                print(f"    Looking for {len(employee_name_list)} employees...")
                for employee_name in employee_name_list:
                    # Find employee by name (case-insensitive)
                    employee = User.objects.filter(
                        full_name__iexact=employee_name,
                        role='employee',
                        status='active'
                    ).first()
                    
                    if not employee:
                        # Try to find by username as fallback
                        employee = User.objects.filter(
                            username__iexact=employee_name,
                            role='employee',
                            status='active'
                        ).first()
                    
                    if employee:
                        selected_employee_objects.append(employee)
                        print(f"    Found employee: {employee.full_name} (ID: {employee.id})")
                        
                        # Ensure TaskManage relationship exists for selected employee
                        task_manage, created = TaskManage.objects.get_or_create(
                            task=task,
                            employee=employee
                        )
                        if created:
                            print(f"    Created TaskManage relationship: {task.name} -> {employee.full_name}")
                    else:
                        print(f"    WARNING: Employee not found: {employee_name}")
                
                if not selected_employee_objects:
                    print(f"    WARNING: No valid employees found from selection: {selected_employee_names}")
                    # No fallback - if specific employees are selected but not found, don't assign the task
                    print(f"    No fallback - task {task_name} will not be assigned")
                
            else:
                # No employees selected for this task - don't assign to anyone
                print(f"  No employees selected for task: {task_name} - task will not be assigned")
                selected_employee_objects = []
            
            if not selected_employee_objects:
                print(f"  WARNING: No employees found for task: {task_name}")
                continue
            
            # Create assignments for all selected employees
            print(f"  Creating assignments for {len(selected_employee_objects)} employees...")
            for employee in selected_employee_objects:
                print(f"    Creating AssignedTask for employee: {employee.full_name} (ID: {employee.id})")
                
                # Check if custom completion days are provided for this task
                custom_completion_days = None
                if task_name in task_completion_days:
                    custom_completion_days = task_completion_days[task_name].get('days', task.completion_days)
                    print(f"      Using custom completion days: {custom_completion_days} (original: {task.completion_days})")
                else:
                    custom_completion_days = task.completion_days
                    print(f"      Using default completion days: {custom_completion_days}")
                
                # Create an AssignedTask for this land, task, and employee
                assigned_task, created = AssignedTask.objects.get_or_create(
                    land=land,
                    task=task,
                    employee=employee,
                    defaults={
                        'status': 'pending',
                        'completion_days': custom_completion_days,
                        'due_date': timezone.now() + timezone.timedelta(days=custom_completion_days) if custom_completion_days > 0 else None
                    }
                )
                if created:
                    created_count += 1
                    print(f"      [SUCCESS] Created new AssignedTask (ID: {assigned_task.id})")
                    
                    # Create notification for employee about new task assignment
                    Notification.objects.create(
                        user=employee,
                        message=f"New task '{task.name}' has been assigned to you for land '{land.name}'"
                    )
                else:
                    print(f"      - AssignedTask already exists (ID: {assigned_task.id})")
                    # Update completion days if they changed
                    if custom_completion_days != assigned_task.completion_days:
                        old_days = assigned_task.completion_days
                        assigned_task.completion_days = custom_completion_days
                        assigned_task.due_date = timezone.now() + timezone.timedelta(days=custom_completion_days) if custom_completion_days > 0 else None
                        assigned_task.save()
                        print(f"      ✓ Updated completion days from {old_days} to {custom_completion_days}")
                
                total_assignments += 1
        
        print(f"\nAssignment Summary:")
        print(f"  Total tasks processed: {len(selected_task_objects)}")
        print(f"  Total assignments created: {created_count}")
        print(f"  Total assignments (including existing): {total_assignments}")
        
        if created_count > 0:
            return True, f"Successfully assigned {created_count} new tasks to employees. Total assignments: {total_assignments}"
        elif total_assignments > 0:
            return True, f"All {total_assignments} task assignments already exist"
        else:
            return False, "No task assignments were created"
        
    except Exception as e:
        print(f"Error in auto_assign_tasks_for_land: {str(e)}")
        import traceback
        traceback.print_exc()
        return False, f"Error assigning tasks: {str(e)}"


def update_assigned_tasks_for_land(land, selected_tasks, task_employee_selections=None, task_completion_days=None):
    """
    Update AssignedTask records when land tasks are modified
    This function intelligently updates only what's necessary:
    - Preserves existing assignments for unchanged tasks
    - Creates new assignments for newly added tasks
    - Updates assignments only for tasks with employee changes
    - Updates completion days if they changed
    """
    try:
        from .models import Task, TaskManage, AssignedTask, User
        from django.utils import timezone
        
        # Get current task assignments for comparison
        current_assignments = AssignedTask.objects.filter(land=land).select_related('task', 'employee')
        current_task_employee_map = {assignment.task.name: assignment.employee.full_name for assignment in current_assignments}
        
        print(f"Current assignments: {current_task_employee_map}")
        print(f"New employee selections: {task_employee_selections}")
        print(f"Selected tasks: '{selected_tasks}'")
        
        # Parse task completion days data
        if task_completion_days:
            try:
                task_completion_days = json.loads(task_completion_days)
                print(f"Task completion days: {task_completion_days}")
            except json.JSONDecodeError:
                print(f"Warning: Invalid JSON in task_completion_days: {task_completion_days}")
                task_completion_days = {}
        else:
            task_completion_days = {}
            print(f"No task completion days provided")
        
        # Parse selected tasks
        if selected_tasks and selected_tasks.strip():
            new_task_names = [task.strip() for task in selected_tasks.split(',') if task.strip()]
        else:
            new_task_names = []
        
        current_task_names = set(current_task_employee_map.keys())
        new_task_names_set = set(new_task_names)
        
        # Determine what needs to be done
        tasks_to_add = new_task_names_set - current_task_names
        tasks_to_remove = current_task_names - new_task_names_set
        tasks_to_keep = current_task_names & new_task_names_set
        
        print(f"Task analysis:")
        print(f"  Tasks to add: {tasks_to_add}")
        print(f"  Tasks to remove: {tasks_to_remove}")
        print(f"  Tasks to keep: {tasks_to_keep}")
        
        # Remove tasks that are no longer selected
        if tasks_to_remove:
            print(f"Removing {len(tasks_to_remove)} unselected tasks")
            AssignedTask.objects.filter(land=land, task__name__in=tasks_to_remove).delete()
        
        # Handle employee assignments for existing tasks - support multiple employees per task
        tasks_with_employee_changes = []  # Track tasks with employee changes
        if task_employee_selections:
            print(f"Processing employee selections for existing tasks: {task_employee_selections}")
            for task_name in tasks_to_keep:
                if task_name in task_employee_selections and task_employee_selections[task_name]:
                    new_employee_names = task_employee_selections[task_name]
                    print(f"Processing employee assignments for existing task '{task_name}': {new_employee_names}")
                    
                    # Parse employee names (comma-separated string)
                    if isinstance(new_employee_names, str):
                        employee_name_list = [name.strip() for name in new_employee_names.split(',') if name.strip()]
                    else:
                        employee_name_list = [new_employee_names]
                    
                    print(f"Employee list for task '{task_name}': {employee_name_list}")
                    
                    # Get current assignments for this task
                    current_task_assignments = current_assignments.filter(task__name=task_name)
                    current_employee_names = [assignment.employee.full_name for assignment in current_task_assignments]
                    
                    print(f"Current employees for task '{task_name}': {current_employee_names}")
                    print(f"New employees for task '{task_name}': {employee_name_list}")
                    
                    # Find the task object
                    task = Task.objects.filter(name=task_name).first()
                    if not task:
                        print(f"WARNING: Task not found: {task_name}")
                        continue
                    
                    # Remove assignments for employees no longer selected
                    employees_to_remove = set(current_employee_names) - set(employee_name_list)
                    if employees_to_remove:
                        print(f"Removing {len(employees_to_remove)} unselected employees for task '{task_name}': {employees_to_remove}")
                        for employee_name in employees_to_remove:
                            employee = User.objects.filter(
                                full_name__iexact=employee_name,
                                role='employee',
                                status='active'
                            ).first()
                            if employee:
                                AssignedTask.objects.filter(
                                    land=land,
                                    task=task,
                                    employee=employee
                                ).delete()
                                print(f"  ✓ Removed assignment: {task_name} -> {employee_name}")
                    
                    # Add/update assignments for newly selected employees
                    for employee_name in employee_name_list:
                        employee = User.objects.filter(
                            full_name__iexact=employee_name,
                            role='employee',
                            status='active'
                        ).first()
                        
                        if not employee:
                            # Try to find by username as fallback
                            employee = User.objects.filter(
                                username__iexact=employee_name,
                                role='employee',
                                status='active'
                            ).first()
                        
                        if employee:
                            # Check if assignment already exists
                            existing_assignment = AssignedTask.objects.filter(
                                land=land,
                                task=task,
                                employee=employee
                            ).first()
                            
                            if existing_assignment:
                                print(f"  - Assignment already exists: {task_name} -> {employee_name}")
                            else:
                                # Create new assignment
                                # Get completion days for this task
                                custom_completion_days = None
                                if task_completion_days and task_name in task_completion_days:
                                    custom_completion_days = task_completion_days[task_name].get('days', task.completion_days)
                                else:
                                    custom_completion_days = task.completion_days
                                
                                new_assignment = AssignedTask.objects.create(
                                    land=land,
                                    task=task,
                                    employee=employee,
                                    status='pending',
                                    completion_days=custom_completion_days,
                                    due_date=timezone.now() + timezone.timedelta(days=custom_completion_days) if custom_completion_days > 0 else None
                                )
                                print(f"  ✓ Created new assignment: {task_name} -> {employee_name}")
                                
                                # Track that this task had employee changes
                                if task_name not in tasks_with_employee_changes:
                                    tasks_with_employee_changes.append(task_name)
                                
                                # Ensure TaskManage relationship exists
                                task_manage, created = TaskManage.objects.get_or_create(
                                    task=task,
                                    employee=employee
                                )
                                if created:
                                    print(f"    Created TaskManage relationship: {task_name} -> {employee_name}")
                        else:
                            print(f"  WARNING: Employee not found: {employee_name}")
        
        # Update completion days for existing tasks if they changed
        if task_completion_days:
            print(f"Checking for completion days updates in {len(task_completion_days)} tasks")
            for task_name, completion_data in task_completion_days.items():
                if task_name in current_task_names:
                    # Get ALL assignments for this task (not just the first one)
                    task_assignments = current_assignments.filter(task__name=task_name)
                    if task_assignments.exists():
                        first_assignment = task_assignments.first()
                        new_days = completion_data.get('days', first_assignment.completion_days)
                        
                        # Update ALL assignments for this task with the new completion days
                        updated_count = 0
                        for assignment in task_assignments:
                            if new_days != assignment.completion_days:
                                old_days = assignment.completion_days
                                assignment.completion_days = new_days
                                assignment.due_date = timezone.now() + timezone.timedelta(days=new_days) if new_days > 0 else None
                                assignment.save()
                                updated_count += 1
                                print(f"  ✓ Updated completion days for '{task_name}' (Employee: {assignment.employee.full_name}): {old_days} -> {new_days} days")
                        
                        if updated_count == 0:
                            print(f"  - Completion days unchanged for '{task_name}': {new_days} days (all {task_assignments.count()} employees)")
                        else:
                            print(f"  ✓ Updated completion days for {updated_count} employees assigned to '{task_name}'")
        
        # Create new assignments for newly added tasks
        if tasks_to_add:
            print(f"Creating new assignments for {len(tasks_to_add)} newly added tasks")
            for task_name in tasks_to_add:
                # Check if user has selected specific employees for this task
                if task_employee_selections and task_name in task_employee_selections:
                    selected_employee_names = task_employee_selections[task_name]
                    print(f"  Using user-selected employees for '{task_name}': {selected_employee_names}")
                    
                    # Handle both single employee (string) and multiple employees (comma-separated)
                    if isinstance(selected_employee_names, str):
                        employee_name_list = [name.strip() for name in selected_employee_names.split(',') if name.strip()]
                    else:
                        employee_name_list = [selected_employee_names]
                    
                    for employee_name in employee_name_list:
                        # Find employee by name
                        employee = User.objects.filter(
                            full_name__iexact=employee_name,
                            role='employee',
                            status='active'
                        ).first()
                        
                        if not employee:
                            # Try to find by username as fallback
                            employee = User.objects.filter(
                                username__iexact=employee_name,
                                role='employee',
                                status='active'
                            ).first()
                        
                        if employee:
                            # Create new assignment with selected employee
                            task = Task.objects.filter(name=task_name).first()
                            if task:
                                # Check if custom completion days are provided for this task
                                custom_completion_days = None
                                if task_name in task_completion_days:
                                    custom_completion_days = task_completion_days[task_name].get('days', task.completion_days)
                                    print(f"      Using custom completion days: {custom_completion_days} (original: {task.completion_days})")
                                else:
                                    custom_completion_days = task.completion_days
                                    print(f"      Using default completion days: {custom_completion_days}")
                                
                                assigned_task, created = AssignedTask.objects.get_or_create(
                                    land=land,
                                    task=task,
                                    employee=employee,
                                    defaults={
                                        'status': 'pending',
                                        'completion_days': custom_completion_days,
                                        'due_date': timezone.now() + timezone.timedelta(days=custom_completion_days) if custom_completion_days > 0 else None
                                    }
                                )
                                if created:
                                    print(f"    ✓ Created new assignment: {task_name} -> {employee.full_name}")
                                    
                                    # Create notification for employee about new task assignment
                                    Notification.objects.create(
                                        user=employee,
                                        message=f"New task '{task_name}' has been assigned to you for land '{land.name}'"
                                    )
                                else:
                                    print(f"    - Assignment already exists: {task_name} -> {employee.full_name}")
                                
                                # Ensure TaskManage relationship exists
                                task_manage, created = TaskManage.objects.get_or_create(
                                    task=task,
                                    employee=employee
                                )
                                if created:
                                    print(f"      Created TaskManage relationship: {task_name} -> {employee.full_name}")
                            else:
                                print(f"    WARNING: Task not found: {task_name}")
                        else:
                            print(f"    WARNING: Employee not found: {employee_name}")
                else:
                    # No employees selected for new task - don't assign to anyone
                    print(f"  No employees selected for '{task_name}' - task will not be assigned")
        
        # Summary
        total_assignments = AssignedTask.objects.filter(land=land).count()
        print(f"\nUpdate Summary:")
        print(f"  Tasks removed: {len(tasks_to_remove)}")
        print(f"  Tasks updated: {len(tasks_with_employee_changes)}")
        print(f"  Tasks added: {len(tasks_to_add)}")
        print(f"  Total assignments after update: {total_assignments}")
        
        if tasks_to_remove or tasks_with_employee_changes or tasks_to_add:
            return True, f"Successfully updated task assignments. Removed: {len(tasks_to_remove)}, Updated: {len(tasks_with_employee_changes)}, Added: {len(tasks_to_add)}"
        else:
            return True, "No changes needed - existing assignments remain unchanged"
        
    except Exception as e:
        print(f"Error in update_assigned_tasks_for_land: {str(e)}")
        import traceback
        traceback.print_exc()
        return False, f"Error updating task assignments: {str(e)}"


# --- Employee Task Management Views ---
@login_required
def update_task_status(request, assigned_task_id):
    """
    Update the status of an assigned task (pending/complete)
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    if not request.user.is_authenticated or request.user.role != 'employee':
        return JsonResponse({'success': False, 'message': 'Unauthorized access'})
    
    try:
        from .models import AssignedTask
        assigned_task = get_object_or_404(AssignedTask, id=assigned_task_id, employee=request.user)
        
        new_status = request.POST.get('status')
        if new_status not in ['pending', 'complete']:
            return JsonResponse({'success': False, 'message': 'Invalid status'})
        
        assigned_task.status = new_status
        if new_status == 'complete':
            assigned_task.completed_date = timezone.now()
        else:
            assigned_task.completed_date = None
        
        assigned_task.save()
        
        # Create notification for admin about task status change
        admin_users = User.objects.filter(role='admin')
        for admin_user in admin_users:
            Notification.objects.create(
                user=admin_user,
                message=f"Task '{assigned_task.task.name}' status changed to {new_status} by {request.user.get_display_name()}"
            )
        
        return JsonResponse({
            'success': True, 
            'message': f'Task status updated to {new_status}',
            'new_status': new_status,
            'completed_date': assigned_task.completed_date.isoformat() if assigned_task.completed_date else None
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error updating task: {str(e)}'})


@login_required
def get_employee_task_details(request, assigned_task_id):
    """
    Get detailed information about a specific assigned task
    """
    if not request.user.is_authenticated or request.user.role != 'employee':
        return JsonResponse({'success': False, 'message': 'Unauthorized access'})
    
    try:
        from .models import AssignedTask
        assigned_task = get_object_or_404(AssignedTask, id=assigned_task_id, employee=request.user)
        
        task_data = {
            'id': assigned_task.id,
            'land_name': assigned_task.land.name,
            'land_id': assigned_task.land.id,
            'task_name': assigned_task.task.name,
            'status': assigned_task.status,
            'assigned_date': assigned_task.assigned_date.strftime('%Y-%m-%d %H:%M'),
            'completed_date': assigned_task.completed_date.strftime('%Y-%m-%d %H:%M') if assigned_task.completed_date else None,
            'admin_approval_notes': assigned_task.admin_approval_notes,
            'land_details': {
                'state': assigned_task.land.state,
                'district': assigned_task.land.district.name,
                'taluka': assigned_task.land.taluka.name,
                'village': assigned_task.land.village.name,
                'sata_prakar': assigned_task.land.sata_prakar,
                'total_area': str(assigned_task.land.total_area),
                'built_up_area': str(assigned_task.land.built_up_area) if assigned_task.land.built_up_area else None,
                'unutilized_area': str(assigned_task.land.unutilized_area) if assigned_task.land.unutilized_area else None,
                'broker_name': assigned_task.land.broker_name,
                'past_date': assigned_task.land.past_date.strftime('%Y-%m-%d') if assigned_task.land.past_date else None,
                'soda_tarikh': assigned_task.land.soda_tarikh.strftime('%Y-%m-%d') if assigned_task.land.soda_tarikh else None,
                'banakhat_tarikh': assigned_task.land.banakhat_tarikh.strftime('%Y-%m-%d') if assigned_task.land.banakhat_tarikh else None,
                'dastavej_tarikh': assigned_task.land.dastavej_tarikh.strftime('%Y-%m-%d') if assigned_task.land.dastavej_tarikh else None,
                'old_sr_no': assigned_task.land.old_sr_no,
                'new_sr_no': assigned_task.land.new_sr_no,
            }
        }
        
        return JsonResponse({'success': True, 'task_data': task_data})
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error fetching task details: {str(e)}'})

@login_required
def get_land_task_employees(request, land_id, task_id):
    """
    Get all available employees for a task and current assignments for a specific land
    """
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized access'})
    
    try:
        from .models import Land, Task, AssignedTask, User, TaskManage
        
        # Get the land and task
        land = get_object_or_404(Land, id=land_id)
        task = get_object_or_404(Task, id=task_id)
        
        # Get all employees who can be assigned to this task (from TaskManage)
        available_employees = User.objects.filter(
            task_manages__task=task,
            role='employee',
            status='active'
        ).distinct().order_by('full_name', 'username')
        
        # Get current assignments for this land and task
        current_assignments = AssignedTask.objects.filter(
            land=land,
            task=task
        ).select_related('employee')
        
        # Create a set of currently assigned employee IDs for quick lookup
        assigned_employee_ids = {assignment.employee.id for assignment in current_assignments}
        
        # Format the data - include all available employees with their current status
        all_employees = []
        for employee in available_employees:
            # Check if this employee is currently assigned to this land+task
            current_assignment = current_assignments.filter(employee=employee).first()
            
            if current_assignment:
                # Employee is currently assigned
                all_employees.append({
                    'id': employee.id,
                    'employee_name': employee.full_name or employee.username,
                    'status': current_assignment.status,
                    'is_assigned': True,
                    'assigned_date': current_assignment.assigned_date.strftime('%Y-%m-%d %H:%M'),
                    'completed_date': current_assignment.completed_date.strftime('%Y-%m-%d %H:%M') if current_assignment.completed_date else None
                })
            else:
                # Employee is available but not currently assigned
                all_employees.append({
                    'id': employee.id,
                    'employee_name': employee.full_name or employee.username,
                    'status': 'available',
                    'is_assigned': False,
                    'assigned_date': None,
                    'completed_date': None
                })
        
        return JsonResponse({
            'success': True,
            'assigned_employees': all_employees,
            'land_name': land.name,
            'task_name': task.name,
            'total_available': len(all_employees),
            'currently_assigned': len([emp for emp in all_employees if emp['is_assigned']])
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error fetching employee assignments: {str(e)}'})

@login_required
def get_land_details_for_edit(request, land_id):
    """
    Get land details including assigned tasks for the edit modal
    """
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized access'})
    
    try:
        from .models import Land, AssignedTask
        
        # Get the land
        land = get_object_or_404(Land, id=land_id)
        
        # Get assigned tasks for this land
        assigned_tasks = AssignedTask.objects.filter(
            land=land
        ).select_related('task', 'employee').order_by('task__name')
        
        # Format assigned tasks data
        assigned_tasks_data = []
        for assigned_task in assigned_tasks:
            # Get all available employees for this task from TaskManage
            from .models import TaskManage
            task_manages = TaskManage.objects.filter(task=assigned_task.task).select_related('employee')
            
            # Get all available employee names for this task
            available_employees = []
            for tm in task_manages:
                emp_name = tm.employee.full_name or tm.employee.username
                available_employees.append(emp_name)
            
            assigned_tasks_data.append({
                'task_id': assigned_task.task.id,
                'task_name': assigned_task.task.name,
                'employee_name': assigned_task.employee.full_name or assigned_task.employee.username,
                'available_employees': available_employees,
                'completion_days': assigned_task.completion_days,
                'status': assigned_task.status,
                'assigned_date': assigned_task.assigned_date.strftime('%Y-%m-%d %H:%M') if assigned_task.assigned_date else None,
                'due_date': assigned_task.due_date.strftime('%Y-%m-%d %H:%M') if assigned_task.due_date else None
            })
        
        # Format land data
        land_data = {
            'id': land.id,
            'name': land.name,
            'state': land.state,
            'district': land.district.name,
            'taluka': land.taluka.name,
            'village_name': land.village.name,
            'old_sr_no': land.old_sr_no,
            'new_sr_no': land.new_sr_no,
            'sata_prakar': land.sata_prakar,
            'built_up_area': str(land.built_up_area),
            'unutilized_area': str(land.unutilized_area),
            'total_area': str(land.total_area),
            'past_date': land.past_date.strftime('%Y-%m-%d') if land.past_date else None,
            'soda_tarikh': land.soda_tarikh.strftime('%Y-%m-%d') if land.soda_tarikh else None,
            'banakhat_tarikh': land.banakhat_tarikh.strftime('%Y-%m-%d') if land.banakhat_tarikh else None,
            'dastavej_tarikh': land.dastavej_tarikh.strftime('%Y-%m-%d') if land.dastavej_tarikh else None,
            'broker_name': land.broker_name,
            'selected_tasks': land.selected_tasks,
            'assigned_tasks': assigned_tasks_data
        }
        
        return JsonResponse({
            'success': True,
            'land': land_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': f'Error fetching land details: {str(e)}'
        })

@login_required
def get_employees_for_tasks(request):
    """
    Get employees for task assignment (excluding marketing type)
    """
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized access'})
    
    try:
        from .models import User
        
        # Get all active employees excluding marketing type
        employees = User.objects.filter(
            role='employee', 
            status='active'
        ).exclude(
            employee_type='marketing'
        ).order_by('full_name', 'username')
        
        # Format employee data
        employees_data = []
        for employee in employees:
            employees_data.append({
                'id': employee.id,
                'username': employee.username,
                'full_name': employee.full_name,
                'employee_type': employee.employee_type,
                'email': employee.email,
                'status': employee.status
            })
        
        return JsonResponse({
            'success': True,
            'employees': employees_data,
            'count': len(employees_data)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': f'Error fetching employees: {str(e)}'
        })

@login_required
def approve_task_completion(request, task_id):
    """
    Admin approves or rejects a task completion request
    """
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized access'})
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    try:
        from .models import AssignedTask
        
        # Get the assigned task
        assigned_task = get_object_or_404(AssignedTask, id=task_id)
        
        # Get action and notes from request
        action = request.POST.get('action')  # 'approve' or 'reject'
        admin_notes = request.POST.get('admin_notes', '')
        
        if action == 'approve':
            # Approve the task completion
            assigned_task.approve_completion(admin_notes)
            
            # Find all other employees assigned to the same task on the same land and complete their tasks too
            same_task_assignments = AssignedTask.objects.filter(
                land=assigned_task.land,
                task=assigned_task.task,
                status__in=['pending_approval', 'in_progress', 'pending']
            ).exclude(id=assigned_task.id)
            
            # Complete all other assignments for the same task
            completed_count = 0
            for other_assignment in same_task_assignments:
                other_assignment.status = 'complete'
                other_assignment.completed_date = timezone.now()
                other_assignment.admin_approval_notes = f"Auto-completed: Task approved for {assigned_task.employee.get_display_name()}"
                other_assignment.save()
                completed_count += 1
                
                # Create notification for each affected employee
                Notification.objects.create(
                    user=other_assignment.employee,
                    message=f"Task '{other_assignment.task.name}' has been completed (approved for team member {assigned_task.employee.get_display_name()})"
                )
            
            if completed_count > 0:
                message = f'Task "{assigned_task.task.name}" approved successfully! Also completed for {completed_count} other team member(s).'
            else:
                message = f'Task "{assigned_task.task.name}" approved successfully!'
            status = 'complete'
        elif action == 'reject':
            # Reject the task completion
            assigned_task.reject_completion(admin_notes)
            message = f'Task "{assigned_task.task.name}" rejected and returned to employee.'
            status = 'in_progress'
        else:
            return JsonResponse({'success': False, 'message': 'Invalid action specified'})
        
        return JsonResponse({
            'success': True,
            'message': message,
            'task_id': task_id,
            'new_status': status
        })
        
    except AssignedTask.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Task not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error processing request: {str(e)}'})

# --- Admin Assigned Tasks API Views ---

@login_required
def admin_assigned_tasks_api(request):
    """API endpoint for admin to get all assigned tasks with filtering and pagination"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'error': 'Unauthorized access'}, status=403)
    
    try:
        from .models import AssignedTask
        from django.core.paginator import Paginator
        from django.db.models import Q
        
        # Get query parameters
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        status_filter = request.GET.get('status', '')
        task_filter = request.GET.get('task', '')
        employee_filter = request.GET.get('employee', '')
        land_filter = request.GET.get('land', '')
        search_query = request.GET.get('search', '')
        
        # Build queryset
        queryset = AssignedTask.objects.select_related(
            'task', 'land', 'employee'
        ).all()
        
        # Apply filters
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if task_filter:
            queryset = queryset.filter(task_id=task_filter)
        
        if employee_filter:
            queryset = queryset.filter(employee_id=employee_filter)
        
        if land_filter:
            queryset = queryset.filter(land_id=land_filter)
        
        if search_query:
            queryset = queryset.filter(
                Q(task__name__icontains=search_query) |
                Q(land__name__icontains=search_query) |
                Q(land__village__name__icontains=search_query) |
                Q(employee__full_name__icontains=search_query) |
                Q(employee__username__icontains=search_query)
            )
        
        # Order by assigned date (newest first)
        queryset = queryset.order_by('-assigned_date')
        
        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        # Serialize data
        tasks_data = []
        for task in page_obj:
            task_data = {
                'id': task.id,
                'task': {
                    'id': task.task.id,
                    'name': task.task.name,
                    'position': task.task.position
                },
                'land': {
                    'id': task.land.id,
                    'name': task.land.name,
                    'village_name': task.land.village.name,
                    'taluka': task.land.taluka.name,
                    'district': task.land.district.name,
                    'total_area': str(task.land.total_area) if task.land.total_area else None
                },
                'employee': {
                    'id': task.employee.id,
                    'username': task.employee.username,
                    'full_name': task.employee.full_name,
                    'employee_type': task.employee.employee_type,
                    'location': task.employee.location
                },
                'status': task.status,
                'assigned_date': task.assigned_date.isoformat(),
                'due_date': task.due_date.isoformat() if task.due_date else None,
                'completion_days': task.completion_days,
                'started_date': task.started_date.isoformat() if task.started_date else None,
                'completed_date': task.completed_date.isoformat() if task.completed_date else None,
                'completion_notes': task.completion_notes,
                'completion_photos': task.completion_photos.url if task.completion_photos else None,
                'completion_pdf': task.completion_pdf.url if task.completion_pdf else None,
                'completion_submitted_date': task.completion_submitted_date.isoformat() if task.completion_submitted_date else None,
                'admin_approval_date': task.admin_approval_date.isoformat() if task.admin_approval_date else None,
                'admin_approval_notes': task.admin_approval_notes
            }
            tasks_data.append(task_data)
        
        return JsonResponse({
            'count': paginator.count,
            'total_pages': paginator.num_pages,
            'current_page': page,
            'results': tasks_data
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def admin_assigned_tasks_statistics_api(request):
    """API endpoint for admin to get assigned tasks statistics"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'error': 'Unauthorized access'}, status=403)
    
    try:
        from .models import AssignedTask
        
        # Get counts for each status
        stats = {
            'pending': AssignedTask.objects.filter(status='pending').count(),
            'in_progress': AssignedTask.objects.filter(status='in_progress').count(),
            'pending_approval': AssignedTask.objects.filter(status='pending_approval').count(),
            'complete': AssignedTask.objects.filter(status='complete').count(),
            'total': AssignedTask.objects.count()
        }
        
        return JsonResponse(stats)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def admin_assigned_task_detail_api(request, task_id):
    """API endpoint for admin to get detailed information about a specific assigned task"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'error': 'Unauthorized access'}, status=403)
    
    try:
        from .models import AssignedTask
        
        task = get_object_or_404(AssignedTask, id=task_id)
        
        task_data = {
            'id': task.id,
            'task': {
                'id': task.task.id,
                'name': task.task.name,
                'position': task.task.position,
                'completion_days': task.task.completion_days
            },
            'land': {
                'id': task.land.id,
                'name': task.land.name,
                'village_name': task.land.village.name,
                'taluka': task.land.taluka.name,
                'district': task.land.district.name,
                'state': task.land.state,
                'old_sr_no': task.land.old_sr_no,
                'new_sr_no': task.land.new_sr_no,
                'sata_prakar': task.land.sata_prakar,
                'built_up_area': str(task.land.built_up_area) if task.land.built_up_area else None,
                'unutilized_area': str(task.land.unutilized_area) if task.land.unutilized_area else None,
                'total_area': str(task.land.total_area) if task.land.total_area else None,
                'broker_name': task.land.broker_name,
                'past_date': task.land.past_date.strftime('%Y-%m-%d') if task.land.past_date else None,
                'soda_tarikh': task.land.soda_tarikh.strftime('%Y-%m-%d') if task.land.soda_tarikh else None,
                'banakhat_tarikh': task.land.banakhat_tarikh.strftime('%Y-%m-%d') if task.land.banakhat_tarikh else None,
                'dastavej_tarikh': task.land.dastavej_tarikh.strftime('%Y-%m-%d') if task.land.dastavej_tarikh else None
            },
            'employee': {
                'id': task.employee.id,
                'username': task.employee.username,
                'full_name': task.employee.full_name,
                'email': task.employee.email,
                'mobile': task.employee.mobile,
                'employee_type': dict(User.EMPLOYEE_TYPE_CHOICES).get(task.employee.employee_type, task.employee.employee_type) if task.employee.employee_type else 'Not specified',
                'location': task.employee.location if task.employee.location else 'Not specified',
                'address': task.employee.address
            },
            'status': task.status,
            'assigned_date': task.assigned_date.isoformat(),
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'completion_days': task.completion_days,
            'started_date': task.started_date.isoformat() if task.started_date else None,
            'completed_date': task.completed_date.isoformat() if task.completed_date else None,
            'completion_notes': task.completion_notes,
            'completion_photos': task.completion_photos.url if task.completion_photos else None,
            'completion_pdf': task.completion_pdf.url if task.completion_pdf else None,
            'completion_submitted_date': task.completion_submitted_date.isoformat() if task.completion_submitted_date else None,
            'admin_approval_date': task.admin_approval_date.isoformat() if task.admin_approval_date else None,
            'admin_approval_notes': task.admin_approval_notes
        }
        
        return JsonResponse(task_data)
        
    except AssignedTask.DoesNotExist:
        return JsonResponse({'error': 'Task not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def get_employee_tasks_api(request, employee_id):
    """API endpoint to get all marketing tasks (not employee-specific)"""
    # Allow admin and marketing employees to access this endpoint
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        # Get the user/employee for display name
        employee = User.objects.get(id=employee_id)
        
        # Get all marketing tasks (not filtered by employee assignment)
        marketing_tasks = Task.objects.filter(
            marketing_task=True
        ).order_by('position', 'name')
        
        # Format tasks data
        tasks_data = []
        for task in marketing_tasks:
            tasks_data.append({
                'id': task.id,
                'name': task.name,
                'completion_days': task.completion_days,
                'position': task.position
            })
        
        return JsonResponse({
            'success': True,
            'employee_name': employee.full_name or employee.username,
            'tasks': tasks_data
        })
        
    except User.DoesNotExist:
        return JsonResponse({'error': 'Employee not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def admin_assigned_task_delete_api(request, task_id):
    """API endpoint for admin to delete an assigned task"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'error': 'Unauthorized access'}, status=403)
    
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        from .models import AssignedTask
        
        task = get_object_or_404(AssignedTask, id=task_id)
        
        # Prevent deletion of completed tasks
        if task.status == 'complete':
            return JsonResponse({'error': 'Cannot delete completed tasks'}, status=400)
        
        # Prevent deletion of tasks pending approval
        if task.status == 'pending_approval':
            return JsonResponse({'error': 'Cannot delete tasks pending approval. Please approve or reassign first.'}, status=400)
        
        # Store task info for logging
        task_info = f"Task {task.id}: {task.task.name} on {task.land.name} assigned to {task.employee.get_display_name()}"
        
        # Delete the task
        task.delete()
        
        return JsonResponse({
            'message': 'Task deleted successfully',
            'deleted_task': task_info
        })
        
    except AssignedTask.DoesNotExist:
        return JsonResponse({'error': 'Task not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def admin_assigned_task_approve_api(request, task_id):
    """API endpoint for admin to approve task completion from admin assigned tasks page"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'error': 'Unauthorized access'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        import json
        from .models import AssignedTask
        
        # Parse JSON data
        data = json.loads(request.body)
        admin_notes = data.get('admin_notes', '')
        
        task = get_object_or_404(AssignedTask, id=task_id)
        
        # Check if task is in pending_approval status
        if task.status != 'pending_approval':
            return JsonResponse({'error': 'Task is not in pending approval status'}, status=400)
        
        # Approve completion
        task.approve_completion(admin_notes)
        
        # Create notification for employee
        Notification.objects.create(
            user=task.employee,
            message=f"Task '{task.task.name}' completion has been approved by admin"
        )
        
        return JsonResponse({'message': 'Task approved successfully'})
        
    except AssignedTask.DoesNotExist:
        return JsonResponse({'error': 'Task not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def admin_assigned_task_reassign_api(request, task_id):
    """API endpoint for admin to reassign task from admin assigned tasks page"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'error': 'Unauthorized access'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        import json
        from .models import AssignedTask
        
        # Parse JSON data
        data = json.loads(request.body)
        reassignment_notes = data.get('reassignment_notes', '')
        
        if not reassignment_notes.strip():
            return JsonResponse({'error': 'Reassignment notes are required'}, status=400)
        
        task = get_object_or_404(AssignedTask, id=task_id)
        
        # Check if task is in pending_approval status
        if task.status != 'pending_approval':
            return JsonResponse({'error': 'Task is not in pending approval status'}, status=400)
        
        # Reassign the task
        task.status = 'in_progress'
        task.assigned_date = datetime.datetime.now()
        task.admin_approval_notes = f"Task reassigned with notes: {reassignment_notes}".strip()
        task.save()
        
        # Create notification for employee
        Notification.objects.create(
            user=task.employee,
            message=f"Task '{task.task.name}' has been reassigned to you with new instructions"
        )
        
        return JsonResponse({'message': 'Task reassigned successfully'})
        
    except AssignedTask.DoesNotExist:
        return JsonResponse({'error': 'Task not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def admin_assigned_task_mark_complete_api(request, task_id):
    """API endpoint for admin to manually mark a task as complete"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'error': 'Unauthorized access'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        import json
        from .models import AssignedTask
        
        # Parse JSON data
        data = json.loads(request.body)
        mark_complete_notes = data.get('mark_complete_notes', '')
        
        task = get_object_or_404(AssignedTask, id=task_id)
        
        # Check if task can be marked complete
        if task.status == 'complete':
            return JsonResponse({'error': 'Task is already complete'}, status=400)
        
        if task.status == 'pending_approval':
            return JsonResponse({'error': 'Task is pending approval. Please approve or reassign instead.'}, status=400)
        
        # Mark task as complete with admin notes
        task.status = 'complete'
        task.completed_date = datetime.datetime.now()
        task.admin_approval_date = datetime.datetime.now()
        task.admin_approval_notes = f"Task manually marked complete by admin: {mark_complete_notes}".strip()
        task.save()
        
        # Create notification for employee
        Notification.objects.create(
            user=task.employee,
            message=f"Task '{task.task.name}' has been manually marked as complete by admin"
        )
        
        return JsonResponse({'message': 'Task marked as complete successfully'})
        
    except AssignedTask.DoesNotExist:
        return JsonResponse({'error': 'Task not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def admin_assigned_tasks_export_api(request):
    """API endpoint for admin to export assigned tasks data"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'error': 'Unauthorized access'}, status=403)
    
    try:
        from .models import AssignedTask
        from django.db.models import Q
        import csv
        from django.http import HttpResponse
        
        # Get filter parameters
        status_filter = request.GET.get('status', '')
        task_filter = request.GET.get('task', '')
        employee_filter = request.GET.get('employee', '')
        land_filter = request.GET.get('land', '')
        search_query = request.GET.get('search', '')
        
        # Build queryset
        queryset = AssignedTask.objects.select_related(
            'task', 'land', 'employee'
        ).all()
        
        # Apply filters
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if task_filter:
            queryset = queryset.filter(task_id=task_filter)
        
        if employee_filter:
            queryset = queryset.filter(employee_id=employee_filter)
        
        if land_filter:
            queryset = queryset.filter(land_id=land_filter)
        
        if search_query:
            queryset = queryset.filter(
                Q(task__name__icontains=search_query) |
                Q(land__name__icontains=search_query) |
                Q(land__village__name__icontains=search_query) |
                Q(employee__full_name__icontains=search_query) |
                Q(employee__username__icontains=search_query)
            )
        
        # Order by assigned date
        queryset = queryset.order_by('-assigned_date')
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="assigned_tasks_{datetime.datetime.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        
        # Write header
        writer.writerow([
            'Task ID', 'Task Name', 'Land Name', 'Village', 'Taluka', 'District',
            'Employee Name', 'Employee Type', 'Status', 'Assigned Date', 'Due Date',
            'Completion Days', 'Started Date', 'Completed Date', 'Completion Notes'
        ])
        
        # Write data rows
        for task in queryset:
            writer.writerow([
                task.id,
                task.task.name,
                task.land.name,
                task.land.village.name,
                task.land.taluka.name,
                task.land.district.name,
                task.employee.full_name or task.employee.username,
                task.employee.employee_type or 'N/A',
                task.status,
                task.assigned_date.strftime('%Y-%m-%d %H:%M') if task.assigned_date else '',
                task.due_date.strftime('%Y-%m-%d %H:%M') if task.due_date else '',
                task.completion_days or '',
                task.started_date.strftime('%Y-%m-%d %H:%M') if task.started_date else '',
                task.completed_date.strftime('%Y-%m-%d %H:%M') if task.completed_date else '',
                task.completion_notes or ''
            ])
        
        return response
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def get_tasks_api(request):
    """API endpoint to get all tasks for filtering"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Unauthorized access'}, status=403)
    
    try:
        from .models import Task
        tasks = Task.objects.all().order_by('name')
        
        print(f"Found {tasks.count()} tasks in database")
        
        tasks_data = []
        for task in tasks:
            task_data = {
                'id': task.id,
                'name': task.name,
                'position': task.position
            }
            tasks_data.append(task_data)
        
        print(f"Returning {len(tasks_data)} task records")
        return JsonResponse(tasks_data, safe=False)
        
    except Exception as e:
        print(f"Error in get_tasks_api: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

# --- Advocate Views ---
@login_required
def advocate_list(request):
    """View for the advocate list page"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    
    advocates = Advocate.objects.all().order_by('name')
    context = {
        'advocates': advocates
    }
    return render(request, 'advocate.html', context)

@login_required
def advocate_api(request):
    """API endpoint to get all advocates"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'error': 'Unauthorized access'}, status=403)
    
    try:
        advocates = Advocate.objects.all().order_by('name')
        advocates_data = []
        
        for advocate in advocates:
            advocate_data = {
                'id': advocate.id,
                'name': advocate.name,
                'created_at': advocate.created_at.isoformat() if advocate.created_at else None,
                'updated_at': advocate.updated_at.isoformat() if advocate.updated_at else None
            }
            advocates_data.append(advocate_data)
        
        return JsonResponse({'advocates': advocates_data})
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def advocate_create_api(request):
    """API endpoint to create a new advocate"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'error': 'Unauthorized access'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        name = data.get('name', '').strip()
        
        if not name:
            return JsonResponse({'error': 'Name is required'}, status=400)
        
        # Check if advocate with same name already exists
        if Advocate.objects.filter(name__iexact=name).exists():
            return JsonResponse({'error': 'An advocate with this name already exists'}, status=400)
        
        advocate = Advocate.objects.create(name=name)
        
        advocate_data = {
            'id': advocate.id,
            'name': advocate.name,
            'created_at': advocate.created_at.isoformat() if advocate.created_at else None,
            'updated_at': advocate.updated_at.isoformat() if advocate.updated_at else None
        }
        
        return JsonResponse({
            'success': True,
            'message': 'Advocate created successfully',
            'advocate': advocate_data
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def advocate_update_api(request, advocate_id):
    """API endpoint to update an existing advocate"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'error': 'Unauthorized access'}, status=403)
    
    if request.method != 'PUT':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        advocate = get_object_or_404(Advocate, id=advocate_id)
        data = json.loads(request.body)
        name = data.get('name', '').strip()
        
        if not name:
            return JsonResponse({'error': 'Name is required'}, status=400)
        
        # Check if another advocate with same name already exists
        if Advocate.objects.filter(name__iexact=name).exclude(id=advocate_id).exists():
            return JsonResponse({'error': 'Another advocate with this name already exists'}, status=400)
        
        advocate.name = name
        advocate.save()
        
        advocate_data = {
            'id': advocate.id,
            'name': advocate.name,
            'created_at': advocate.created_at.isoformat() if advocate.created_at else None,
            'updated_at': advocate.updated_at.isoformat() if advocate.updated_at else None
        }
        
        return JsonResponse({
            'success': True,
            'message': 'Advocate updated successfully',
            'advocate': advocate_data
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def advocate_delete_api(request, advocate_id):
    """API endpoint to delete an advocate (hard delete)"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'error': 'Unauthorized access'}, status=403)
    
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        advocate = get_object_or_404(Advocate, id=advocate_id)
        advocate.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Advocate deleted successfully'
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# --- Location API Views ---
@login_required
def location_api(request):
    """API endpoint to get all districts for Gujarat"""
    if request.method == 'GET':
        try:
            districts = District.objects.filter(state='Gujarat').order_by('name')
            district_data = [{'id': district.id, 'name': district.name} for district in districts]
            return JsonResponse({'success': True, 'districts': district_data})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Method not allowed'})

@login_required
def taluka_api(request, district_id):
    """API endpoint to get talukas for a specific district"""
    if request.method == 'GET':
        try:
            talukas = Taluka.objects.filter(district_id=district_id).order_by('name')
            taluka_data = [{'id': taluka.id, 'name': taluka.name} for taluka in talukas]
            return JsonResponse({'success': True, 'talukas': taluka_data})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Method not allowed'})

@login_required
def village_api(request, taluka_id):
    """API endpoint to get villages for a specific taluka"""
    if request.method == 'GET':
        try:
            villages = Village.objects.filter(taluka_id=taluka_id).order_by('name')
            village_data = [{'id': village.id, 'name': village.name} for village in villages]
            return JsonResponse({'success': True, 'villages': village_data})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Method not allowed'})

@login_required
def add_village_api(request):
    """API endpoint to add a new village"""
    if request.method == 'POST':
        try:
            taluka_id = request.POST.get('taluka')
            village_name = request.POST.get('village_name')
            
            if not taluka_id or not village_name:
                return JsonResponse({'success': False, 'error': 'Taluka and village name are required'})
            
            taluka = Taluka.objects.get(id=taluka_id)
            
            # Check if village already exists in this taluka
            if Village.objects.filter(name=village_name, taluka=taluka).exists():
                return JsonResponse({
                    'success': False, 
                    'error': f'Village "{village_name}" already exists in taluka "{taluka.name}". Please use a different name or select a different taluka.'
                })
            
            village = Village.objects.create(name=village_name, taluka=taluka)
            
            return JsonResponse({
                'success': True, 
                'village': {'id': village.id, 'name': village.name},
                'message': 'Village added successfully'
            })
        except Taluka.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Taluka not found'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Method not allowed'})

# --- Village Management API Views ---
@login_required
def village_list_api(request):
    """API endpoint to get all villages with taluka and district information"""
    if request.method == 'GET':
        try:
            villages = Village.objects.select_related('taluka__district').all().order_by('taluka__district__name', 'taluka__name', 'name')
            village_data = []
            
            for village in villages:
                village_data.append({
                    'id': village.id,
                    'name': village.name,
                    'taluka_name': village.taluka.name,
                    'district_name': village.taluka.district.name,
                    'created_at': village.created_at.isoformat() if village.created_at else None
                })
            
            return JsonResponse({'success': True, 'villages': village_data})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Method not allowed'})



@login_required
def village_management_view(request):
    """View for the village management page"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('login')
    
    return render(request, 'village_management.html')

@login_required
def add_district_api(request):
    """API endpoint to add a new district"""
    if request.method == 'POST':
        try:
            district_name = request.POST.get('district_name')
            state = request.POST.get('state', 'Gujarat')
            
            if not district_name:
                return JsonResponse({'success': False, 'error': 'District name is required'})
            
            # Check if district already exists
            if District.objects.filter(name=district_name).exists():
                return JsonResponse({'success': False, 'error': 'District already exists'})
            
            district = District.objects.create(name=district_name, state=state)
            
            return JsonResponse({
                'success': True, 
                'district': {'id': district.id, 'name': district.name, 'state': district.state},
                'message': 'District added successfully'
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Method not allowed'})

@login_required
def add_taluka_api(request):
    """API endpoint to add a new taluka"""
    if request.method == 'POST':
        try:
            taluka_name = request.POST.get('taluka_name')
            district_id = request.POST.get('district_id')
            
            if not taluka_name or not district_id:
                return JsonResponse({'success': False, 'error': 'Taluka name and district are required'})
            
            try:
                district = District.objects.get(id=district_id)
            except District.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'District not found'})
            
            # Check if taluka already exists in this district
            if Taluka.objects.filter(name=taluka_name, district=district).exists():
                return JsonResponse({'success': False, 'error': 'Taluka already exists in this district'})
            
            taluka = Taluka.objects.create(name=taluka_name, district=district)
            
            return JsonResponse({
                'success': True, 
                'taluka': {'id': taluka.id, 'name': taluka.name, 'district': district.name},
                'message': 'Taluka added successfully'
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Method not allowed'})

@login_required
def district_list_api(request):
    """API endpoint to get all districts"""
    if request.method == 'GET':
        try:
            districts = District.objects.all().order_by('name')
            district_data = [{'id': district.id, 'name': district.name, 'state': district.state} for district in districts]
            return JsonResponse({'success': True, 'districts': district_data})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Method not allowed'})

@login_required
def taluka_list_api(request):
    """API endpoint to get all talukas with district information"""
    if request.method == 'GET':
        try:
            talukas = Taluka.objects.select_related('district').all().order_by('district__name', 'name')
            taluka_data = []
            
            for taluka in talukas:
                taluka_data.append({
                    'id': taluka.id,
                    'name': taluka.name,
                    'district_name': taluka.district.name,
                    'district_id': taluka.district.id,
                    'state': taluka.district.state
                })
            
            return JsonResponse({'success': True, 'talukas': taluka_data})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Method not allowed'})

@login_required
def assign_task_to_land(request):
    """AJAX view to assign an existing task to a specific land with an employee"""
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    if request.method == 'POST':
        try:
            from .models import Task, User, Land, AssignedTask
            
            task_name = request.POST.get('task_name')
            position = request.POST.get('position')
            assign_employee = request.POST.get('assign_employee')
            is_default = request.POST.get('is_default')
            completion_days = request.POST.get('completion_days')
            land_id = request.POST.get('land_id')
            
            if not all([task_name, position, assign_employee, is_default, completion_days, land_id]):
                return JsonResponse({'success': False, 'message': 'All required fields must be filled'})
            
            # Validate land exists
            try:
                land = Land.objects.get(id=land_id)
            except Land.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Land not found'})
            
            # Validate employee exists
            try:
                employee = User.objects.get(id=assign_employee, role='employee')
            except User.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Employee not found'})
            
            # Convert completion_days to integer
            try:
                completion_days_int = int(completion_days)
                if completion_days_int < 0:
                    return JsonResponse({'success': False, 'message': 'Completion days must be 0 or greater'})
            except ValueError:
                return JsonResponse({'success': False, 'message': 'Completion days must be a valid number'})
            
            # Check if task already exists with this name
            task, created = Task.objects.get_or_create(
                name=task_name,
                defaults={
                    'position': int(position),
                    'is_default': is_default.lower() == 'true',
                    'completion_days': completion_days_int
                }
            )
            
            # If task was created, also create TaskManage record
            if created:
                from .models import TaskManage
                TaskManage.objects.create(
                    task=task,
                    employee=employee
                )
            
            # Check if this task is already assigned to this land for this employee
            existing_assignment = AssignedTask.objects.filter(
                land=land,
                task=task,
                employee=employee
            ).first()
            
            if existing_assignment:
                return JsonResponse({'success': False, 'message': 'This task is already assigned to this land for this employee'})
            
            # Create the AssignedTask
            assigned_task = AssignedTask.objects.create(
                land=land,
                task=task,
                employee=employee,
                status='pending',
                completion_days=completion_days_int,
                assigned_date=timezone.now()
            )
            
            return JsonResponse({
                'success': True,
                'message': f'Task "{task_name}" assigned to land "{land.name}" for employee "{employee.get_display_name()}" successfully!',
                'assigned_task_id': assigned_task.id
            })
            
        except Exception as e:
            print(f"Error in assign_task_to_land: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})

# --- Send Land to Inventory ---
@login_required
def send_land_to_inventory(request, land_id):
    if request.method == 'POST':
        try:
            # Check if user is admin
            if not request.user.is_authenticated or request.user.role != 'admin':
                return JsonResponse({'success': False, 'error': 'Unauthorized access'}, status=403)
            
            # Get the land object
            try:
                land = Land.objects.get(id=land_id)
            except Land.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Land not found'}, status=404)
            
            # Check if land is already in inventory
            if land.status == 'inventory':
                return JsonResponse({'success': False, 'error': 'Land is already in inventory'}, status=400)
            
            # Update land status to inventory
            land.status = 'inventory'
            land.save()
            
            # Create notification for all admins
            admin_users = User.objects.filter(role='admin')
            for admin in admin_users:
                Notification.objects.create(
                    user=admin,
                    message=f"Land {land.id} - {land.name} has been moved to inventory by {request.user.username}"
                )
            
            return JsonResponse({
                'success': True,
                'message': f'Land {land.id} - {land.name} has been successfully moved to inventory',
                'land_id': land.id,
                'land_name': land.name,
                'new_status': land.status
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

# --- Inventory Management ---
@login_required
def inventory_land(request):
    # Allow admin and marketing employees to access inventory
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        return redirect('login')
    
    # Get only lands with 'inventory' status (lands ready for sale)
    inventory_lands = Land.objects.filter(status='inventory').order_by('-id')
    
    # Debug: Print land statuses to verify database fetching
    print("DEBUG: Fetching land statuses from core_land table:")
    for land in inventory_lands:
        print(f"  Land ID: {land.id}, Status: {land.status}, Name: {land.name}")
    
    # Add sale information to each land
    for land in inventory_lands:
        # Get the most recent sale for this land
        from .models import LandSale
        land_sale = LandSale.objects.filter(land=land).order_by('-created_at').first()
        land.has_sale = land_sale is not None
        if land_sale:
            land.sale_info = {
                'buyer_name': land_sale.buyer_name,
                'sale_date': land_sale.sale_date,
                'status': land_sale.status
            }
        else:
            land.sale_info = None
    
    # Get all sata prakar for filtering
    from .models import SataPrakar, Client, Task
    sata_prakar_list = SataPrakar.objects.all().order_by('name')
    
    # Get all clients for the sell land modal
    clients = Client.objects.all().order_by('client_name')
    
    # Get all marketing tasks for the task assignment dropdown in sell land modal
    all_tasks = Task.objects.filter(marketing_task=True).order_by('position', 'name')
    
    # Get marketing employees for the sell land modal
    if request.user.role == 'admin':
        marketing_employees = User.objects.filter(role='employee', employee_type='marketing', status='active').order_by('full_name', 'username')
    else:
        # Marketing employees see only themselves
        marketing_employees = User.objects.filter(id=request.user.id, role='employee', employee_type='marketing', status='active')
    
    # Calculate statistics
    total_inventory_lands = inventory_lands.count()
    total_area_inventory = sum(land.total_area for land in inventory_lands)
    
    # Count lands by status in inventory
    sold_in_inventory = sum(1 for land in inventory_lands if land.status == 'sold')
    in_process_in_inventory = sum(1 for land in inventory_lands if land.status == 'in_process')
    inventory_only = sum(1 for land in inventory_lands if land.status == 'inventory')
    
    # Debug: Print statistics calculation
    print(f"DEBUG: Statistics from core_land table:")
    print(f"  Inventory only: {inventory_only}")
    print(f"  In process: {in_process_in_inventory}")
    print(f"  Sold: {sold_in_inventory}")
    print(f"  Total: {total_inventory_lands}")
    print(f"DEBUG: Sold lands will remain in inventory page (not moved to admin_land)")
    
    # Get status distribution
    status_distribution = {
        'inventory': inventory_only,
        'sold_in_inventory': sold_in_inventory,
        'active': Land.objects.filter(status='active').count(),
        'sold': Land.objects.filter(status='sold').count(),
        'archived': Land.objects.filter(status='archived').count(),
    }
    
    context = {
        'inventory_lands': inventory_lands,
        'sata_prakar_list': sata_prakar_list,
        'clients': clients,
        'marketing_employees': marketing_employees,
        'all_tasks': all_tasks,
        'total_inventory_lands': total_inventory_lands,
        'total_area_inventory': total_area_inventory,
        'sold_in_inventory': sold_in_inventory,
        'in_process_in_inventory': in_process_in_inventory,
        'inventory_only': inventory_only,
        'status_distribution': status_distribution,
    }
    
    return render(request, 'inventory.html', context)


@login_required
def sold_land(request):
    # Allow admin and marketing employees to access sold lands
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        return redirect('login')
    
    # Filter lands based on user role and marketing employee who sold them
    if request.user.role == 'admin':
        # Admin can see all sold and in_process lands
        sold_lands = Land.objects.filter(status__in=['sold', 'in_process']).order_by('-id')
        print("DEBUG: Admin user - showing all sold lands")
    elif request.user.role == 'employee' and request.user.employee_type == 'marketing':
        # Marketing employees can only see lands they sold
        from .models import LandSale
        # Get lands that have sales records with current user as marketing_employee
        sold_land_ids = LandSale.objects.filter(
            marketing_employee=request.user
        ).values_list('land_id', flat=True)
        
        sold_lands = Land.objects.filter(
            id__in=sold_land_ids,
            status__in=['sold', 'in_process']
        ).order_by('-id')
        
        print(f"DEBUG: Marketing employee {request.user.username} - showing only their sold lands")
        print(f"DEBUG: Found {len(sold_land_ids)} land sales for this marketing employee")
    else:
        # Fallback - no lands for other user types
        sold_lands = Land.objects.none()
        print("DEBUG: User type not authorized - showing no lands")
    
    # Debug: Print land statuses to verify database fetching
    print("DEBUG: Fetching sold land statuses from core_land table:")
    for land in sold_lands:
        print(f"  Land ID: {land.id}, Status: {land.status}, Name: {land.name}")
    
    # Add sale information to each land
    for land in sold_lands:
        # Get the most recent sale for this land
        from .models import LandSale
        land_sale = LandSale.objects.filter(land=land).order_by('-created_at').first()
        land.has_sale = land_sale is not None
        if land_sale:
            land.sale_info = {
                'buyer_name': land_sale.buyer_name,
                'sale_date': land_sale.sale_date,
                'status': land_sale.status,
                'marketing_employee_name': land_sale.marketing_employee.full_name if land_sale.marketing_employee else None,
                'notes': land_sale.notes
            }
        else:
            land.sale_info = None
    
    # Get all clients for sell modal
    from .models import Client
    clients = Client.objects.all().order_by('client_name')
    
    # Get marketing employees for sell modal - restrict to current user if user is marketing employee  
    if request.user.role == 'employee' and request.user.employee_type == 'marketing':
        # Marketing employees can only see themselves in the dropdown
        marketing_employees = User.objects.filter(id=request.user.id, role='employee', employee_type='marketing', status='active')
    else:
        # Admin users can see all marketing employees
        marketing_employees = User.objects.filter(role='employee', employee_type='marketing', status='active').order_by('full_name', 'username')
    
    # Get all tasks for task assignment functionality
    from .models import Task
    all_tasks = Task.objects.all().order_by('position', 'name')
    
    # Calculate statistics for sold lands
    total_sold_lands = sold_lands.count()
    in_process_lands_count = sum(1 for land in sold_lands if land.status == 'in_process')
    sold_lands_count = sum(1 for land in sold_lands if land.status == 'sold')
    
    # Calculate total revenue (placeholder - you can add actual revenue calculation)
    total_revenue = 0  # This can be calculated from actual sale amounts if available
    
    # Debug: Print statistics calculation
    print(f"DEBUG: Sold lands statistics:")
    print(f"  In process: {in_process_lands_count}")
    print(f"  Sold: {sold_lands_count}")
    print(f"  Total: {total_sold_lands}")
    
    context = {
        'sold_lands': sold_lands,
        'clients': clients,
        'marketing_employees': marketing_employees,
        'all_tasks': all_tasks,
        'total_sold_lands': total_sold_lands,
        'in_process_lands_count': in_process_lands_count,
        'sold_lands_count': sold_lands_count,
        'total_revenue': total_revenue,
    }
    
    return render(request, 'sold_land.html', context)


@login_required
def land_installments(request):
    """View to display all land installments from core_installment table"""
    # Allow admin and marketing employees to access installments
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        return redirect('login')
    
    try:
        from datetime import date
        today = date.today()
        
        # Filter installments based on user role with custom sorting
        from django.db.models import Case, When, Value, IntegerField
        
        # Custom ordering: pending/overdue first (by due date), then paid installments
        custom_order = Case(
            When(status='pending', then=Value(1)),
            When(status='overdue', then=Value(1)), 
            When(status='paid', then=Value(2)),
            default=Value(3),
            output_field=IntegerField()
        )
        
        if request.user.role == 'admin':
            # Admin can see all installments - pending/overdue by due date first, then paid
            installments = Installment.objects.select_related(
                'land_sale__land__village',
                'land_sale__land__taluka', 
                'land_sale__client',
                'land_sale__marketing_employee'
            ).annotate(
                sort_priority=custom_order
            ).order_by('sort_priority', 'due_date', 'installment_number')
            print("DEBUG: Admin user - showing all installments with pending first, then paid")
        elif request.user.role == 'employee' and request.user.employee_type == 'marketing':
            # Marketing employees can only see installments for lands they sold - pending/overdue by due date first, then paid
            installments = Installment.objects.select_related(
                'land_sale__land__village',
                'land_sale__land__taluka',
                'land_sale__client',
                'land_sale__marketing_employee'
            ).filter(
                land_sale__marketing_employee=request.user
            ).annotate(
                sort_priority=custom_order
            ).order_by('sort_priority', 'due_date', 'installment_number')
            print(f"DEBUG: Marketing employee {request.user.username} - showing installments with pending first, then paid")
        else:
            # Fallback - no installments for other user types
            installments = Installment.objects.none()
            print("DEBUG: User type not authorized - showing no installments")
        
        # Since LandSale doesn't have sale_amount field, we'll display percentage as is
        # The amount calculation will be handled in the template or can be added later
        for installment in installments:
            # Set a placeholder amount or use percentage directly
            installment.amount = installment.percentage  # Display percentage as amount for now
        
        # Get unique lands for filter dropdown
        land_sales = set()
        for installment in installments:
            if installment.land_sale:
                land_sales.add(installment.land_sale)
        
        # Get all clients for filter dropdown
        all_clients = Client.objects.all().order_by('client_name')
        
        # Get all marketing employees for filter dropdown
        marketing_employees = User.objects.filter(
            role='employee', 
            employee_type='marketing'
        ).order_by('full_name')
        
        context = {
            'installments': installments,
            'land_sales': list(land_sales),
            'all_clients': all_clients,
            'marketing_employees': marketing_employees,
            'today': today,
            'user': request.user,
        }
        
        print(f"DEBUG: Found {len(installments)} installments")
        return render(request, 'land_installments.html', context)
        
    except Exception as e:
        print(f"ERROR in land_installments view: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return empty context on error
        context = {
            'installments': [],
            'land_sales': [],
            'today': date.today(),
            'user': request.user,
            'error_message': 'Error loading installments data'
        }
        return render(request, 'land_installments.html', context)


@login_required
def mark_installment_paid_api(request, installment_id):
    """API endpoint to mark installment as paid"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    # Allow admin and marketing employees
    if request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing'):
        return JsonResponse({'success': False, 'message': 'Permission denied'})
    
    try:
        import json
        from datetime import datetime
        
        data = json.loads(request.body)
        installment = Installment.objects.get(id=installment_id)
        
        # Check if marketing employee can only update their own installments
        if request.user.role == 'employee' and request.user.employee_type == 'marketing':
            if installment.land_sale.marketing_employee != request.user:
                return JsonResponse({'success': False, 'message': 'Permission denied - not your installment'})
        
        # Update installment as paid with simplified remark-only process
        remark = data.get('remark', '').strip()
        
        if not remark:
            return JsonResponse({'success': False, 'message': 'Remark is required'})
        
        installment.status = 'paid'
        installment.paid_date = datetime.now().date()
        installment.remark = remark
        installment.received_by = request.user
        
        installment.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Installment marked as paid successfully'
        })
        
    except Installment.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Installment not found'})
    except Exception as e:
        print(f"ERROR in mark_installment_paid_api: {str(e)}")
        return JsonResponse({'success': False, 'message': 'Error marking installment as paid'})


@login_required
def process_installment_payment_api(request, installment_id):
    """API endpoint to process installment payment with comprehensive details"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    # Allow admin and marketing employees
    if request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing'):
        return JsonResponse({'success': False, 'message': 'Permission denied'})
    
    try:
        from datetime import datetime
        
        installment = Installment.objects.get(id=installment_id)
        
        # Check if marketing employee can only update their own installments
        if request.user.role == 'employee' and request.user.employee_type == 'marketing':
            if installment.land_sale.marketing_employee != request.user:
                return JsonResponse({'success': False, 'message': 'Permission denied - not your installment'})
        
        # Get form data
        payment_date = request.POST.get('payment_date')
        rtgs_number = request.POST.get('rtgs_number', '')
        from_bank = request.POST.get('from_bank', '')
        utr_reference = request.POST.get('utr_reference', '')
        ifsc_code = request.POST.get('ifsc_code', '')
        bank_name = request.POST.get('bank_name', '')
        payment_remark = request.POST.get('remark', '')  # Fixed: JavaScript sends 'remark'
        cheque_photo = request.FILES.get('payment_photo')  # Fixed: JavaScript sends 'payment_photo'
        
        # Debug logging
        print(f"DEBUG - Payment data received:")
        print(f"  - payment_date: {payment_date}")
        print(f"  - remark: {payment_remark}")
        print(f"  - cheque_photo: {cheque_photo}")
        print(f"  - rtgs_number: {rtgs_number}")
        
        if not payment_date:
            return JsonResponse({'success': False, 'message': 'Payment date is required'})
        
        if not payment_remark.strip():
            return JsonResponse({'success': False, 'message': 'Payment remark is required'})
        
        # Update installment with payment record fields (matching sold_land structure)
        installment.paid_date = datetime.strptime(payment_date, '%Y-%m-%d').date()
        installment.rtgs_number = rtgs_number
        installment.from_bank = from_bank
        installment.utr_reference = utr_reference
        installment.ifsc_code = ifsc_code
        installment.bank_name = bank_name
        installment.remark = payment_remark
        
        # Handle file upload for cheque photo
        if cheque_photo:
            installment.cheque_photo = cheque_photo
            print(f"DEBUG - Cheque photo saved: {installment.cheque_photo.name}")
        
        installment.received_by = request.user
        installment.status = 'paid'
        
        installment.save()
        
        print(f"DEBUG - Installment saved successfully with remark: {installment.remark}")
        
        return JsonResponse({
            'success': True,
            'message': 'Payment processed successfully'
        })
        
    except Installment.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Installment not found'})
    except Exception as e:
        print(f"ERROR in process_installment_payment_api: {str(e)}")
        return JsonResponse({'success': False, 'message': 'Error processing payment'})


@login_required
def update_installment_api(request, installment_id):
    """API endpoint to update installment details"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    # Allow admin and marketing employees
    if request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing'):
        return JsonResponse({'success': False, 'message': 'Permission denied'})
    
    try:
        import json
        from datetime import datetime
        
        data = json.loads(request.body)
        installment = Installment.objects.get(id=installment_id)
        
        # Check if marketing employee can only update their own installments
        if request.user.role == 'employee' and request.user.employee_type == 'marketing':
            if installment.land_sale.marketing_employee != request.user:
                return JsonResponse({'success': False, 'message': 'Permission denied - not your installment'})
        
        # Update installment details
        if data.get('percentage'):
            installment.percentage = float(data.get('percentage'))
        
        if data.get('due_date'):
            installment.due_date = datetime.strptime(data.get('due_date'), '%Y-%m-%d').date()
        
        if data.get('payment_type'):
            installment.payment_type = data.get('payment_type')
        
        if data.get('notes'):
            installment.notes = data.get('notes')
        
        installment.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Installment updated successfully'
        })
        
    except Installment.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Installment not found'})
    except Exception as e:
        print(f"ERROR in update_installment_api: {str(e)}")
        return JsonResponse({'success': False, 'message': 'Error updating installment'})


@login_required
def get_installment_details_api(request, installment_id):
    """API endpoint to get installment details"""
    if request.method != 'GET':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    # Allow admin and marketing employees
    if request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing'):
        return JsonResponse({'success': False, 'message': 'Permission denied'})
    
    try:
        installment = Installment.objects.select_related(
            'land_sale__land__village',
            'land_sale__land__taluka',
            'land_sale__client',
            'land_sale__marketing_employee'
        ).get(id=installment_id)
        
        # Check if marketing employee can only view their own installments
        if request.user.role == 'employee' and request.user.employee_type == 'marketing':
            if installment.land_sale.marketing_employee != request.user:
                return JsonResponse({'success': False, 'message': 'Permission denied - not your installment'})
        
        # Calculate installment amount
        amount = 0
        if installment.land_sale and installment.land_sale.sale_amount:
            amount = (installment.percentage / 100) * installment.land_sale.sale_amount
        
        data = {
            'id': installment.id,
            'installment_number': installment.installment_number,
            'percentage': float(installment.percentage),
            'amount': float(amount),
            'due_date': installment.due_date.strftime('%Y-%m-%d') if installment.due_date else '',
            'paid_date': installment.paid_date.strftime('%Y-%m-%d') if installment.paid_date else '',
            'status': installment.status,
            'payment_type': installment.payment_type,
            'payment_reference': installment.payment_reference,
            'notes': installment.notes,
            'remark': installment.remark,
            'land_details': {
                'land_number': installment.land_sale.land.land_number if installment.land_sale.land else '',
                'village': installment.land_sale.land.village.name if installment.land_sale.land and installment.land_sale.land.village else '',
                'taluka': installment.land_sale.land.taluka.name if installment.land_sale.land and installment.land_sale.land.taluka else '',
            },
            'client_details': {
                'name': installment.land_sale.client.client_name if installment.land_sale.client else '',
                'phone': installment.land_sale.client.phone if installment.land_sale.client else '',
            },
            'marketing_employee': {
                'name': installment.land_sale.marketing_employee.full_name if installment.land_sale.marketing_employee else '',
                'username': installment.land_sale.marketing_employee.username if installment.land_sale.marketing_employee else '',
            }
        }
        
        return JsonResponse({
            'success': True,
            'data': data
        })
        
    except Installment.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Installment not found'})
    except Exception as e:
        print(f"ERROR in get_installment_details_api: {str(e)}")
        return JsonResponse({'success': False, 'message': 'Error fetching installment details'})


@login_required
def get_land_status_api(request, land_id):
    """API endpoint to get land status directly from database"""
    if request.method != 'GET':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    if request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Permission denied'})
    
    try:
        land = Land.objects.get(id=land_id)
        return JsonResponse({
            'success': True,
            'land_id': land.id,
            'land_name': land.name,
            'status': land.status,
            'status_display': land.get_status_display() if hasattr(land, 'get_status_display') else land.status
        })
    except Land.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Land not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error: {str(e)}'})

# --- Restore Land from Inventory ---
@login_required
def restore_land_from_inventory(request, land_id):
    if request.method == 'POST':
        try:
            # Check if user is admin
            if not request.user.is_authenticated or request.user.role != 'admin':
                return JsonResponse({'success': False, 'error': 'Unauthorized access'}, status=403)
            
            # Get the land object
            try:
                land = Land.objects.get(id=land_id)
            except Land.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Land not found'}, status=404)
            
            # Check if land is in inventory
            if land.status != 'inventory':
                return JsonResponse({'success': False, 'error': 'Land is not in inventory'}, status=400)
            
            # Update land status to active
            land.status = 'active'
            land.save()
            
            # Create notification for all admins
            admin_users = User.objects.filter(role='admin')
            for admin in admin_users:
                Notification.objects.create(
                    user=admin,
                    message=f"Land {land.id} - {land.name} has been restored from inventory by {request.user.username}"
                )
            
            return JsonResponse({
                'success': True,
                'message': f'Land {land.id} - {land.name} has been successfully restored from inventory',
                'land_id': land.id,
                'land_name': land.name,
                'new_status': land.status
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

# --- Mark Land as Sold ---
@login_required
def mark_land_as_sold(request, land_id):
    if request.method == 'POST':
        try:
            # Check if user is admin
            if not request.user.is_authenticated or request.user.role != 'admin':
                return JsonResponse({'success': False, 'error': 'Unauthorized access'}, status=403)
            
            # Get the land object
            try:
                land = Land.objects.get(id=land_id)
            except Land.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Land not found'}, status=404)
            
            # Check if land is already sold
            if land.status == 'sold':
                return JsonResponse({'success': False, 'error': 'Land is already marked as sold'}, status=400)
            
            # Update land status to sold
            land.status = 'sold'
            land.save()
            
            # Create notification for all admins
            admin_users = User.objects.filter(role='admin')
            for admin in admin_users:
                Notification.objects.create(
                    user=admin,
                    message=f"Land {land.id} - {land.name} has been marked as sold by {request.user.username}"
                )
            
            return JsonResponse({
                'success': True,
                'message': f'Land {land.id} - {land.name} has been successfully marked as sold',
                'land_id': land.id,
                'land_name': land.name,
                'new_status': land.status
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@login_required
def get_land_details(request, land_id):
    """Get comprehensive land details for modal display"""
    try:
        land = Land.objects.select_related('district', 'taluka', 'village').get(id=land_id)
        
        # Allow admin and marketing employees to access land details
        if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
            return JsonResponse({'success': False, 'message': 'Permission denied'})
        
        # Format dates
        def format_date(date):
            if date:
                return date.strftime('%d/%m/%Y')
            return 'Not specified'
        
        # Get tasks list
        tasks_list = land.get_tasks_list()
        
        # Prepare comprehensive land data
        land_data = {
            'success': True,
            'land': {
                'id': land.id,
                'name': land.name,
                'status': land.get_status_display(),
                'status_value': land.status,
                
                # Location Details
                'state': land.state,
                'district': land.district.name if land.district else 'Not specified',
                'taluka': land.taluka.name if land.taluka else 'Not specified',
                'village': land.village.name if land.village else 'Not specified',
                'full_location': f"{land.village.name if land.village else 'N/A'}, {land.taluka.name if land.taluka else 'N/A'}, {land.district.name if land.district else 'N/A'}, {land.state}",
                
                # Identification Numbers
                'old_sr_no': land.old_sr_no or 'Not specified',
                'new_sr_no': land.new_sr_no or 'Not specified',
                
                # Area Information
                'sata_prakar': land.sata_prakar,
                'built_up_area': float(land.built_up_area) if land.built_up_area else 0,
                'unutilized_area': float(land.unutilized_area) if land.unutilized_area else 0,
                'total_area': float(land.total_area) if land.total_area else 0,
                'area_unit': 'sq m',
                
                # Important Dates
                'past_date': format_date(land.past_date),
                'soda_tarikh': format_date(land.soda_tarikh),
                'banakhat_tarikh': format_date(land.banakhat_tarikh),
                'dastavej_tarikh': format_date(land.dastavej_tarikh),
                
                # Additional Information
                'broker_name': land.broker_name or 'Not specified',
                'location': land.location or 'Not specified',
                'remark': land.remark or 'Not specified',
                'selected_tasks': tasks_list,
                'tasks_count': len(tasks_list),
                
                # Calculated Values
                'total_value': land.get_total_value(),
            }
        }
        
        return JsonResponse(land_data)
        
    except Land.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Land not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error: {str(e)}'})


@login_required
def process_land_sale(request):
    """Process land sale with installments"""
    print(f"DEBUG: process_land_sale called - Method: {request.method}, User: {request.user.username}, Role: {request.user.role}")
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    # Allow admin and marketing employees to update land sales
    if request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing'):
        return JsonResponse({'success': False, 'message': 'Permission denied'})
    
    try:
        from .models import LandSale, Installment
        import json
        from datetime import datetime, timedelta
        
        # Get data from request
        data = json.loads(request.body)
        land_id = data.get('land_id')
        installments_data = data.get('installments', [])
        total_percentage = data.get('total_percentage', 0)
        
        # New sale data fields
        client_id = data.get('client_id')
        marketing_employee_id = data.get('marketing_employee_id')
        sale_date = data.get('sale_date')
        notes = data.get('notes', '')
        
        # Validate required fields
        if not land_id:
            return JsonResponse({'success': False, 'message': 'Land ID is required'})
        
        # Allow empty installments for direct land sales
        # if not installments_data:
        #     return JsonResponse({'success': False, 'message': 'Installments data is required'})
        
        if not client_id:
            return JsonResponse({'success': False, 'message': 'Client selection is required'})
        
        if not marketing_employee_id:
            return JsonResponse({'success': False, 'message': 'Marketing employee selection is required'})
        
        if not sale_date:
            return JsonResponse({'success': False, 'message': 'Sale date is required'})
        
        # Get the land
        try:
            land = Land.objects.get(id=land_id)
        except Land.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Land not found'})
        
        # Get the client
        try:
            from .models import Client
            client = Client.objects.get(id=client_id)
        except Client.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Selected client not found'})
        
        # Get the marketing employee
        try:
            marketing_employee = User.objects.get(id=marketing_employee_id, role='employee', employee_type='marketing')
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Selected marketing employee not found'})
        
        # Parse sale date
        try:
            sale_date_obj = datetime.strptime(sale_date, '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse({'success': False, 'message': 'Invalid sale date format'})
        
        # Create LandSale record with enhanced data
        land_sale = LandSale.objects.create(
            land=land,
            client=client,
            marketing_employee=marketing_employee,
            buyer_name=client.client_name,
            buyer_contact=client.mobile_no,
            buyer_address=client.address or '',
            sale_date=sale_date_obj,
            status=land.status,  # Use land's status instead of hardcoded 'active'
            notes=notes,
            created_by=request.user
        )
        
        # Create Installment records (if any)
        created_installments = []
        if installments_data:
            for installment_data in installments_data:
                # Get installment number from data
                installment_number = installment_data.get('installment_number', 1)
                
                # Calculate due date based on days from today
                days = int(installment_data.get('days', 0))
                due_date = datetime.now().date() + timedelta(days=days)
                
                # Get percentage from installment data
                percentage = float(installment_data.get('percentage', 0))
                
                # Get payment method from data
                payment_method = installment_data.get('payment_method', 'cash')
                
                installment = Installment.objects.create(
                    land_sale=land_sale,
                    installment_number=installment_number,
                    percentage=percentage,
                    payment_type=payment_method,
                    due_date=due_date,
                    status='pending'
                )
                created_installments.append(installment)
        
        # Update land status to in_process (installments created but not all paid)
        land.status = 'in_process'
        land.save()
        
        # Auto-assign marketing tasks to the selected marketing employee
        # Use user-updated completion days from task_assignments data if available
        tasks_assigned = 0
        task_assignments_data = data.get('task_assignments', [])
        
        print(f"DEBUG: Auto-assigning marketing tasks to employee: {marketing_employee.full_name} (ID: {marketing_employee.id})")
        print(f"DEBUG: Received task_assignments_data: {task_assignments_data}")
        
        try:
            from .models import AssignedTask, Task
            from datetime import datetime, timedelta
            
            # Get all marketing tasks from core_task table
            marketing_tasks = Task.objects.filter(marketing_task=True).order_by('position', 'name')
            print(f"DEBUG: Found {marketing_tasks.count()} marketing tasks to assign")
            
            for task in marketing_tasks:
                # Check if this task is already assigned to this employee for this land
                existing_assignment = AssignedTask.objects.filter(
                    land=land,
                    task=task,
                    employee=marketing_employee
                ).first()
                
                if not existing_assignment:
                    # Look for user-updated completion days in task_assignments_data
                    user_completion_days = None
                    for task_data in task_assignments_data:
                        if task_data.get('task_name') == task.name:
                            user_completion_days = int(task_data.get('completion_days', 0))
                            print(f"DEBUG: Found user-updated completion days for '{task.name}': {user_completion_days}")
                            break
                    
                    # Use user-updated completion days if available, otherwise use default
                    completion_days = user_completion_days if user_completion_days else task.completion_days
                    
                    # Calculate due date based on completion days (user-updated or default)
                    due_date = datetime.now() + timedelta(days=completion_days)
                    
                    # Create the task assignment directly in core_assignedtask table
                    # Links: land_id (core_land), task_id (core_task), employee_id (core_user)
                    assigned_task = AssignedTask.objects.create(
                        land=land,  # Foreign key to core_land
                        task=task,  # Foreign key to core_task
                        employee=marketing_employee,  # Foreign key to core_user (marketing employee)
                        status='pending',
                        completion_days=completion_days,  # Use user-updated or default completion days
                        due_date=due_date
                    )
                    tasks_assigned += 1
                    print(f"DEBUG: Marketing task '{task.name}' (ID: {task.id}) auto-assigned to {marketing_employee.full_name} (ID: {marketing_employee.id}) for land {land.id}")
                    print(f"DEBUG: AssignedTask created with ID: {assigned_task.id} - Completion days: {completion_days} (user-updated: {user_completion_days is not None}) - Due date: {due_date.date()}")
                else:
                    print(f"DEBUG: Marketing task '{task.name}' already assigned to {marketing_employee.full_name} for land {land.id}")
                
        except Exception as task_error:
            print(f"DEBUG: Error auto-assigning marketing tasks: {str(task_error)}")
            # Don't fail the entire sale process if task assignment fails
            pass
        
        # Prepare success message
        if created_installments:
            message = f'Land sale processed successfully with {len(created_installments)} installments'
        else:
            message = 'Land sale processed successfully. Land status updated to "In process"'
            
        if tasks_assigned > 0:
            message += f'. {tasks_assigned} task(s) assigned to marketing employee'
        
        return JsonResponse({
            'success': True,
            'message': message,
            'sale_id': land_sale.id,
            'installments_count': len(created_installments),
            'tasks_assigned': tasks_assigned
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error processing sale: {str(e)}'})


@login_required
def get_land_installments(request, land_id):
    """Get existing installments for a land"""
    if request.method != 'GET':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    # Allow admin and marketing employees to view land installments
    if request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing'):
        return JsonResponse({'success': False, 'message': 'Permission denied'})
    
    try:
        from .models import LandSale, Installment
        from datetime import date
        
        # Get the land
        try:
            land = Land.objects.get(id=land_id)
        except Land.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Land not found'})
        
        # Get the most recent sale for this land
        land_sale = LandSale.objects.filter(land=land).order_by('-created_at').first()
        
        if not land_sale:
            return JsonResponse({
                'success': True, 
                'has_sale': False,
                'message': 'No sale found for this land'
            })
        
        # Get all installments for this sale
        installments = Installment.objects.filter(land_sale=land_sale).order_by('installment_number')
        
        # Format installments data
        installments_data = []
        for installment in installments:
            installments_data.append({
                'id': installment.id,
                'installment_number': installment.installment_number,
                'percentage': float(installment.percentage),
                'payment_type': installment.payment_type,
                'due_date': installment.due_date.strftime('%Y-%m-%d'),
                'paid_date': installment.paid_date.strftime('%Y-%m-%d') if installment.paid_date else None,
                'status': installment.status,
                'notes': installment.notes,
                'is_overdue': installment.is_overdue(),
                # Payment record fields
                'rtgs_number': installment.rtgs_number,
                'utr_reference': installment.utr_reference,
                'bank_name': installment.bank_name,
                'from_bank': installment.from_bank,
                'ifsc_code': installment.ifsc_code,
                'cheque_photo': installment.cheque_photo.url if installment.cheque_photo else None,
                'received_by': installment.received_by.full_name if installment.received_by else None
            })
        
        return JsonResponse({
            'success': True,
            'has_sale': True,
            'sale': {
                'id': land_sale.id,
                'land_name': land_sale.land.name,
                'buyer_name': land_sale.buyer_name,
                'sale_date': land_sale.sale_date.strftime('%Y-%m-%d'),
                'status': land_sale.status,
                'client_name': land_sale.client.client_name if land_sale.client else None,
                'marketing_employee_name': land_sale.marketing_employee.full_name if land_sale.marketing_employee else None,
                'notes': land_sale.notes or ''
            },
            'installments': installments_data,
            'total_installments': len(installments_data),
            'paid_installments': len([i for i in installments_data if i['status'] == 'paid']),
            'pending_installments': len([i for i in installments_data if i['status'] == 'pending'])
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error fetching installments: {str(e)}'})


@login_required
def update_land_sale(request):
    """Update existing land sale details"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    if request.user.role != 'admin':
        return JsonResponse({'success': False, 'message': 'Permission denied'})
    
    try:
        from .models import LandSale, Client
        import json
        from datetime import datetime
        
        # Get data from request
        data = json.loads(request.body)
        land_id = data.get('land_id')
        client_id = data.get('client_id')
        marketing_employee_id = data.get('marketing_employee_id')
        sale_date = data.get('sale_date')
        notes = data.get('notes', '')
        installments_data = data.get('installments', [])
        total_percentage = data.get('total_percentage', 0)
        
        # Validate required fields
        if not land_id:
            return JsonResponse({'success': False, 'message': 'Land ID is required'})
        
        if not client_id:
            return JsonResponse({'success': False, 'message': 'Client selection is required'})
        
        if not marketing_employee_id:
            return JsonResponse({'success': False, 'message': 'Marketing employee selection is required'})
        
        if not sale_date:
            return JsonResponse({'success': False, 'message': 'Sale date is required'})
        
        # Get the land
        try:
            land = Land.objects.get(id=land_id)
        except Land.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Land not found'})
        
        # Get the client
        try:
            client = Client.objects.get(id=client_id)
        except Client.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Selected client not found'})
        
        # Get the marketing employee
        try:
            marketing_employee = User.objects.get(id=marketing_employee_id, role='employee', employee_type='marketing')
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Selected marketing employee not found'})
        
        # Parse sale date
        try:
            sale_date_obj = datetime.strptime(sale_date, '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse({'success': False, 'message': 'Invalid sale date format'})
        
        # Get the existing land sale
        try:
            land_sale = LandSale.objects.filter(land=land).order_by('-created_at').first()
            if not land_sale:
                return JsonResponse({'success': False, 'message': 'No existing sale found for this land'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Error finding existing sale: {str(e)}'})
        
        # Update the land sale
        land_sale.client = client
        land_sale.marketing_employee = marketing_employee
        land_sale.buyer_name = client.client_name
        land_sale.buyer_contact = client.mobile_no
        land_sale.buyer_address = client.address or ''
        land_sale.sale_date = sale_date_obj
        land_sale.notes = notes
        land_sale.save()
        
        # Update installments if provided
        if installments_data:
            from .models import Installment
            from datetime import timedelta
            
            # Get existing installments to preserve their status
            existing_installments = Installment.objects.filter(land_sale=land_sale)
            existing_installments_dict = {}
            for inst in existing_installments:
                # Use only installment_number as key since that's the unique constraint
                existing_installments_dict[inst.installment_number] = inst
            
            # Track which installment numbers we've processed
            processed_numbers = set()
            
            # Update or create installments
            for installment_data in installments_data:
                # Get installment number from data
                installment_number = installment_data.get('installment_number', 1)
                
                # Calculate due date based on days from today
                days = int(installment_data.get('days', 0))
                due_date = datetime.now().date() + timedelta(days=days)
                
                # Get percentage from installment data
                percentage = float(installment_data.get('percentage', 0))
                
                # Get payment method from data
                payment_method = installment_data.get('payment_method', 'cash')
                
                # Get status from data (preserve paid status)
                status = installment_data.get('status', 'pending')
                
                # Track this installment number
                processed_numbers.add(installment_number)
                
                # Check if this installment already exists
                if installment_number in existing_installments_dict:
                    # Update existing installment (preserve status if it's paid)
                    existing_installment = existing_installments_dict[installment_number]
                    existing_installment.percentage = percentage
                    existing_installment.payment_type = payment_method
                    existing_installment.due_date = due_date
                    # Only update status if it's not already paid
                    if existing_installment.status != 'paid':
                        existing_installment.status = status
                    existing_installment.save()
                else:
                    # Create new installment
                    Installment.objects.create(
                        land_sale=land_sale,
                        installment_number=installment_number,
                        percentage=percentage,
                        payment_type=payment_method,
                        due_date=due_date,
                        status=status
                    )
            
            # Delete installments that are no longer in the data (but preserve paid ones)
            for installment_number, existing_installment in existing_installments_dict.items():
                if installment_number not in processed_numbers and existing_installment.status != 'paid':
                    existing_installment.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Land sale updated successfully',
            'sale_id': land_sale.id
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error updating sale: {str(e)}'})


@login_required
def process_installment_payment(request, installment_id):
    """Process payment for an installment"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    # Allow admin and marketing employees to process installment payments
    if request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing'):
        return JsonResponse({'success': False, 'message': 'Permission denied'})
    
    try:
        from .models import Installment
        from datetime import datetime
        import os
        
        # Get data from request (FormData)
        payment_date = request.POST.get('payment_date')
        rtgs_number = request.POST.get('rtgs_number', '')
        from_bank = request.POST.get('from_bank', '')
        utr_reference = request.POST.get('utr_reference', '')
        ifsc_code = request.POST.get('ifsc_code', '')
        bank_name = request.POST.get('bank_name', '')
        cheque_photo = request.FILES.get('cheque_photo')
        remark = request.POST.get('remark', '')
        
        # Validate required fields
        if not payment_date:
            return JsonResponse({'success': False, 'message': 'Payment date is required'})
        
        # Get the installment
        try:
            installment = Installment.objects.get(id=installment_id)
        except Installment.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Installment not found'})
        
        # Check if installment is already paid
        if installment.status == 'paid':
            return JsonResponse({'success': False, 'message': 'Installment is already paid'})
        
        # Update installment with payment record fields
        installment.paid_date = datetime.strptime(payment_date, '%Y-%m-%d').date()
        installment.rtgs_number = rtgs_number
        installment.from_bank = from_bank
        installment.utr_reference = utr_reference
        installment.ifsc_code = ifsc_code
        installment.bank_name = bank_name
        installment.remark = remark
        
        # Handle file upload for cheque photo
        if cheque_photo:
            installment.cheque_photo = cheque_photo
        
        installment.received_by = request.user
        installment.status = 'paid'
        installment.save()
        


        
        # Check if all installments are paid and update land status
        land = installment.land_sale.land
        if land.update_status_based_on_installments():
            status_message = f'Payment processed successfully. All installments paid - Land status updated to SOLD.'
        else:
            status_message = f'Payment processed successfully'
        
        return JsonResponse({
            'success': True,
            'message': status_message,
            'payment_id': installment.id,
            'receipt_number': f"RCP{installment.id:04d}{installment.paid_date.strftime('%Y%m%d') if installment.paid_date else ''}",
            'land_status_updated': land.status == 'sold'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error processing payment: {str(e)}'})


@login_required
def get_payment_details(request, installment_id):
    """Get payment details for an installment"""
    if request.method != 'GET':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    # Allow admin and marketing employees to view payment details
    if request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing'):
        return JsonResponse({'success': False, 'message': 'Permission denied'})
    
    try:
        from .models import Installment
        import re
        
        # Get the installment
        try:
            installment = Installment.objects.get(id=installment_id)
        except Installment.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Installment not found'})
        
        # Check if installment is paid
        if installment.status != 'paid':
            return JsonResponse({'success': False, 'message': 'Installment is not paid'})
        
        # Check if this is a detailed payment (has bank details) or simple mark-as-paid
        has_detailed_payment = bool(installment.rtgs_number or installment.utr_reference or 
                                  installment.bank_name or installment.from_bank or 
                                  installment.ifsc_code or installment.cheque_photo)
        
        # Format payment details - show different data based on payment type
        payment_details = {
            'installment_number': installment.installment_number,
            'percentage': float(installment.percentage),
            'payment_method': installment.payment_type,
            'received_date': installment.paid_date.strftime('%Y-%m-%d') if installment.paid_date else '',
            'received_by': installment.received_by.username if installment.received_by else 'Unknown',
            'receipt_number': f"RCP{installment.id:04d}{installment.paid_date.strftime('%Y%m%d') if installment.paid_date else ''}",
            'remark': installment.remark or '',  # Always show remark
            'is_detailed_payment': has_detailed_payment,  # Flag to determine modal content
        }
        
        # Only include detailed payment fields if they exist
        if has_detailed_payment:
            payment_details.update({
                'payment_reference': installment.utr_reference or installment.rtgs_number,
                'bank_name': installment.bank_name,
                'from_bank': installment.from_bank,
                'rtgs_number': installment.rtgs_number,
                'utr_reference': installment.utr_reference,
                'ifsc_code': installment.ifsc_code,
                'cheque_photo': installment.cheque_photo.url if installment.cheque_photo else None,
                'notes': installment.notes or '',
            })
        
        return JsonResponse({
            'success': True,
            'payment_details': payment_details
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error fetching payment details: {str(e)}'})

# ===== CLIENT MANAGEMENT VIEWS =====

@login_required
def admin_clients(request):
    """Admin clients page - accessible to admin and marketing employees"""
    # Allow admin and marketing employees to access clients page
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        return redirect('login')
    
    clients = Client.objects.all().order_by('-created_at')
    
    # Calculate client type statistics
    property_owner_clients = clients.filter(client_type='property_owner').count()
    lead_generation_clients = clients.filter(client_type='lead_generation').count()
    web_by_reference_clients = clients.filter(client_type='web_by_reference').count()
    direct_visit_clients = clients.filter(client_type='direct_visit').count()
    
    # Search and filter functionality
    search_query = request.GET.get('search', '')
    client_type_filter = request.GET.get('client_type', '')
    
    if search_query:
        clients = clients.filter(
            Q(client_name__icontains=search_query) |
            Q(email__icontains=search_query) |
            Q(mobile_no__icontains=search_query) |
            Q(whatsapp_no__icontains=search_query)
        )
    
    if client_type_filter:
        clients = clients.filter(client_type=client_type_filter)
    
    context = {
        'clients': clients,
        'property_owner_clients': property_owner_clients,
        'lead_generation_clients': lead_generation_clients,
        'web_by_reference_clients': web_by_reference_clients,
        'direct_visit_clients': direct_visit_clients,
        'search_query': search_query,
        'client_type_filter': client_type_filter,
    }
    return render(request, 'admin_clients.html', context)

@login_required
def add_client(request):
    """Add new client"""
    # Allow admin and marketing employees to add clients
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        return redirect('login')
    
    if request.method == 'POST':
        try:
            # Get form data
            client_type = request.POST.get('client_type')
            search_property_title = request.POST.get('search_property_title', '')
            client_name = request.POST.get('client_name')
            email = request.POST.get('email')
            mobile_no = request.POST.get('mobile_no')
            another_mobile_no = request.POST.get('another_mobile_no', '')
            whatsapp_no = request.POST.get('whatsapp_no')
            pan_no = request.POST.get('pan_no', '')
            adhar_card_no = request.POST.get('adhar_card_no', '')
            address = request.POST.get('address', '')
            approx_investment = request.POST.get('approx_investment', '')
            choice_in_particular_property = request.POST.get('choice_in_particular_property', '')
            dob = request.POST.get('dob', '')
            anniversary = request.POST.get('anniversary', '')
            any_event = request.POST.get('any_event', '')
            remark = request.POST.get('remark', '')
            is_active = request.POST.get('is_active') == 'on'  # Checkbox returns 'on' when checked
            
            # Validate required fields
            if not all([client_name, email, mobile_no, whatsapp_no]):
                return JsonResponse({'success': False, 'message': 'Please fill all required fields'})
            
            # Additional validation
            import re
            
            # Mobile number validation (10 digits)
            if mobile_no and not re.match(r'^\d{10}$', mobile_no):
                return JsonResponse({'success': False, 'message': 'Mobile number must be exactly 10 digits.'})
            
            # Another mobile number validation (10 digits)
            if another_mobile_no and not re.match(r'^\d{10}$', another_mobile_no):
                return JsonResponse({'success': False, 'message': 'Another mobile number must be exactly 10 digits.'})
            
            # WhatsApp number validation (10 digits)
            if whatsapp_no and not re.match(r'^\d{10}$', whatsapp_no):
                return JsonResponse({'success': False, 'message': 'WhatsApp number must be exactly 10 digits.'})
            
            # PAN number validation (10 characters: 5 letters, 4 digits, 1 letter)
            if pan_no and not re.match(r'^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$', pan_no):
                return JsonResponse({'success': False, 'message': 'PAN number must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter).'})
            
            # Aadhar card validation (12 digits)
            if adhar_card_no and not re.match(r'^\d{12}$', adhar_card_no):
                return JsonResponse({'success': False, 'message': 'Aadhar card number must be exactly 12 digits.'})
            
            # Create client
            client = Client.objects.create(
                client_type=client_type,
                search_property_title=search_property_title if search_property_title else None,
                client_name=client_name,
                email=email,
                mobile_no=mobile_no,
                another_mobile_no=another_mobile_no if another_mobile_no else None,
                whatsapp_no=whatsapp_no,
                pan_no=pan_no.upper() if pan_no else None,
                adhar_card_no=adhar_card_no if adhar_card_no else None,
                address=address if address else None,
                approx_investment=float(approx_investment) if approx_investment else None,
                choice_in_particular_property=choice_in_particular_property if choice_in_particular_property else None,
                dob=datetime.datetime.strptime(dob, '%Y-%m-%d').date() if dob else None,
                anniversary=datetime.datetime.strptime(anniversary, '%Y-%m-%d').date() if anniversary else None,
                any_event=datetime.datetime.strptime(any_event, '%Y-%m-%d').date() if any_event else None,
                remark=remark if remark else None,
                is_active=is_active,
                created_by=request.user
            )
            
            return JsonResponse({'success': True, 'message': 'Client added successfully', 'client_id': client.id})
            
        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Error adding client: {str(e)}'})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})

@login_required
def edit_client(request, client_id):
    """Edit existing client"""
    # Allow admin and marketing employees to edit clients
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        return redirect('login')
    
    try:
        client = Client.objects.get(id=client_id)
    except Client.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Client not found'})
    
    if request.method == 'GET':
        # Return client data for editing
        client_data = {
            'id': client.id,
            'client_type': client.client_type,
            'search_property_title': client.search_property_title or '',
            'client_name': client.client_name,
            'email': client.email,
            'mobile_no': client.mobile_no,
            'another_mobile_no': client.another_mobile_no or '',
            'whatsapp_no': client.whatsapp_no,
            'pan_no': client.pan_no or '',
            'adhar_card_no': client.adhar_card_no or '',
            'address': client.address or '',
            'approx_investment': client.approx_investment or '',
            'choice_in_particular_property': client.choice_in_particular_property or '',
            'dob': client.dob.strftime('%Y-%m-%d') if client.dob else '',
            'anniversary': client.anniversary.strftime('%Y-%m-%d') if client.anniversary else '',
            'any_event': client.any_event.strftime('%Y-%m-%d') if client.any_event else '',
            'remark': client.remark or '',
            'is_active': client.is_active,
            'created_at': client.created_at.strftime('%d/%m/%Y %H:%M') if client.created_at else ''
        }
        return JsonResponse({'success': True, 'client': client_data})
    
    if request.method == 'POST':
        try:
            # Get form data
            client_type = request.POST.get('client_type', client.client_type)
            client_name = request.POST.get('client_name', client.client_name)
            email = request.POST.get('email', client.email)
            mobile_no = request.POST.get('mobile_no', client.mobile_no)
            another_mobile_no = request.POST.get('another_mobile_no', '')
            whatsapp_no = request.POST.get('whatsapp_no', client.whatsapp_no)
            pan_no = request.POST.get('pan_no', '')
            adhar_card_no = request.POST.get('adhar_card_no', '')
            
            # Additional validation
            import re
            
            # Mobile number validation (10 digits)
            if mobile_no and not re.match(r'^\d{10}$', mobile_no):
                return JsonResponse({'success': False, 'message': 'Mobile number must be exactly 10 digits.'})
            
            # Another mobile number validation (10 digits)
            if another_mobile_no and not re.match(r'^\d{10}$', another_mobile_no):
                return JsonResponse({'success': False, 'message': 'Another mobile number must be exactly 10 digits.'})
            
            # WhatsApp number validation (10 digits)
            if whatsapp_no and not re.match(r'^\d{10}$', whatsapp_no):
                return JsonResponse({'success': False, 'message': 'WhatsApp number must be exactly 10 digits.'})
            
            # PAN number validation (10 characters: 5 letters, 4 digits, 1 letter)
            if pan_no and not re.match(r'^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$', pan_no):
                return JsonResponse({'success': False, 'message': 'PAN number must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter).'})
            
            # Aadhar card validation (12 digits)
            if adhar_card_no and not re.match(r'^\d{12}$', adhar_card_no):
                return JsonResponse({'success': False, 'message': 'Aadhar card number must be exactly 12 digits.'})
            
            # Update client fields
            client.client_type = client_type
            client.search_property_title = request.POST.get('search_property_title', '') or None
            client.client_name = client_name
            client.email = email
            client.mobile_no = mobile_no
            client.another_mobile_no = another_mobile_no if another_mobile_no else None
            client.whatsapp_no = whatsapp_no
            client.pan_no = pan_no.upper() if pan_no else None
            client.adhar_card_no = adhar_card_no if adhar_card_no else None
            client.address = request.POST.get('address', '') or None
            client.approx_investment = float(request.POST.get('approx_investment', '')) if request.POST.get('approx_investment') else None
            client.choice_in_particular_property = request.POST.get('choice_in_particular_property', '') or None
            
            # Handle date fields
            dob = request.POST.get('dob', '')
            anniversary = request.POST.get('anniversary', '')
            any_event = request.POST.get('any_event', '')
            
            client.dob = datetime.datetime.strptime(dob, '%Y-%m-%d').date() if dob else None
            client.anniversary = datetime.datetime.strptime(anniversary, '%Y-%m-%d').date() if anniversary else None
            client.any_event = datetime.datetime.strptime(any_event, '%Y-%m-%d').date() if any_event else None
            
            # Handle remark field
            remark = request.POST.get('remark', '')
            client.remark = remark if remark else None
            
            # Handle is_active field
            is_active = request.POST.get('is_active') == 'on'  # Checkbox returns 'on' when checked
            client.is_active = is_active
            
            client.save()
            
            return JsonResponse({'success': True, 'message': 'Client updated successfully'})
            
        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Error updating client: {str(e)}'})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})

@login_required
def delete_client(request, client_id):
    """Delete client"""
    # Allow admin and marketing employees to delete clients
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        return redirect('login')
    
    try:
        client = Client.objects.get(id=client_id)
        client.delete()
        return JsonResponse({'success': True, 'message': 'Client deleted successfully'})
    except Client.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Client not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Error deleting client: {str(e)}'})

@login_required
def get_clients_api(request):
    """API endpoint to get all clients"""
    # Allow admin and marketing employees to access clients API
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    try:
        clients = Client.objects.all().order_by('-created_at')
        clients_data = []
        
        for client in clients:
            clients_data.append({
                'id': client.id,
                'client_name': client.client_name,
                'client_type': client.get_client_type_display(),
                'email': client.email,
                'mobile_no': client.mobile_no,
                'whatsapp_no': client.whatsapp_no,
                'created_at': client.created_at.strftime('%d/%m/%Y %H:%M'),
                'created_by': client.created_by.full_name if client.created_by else 'System'
            })
        
        return JsonResponse({'success': True, 'clients': clients_data})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
def get_client_details_api(request, client_id):
    """API endpoint to get detailed client information for viewing"""
    # Allow admin and marketing employees to view client details
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        return JsonResponse({'success': False, 'message': 'Unauthorized'})
    
    try:
        client = Client.objects.get(id=client_id)
        
        # Get client type display name
        client_type_display = client.get_client_type_display()
        
        client_data = {
            'id': client.id,
            'client_type': client.client_type,
            'client_type_display': client_type_display,
            'search_property_title': client.search_property_title or 'Not specified',
            'client_name': client.client_name,
            'email': client.email,
            'mobile_no': client.mobile_no,
            'another_mobile_no': client.another_mobile_no or 'Not provided',
            'whatsapp_no': client.whatsapp_no,
            'pan_no': client.pan_no or 'Not provided',
            'adhar_card_no': client.adhar_card_no or 'Not provided',
            'address': client.address or 'Not provided',
            'approx_investment': f'₹{client.approx_investment:,.2f}' if client.approx_investment else 'Not specified',
            'choice_in_particular_property': client.choice_in_particular_property or 'Not specified',
            'dob': client.dob.strftime('%d/%m/%Y') if client.dob else 'Not provided',
            'anniversary': client.anniversary.strftime('%d/%m/%Y') if client.anniversary else 'Not provided',
            'any_event': client.any_event.strftime('%d/%m/%Y') if client.any_event else 'Not provided',
            'remark': client.remark or 'No remarks added',
            'created_at': client.created_at.strftime('%d/%m/%Y at %H:%M') if client.created_at else 'Unknown',
            'created_by': client.created_by.full_name if client.created_by else 'System'
        }
        
        return JsonResponse({'success': True, 'client_details': client_data})
        
    except Client.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Client not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@login_required
@csrf_exempt
def create_reminder_api(request):
    """API endpoint to create a new reminder"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'})
    
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        reminder_time = data.get('reminder_time')
        priority = data.get('priority', 'medium')
        installment_id = data.get('installment_id')
        
        if not title or not description or not reminder_time:
            return JsonResponse({'success': False, 'message': 'Title, description, and reminder time are required'})
        
        # Parse reminder time
        from datetime import datetime
        try:
            reminder_datetime = datetime.fromisoformat(reminder_time.replace('Z', '+00:00'))
        except ValueError:
            return JsonResponse({'success': False, 'message': 'Invalid reminder time format'})
        
        # Create reminder
        from .models import Reminder, Installment
        
        reminder = Reminder(
            title=title,
            description=description,
            reminder_time=reminder_datetime,
            priority=priority,
            created_by=request.user,
            assigned_to=request.user
        )
        
        # Link to installment if provided
        if installment_id:
            try:
                installment = Installment.objects.get(id=installment_id)
                reminder.installment = installment
            except Installment.DoesNotExist:
                pass
        
        reminder.save()
        
        return JsonResponse({
            'success': True, 
            'message': 'Reminder created successfully',
            'reminder_id': reminder.id
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data'})
    except Exception as e:
        print(f"Error creating reminder: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'message': 'Error creating reminder'})

@login_required
def get_reminders_api(request):
    """API endpoint to get user's reminders"""
    try:
        from .models import Reminder
        
        # Get reminders for the current user
        reminders = Reminder.objects.filter(
            assigned_to=request.user,
            status='pending'
        ).order_by('reminder_time')
        
        reminders_data = []
        for reminder in reminders:
            reminders_data.append({
                'id': reminder.id,
                'title': reminder.title,
                'description': reminder.description,
                'reminder_time': reminder.reminder_time.strftime('%d/%m/%Y %H:%M'),
                'priority': reminder.get_priority_display(),
                'priority_value': reminder.priority,
                'is_overdue': reminder.is_overdue(),
                'installment_id': reminder.installment.id if reminder.installment else None,
                'created_at': reminder.created_at.strftime('%d/%m/%Y %H:%M')
            })
        
        return JsonResponse({'success': True, 'reminders': reminders_data})
        
    except Exception as e:
        print(f"Error fetching reminders: {str(e)}")
        return JsonResponse({'success': False, 'message': 'Error fetching reminders'})

@login_required
@csrf_exempt
def mark_reminder_completed_api(request, reminder_id):
    """API endpoint to mark a reminder as completed"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'})
    
    try:
        from .models import Reminder
        
        reminder = Reminder.objects.get(id=reminder_id, assigned_to=request.user)
        reminder.mark_completed()
        
        return JsonResponse({'success': True, 'message': 'Reminder marked as completed'})
        
    except Reminder.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Reminder not found or unauthorized'})
    except Exception as e:
        print(f"Error marking reminder completed: {str(e)}")
        return JsonResponse({'success': False, 'message': 'Error marking reminder completed'})


# --- Task Download Views ---
@login_required
def download_single_task(request, land_id, task_id):
    """Download single task details as PDF"""
    # Check user permissions
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        return HttpResponse('Unauthorized', status=403)
    
    try:
        # Get the land and task
        land = get_object_or_404(Land, id=land_id)
        assigned_task = get_object_or_404(AssignedTask, id=task_id, land=land)
        
        # Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        story.append(Paragraph(f"Task Details Report", title_style))
        story.append(Spacer(1, 20))
        
        # Land Information
        land_data = [
            ['Land Information', ''],
            ['Land Name:', land.name],
            ['Village:', land.village.name if land.village else 'N/A'],
            ['Taluka:', land.taluka.name if land.taluka else 'N/A'],
            ['District:', land.district.name if land.district else 'N/A'],
            ['Total Area:', f"{land.total_area} sq ft" if land.total_area else 'N/A'],
        ]
        
        land_table = Table(land_data, colWidths=[2*inch, 4*inch])
        land_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(land_table)
        story.append(Spacer(1, 20))
        
        # Task Information
        task_data = [
            ['Task Information', ''],
            ['Task Name:', assigned_task.task.name],
            ['Task Type:', 'Marketing Task' if assigned_task.task.marketing_task else 'General Task'],
            ['Assigned Employee:', assigned_task.employee.get_display_name()],
            ['Status:', assigned_task.get_status_display()],
            ['Assigned Date:', assigned_task.assigned_date.strftime('%B %d, %Y') if assigned_task.assigned_date else 'N/A'],
            ['Due Date:', assigned_task.due_date.strftime('%B %d, %Y') if assigned_task.due_date else 'N/A'],
            ['Completion Days:', str(assigned_task.completion_days) if assigned_task.completion_days else 'N/A'],
        ]
        
        if assigned_task.completion_submitted_date:
            task_data.append(['Submitted Date:', assigned_task.completion_submitted_date.strftime('%B %d, %Y')])
        
        if assigned_task.completion_notes:
            task_data.append(['Employee Notes:', assigned_task.completion_notes])
        
        if assigned_task.admin_approval_notes:
            task_data.append(['Admin Notes:', assigned_task.admin_approval_notes])
        
        if assigned_task.admin_approval_date:
            task_data.append(['Admin Approval Date:', assigned_task.admin_approval_date.strftime('%B %d, %Y')])
        
        task_table = Table(task_data, colWidths=[2*inch, 4*inch])
        task_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.blue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightblue),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(task_table)
        story.append(Spacer(1, 20))
        
        # Add uploaded photo if exists
        if assigned_task.completion_photos:
            try:
                photo_title = ParagraphStyle(
                    'PhotoTitle',
                    parent=styles['Heading2'],
                    fontSize=14,
                    spaceAfter=10
                )
                story.append(Paragraph("Task Completion Photo", photo_title))
                
                # Get the photo path
                photo_path = assigned_task.completion_photos.path
                if os.path.exists(photo_path):
                    # Open and resize image if needed
                    with PILImage.open(photo_path) as img:
                        # Calculate dimensions to fit in PDF (max 4 inches wide)
                        max_width = 4 * inch
                        max_height = 3 * inch
                        
                        img_width, img_height = img.size
                        aspect_ratio = img_width / img_height
                        
                        if img_width > max_width:
                            new_width = max_width
                            new_height = max_width / aspect_ratio
                        else:
                            new_width = img_width * 72 / 96  # Convert pixels to points
                            new_height = img_height * 72 / 96
                        
                        if new_height > max_height:
                            new_height = max_height
                            new_width = max_height * aspect_ratio
                        
                        # Add image to PDF
                        img_obj = Image(photo_path, width=new_width, height=new_height)
                        story.append(img_obj)
                        story.append(Spacer(1, 10))
                        
            except Exception as e:
                story.append(Paragraph(f"Photo could not be loaded: {str(e)}", styles['Normal']))
                story.append(Spacer(1, 10))
        
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Create response
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Task_{assigned_task.task.name}_{land.name}.pdf"'
        return response
        
    except Exception as e:
        print(f"Error generating task PDF: {str(e)}")
        return HttpResponse('Error generating PDF', status=500)


@login_required
def download_bulk_tasks(request, land_id):
    """Download multiple tasks as a ZIP file containing PDFs"""
    # Check user permissions
    if not request.user.is_authenticated or (request.user.role != 'admin' and not (request.user.role == 'employee' and request.user.employee_type == 'marketing')):
        return HttpResponse('Unauthorized', status=403)
    
    try:
        # Get task IDs from query parameters
        task_ids_str = request.GET.get('task_ids', '')
        if not task_ids_str:
            return HttpResponse('No tasks selected', status=400)
        
        task_ids = [int(id.strip()) for id in task_ids_str.split(',') if id.strip().isdigit()]
        if not task_ids:
            return HttpResponse('Invalid task IDs', status=400)
        
        # Get the land and tasks
        land = get_object_or_404(Land, id=land_id)
        assigned_tasks = AssignedTask.objects.filter(id__in=task_ids, land=land).select_related('task', 'employee')
        
        if not assigned_tasks.exists():
            return HttpResponse('No valid tasks found', status=404)
        
        # Create ZIP buffer
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for assigned_task in assigned_tasks:
                # Create PDF for each task
                pdf_buffer = io.BytesIO()
                doc = SimpleDocTemplate(pdf_buffer, pagesize=A4)
                styles = getSampleStyleSheet()
                story = []
                
                # Title
                title_style = ParagraphStyle(
                    'CustomTitle',
                    parent=styles['Heading1'],
                    fontSize=18,
                    spaceAfter=30,
                    alignment=1
                )
                story.append(Paragraph(f"Task: {assigned_task.task.name}", title_style))
                story.append(Spacer(1, 20))
                
                # Task details table
                task_data = [
                    ['Task Information', ''],
                    ['Task Name:', assigned_task.task.name],
                    ['Task Type:', 'Marketing Task' if assigned_task.task.marketing_task else 'General Task'],
                    ['Assigned Employee:', assigned_task.employee.get_display_name()],
                    ['Status:', assigned_task.get_status_display()],
                    ['Assigned Date:', assigned_task.assigned_date.strftime('%B %d, %Y') if assigned_task.assigned_date else 'N/A'],
                    ['Due Date:', assigned_task.due_date.strftime('%B %d, %Y') if assigned_task.due_date else 'N/A'],
                    ['Land:', land.name],
                    ['Village:', land.village.name if land.village else 'N/A'],
                ]
                
                if assigned_task.completion_submitted_date:
                    task_data.append(['Submitted Date:', assigned_task.completion_submitted_date.strftime('%B %d, %Y')])
                
                if assigned_task.completion_notes:
                    task_data.append(['Employee Notes:', assigned_task.completion_notes])
                
                if assigned_task.admin_approval_notes:
                    task_data.append(['Admin Notes:', assigned_task.admin_approval_notes])
                
                if assigned_task.admin_approval_date:
                    task_data.append(['Admin Approval Date:', assigned_task.admin_approval_date.strftime('%B %d, %Y')])
                
                task_table = Table(task_data, colWidths=[2*inch, 4*inch])
                task_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.blue),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.lightblue),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ]))
                story.append(task_table)
                story.append(Spacer(1, 20))
                
                # Add uploaded photo if exists
                if assigned_task.completion_photos:
                    try:
                        photo_title = ParagraphStyle(
                            'PhotoTitle',
                            parent=styles['Heading2'],
                            fontSize=14,
                            spaceAfter=10
                        )
                        story.append(Paragraph("Task Completion Photo", photo_title))
                        
                        # Get the photo path
                        photo_path = assigned_task.completion_photos.path
                        if os.path.exists(photo_path):
                            # Open and resize image if needed
                            with PILImage.open(photo_path) as img:
                                # Calculate dimensions to fit in PDF (max 4 inches wide)
                                max_width = 4 * inch
                                max_height = 3 * inch
                                
                                img_width, img_height = img.size
                                aspect_ratio = img_width / img_height
                                
                                if img_width > max_width:
                                    new_width = max_width
                                    new_height = max_width / aspect_ratio
                                else:
                                    new_width = img_width * 72 / 96  # Convert pixels to points
                                    new_height = img_height * 72 / 96
                                
                                if new_height > max_height:
                                    new_height = max_height
                                    new_width = max_height * aspect_ratio
                                
                                # Add image to PDF
                                img_obj = Image(photo_path, width=new_width, height=new_height)
                                story.append(img_obj)
                                story.append(Spacer(1, 10))
                                
                    except Exception as e:
                        story.append(Paragraph(f"Photo could not be loaded: {str(e)}", styles['Normal']))
                        story.append(Spacer(1, 10))
                
                
                # Build PDF
                doc.build(story)
                pdf_buffer.seek(0)
                
                # Add PDF to ZIP
                filename = f"Task_{assigned_task.id}_{assigned_task.task.name.replace(' ', '_')}.pdf"
                zip_file.writestr(filename, pdf_buffer.getvalue())
        
        zip_buffer.seek(0)
        
        # Create response
        response = HttpResponse(zip_buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="Land_{land.name}_Tasks_Bulk.zip"'
        return response
        
    except Exception as e:
        print(f"Error generating bulk task ZIP: {str(e)}")
        return HttpResponse('Error generating ZIP file', status=500)
