from django.core.management.base import BaseCommand
from core.models import District, Taluka

class Command(BaseCommand):
    help = 'Populate Gujarat districts and talukas with real data'

    def handle(self, *args, **options):
        self.stdout.write('Starting to populate Gujarat districts and talukas...')
        
        # Gujarat Districts and their Talukas
        gujarat_data = {
            'Ahmedabad': [
                'Ahmedabad City', 'Ahmedabad Rural', 'Bavla', 'Daskroi', 'Detroj', 'Dhandhuka', 'Dholka', 'Mandal', 'Sanand', 'Viramgam'
            ],
            'Amreli': [
                'Amreli', 'Babra', 'Bagasara', 'Dhari', 'Jafrabad', 'Khambha', 'Kodinar', 'Lathi', 'Lilia', 'Rajula', 'Savarkundla'
            ],
            'Anand': [
                'Anand', 'Borsad', 'Khambhat', 'Petlad', 'Sojitra', 'Tarapur', 'Umreth'
            ],
            'Aravalli': [
                'Bayad', 'Bhiloda', 'Dhansura', 'Malpur', 'Meghraj', 'Modasa'
            ],
            'Banaskantha': [
                'Amirgadh', 'Bhabhar', 'Danta', 'Deesa', 'Deodar', 'Dhanera', 'Disa', 'Kankrej', 'Lakhani', 'Palanpur', 'Suigam', 'Tharad', 'Vadgam', 'Vav'
            ],
            'Bharuch': [
                'Amod', 'Anklesvar', 'Bharuch', 'Hansot', 'Jambusar', 'Jhagadia', 'Netrang', 'Valia', 'Vagra'
            ],
            'Bhavnagar': [
                'Bhavnagar', 'Gariadhar', 'Ghogha', 'Jesar', 'Mahuva', 'Palitana', 'Sihor', 'Talaja', 'Umrala', 'Vallabhipur'
            ],
            'Botad': [
                'Barwala', 'Botad', 'Gadhada', 'Ranpur'
            ],
            'Chhota Udaipur': [
                'Chhota Udaipur', 'Chhota Udepur', 'Kavant', 'Nasvadi'
            ],
            'Dahod': [
                'Devgadh Baria', 'Dohad', 'Fatepura', 'Garbada', 'Jhalod', 'Limkheda', 'Sanjeli'
            ],
            'Dang': [
                'Ahwa', 'Subir', 'Waghai'
            ],
            'Devbhoomi Dwarka': [
                'Bhanvad', 'Dwarka', 'Kalyanpur', 'Khambhalia', 'Okhamandal'
            ],
            'Gandhinagar': [
                'Dehgam', 'Gandhinagar', 'Kalol', 'Mansa'
            ],
            'Gir Somnath': [
                'Gir Gadhada', 'Kodinar', 'Patan-Veraval', 'Sutrapada', 'Talala', 'Una'
            ],
            'Jamnagar': [
                'Dhrol', 'Jamjodhpur', 'Jamnagar', 'Jodiya', 'Kalavad', 'Lalpur'
            ],
            'Junagadh': [
                'Bhesan', 'Junagadh', 'Keshod', 'Kodinar', 'Malia', 'Manavadar', 'Mangrol', 'Patan-Veraval', 'Sutrapada', 'Una', 'Vanthali', 'Visavadar'
            ],
            'Kheda': [
                'Galteshwar', 'Kapadvanj', 'Kheda', 'Mahudha', 'Matar', 'Mehmedabad', 'Nadiad', 'Thasra', 'Vaso'
            ],
            'Kutch': [
                'Abdasa', 'Anjar', 'Bhachau', 'Bhuj', 'Gandhidham', 'Lakhpat', 'Mandvi', 'Mundra', 'Nakhatrana', 'Rapar'
            ],
            'Mahisagar': [
                'Balasinor', 'Kadana', 'Khanpur', 'Lunawada', 'Santrampur', 'Virpur'
            ],
            'Mehsana': [
                'Becharaji', 'Kadi', 'Kheralu', 'Mansa', 'Mehsana', 'Satlasana', 'Unjha', 'Vadnagar', 'Vijapur', 'Visnagar'
            ],
            'Morbi': [
                'Halvad', 'Maliya', 'Morbi', 'Tankara', 'Wankaner'
            ],
            'Narmada': [
                'Dediapada', 'Garudeshwar', 'Nandod', 'Tilakwada'
            ],
            'Navsari': [
                'Bansda', 'Chikhli', 'Gandevi', 'Jalalpore', 'Navsari', 'Vansda'
            ],
            'Panchmahal': [
                'Godhra', 'Halol', 'Jambughoda', 'Kadana', 'Khanpur', 'Lunawada', 'Morva Hadaf', 'Santrampur', 'Shehra', 'Vejalpur'
            ],
            'Patan': [
                'Chanasma', 'Harij', 'Patan', 'Radhanpur', 'Sami', 'Santalpur', 'Sidhpur'
            ],
            'Porbandar': [
                'Kutiyana', 'Porbandar', 'Ranavav'
            ],
            'Rajkot': [
                'Dhoraji', 'Gondal', 'Jamkandorna', 'Jasdan', 'Kotda Sangani', 'Lodhika', 'Maliya', 'Paddhari', 'Rajkot', 'Upleta', 'Vinchhiya', 'Wankaner'
            ],
            'Sabarkantha': [
                'Bayad', 'Bhiloda', 'Dhansura', 'Himatnagar', 'Idar', 'Khedbrahma', 'Malpur', 'Meghraj', 'Modasa', 'Poshina', 'Pratapgadh', 'Talod', 'Vadali', 'Vijaynagar'
            ],
            'Surat': [
                'Bardoli', 'Chorasi', 'Kamrej', 'Mahuva', 'Mangrol', 'Olpad', 'Palsana', 'Surat City', 'Umarpada'
            ],
            'Surendranagar': [
                'Chotila', 'Chuda', 'Dasada', 'Dhrangadhra', 'Lakhtar', 'Limbdi', 'Muli', 'Sayla', 'Thangadh', 'Wadhwan'
            ],
            'Tapi': [
                'Dolvan', 'Nizar', 'Songadh', 'Uchchhal', 'Valod', 'Vyara'
            ],
            'Vadodara': [
                'Chhota Udaipur', 'Dabhoi', 'Desar', 'Karjan', 'Padra', 'Savli', 'Sinor', 'Vadodara'
            ],
            'Valsad': [
                'Dharampur', 'Kaprada', 'Pardi', 'Umbergaon', 'Valsad', 'Vapi'
            ]
        }
        
        districts_created = 0
        talukas_created = 0
        
        for district_name, taluka_names in gujarat_data.items():
            # Create or get district
            district, created = District.objects.get_or_create(
                name=district_name,
                defaults={'state': 'Gujarat'}
            )
            
            if created:
                districts_created += 1
                self.stdout.write(f'Created district: {district_name}')
            else:
                self.stdout.write(f'District already exists: {district_name}')
            
            # Create talukas for this district
            for taluka_name in taluka_names:
                taluka, created = Taluka.objects.get_or_create(
                    name=taluka_name,
                    district=district,
                    defaults={'state': 'Gujarat'}
                )
                
                if created:
                    talukas_created += 1
                    self.stdout.write(f'  Created taluka: {taluka_name}')
                else:
                    self.stdout.write(f'  Taluka already exists: {taluka_name}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Successfully populated Gujarat locations!\n'
                f'📊 Summary:\n'
                f'   • Districts: {districts_created} created, {len(gujarat_data)} total\n'
                f'   • Talukas: {talukas_created} created\n'
                f'   • Total Talukas: {sum(len(talukas) for talukas in gujarat_data.values())}'
            )
        )
        
        self.stdout.write(
            self.style.WARNING(
                '\n💡 Note: You can now use the location dropdowns in your forms!\n'
                '   The data is stored in the database and will persist across server restarts.'
            )
        )

