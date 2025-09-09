from django.urls import path
from . import views

urlpatterns = [
    # User authentication
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),

    # Dashboard and index
    path('', views.index, name='dashboard-index'),
    path('home/', views.home, name='home'),

    # Admin views
    path('dashboard/admin/', views.admin_dashboard, name='admin-dashboard'),
    path('dashboard/admin/employees/', views.admin_employees, name='admin-employees'),
    path('dashboard/admin/clients/', views.admin_clients, name='admin-clients'),
    path('dashboard/admin/land/', views.admin_land, name='admin-land'),
    path('dashboard/admin/land/<int:land_id>/tasks/', views.land_tasks, name='land-tasks'),
    path('dashboard/admin/assigned-tasks/', views.admin_assigned_tasks, name='admin-assigned-tasks'),

    path('dashboard/admin/chat/', views.admin_chat_index, name='admin_chat_index'),
    path('dashboard/admin/chat/<str:developer_username>/', views.admin_chat, name='admin_chat'),

    # Employee views
    path('dashboard/employee/', views.employee_dashboard, name='employee-dashboard'),
    path('dashboard/employee/tasks/', views.employee_tasks, name='employee-tasks'),
    path('dashboard/employee/profile/', views.employee_profile, name='employee-profile'),

    path('dashboard/employee/chat/', views.employee_chat, name='employee-chat'),

    # Marketing employee views
    path('dashboard/marketing/', views.marketing_dashboard, name='marketing-dashboard'),
    path('dashboard/marketing/tasks/', views.marketing_tasks, name='marketing-tasks'),

    # Profile
    path('profile/', views.profile, name='profile'),

    # Employee CRUD
    path('add_employee/', views.add_employee, name='add_employee'),
    path('add_employee_page/', views.add_employee_page, name='add_employee_page'),
    path('edit_employee/<str:dev_id>/', views.edit_employee, name='edit_employee'),
    path('delete_employee/<str:dev_id>/', views.delete_employee, name='delete_employee'),
    path('bulk_delete_employees/', views.bulk_delete_employees, name='bulk_delete_employees'),

    # Land CRUD
    path('add_land/', views.add_land, name='add_land'),
    path('edit_land/<int:land_id>/', views.edit_land, name='edit_land'),
    path('delete_land/<int:land_id>/', views.delete_land, name='delete_land'),
    path('bulk_delete_lands/', views.bulk_delete_lands, name='bulk_delete_lands'),
    path('land/<int:land_id>/tasks/', views.get_land_tasks, name='get_land_tasks'),
    path('land/<int:land_id>/data/', views.get_land_data, name='get_land_data'),
    path('land/<int:land_id>/task/<int:task_id>/employees/', views.get_land_task_employees, name='get_land_task_employees'),
    path('get_land_details/<int:land_id>/', views.get_land_details_for_edit, name='get_land_details_for_edit'),
    path('get_employees_for_tasks/', views.get_employees_for_tasks, name='get_employees_for_tasks'),
    
    # API endpoints for land tasks
    path('api/land/<int:land_id>/tasks/', views.get_land_tasks_api, name='get_land_tasks_api'),
    path('api/employee/<int:employee_id>/tasks/', views.get_employee_tasks_api, name='get_employee_tasks_api'),
    path('api/employees/', views.get_employees_api, name='get_employees_api'),
    path('api/clients/', views.get_clients_api, name='get_clients_api'),
    path('api/clients/add/', views.add_client, name='add_client_api'),
    path('api/clients/<int:client_id>/edit/', views.edit_client, name='edit_client_api'),
    path('api/clients/<int:client_id>/delete/', views.delete_client, name='delete_client_api'),
    path('api/clients/<int:client_id>/details/', views.get_client_details_api, name='get_client_details_api'),
    path('api/lands/', views.get_lands_api, name='get_lands_api'),
    path('api/tasks/', views.get_tasks_api, name='get_tasks_api'),
    path('api/tasks/add/', views.add_task_api, name='add_task_api'),
    path('api/tasks/<int:task_id>/', views.get_task_details_api, name='get_task_details_api'),
    path('api/tasks/<int:task_id>/approve/', views.approve_task_api, name='approve_task_api'),
    path('api/tasks/<int:task_id>/delete/', views.delete_task_api, name='delete_task_api'),
    
    # API endpoints for task completion workflow
    path('api/tasks/<int:task_id>/start/', views.start_task_api, name='start_task_api'),
    path('api/tasks/<int:task_id>/submit-completion/', views.submit_task_completion_api, name='submit_task_completion_api'),
    path('api/tasks/<int:task_id>/approve-completion/', views.approve_task_completion_api, name='approve_task_completion_api'),
    path('api/tasks/<int:task_id>/reject-completion/', views.reject_task_completion_api, name='reject_task_completion_api'),
    path('api/tasks/<int:task_id>/reassign/', views.reassign_task_api, name='reassign_task_api'),

    # Admin Assigned Tasks API endpoints
    path('api/admin/assigned-tasks/', views.admin_assigned_tasks_api, name='admin_assigned_tasks_api'),
    path('api/admin/assigned-tasks/statistics/', views.admin_assigned_tasks_statistics_api, name='admin_assigned_tasks_statistics_api'),
    path('api/admin/assigned-tasks/<int:task_id>/', views.admin_assigned_task_detail_api, name='admin_assigned_task_detail_api'),
    path('api/admin/assigned-tasks/<int:task_id>/delete/', views.admin_assigned_task_delete_api, name='admin_assigned_task_delete_api'),
    path('api/admin/assigned-tasks/<int:task_id>/approve/', views.admin_assigned_task_approve_api, name='admin_assigned_task_approve_api'),
    path('api/admin/assigned-tasks/<int:task_id>/reassign/', views.admin_assigned_task_reassign_api, name='admin_assigned_task_reassign_api'),
    path('api/admin/assigned-tasks/<int:task_id>/mark-complete/', views.admin_assigned_task_mark_complete_api, name='admin_assigned_task_mark_complete_api'),
    path('api/admin/assigned-tasks/export/', views.admin_assigned_tasks_export_api, name='admin_assigned_tasks_export_api'),

    # Chat
    path('chat/unread_count', views.chat_unread_count, name='chat_unread_count'),
    path('chat/send_message/', views.send_message_ajax, name='send_message_ajax'),
    path('chat/get_messages/', views.get_chat_messages_ajax, name='get_chat_messages_ajax'),

    # Notifications
    path('notifications/', views.notifications_index, name='notifications-index'),
    path('notifications/mark_read/', views.mark_read, name='notifications_mark_read'),
    path('notifications/user/', views.user_notifications, name='notifications_user'),
    path('chat/mark_read/', views.mark_chat_read, name='mark_chat_read'),

    # Tasks and Users index
    # path('tasks/', views.tasks_index, name='tasks-index'),  # Commented out - conflicts with main tasks view
    path('users/', views.users_index, name='users-index'),
    
    # Employee status change
    path('change_employee_status/<int:employee_id>/', views.change_employee_status, name='change_employee_status'),
    
    # Task Management (Merged from Task Field and Assigned Tasks)
    path('tasks/', views.tasks, name='tasks'),
    path('add_task/', views.add_task, name='add_task'),
    path('add_task_for_land/', views.add_task_for_land, name='add_task_for_land'),
    path('get_task_employee_info/', views.get_task_employee_info, name='get_task_employee_info'),
    path('assign_task_to_land/', views.assign_task_to_land, name='assign_task_to_land'),
    path('get_task/<int:task_id>/', views.get_task, name='get_task'),
    path('update_task/', views.update_task, name='update_task'),
    path('delete_task/<int:task_id>/', views.delete_task, name='delete_task'),

    # Advocate Management
    path('advocates/', views.advocate_list, name='advocates'),
    path('api/advocates/', views.advocate_api, name='advocate_api'),
    path('api/advocates/create/', views.advocate_create_api, name='advocate_create_api'),
    path('api/advocates/<int:advocate_id>/', views.advocate_update_api, name='advocate_update_api'),
    path('api/advocates/<int:advocate_id>/delete/', views.advocate_delete_api, name='advocate_delete_api'),

    
    # Sata Prakar Management
    path('sata-prakar/', views.sata_prakar, name='sata_prakar'),
    path('add_sata_prakar/', views.add_sata_prakar, name='add_sata_prakar'),
    path('get_sata_prakar/<int:sata_id>/', views.get_sata_prakar, name='get_sata_prakar'),
    path('update_sata_prakar/', views.update_sata_prakar, name='update_sata_prakar'),
    path('delete_sata_prakar/<int:sata_id>/', views.delete_sata_prakar, name='delete_sata_prakar'),
    
    # TaskManage Management
    path('create_task_manage/', views.create_task_manage, name='create_task_manage'),
    path('delete_task_manage/<int:task_manage_id>/', views.delete_task_manage, name='delete_task_manage'),
    
    # Employee Task Management
    path('employee/update_task_status/<int:assigned_task_id>/', views.update_task_status, name='update_task_status'),
    
    # Task Approval Management
    path('approve_task_completion/<int:task_id>/', views.approve_task_completion, name='approve_task_completion'),
    path('employee/get_task_details/<int:assigned_task_id>/', views.get_employee_task_details, name='get_employee_task_details'),

    # Location APIs
    path('api/location/districts/', views.location_api, name='location_api'),
    path('api/location/districts/add/', views.add_district_api, name='add_district_api'),
    path('api/location/districts/list/', views.district_list_api, name='district_list_api'),
    path('api/location/districts/<int:district_id>/talukas/', views.taluka_api, name='taluka_api'),
    path('api/location/talukas/add/', views.add_taluka_api, name='add_taluka_api'),
    path('api/location/talukas/list/', views.taluka_list_api, name='taluka_list_api'),
    path('api/location/talukas/<int:taluka_id>/villages/', views.village_api, name='village_api'),
    path('api/location/villages/add/', views.add_village_api, name='add_village_api'),
    
    # Village Management
    path('village-management/', views.village_management_view, name='village_management'),
    path('api/location/villages/list/', views.village_list_api, name='village_list_api'),
    
    # Land Inventory Management
    path('land/<int:land_id>/send-to-inventory/', views.send_land_to_inventory, name='send_land_to_inventory'),
    path('inventory/', views.inventory_land, name='inventory_land'),
    path('sold-lands/', views.sold_land, name='sold_land'),
    path('land/<int:land_id>/restore-from-inventory/', views.restore_land_from_inventory, name='restore_land_from_inventory'),
    path('land/<int:land_id>/mark-as-sold/', views.mark_land_as_sold, name='mark_land_as_sold'),
    path('land/<int:land_id>/details/', views.get_land_details, name='get_land_details_for_modal'),
    path('land/<int:land_id>/status/', views.get_land_status_api, name='get_land_status_api'),
    
    # Land Sale and Installment Processing
    path('process-land-sale/', views.process_land_sale, name='process_land_sale'),
    path('update-land-sale/', views.update_land_sale, name='update_land_sale'),
    path('land-installments/', views.land_installments, name='land_installments'),
    path('land/<int:land_id>/installments/', views.get_land_installments, name='get_land_installments'),
    path('installment/<int:installment_id>/pay/', views.process_installment_payment, name='process_installment_payment'),
    path('installment/<int:installment_id>/payment-details/', views.get_payment_details, name='get_payment_details'),
    
    # Land Installments API endpoints
    path('api/installments/<int:installment_id>/mark-paid/', views.mark_installment_paid_api, name='mark_installment_paid_api'),
    path('api/installments/<int:installment_id>/process-payment/', views.process_installment_payment_api, name='process_installment_payment_api'),
    path('api/installments/<int:installment_id>/update/', views.update_installment_api, name='update_installment_api'),
    path('api/installments/<int:installment_id>/details/', views.get_installment_details_api, name='get_installment_details_api'),
    
    # Marketing Dashboard Installments API
    path('api/marketing-installments/<str:installment_type>/', views.marketing_installments_api, name='marketing_installments_api'),
    
    # Reminder API endpoints
    path('api/reminders/create/', views.create_reminder_api, name='create_reminder_api'),
    path('api/reminders/', views.get_reminders_api, name='get_reminders_api'),
    path('api/reminders/<int:reminder_id>/complete/', views.mark_reminder_completed_api, name='mark_reminder_completed_api'),
    
    # Task Download endpoints
    path('land/<int:land_id>/task/<int:task_id>/download/', views.download_single_task, name='download_single_task'),
    path('land/<int:land_id>/tasks/download-bulk/', views.download_bulk_tasks, name='download_bulk_tasks'),

]