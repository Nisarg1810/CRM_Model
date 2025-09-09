from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import datetime

class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_staff', True)  # Required for admin access
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('status', 'active')
        
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(username, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('employee', 'Employee'),
    ]
    
    EMPLOYEE_TYPE_CHOICES = [
        ('marketing', 'Marketing'),
        ('backoffice', 'Back Office'),
        ('legal_team', 'Legal Team'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    # Basic fields
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    employee_type = models.CharField(max_length=20, choices=EMPLOYEE_TYPE_CHOICES, blank=True)
    full_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(unique=True, blank=True)
    mobile = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=255, blank=True, help_text="Area covered")
    address = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Profile
    profile_pic = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    
    # Django auth fields (required for admin access)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(blank=True, null=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email','role']
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.full_name or self.username} ({self.role})"
    
    def get_display_name(self):
        return self.full_name if self.full_name else self.username
    
    def has_perm(self, perm, obj=None):
        return self.is_superuser or self.is_staff
    
    def has_module_perms(self, app_label):
        return self.is_superuser or self.is_staff

# --- Advocate Model ---
class Advocate(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Advocate'
        verbose_name_plural = 'Advocates'
        ordering = ['name']

    def __str__(self):
        return self.name

# --- Message Model (from dashboard app) ---
class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    read_by_admin = models.BooleanField(default=False)
    read_by_dev = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender.username} to {self.receiver.username}: {self.content[:30]}"

# --- Task and Feedback Models (from tasks app) ---
class Task(models.Model):
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('completed', 'Completed'),
        ('approved', 'Approved'),
    ]
    name = models.CharField(max_length=255, help_text="Task name")
    position = models.PositiveIntegerField(default=0, help_text="Display position of the task")
    is_default = models.BooleanField(default=False, help_text="Whether this is a default task")
    completion_days = models.PositiveIntegerField(default=0, help_text="Expected completion time in days")
    marketing_task = models.BooleanField(default=False, help_text="Whether this is a marketing-specific task")
    # Note: Employee assignments are now handled through the TaskManage model

    class Meta:
        ordering = ['position', 'name']
        verbose_name = "Task"
        verbose_name_plural = "Tasks"

    def __str__(self):
        return f"{self.position}. {self.name}"

    def get_assigned_employees_display(self):
        """Return comma-separated list of assigned employee names"""
        employees = [assignment.employee for assignment in self.task_manages.all()]
        return ', '.join([emp.full_name or emp.username for emp in employees])
    
    def get_assigned_employees_count(self):
        """Return count of assigned employees"""
        return self.task_manages.count()
    




# --- Notification Model (from notifications app) ---
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.message}"

# --- Location Models ---
class District(models.Model):
    name = models.CharField(max_length=100, unique=True)
    state = models.CharField(max_length=100, default='Gujarat')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "District"
        verbose_name_plural = "Districts"

    def __str__(self):
        return f"{self.name}, {self.state}"

class Taluka(models.Model):
    name = models.CharField(max_length=100)
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='talukas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Taluka"
        verbose_name_plural = "Talukas"
        unique_together = ['name', 'district']

    def __str__(self):
        return f"{self.name}, {self.district.name}"

class Village(models.Model):
    name = models.CharField(max_length=100)
    taluka = models.ForeignKey(Taluka, on_delete=models.CASCADE, related_name='villages')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Village"
        verbose_name_plural = "Villages"
        unique_together = ['name', 'taluka']

    def __str__(self):
        return f"{self.name}, {self.taluka.name}"


# --- Land Model ---
class Land(models.Model):
    # Land will use default auto-incrementing ID
    
    # Basic Information
    name = models.CharField(max_length=255)
    
    # Location Details
    state = models.CharField(max_length=100, default='Gujarat')
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='lands')
    taluka = models.ForeignKey(Taluka, on_delete=models.CASCADE, related_name='lands')
    village = models.ForeignKey(Village, on_delete=models.CASCADE, related_name='lands')
    
    # Identification Numbers
    old_sr_no = models.CharField(max_length=50, default='')
    new_sr_no = models.CharField(max_length=50, default='')
    
    # Land Type/Area Details
    sata_prakar = models.CharField(max_length=255)  # Removed choices constraint to allow dynamic values
    built_up_area = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unutilized_area = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_area = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Important Dates
    past_date = models.DateField(blank=True, null=True)
    soda_tarikh = models.DateField(default=datetime.date.today)
    banakhat_tarikh = models.DateField(default=datetime.date.today)
    dastavej_tarikh = models.DateField(default=datetime.date.today)
    
    # Additional Information
    broker_name = models.CharField(max_length=255, default='')
    location = models.CharField(max_length=255, blank=True, help_text="Additional location details")
    remark = models.TextField(blank=True, help_text="Additional remarks or notes")
    
    # Tasks
    selected_tasks = models.TextField(blank=True, help_text="Comma-separated list of selected tasks")
    
    # Status
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inventory', 'In Inventory'),
        ('in_process', 'In Process'),
        ('sold', 'Sold'),
        ('archived', 'Archived'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    def __str__(self):
        return f"Land {self.id} - {self.name} - {self.village.name}, {self.taluka.name}"
    
    def get_tasks_list(self):
        """Return selected tasks as a list"""
        if self.selected_tasks:
            return [task.strip() for task in self.selected_tasks.split(',')]
        return []
    
    def get_total_value(self):
        """Calculate total value based on area"""
        return self.total_area or 0
    
    def are_all_installments_paid(self):
        """Check if all installments for this land are paid"""
        try:
            from .models import LandSale, Installment
            # Get the latest sale for this land
            latest_sale = LandSale.objects.filter(land=self).order_by('-created_at').first()
            if not latest_sale:
                return False
            
            # Check if all installments are paid
            total_installments = Installment.objects.filter(land_sale=latest_sale).count()
            paid_installments = Installment.objects.filter(land_sale=latest_sale, status='paid').count()
            
            return total_installments > 0 and total_installments == paid_installments
        except:
            return False
    
    def update_status_based_on_installments(self):
        """Update land status based on installment payment status"""
        if self.are_all_installments_paid():
            self.status = 'sold'
            self.save()
            return True
        return False
    
    # No custom save method needed - using default auto-incrementing ID
    
    class Meta:
        ordering = ['-id']


# --- Sata Prakar Model ---
class SataPrakar(models.Model):
    """Model for Sata Prakar (Document Types)"""
    name = models.CharField(max_length=255, unique=True, help_text="Name of the document type")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Sata Prakar"
        verbose_name_plural = "Sata Prakar"
    
    def __str__(self):
        return self.name


# Note: Land and employee assignments are now handled through the TaskManage model


# --- TaskManage Model ---
class TaskManage(models.Model):
    """Simple model for managing task assignments to employees"""
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='task_manages')
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_manages')
    
    class Meta:
        unique_together = ['task', 'employee']
        ordering = ['task__position', 'employee__username']
        verbose_name = "Task Management"
        verbose_name_plural = "Task Management"
    
    def __str__(self):
        return f"{self.employee.get_display_name()} - {self.task.name}"


# --- AssignedTask Model for Automatic Task Assignment ---
class AssignedTask(models.Model):
    """Model for automatically assigned tasks when land is submitted"""
    # This model automatically assigns tasks to employees when land is submitted
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('pending_approval', 'Pending Approval'),
        ('complete', 'Complete'),
    ]
    
    land = models.ForeignKey(Land, on_delete=models.CASCADE, related_name='assigned_tasks')
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='land_assignments')
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='land_task_assignments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_date = models.DateTimeField(auto_now_add=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    
    # New fields for task completion workflow
    started_date = models.DateTimeField(null=True, blank=True)
    completion_notes = models.TextField(blank=True, help_text="Notes from employee when completing task")
    completion_photos = models.ImageField(upload_to='task_completion_photos/', blank=True, null=True, help_text="Photos from task completion")
    completion_pdf = models.FileField(upload_to='task_completion_pdfs/', blank=True, null=True, help_text="Documents from task completion")
    completion_submitted_date = models.DateTimeField(null=True, blank=True)
    admin_approval_date = models.DateTimeField(null=True, blank=True)
    admin_approval_notes = models.TextField(blank=True, help_text="Notes from admin when approving task")
    
    # Additional fields that exist in the database
    completion_days = models.PositiveIntegerField(default=0, help_text="Expected completion time in days")
    due_date = models.DateTimeField(null=True, blank=True, help_text="Due date for task completion")
    

    
    class Meta:
        unique_together = ['land', 'task', 'employee']
        ordering = ['-assigned_date']
        verbose_name = "Land Task Assignment"
        verbose_name_plural = "Land Task Assignments"
    
    def __str__(self):
        return f"{self.land.name} - {self.task.name} - {self.employee.get_display_name()} ({self.status})"
    
    def mark_in_progress(self):
        """Mark the task as in progress"""
        self.status = 'in_progress'
        self.started_date = datetime.datetime.now()
        self.save()
    
    def submit_for_approval(self, notes='', photos=None, pdf=None):
        """Submit task for admin approval"""
        try:
            self.status = 'pending_approval'
            self.completion_notes = notes
            if photos:
                self.completion_photos = photos
            if pdf:
                self.completion_pdf = pdf
            self.completion_submitted_date = datetime.datetime.now()
            self.save()
            print(f"Task {self.id} submitted for approval successfully")
        except Exception as e:
            print(f"Error in submit_for_approval: {str(e)}")
            import traceback
            traceback.print_exc()
            raise e
    
    def approve_completion(self, admin_notes=''):
        """Admin approves task completion"""
        self.status = 'complete'
        self.completed_date = datetime.datetime.now()
        self.admin_approval_date = datetime.datetime.now()
        self.admin_approval_notes = admin_notes
        self.save()
    
    def reject_completion(self, admin_notes=''):
        """Admin rejects task completion"""
        self.status = 'in_progress'
        self.completion_notes = ''
        self.completion_photos = None
        self.completion_pdf = None
        self.completion_submitted_date = None
        self.admin_approval_notes = admin_notes
        self.save()
    
    def mark_pending(self):
        """Mark the task as pending"""
        self.status = 'pending'
        self.started_date = None
        self.completed_date = None
        self.completion_notes = ''
        self.completion_photos = None
        self.completion_pdf = None
        self.completion_submitted_date = None
        self.admin_approval_date = None
        self.admin_approval_notes = ''
        self.save()
    
    def save(self, *args, **kwargs):
        """Override save method to automatically calculate due_date"""
        # Calculate due_date if completion_days is set and due_date is not already set
        # Use completion_days from AssignedTask model, not from Task model
        if self.completion_days > 0 and not self.due_date:
            from datetime import timedelta
            self.due_date = self.assigned_date + timedelta(days=self.completion_days)
        
        super().save(*args, **kwargs)

                        # --- Land Sale and Installment Models ---

class LandSale(models.Model):
    """Model for land sale transactions"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inventory', 'In Inventory'),
        ('in_process', 'In Process'),
        ('sold', 'Sold'),
        ('archived', 'Archived'),
    ]
    
    land = models.ForeignKey(Land, on_delete=models.CASCADE, related_name='sales')
    client = models.ForeignKey('Client', on_delete=models.SET_NULL, null=True, blank=True, related_name='land_sales', help_text="Client who purchased the land")
    marketing_employee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='marketing_sales', help_text="Marketing employee who handled the sale")
    buyer_name = models.CharField(max_length=255, help_text="Name of the buyer")
    buyer_contact = models.CharField(max_length=20, blank=True, help_text="Contact number of buyer")
    buyer_address = models.TextField(blank=True, help_text="Address of the buyer")
    
    # Sale details (amount fields removed)
    
    # Sale dates
    sale_date = models.DateField(help_text="Date when the sale was made")
    agreement_date = models.DateField(null=True, blank=True, help_text="Date of sale agreement")
    
    # Status and notes
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_process')
    notes = models.TextField(blank=True, help_text="Additional notes about the sale")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_sales')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Land Sale"
        verbose_name_plural = "Land Sales"
    
    def __str__(self):
        return f"{self.land.name} - {self.buyer_name}"
    
    def save(self, *args, **kwargs):
        """Override save method"""
        super().save(*args, **kwargs)


class Installment(models.Model):
    """Model for land sale installments with integrated payment records"""
    PAYMENT_TYPE_CHOICES = [
        ('cash', 'Cash'),
        ('cheque', 'Cheque'),
        ('bank_transfer', 'Bank Transfer'),
        ('upi', 'UPI'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    land_sale = models.ForeignKey(LandSale, on_delete=models.CASCADE, related_name='installments')
    installment_number = models.PositiveIntegerField(help_text="Installment number (1, 2, 3, etc.)")
    
    # Amount details
    percentage = models.DecimalField(max_digits=5, decimal_places=2, help_text="Percentage of total amount")
    
    # Payment details
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='cash')
    payment_reference = models.CharField(max_length=255, blank=True, help_text="Cheque number, transaction ID, etc.")
    
    # Dates
    due_date = models.DateField(help_text="Due date for this installment")
    paid_date = models.DateField(null=True, blank=True, help_text="Date when payment was received")
    
    # Status and notes
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, help_text="Additional notes about this installment")
    remark = models.TextField(blank=True, help_text="Payment processing remarks")
    
    # Payment record fields (merged from PaymentRecord model)
    rtgs_number = models.CharField(max_length=100, blank=True, help_text="RTGS number")
    from_bank = models.CharField(max_length=255, blank=True, help_text="Sender bank name")
    utr_reference = models.CharField(max_length=100, blank=True, help_text="UTR reference number")
    ifsc_code = models.CharField(max_length=11, blank=True, help_text="IFSC code")
    bank_name = models.CharField(max_length=255, blank=True, help_text="Bank name")
    cheque_photo = models.ImageField(upload_to='payment_photos/', blank=True, null=True, help_text="Cheque photo")
    
    # System fields
    received_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='received_payments')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['land_sale', 'installment_number']
        unique_together = ['land_sale', 'installment_number']
        verbose_name = "Installment"
        verbose_name_plural = "Installments"
    
    def __str__(self):
        return f"{self.land_sale.land.name} - Installment {self.installment_number} - {self.percentage}%"
    
    def is_overdue(self):
        """Check if installment is overdue"""
        from datetime import date
        return self.status == 'pending' and self.due_date < date.today()
    
    def mark_as_paid(self, paid_date=None, payment_reference=''):
        """Mark installment as paid"""
        from datetime import date
        self.status = 'paid'
        self.paid_date = paid_date or date.today()
        if payment_reference:
            self.payment_reference = payment_reference
        self.save()

class Client(models.Model):
    CLIENT_TYPE_CHOICES = [
        ('property_owner', 'Property Owner'),
        ('lead_generation', 'Lead Generation'),
        ('web_by_reference', 'Web By Reference'),
        ('direct_visit', 'Direct Visit'),
    ]
    
    # Client Identification
    client_type = models.CharField(max_length=20, choices=CLIENT_TYPE_CHOICES, default='property_owner')
    search_property_title = models.CharField(max_length=255, blank=True, null=True)
    client_name = models.CharField(max_length=255)
    
    # Contact Information
    email = models.EmailField()
    mobile_no = models.CharField(max_length=15)
    another_mobile_no = models.CharField(max_length=15, blank=True, null=True)
    whatsapp_no = models.CharField(max_length=15)
    pan_no = models.CharField(max_length=20, blank=True, null=True)
    adhar_card_no = models.CharField(max_length=20, blank=True, null=True)
    
    # Address and Investment Details
    address = models.TextField(blank=True, null=True)
    approx_investment = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    choice_in_particular_property = models.TextField(blank=True, null=True)
    
    # Important Events
    dob = models.DateField(blank=True, null=True)
    anniversary = models.DateField(blank=True, null=True)
    any_event = models.DateField(blank=True, null=True)
    
    # Additional Information
    remark = models.TextField(blank=True, null=True, help_text="Additional remarks or notes about the client")
    
    # System fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='clients_created')
    is_active = models.BooleanField(default=True, help_text="Whether the client is active or not")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Client"
        verbose_name_plural = "Clients"
    
    def __str__(self):
        return f"{self.client_name} ({self.get_client_type_display()})"
    
    def get_display_name(self):
        return f"{self.client_name} - {self.mobile_no}"
    
    def clean(self):
        from django.core.exceptions import ValidationError
        import re
        
        # Mobile number validation (10 digits)
        if self.mobile_no:
            if not re.match(r'^\d{10}$', self.mobile_no):
                raise ValidationError({'mobile_no': 'Mobile number must be exactly 10 digits.'})
        
        # Another mobile number validation (10 digits)
        if self.another_mobile_no:
            if not re.match(r'^\d{10}$', self.another_mobile_no):
                raise ValidationError({'another_mobile_no': 'Another mobile number must be exactly 10 digits.'})
        
        # WhatsApp number validation (10 digits)
        if self.whatsapp_no:
            if not re.match(r'^\d{10}$', self.whatsapp_no):
                raise ValidationError({'whatsapp_no': 'WhatsApp number must be exactly 10 digits.'})
        
        # PAN number validation (10 characters: 5 letters, 4 digits, 1 letter)
        if self.pan_no:
            if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', self.pan_no.upper()):
                raise ValidationError({'pan_no': 'PAN number must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter).'})
            self.pan_no = self.pan_no.upper()  # Convert to uppercase
        
        # Aadhar card validation (12 digits)
        if self.adhar_card_no:
            if not re.match(r'^\d{12}$', self.adhar_card_no):
                raise ValidationError({'adhar_card_no': 'Aadhar card number must be exactly 12 digits.'})
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class Reminder(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Basic fields
    title = models.CharField(max_length=200)
    description = models.TextField()
    reminder_time = models.DateTimeField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    
    # Relations
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_reminders')
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_reminders', null=True, blank=True)
    installment = models.ForeignKey('Installment', on_delete=models.CASCADE, null=True, blank=True, related_name='reminders')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'core_reminder'
        ordering = ['-reminder_time', '-created_at']
        verbose_name = "Reminder"
        verbose_name_plural = "Reminders"
    
    def __str__(self):
        return f"{self.title} - {self.reminder_time.strftime('%d/%m/%Y %H:%M')}"
    
    def is_overdue(self):
        return self.status == 'pending' and self.reminder_time < timezone.now()
    
    def mark_completed(self):
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()

