from django.core.management.base import BaseCommand
from core.models import Village

class Command(BaseCommand):
    help = 'Remove all villages from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm that you want to delete all villages',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    '⚠️  WARNING: This will delete ALL villages from the database!\n'
                    'To proceed, run: python manage.py clear_all_villages --confirm'
                )
            )
            return

        # Count villages before deletion
        total_villages = Village.objects.count()
        
        if total_villages == 0:
            self.stdout.write('No villages found in the database.')
            return

        self.stdout.write(f'Found {total_villages} villages in the database.')
        self.stdout.write('Deleting all villages...')

        # Delete all villages
        deleted_count = Village.objects.all().delete()[0]
        
        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Successfully deleted {deleted_count} villages from the database!'
            )
        )
        
        # Verify deletion
        remaining_villages = Village.objects.count()
        self.stdout.write(f'Remaining villages: {remaining_villages}')
        
        if remaining_villages == 0:
            self.stdout.write(
                self.style.SUCCESS('🎯 All villages have been successfully removed!')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'⚠️  {remaining_villages} villages still remain in the database.')
            )
