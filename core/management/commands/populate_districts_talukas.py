from django.core.management.base import BaseCommand
from core.models import District, Taluka

class Command(BaseCommand):
    help = 'Populate districts and talukas for Gujarat state directly using Django ORM'

    def handle(self, *args, **options):
        self.stdout.write('Starting to populate districts and talukas...')
        
        # Gujarat districts and their talukas
        gujarat_data = {
            'Ahmedabad': [
                'Ahmedabad City', 'Ahmedabad Rural', 'Daskroi', 'Detroj', 'Dholka', 'Mandal', 'Sanand', 'Viramgam'
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
                'Amirgadh', 'Bhabhar', 'Danta', 'Deesa', 'Deodar', 'Dhanera', 'Disa', 'Kankrej', 'Lakhani', 'Palanpur', 'Tharad', 'Vadgam', 'Vav'
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
                'Chhota Udaipur', 'Kavant', 'Nasvadi', 'Sankheda'
            ],
            'Dahod': [
                'Devgadh Baria', 'Dahod', 'Fatepura', 'Garbada', 'Jhalod', 'Limkheda'
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
                'Bhesan', 'Junagadh', 'Keshod', 'Kodinar', 'Malia', 'Manavadar', 'Mangrol', 'Patan-Veraval', 'Sutrapada', 'Talala', 'Una', 'Vanthali', 'Visavadar'
            ],
            'Kheda': [
                'Galteshwar', 'Kapadvanj', 'Kheda', 'Mahudha', 'Matar', 'Mehmedabad', 'Nadiad', 'Petlad', 'Thasra', 'Umreth'
            ],
            'Kutch': [
                'Abdasa', 'Anjar', 'Bhachau', 'Bhuj', 'Gandhidham', 'Lakhpat', 'Mandvi', 'Mundra', 'Nakhatrana', 'Rapar'
            ],
            'Mahisagar': [
                'Balasinor', 'Kadana', 'Khanpur', 'Lunawada', 'Santrampur', 'Virpur'
            ],
            'Mehsana': [
                'Becharaji', 'Jotana', 'Kadi', 'Kheralu', 'Mansa', 'Mehsana', 'Satlasana', 'Unjha', 'Vadnagar', 'Vijapur', 'Visnagar'
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
                'Dahod', 'Devgadh Baria', 'Godhra', 'Halol', 'Jhalod', 'Kadana', 'Kalol', 'Limkheda', 'Morva Hadaf', 'Santrampur'
            ],
            'Patan': [
                'Chanasma', 'Harij', 'Patan', 'Radhanpur', 'Sami', 'Santalpur', 'Sidhpur', 'Unjha'
            ],
            'Porbandar': [
                'Kutiyana', 'Porbandar', 'Ranavav'
            ],
            'Rajkot': [
                'Dhoraji', 'Gondal', 'Jamkandorna', 'Jasdan', 'Kotda Sangani', 'Lodhika', 'Maliya', 'Paddhari', 'Rajkot', 'Tankara', 'Upleta', 'Vinchhiya'
            ],
            'Sabarkantha': [
                'Bayad', 'Bhiloda', 'Dhansura', 'Himatnagar', 'Idar', 'Khedbrahma', 'Malpur', 'Meghraj', 'Modasa', 'Poshina', 'Prantij', 'Talod', 'Vadali', 'Vijaynagar'
            ],
            'Surat': [
                'Bardoli', 'Choryasi', 'Kamrej', 'Mahuva', 'Mandvi', 'Olpad', 'Palsana', 'Surat City', 'Umarpada'
            ],
            'Surendranagar': [
                'Chotila', 'Chuda', 'Dasada', 'Dhrangadhra', 'Lakhtar', 'Limbdi', 'Muli', 'Sayla', 'Thangadh', 'Wadhwan'
            ],
            'Tapi': [
                'Dolvan', 'Nizar', 'Songadh', 'Uchchhal', 'Valod', 'Vyara'
            ],
            'Vadodara': [
                'Chhota Udaipur', 'Dabhoi', 'Desar', 'Karjan', 'Padra', 'Savli', 'Sinor', 'Vadodara Rural', 'Vadodara Urban'
            ],
            'Valsad': [
                'Dharampur', 'Kaprada', 'Pardi', 'Umbergaon', 'Valsad', 'Vapi'
            ]
        }
        
        # Populate districts first
        district_map = {}  # To store district name to ID mapping
        districts_created = 0
        districts_existing = 0
        
        for district_name in gujarat_data.keys():
            try:
                # Check if district already exists
                district, created = District.objects.get_or_create(
                    name=district_name,
                    defaults={'state': 'Gujarat'}
                )
                
                if created:
                    district_map[district_name] = district.id
                    districts_created += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Created district: {district_name} (ID: {district.id})')
                    )
                else:
                    district_map[district_name] = district.id
                    districts_existing += 1
                    self.stdout.write(
                        self.style.WARNING(f'⚠ District already exists: {district_name} (ID: {district.id})')
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Error with district {district_name}: {e}')
                )
        
        self.stdout.write(f'\n📊 Districts Summary: {districts_created} created, {districts_existing} already existed')
        
        # Now populate talukas
        self.stdout.write('\nStarting to populate talukas...')
        talukas_created = 0
        talukas_existing = 0
        
        for district_name, taluka_names in gujarat_data.items():
            if district_name not in district_map:
                self.stdout.write(
                    self.style.WARNING(f'⚠ Skipping talukas for {district_name} - district not found')
                )
                continue
                
            district_id = district_map[district_name]
            self.stdout.write(f'\nAdding talukas for district: {district_name}')
            
            for taluka_name in taluka_names:
                try:
                    # Check if taluka already exists in this district
                    taluka, created = Taluka.objects.get_or_create(
                        name=taluka_name,
                        district_id=district_id
                    )
                    
                    if created:
                        talukas_created += 1
                        self.stdout.write(
                            self.style.SUCCESS(f'  ✓ Created taluka: {taluka_name}')
                        )
                    else:
                        talukas_existing += 1
                        self.stdout.write(
                            self.style.WARNING(f'  ⚠ Taluka already exists: {taluka_name}')
                        )
                        
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'  ✗ Error with taluka {taluka_name}: {e}')
                    )
        
        self.stdout.write(f'\n📊 Talukas Summary: {talukas_created} created, {talukas_existing} already existed')
        
        # Final summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write('POPULATION COMPLETE!')
        self.stdout.write('='*50)
        
        # Get final counts
        try:
            total_districts = District.objects.count()
            total_talukas = Taluka.objects.count()
            
            self.stdout.write(f'Total Districts in Database: {total_districts}')
            self.stdout.write(f'Total Talukas in Database: {total_talukas}')
            
            # Show some sample data
            self.stdout.write('\n📋 Sample Districts:')
            for district in District.objects.all()[:5]:
                self.stdout.write(f'  - {district.name} ({district.state})')
            
            self.stdout.write('\n📋 Sample Talukas:')
            for taluka in Taluka.objects.select_related('district').all()[:5]:
                self.stdout.write(f'  - {taluka.name} (District: {taluka.district.name})')
                
        except Exception as e:
            self.stdout.write(f'Could not get final counts: {e}')
        
        self.stdout.write(self.style.SUCCESS('\n✅ District and Taluka population completed successfully!'))
