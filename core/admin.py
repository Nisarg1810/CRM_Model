from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
import datetime
from .models import (
    User, Task, TaskManage, SataPrakar, Land, Message, Notification, 
    Advocate, District, Taluka, Village, AssignedTask, LandSale, 
    Installment, Client
)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'full_name', 'role', 'employee_type', 'status')
    list_filter = ('role', 'employee_type', 'status', 'is_superuser', 'is_staff')
    search_fields = ('username', 'email', 'full_name', 'mobile')
    ordering = ('username',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('email', 'full_name', 'mobile', 'address')}),
        ('Professional info', {'fields': ('role', 'employee_type', 'location')}),
        ('Profile', {'fields': ('profile_pic',)}),
        ('Status', {'fields': ('status', 'is_active')}),
        ('Permissions', {'fields': ('is_superuser', 'is_staff', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'role', 'email'),
        }),
    )

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'content_preview', 'timestamp', 'read_by_admin', 'read_by_dev')
    list_filter = ('timestamp', 'read_by_admin', 'read_by_dev')
    search_fields = ('sender__username', 'receiver__username', 'content')
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('name', 'position', 'is_default', 'completion_days', 'assigned_employees_count')
    list_filter = ('is_default',)
    search_fields = ('name',)
    ordering = ('position', 'name')
    
    fieldsets = (
        ('Task Information', {'fields': ('name', 'position', 'is_default', 'completion_days')}),
        ('Employee Assignment', {'fields': ()}),  # Employee assignments are managed through TaskManage
    )
    
    def assigned_employees_count(self, obj):
        return obj.get_assigned_employees_count()
    assigned_employees_count.short_description = 'Assigned Employees'


@admin.register(TaskManage)
class TaskManageAdmin(admin.ModelAdmin):
    list_display = ('task', 'employee', 'task_position', 'employee_role')
    list_filter = ('employee__role', 'task__is_default')
    search_fields = ('task__name', 'employee__username', 'employee__full_name')
    ordering = ('task__position', 'employee__username')
    
    fieldsets = (
        ('Task Assignment', {'fields': ('task', 'employee')}),
    )
    
    def task_position(self, obj):
        return obj.task.position
    task_position.short_description = 'Task Position'
    
    def employee_role(self, obj):
        return obj.employee.role
    employee_role.short_description = 'Employee Role'



@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'message_preview', 'is_read', 'timestamp')
    list_filter = ('is_read', 'timestamp', 'user__role')
    search_fields = ('user__username', 'message')
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message'

@admin.register(Land)
class LandAdmin(admin.ModelAdmin):
    list_display = ('name', 'village', 'taluka', 'district', 'sata_prakar', 'total_area', 'status')
    list_filter = ('district', 'taluka', 'village', 'sata_prakar', 'status')
    search_fields = ('name', 'village__name', 'taluka__name', 'district__name', 'broker_name', 'old_sr_no', 'new_sr_no')
    readonly_fields = ('total_area',)
    
    fieldsets = (
        ('Basic Information', {'fields': ('name', 'status')}),
        ('Location Details', {'fields': ('state', 'district', 'taluka', 'village')}),
        ('Identification Numbers', {'fields': ('old_sr_no', 'new_sr_no')}),
        ('Land Type/Area Details', {'fields': ('sata_prakar', 'built_up_area', 'unutilized_area', 'total_area')}),
        ('Important Dates', {'fields': ('past_date', 'soda_tarikh', 'banakhat_tarikh', 'dastavej_tarikh')}),
        ('Additional Information', {'fields': ('broker_name', 'location', 'remark', 'selected_tasks')}),
    )

@admin.register(SataPrakar)
class SataPrakarAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'updated_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('name',)

@admin.register(AssignedTask)
class AssignedTaskAdmin(admin.ModelAdmin):
    list_display = ('land', 'task', 'employee', 'status', 'assigned_date', 'completed_date')
    list_filter = ('status', 'assigned_date', 'completed_date', 'employee__role', 'land__district')
    search_fields = ('land__name', 'task__name', 'employee__username', 'employee__full_name')
    readonly_fields = ('assigned_date',)
    ordering = ('-assigned_date',)
    
    fieldsets = (
        ('Assignment', {'fields': ('land', 'task', 'employee')}),
        ('Status', {'fields': ('status', 'assigned_date', 'completed_date')}),
    )
    
    actions = ['mark_completed', 'mark_pending']
    
    def mark_completed(self, request, queryset):
        updated = queryset.update(status='complete', completed_date=datetime.datetime.now())
        self.message_user(request, f'{updated} task(s) marked as completed.')
    mark_completed.short_description = "Mark selected tasks as completed"
    
    def mark_pending(self, request, queryset):
        updated = queryset.update(status='pending', completed_date=None)
        self.message_user(request, f'{updated} task(s) marked as pending.')
    mark_pending.short_description = "Mark selected tasks as pending"

@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ['name', 'state', 'created_at']
    list_filter = ['state']
    search_fields = ['name']
    ordering = ['name']

@admin.register(Taluka)
class TalukaAdmin(admin.ModelAdmin):
    list_display = ['name', 'district', 'created_at']
    list_filter = ['district', 'district__state']
    search_fields = ['name', 'district__name']
    ordering = ['district__name', 'name']

@admin.register(Village)
class VillageAdmin(admin.ModelAdmin):
    list_display = ['name', 'taluka', 'district', 'created_at']
    list_filter = ['taluka__district', 'taluka__district__state']
    search_fields = ['name', 'taluka__name', 'taluka__district__name']
    ordering = ['taluka__district__name', 'taluka__name', 'name']

    def district(self, obj):
        return obj.taluka.district.name
    district.short_description = 'District'


# --- Land Sale and Installment Admin Classes ---

@admin.register(LandSale)
class LandSaleAdmin(admin.ModelAdmin):
    list_display = ('land', 'buyer_name', 'status', 'sale_date', 'created_at')
    list_filter = ('status', 'sale_date', 'created_at')
    search_fields = ('land__name', 'buyer_name', 'buyer_contact')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Land Information', {
            'fields': ('land',)
        }),
        ('Buyer Information', {
            'fields': ('buyer_name', 'buyer_contact', 'buyer_address')
        }),
        ('Sale Details', {
            'fields': ('sale_date', 'agreement_date')
        }),
        ('Status & Notes', {
            'fields': ('status', 'notes')
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Installment)
class InstallmentAdmin(admin.ModelAdmin):
    list_display = ('land_sale', 'installment_number', 'percentage', 'due_date', 'status', 'paid_date', 'payment_type')
    list_filter = ('status', 'payment_type', 'due_date', 'paid_date', 'received_by')
    search_fields = ('land_sale__land__name', 'land_sale__buyer_name', 'payment_reference', 'rtgs_number', 'utr_reference')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('land_sale', 'installment_number')
    
    fieldsets = (
        ('Sale Information', {
            'fields': ('land_sale', 'installment_number')
        }),
        ('Amount Details', {
            'fields': ('percentage',)
        }),
        ('Payment Information', {
            'fields': ('payment_type', 'payment_reference', 'due_date', 'paid_date', 'status')
        }),
        ('Payment Record Details', {
            'fields': ('rtgs_number', 'from_bank', 'utr_reference', 'ifsc_code', 'bank_name', 'cheque_photo', 'received_by'),
            'classes': ('collapse',)
        }),
        ('Status & Notes', {
            'fields': ('notes',)
        }),
        ('System Information', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('land_sale__land', 'received_by')

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('client_name', 'client_type', 'email', 'mobile_no', 'whatsapp_no', 'created_at')
    list_filter = ('client_type', 'created_at', 'created_by')
    search_fields = ('client_name', 'email', 'mobile_no', 'whatsapp_no', 'pan_no', 'adhar_card_no')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Client Identification', {
            'fields': ('client_type', 'search_property_title', 'client_name')
        }),
        ('Contact Information', {
            'fields': ('email', 'mobile_no', 'another_mobile_no', 'whatsapp_no', 'pan_no', 'adhar_card_no')
        }),
        ('Address and Investment Details', {
            'fields': ('address', 'approx_investment', 'choice_in_particular_property')
        }),
        ('Important Events', {
            'fields': ('dob', 'anniversary', 'any_event')
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
