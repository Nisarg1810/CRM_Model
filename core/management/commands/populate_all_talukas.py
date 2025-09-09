from django.core.management.base import BaseCommand
from core.models import District, Taluka, Village

class Command(BaseCommand):
    help = 'Populate all talukas for all Gujarat districts'

    def handle(self, *args, **options):
        self.stdout.write('Starting to populate all talukas for Gujarat districts...')
        
        # Comprehensive taluka data for all Gujarat districts
        taluka_data = {
            'Ahmedabad': [
                'Ahmedabad City', 'Daskroi', 'Sanand', 'Viramgam', 'Dholka', 'Dhandhuka', 'Ranpur', 'Barwala', 'Detroj', 'Mandal'
            ],
            'Surat': [
                'Surat City', 'Bardoli', 'Vyara', 'Songadh', 'Valod', 'Uchchhal', 'Nizar', 'Mangrol', 'Mandvi', 'Bansda'
            ],
            'Vadodara': [
                'Vadodara City', 'Savli', 'Padra', 'Karjan', 'Dabhoi', 'Chhota Udepur', 'Kavant', 'Naswadi', 'Tilakwada'
            ],
            'Rajkot': [
                'Rajkot City', 'Gondal', 'Jetpur', 'Upleta', 'Dhoraji', 'Jamkandorna', 'Kotda Sangani', 'Lodhika', 'Paddhari'
            ],
            'Bhavnagar': [
                'Bhavnagar City', 'Bhavnagar Rural', 'Gariadhar', 'Palitana', 'Sihor', 'Talaja', 'Vallabhipur', 'Mahuva', 'Ghogha'
            ],
            'Jamnagar': [
                'Jamnagar City', 'Jamnagar Rural', 'Dhrol', 'Kalavad', 'Lalpur', 'Okhamandal', 'Jodiya', 'Bhanvad'
            ],
            'Gandhinagar': [
                'Gandhinagar City', 'Gandhinagar Rural', 'Kalol', 'Mansa', 'Dehgam', 'Dahegam'
            ],
            'Anand': [
                'Anand City', 'Anand Rural', 'Petlad', 'Sojitra', 'Umreth', 'Borsad', 'Khambhat', 'Tarapur'
            ],
            'Bharuch': [
                'Bharuch City', 'Bharuch Rural', 'Ankleshwar', 'Jambusar', 'Amod', 'Vagra', 'Hansot', 'Jhagadia', 'Netrang'
            ],
            'Narmada': [
                'Rajpipla', 'Narmada', 'Dediapada', 'Sagbara', 'Valia', 'Tilakwada', 'Kevadia'
            ],
            'Dang': [
                'Ahwa', 'Subir', 'Waghai', 'Dang'
            ],
            'Navsari': [
                'Navsari City', 'Navsari Rural', 'Gandevi', 'Chikhli', 'Bansda', 'Jalalpore', 'Vansda'
            ],
            'Valsad': [
                'Valsad City', 'Valsad Rural', 'Pardi', 'Umbergaon', 'Dharampur', 'Kaprada', 'Vapi'
            ],
            'Tapi': [
                'Vyara', 'Songadh', 'Valod', 'Uchchhal', 'Nizar', 'Dolvan', 'Kukarmunda'
            ],
            'Dahod': [
                'Dahod City', 'Dahod Rural', 'Garbada', 'Devgadh Baria', 'Limkheda', 'Jhalod', 'Fatepura'
            ],
            'Panchmahal': [
                'Godhra', 'Kalol', 'Halol', 'Jambughoda', 'Kadana', 'Santrampur', 'Morva Hadaf', 'Ghoghamba'
            ],
            'Kheda': [
                'Kheda City', 'Kheda Rural', 'Nadiad', 'Kapadvanj', 'Matar', 'Mahudha', 'Thasra', 'Mehmedabad'
            ],
            'Sabarkantha': [
                'Himmatnagar', 'Idar', 'Khedbrahma', 'Bhiloda', 'Vadali', 'Bayad', 'Prantij', 'Vijaynagar'
            ],
            'Banaskantha': [
                'Palanpur', 'Deesa', 'Deodar', 'Danta', 'Amirgadh', 'Bhabhar', 'Vadgam', 'Tharad'
            ],
            'Patan': [
                'Patan City', 'Patan Rural', 'Radhanpur', 'Santalpur', 'Sidhpur', 'Chanasma', 'Harij', 'Sami'
            ],
            'Mehsana': [
                'Mehsana City', 'Mehsana Rural', 'Vijapur', 'Kadi', 'Visnagar', 'Becharaji', 'Satlasana', 'Unjha'
            ],
            'Surendranagar': [
                'Surendranagar City', 'Surendranagar Rural', 'Lakhtar', 'Dhrangadhra', 'Limbdi', 'Sayla', 'Chotila', 'Vinchhiya'
            ],
            'Amreli': [
                'Amreli City', 'Amreli Rural', 'Lathi', 'Lilia', 'Babra', 'Bagasara', 'Rajula', 'Jafrabad'
            ],
            'Junagadh': [
                'Junagadh City', 'Junagadh Rural', 'Mendarda', 'Vanthali', 'Visavadar', 'Bhesan', 'Manavadar', 'Keshod'
            ],
            'Porbandar': [
                'Porbandar City', 'Porbandar Rural', 'Ranavav', 'Kutiyana'
            ],
            'Devbhoomi Dwarka': [
                'Khambhalia', 'Kalyanpur', 'Bhanvad', 'Dwarka', 'Okhamandal'
            ],
            'Morbi': [
                'Morbi City', 'Morbi Rural', 'Tankara', 'Halvad', 'Wankaner', 'Maliya'
            ],
            'Botad': [
                'Botad City', 'Botad Rural', 'Gadhda', 'Ranpur', 'Vallabhipur'
            ],
            'Chhota Udepur': [
                'Chhota Udepur', 'Kavant', 'Naswadi', 'Tilakwada', 'Kevadia'
            ],
            'Mahisagar': [
                'Lunavada', 'Santrampur', 'Kadana', 'Morva Hadaf', 'Ghoghamba'
            ],
            'Aravalli': [
                'Modasa', 'Bhiloda', 'Vadali', 'Bayad', 'Prantij', 'Vijaynagar'
            ]
        }
        
        total_talukas_created = 0
        total_talukas_existing = 0
        
        for district_name, taluka_names in taluka_data.items():
            try:
                district = District.objects.get(name=district_name)
                self.stdout.write(f'\nProcessing district: {district_name}')
                
                for taluka_name in taluka_names:
                    taluka, created = Taluka.objects.get_or_create(
                        name=taluka_name,
                        district=district
                    )
                    
                    if created:
                        self.stdout.write(f'  ✓ Created taluka: {taluka_name}')
                        total_talukas_created += 1
                    else:
                        self.stdout.write(f'  - Taluka already exists: {taluka_name}')
                        total_talukas_existing += 1
                        
            except District.DoesNotExist:
                self.stdout.write(f'  ✗ District not found: {district_name}')
        
        # Create some sample villages for major talukas
        self.stdout.write('\n\nCreating sample villages for major talukas...')
        
        sample_villages = {
            'Ahmedabad City': ['Satellite', 'Vastrapur', 'Navrangpura', 'Ellisbridge', 'Paldi', 'Law Garden'],
            'Surat City': ['Adajan', 'Vesu', 'Athwa', 'Pal', 'Piplod', 'Mota Varachha'],
            'Vadodara City': ['Alkapuri', 'Fatehgunj', 'Gotri', 'Karelibaug', 'Sama', 'Tandalja'],
            'Rajkot City': ['Gondal', 'Jetpur', 'Upleta', 'Dhoraji', 'Jamkandorna', 'Kotda Sangani'],
            'Bhavnagar City': ['Gariadhar', 'Palitana', 'Sihor', 'Talaja', 'Vallabhipur', 'Mahuva']
        }
        
        total_villages_created = 0
        
        for taluka_name, village_names in sample_villages.items():
            try:
                taluka = Taluka.objects.get(name=taluka_name)
                self.stdout.write(f'\nProcessing taluka: {taluka_name}')
                
                for village_name in village_names:
                    village, created = Village.objects.get_or_create(
                        name=village_name,
                        taluka=taluka
                    )
                    
                    if created:
                        self.stdout.write(f'  ✓ Created village: {village_name}')
                        total_villages_created += 1
                    else:
                        self.stdout.write(f'  - Village already exists: {village_name}')
                        
            except Taluka.DoesNotExist:
                self.stdout.write(f'  ✗ Taluka not found: {taluka_name}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n\n✅ Successfully populated taluka data!'
                f'\n📊 Summary:'
                f'\n  - Districts: {District.objects.count()}'
                f'\n  - Talukas: {Taluka.objects.count()} (Created: {total_talukas_created}, Existing: {total_talukas_existing})'
                f'\n  - Villages: {Village.objects.count()} (Created: {total_villages_created})'
            )
        )
