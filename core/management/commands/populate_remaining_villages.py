from django.core.management.base import BaseCommand
from core.models import District, Taluka, Village

class Command(BaseCommand):
    help = 'Populate villages for ALL remaining talukas that don\'t have villages yet'

    def handle(self, *args, **options):
        self.stdout.write('Starting to populate villages for ALL remaining talukas...')
        
        # Get all talukas that don't have villages
        talukas_without_villages = [t for t in Taluka.objects.all() if t.villages.count() == 0]
        
        self.stdout.write(f'Found {len(talukas_without_villages)} talukas without villages')
        
        if not talukas_without_villages:
            self.stdout.write('All talukas already have villages!')
            return
        
        total_villages_created = 0
        
        # Generic village patterns for different types of talukas
        generic_villages = [
            'Main Village', 'Central Area', 'North Zone', 'South Zone', 'East Zone', 'West Zone',
            'Market Area', 'Residential Area', 'Industrial Area', 'Agricultural Area', 'Forest Area',
            'Rural Settlement', 'Urban Center', 'Suburban Area', 'Commercial District', 'Residential Colony'
        ]
        
        # Process each taluka without villages
        for taluka in talukas_without_villages:
            self.stdout.write(f'\nProcessing taluka: {taluka.name} (District: {taluka.district.name})')
            
            # Create basic villages for this taluka
            villages_created = 0
            
            # Add the taluka name itself as a village if it doesn't exist
            village, created = Village.objects.get_or_create(
                name=taluka.name,
                taluka=taluka
            )
            if created:
                self.stdout.write(f'  ✓ Created village: {taluka.name}')
                total_villages_created += 1
                villages_created += 1
            
            # Add some generic villages
            for i, village_name in enumerate(generic_villages[:8]):  # Limit to 8 generic villages
                village, created = Village.objects.get_or_create(
                    name=f'{taluka.name} {village_name}',
                    taluka=taluka
                )
                if created:
                    self.stdout.write(f'  ✓ Created village: {taluka.name} {village_name}')
                    total_villages_created += 1
                    villages_created += 1
            
            # Add some numbered villages for larger coverage
            for i in range(1, 6):  # Add 5 numbered villages
                village, created = Village.objects.get_or_create(
                    name=f'{taluka.name} Village {i}',
                    taluka=taluka
                )
                if created:
                    self.stdout.write(f'  ✓ Created village: {taluka.name} Village {i}')
                    total_villages_created += 1
                    villages_created += 1
            
            self.stdout.write(f'  Total villages created for {taluka.name}: {villages_created}')
        
        # Final summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\n\n✅ Successfully populated villages for ALL remaining talukas!'
                f'\n📊 Summary:'
                f'\n  - Districts: {District.objects.count()}'
                f'\n  - Talukas: {Taluka.objects.count()}'
                f'\n  - Total Villages: {Village.objects.count()}'
                f'\n  - New Villages Created: {total_villages_created}'
                f'\n  - Talukas Processed: {len(talukas_without_villages)}'
            )
        )
        
        # Show final status
        final_talukas_without_villages = [t for t in Taluka.objects.all() if t.villages.count() == 0]
        if final_talukas_without_villages:
            self.stdout.write(f'\n⚠️  Warning: {len(final_talukas_without_villages)} talukas still have no villages')
            for taluka in final_talukas_without_villages[:10]:
                self.stdout.write(f'  - {taluka.name} ({taluka.district.name})')
        else:
            self.stdout.write('\n🎉 SUCCESS: All talukas now have villages!')
