from django.core.management.base import BaseCommand
from core.models import District, Taluka, Village

class Command(BaseCommand):
    help = 'Populate database with initial Gujarat location data'

    def handle(self, *args, **options):
        self.stdout.write('Starting to populate Gujarat location data...')
        
        # Create districts
        districts_data = [
            'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 
            'Gandhinagar', 'Anand', 'Bharuch', 'Narmada', 'Dang', 'Navsari', 
            'Valsad', 'Tapi', 'Dahod', 'Panchmahal', 'Kheda', 'Sabarkantha', 
            'Banaskantha', 'Patan', 'Mehsana', 'Surendranagar', 'Amreli', 
            'Junagadh', 'Porbandar', 'Devbhoomi Dwarka', 'Morbi', 'Botad', 
            'Chhota Udepur', 'Mahisagar', 'Aravalli'
        ]
        
        created_districts = []
        for district_name in districts_data:
            district, created = District.objects.get_or_create(
                name=district_name,
                defaults={'state': 'Gujarat'}
            )
            if created:
                self.stdout.write(f'Created district: {district_name}')
            created_districts.append(district)
        
        # Create some sample talukas and villages for major districts
        sample_data = {
            'Ahmedabad': {
                'Ahmedabad City': ['Ahmedabad City', 'Satellite', 'Vastrapur', 'Navrangpura', 'Ellisbridge', 'Paldi'],
                'Daskroi': ['Daskroi', 'Bavla', 'Sanand', 'Viramgam', 'Dholka', 'Dhandhuka'],
                'Sanand': ['Sanand', 'Bhat', 'Bopal', 'Chandkheda', 'Chandlodia', 'Chharodi']
            },
            'Surat': {
                'Surat City': ['Surat City', 'Adajan', 'Vesu', 'Athwa', 'Pal', 'Piplod'],
                'Bardoli': ['Bardoli', 'Bardoli Rural', 'Bardoli City', 'Bardoli West', 'Bardoli East'],
                'Vyara': ['Vyara', 'Vyara Rural', 'Vyara City', 'Vyara West', 'Vyara East']
            },
            'Vadodara': {
                'Vadodara City': ['Vadodara City', 'Alkapuri', 'Fatehgunj', 'Gotri', 'Karelibaug', 'Sama'],
                'Savli': ['Savli', 'Savli Rural', 'Savli City', 'Savli West', 'Savli East'],
                'Padra': ['Padra', 'Padra Rural', 'Padra City', 'Padra West', 'Padra East']
            },
            'Rajkot': {
                'Rajkot City': ['Rajkot City', 'Gondal', 'Jetpur', 'Upleta', 'Dhoraji', 'Jamkandorna'],
                'Gondal': ['Gondal', 'Gondal Rural', 'Gondal City', 'Gondal West', 'Gondal East'],
                'Jetpur': ['Jetpur', 'Jetpur Rural', 'Jetpur City', 'Jetpur West', 'Jetpur East']
            }
        }
        
        for district_name, talukas_data in sample_data.items():
            try:
                district = District.objects.get(name=district_name)
                
                for taluka_name, villages_data in talukas_data.items():
                    taluka, created = Taluka.objects.get_or_create(
                        name=taluka_name,
                        district=district
                    )
                    if created:
                        self.stdout.write(f'Created taluka: {taluka_name} in {district_name}')
                    
                    for village_name in villages_data:
                        village, created = Village.objects.get_or_create(
                            name=village_name,
                            taluka=taluka
                        )
                        if created:
                            self.stdout.write(f'Created village: {village_name} in {taluka_name}')
                            
            except District.DoesNotExist:
                self.stdout.write(f'District {district_name} not found, skipping...')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated location data! '
                f'Created {District.objects.count()} districts, '
                f'{Taluka.objects.count()} talukas, '
                f'{Village.objects.count()} villages'
            )
        )
