from django.core.management.base import BaseCommand
from core.models import User

class Command(BaseCommand):
    help = 'Manage user permissions for Django admin access'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Username to manage permissions for'
        )
        parser.add_argument(
            '--grant-admin',
            action='store_true',
            help='Grant admin access to the user'
        )
        parser.add_argument(
            '--revoke-admin',
            action='store_true',
            help='Revoke admin access from the user'
        )
        parser.add_argument(
            '--list-users',
            action='store_true',
            help='List all users with their permissions'
        )

    def handle(self, *args, **options):
        if options['list_users']:
            self.list_users()
            return

        username = options['username']
        if not username:
            self.stdout.write(
                self.style.ERROR('Please provide a username with --username')
            )
            return

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User "{username}" does not exist')
            )
            return

        if options['grant_admin']:
            self.grant_admin(user)
        elif options['revoke_admin']:
            self.revoke_admin(user)
        else:
            self.show_user_status(user)

    def list_users(self):
        users = User.objects.all().order_by('username')
        self.stdout.write(self.style.SUCCESS('Current Users:'))
        self.stdout.write('-' * 80)
        
        for user in users:
            status = []
            if user.is_superuser:
                status.append('SUPERUSER')
            if user.is_staff:
                status.append('STAFF')
            if user.is_active:
                status.append('ACTIVE')
            else:
                status.append('INACTIVE')
            
            status_str = ', '.join(status) if status else 'NO PERMISSIONS'
            self.stdout.write(
                f'{user.username:<20} | Role: {user.role:<10} | {status_str}'
            )

    def grant_admin(self, user):
        user.is_staff = True
        user.is_superuser = True
        user.save()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully granted admin access to user "{user.username}"'
            )
        )
        self.show_user_status(user)

    def revoke_admin(self, user):
        user.is_staff = False
        user.is_superuser = False
        user.save()
        
        self.stdout.write(
            self.style.WARNING(
                f'Successfully revoked admin access from user "{user.username}"'
            )
        )
        self.show_user_status(user)

    def show_user_status(self, user):
        self.stdout.write(f'\nUser: {user.username}')
        self.stdout.write(f'Role: {user.role}')
        self.stdout.write(f'is_staff: {user.is_staff}')
        self.stdout.write(f'is_superuser: {user.is_superuser}')
        self.stdout.write(f'is_active: {user.is_active}')
        
        if user.is_staff or user.is_superuser:
            self.stdout.write(
                self.style.SUCCESS('✓ Has admin access')
            )
        else:
            self.stdout.write(
                self.style.ERROR('✗ No admin access')
            )
