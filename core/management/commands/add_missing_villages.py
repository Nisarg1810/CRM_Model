from django.core.management.base import BaseCommand
from core.models import District, Taluka, Village

class Command(BaseCommand):
    help = 'Add missing villages for talukas that have very few or no villages'

    def handle(self, *args, **options):
        self.stdout.write('Checking for talukas with missing villages...')
        
        # Get all talukas
        all_talukas = Taluka.objects.all()
        talukas_with_few_villages = []
        
        for taluka in all_talukas:
            village_count = taluka.villages.count()
            if village_count < 5:  # Consider talukas with less than 5 villages as needing more
                talukas_with_few_villages.append({
                    'taluka': taluka,
                    'village_count': village_count,
                    'district': taluka.district.name
                })
        
        self.stdout.write(f'Found {len(talukas_with_few_villages)} talukas with less than 5 villages')
        
        if not talukas_with_few_villages:
            self.stdout.write(self.style.SUCCESS('All talukas have sufficient villages!'))
            return
        
        # Show talukas that need more villages
        self.stdout.write('\nTalukas needing more villages:')
        for item in talukas_with_few_villages[:20]:  # Show first 20
            self.stdout.write(f'  {item["taluka"].name} ({item["district"]}): {item["village_count"]} villages')
        
        # Add villages for talukas with few villages
        self.stdout.write('\nAdding missing villages...')
        
        # Generic village patterns for different types of talukas
        generic_villages = [
            'Central', 'North', 'South', 'East', 'West', 'Rural', 'Urban', 'City', 'Town',
            'Market', 'Station', 'Bus Stand', 'Hospital', 'School', 'College', 'Temple',
            'Mosque', 'Church', 'Park', 'Garden', 'Lake', 'River', 'Bridge', 'Road',
            'Square', 'Circle', 'Crossing', 'Junction', 'Highway', 'Expressway'
        ]
        
        # District-specific village patterns
        district_villages = {
            'Ahmedabad': ['Satellite', 'Vastrapur', 'Navrangpura', 'Ellisbridge', 'Paldi', 'Law Garden'],
            'Surat': ['Adajan', 'Vesu', 'Athwa', 'Pal', 'Piplod', 'Mota Varachha'],
            'Vadodara': ['Alkapuri', 'Fatehgunj', 'Gotri', 'Karelibaug', 'Sama', 'Tandalja'],
            'Rajkot': ['Gondal', 'Jetpur', 'Upleta', 'Dhoraji', 'Jamkandorna', 'Kotda Sangani'],
            'Bhavnagar': ['Gariadhar', 'Palitana', 'Sihor', 'Talaja', 'Vallabhipur', 'Mahuva'],
            'Jamnagar': ['Dhrol', 'Kalavad', 'Lalpur', 'Okhamandal', 'Jodiya', 'Bhanvad'],
            'Gandhinagar': ['Kalol', 'Mansa', 'Dehgam', 'Dahegam'],
            'Anand': ['Petlad', 'Sojitra', 'Umreth', 'Borsad', 'Khambhat', 'Tarapur'],
            'Bharuch': ['Ankleshwar', 'Jambusar', 'Amod', 'Vagra', 'Hansot', 'Jhagadia'],
            'Narmada': ['Rajpipla', 'Dediapada', 'Sagbara', 'Valia', 'Kevadia'],
            'Dang': ['Ahwa', 'Subir', 'Waghai'],
            'Navsari': ['Gandevi', 'Chikhli', 'Bansda', 'Jalalpore', 'Vansda'],
            'Valsad': ['Pardi', 'Umbergaon', 'Dharampur', 'Kaprada', 'Vapi'],
            'Tapi': ['Songadh', 'Valod', 'Uchchhal', 'Nizar', 'Dolvan', 'Kukarmunda'],
            'Dahod': ['Garbada', 'Devgadh Baria', 'Limkheda', 'Jhalod', 'Fatepura'],
            'Panchmahal': ['Godhra', 'Halol', 'Jambughoda', 'Kadana', 'Morva Hadaf', 'Ghoghamba'],
            'Kheda': ['Nadiad', 'Kapadvanj', 'Matar', 'Mahudha', 'Thasra', 'Mehmedabad'],
            'Sabarkantha': ['Himmatnagar', 'Idar', 'Khedbrahma', 'Bhiloda', 'Vadali', 'Bayad'],
            'Banaskantha': ['Palanpur', 'Deesa', 'Deodar', 'Danta', 'Amirgadh', 'Bhabhar'],
            'Patan': ['Radhanpur', 'Santalpur', 'Sidhpur', 'Chanasma', 'Harij', 'Sami'],
            'Mehsana': ['Vijapur', 'Kadi', 'Visnagar', 'Becharaji', 'Satlasana', 'Unjha'],
            'Surendranagar': ['Lakhtar', 'Dhrangadhra', 'Limbdi', 'Sayla', 'Chotila', 'Vinchhiya'],
            'Amreli': ['Lathi', 'Lilia', 'Babra', 'Bagasara', 'Rajula', 'Jafrabad'],
            'Junagadh': ['Mendarda', 'Vanthali', 'Visavadar', 'Bhesan', 'Manavadar', 'Keshod'],
            'Porbandar': ['Ranavav', 'Kutiyana'],
            'Devbhoomi Dwarka': ['Khambhalia', 'Kalyanpur', 'Bhanvad', 'Dwarka', 'Okhamandal'],
            'Morbi': ['Tankara', 'Halvad', 'Wankaner', 'Maliya'],
            'Botad': ['Gadhda', 'Ranpur', 'Vallabhipur'],
            'Chhota Udepur': ['Kavant', 'Naswadi', 'Tilakwada', 'Kevadia'],
            'Mahisagar': ['Lunavada', 'Santrampur', 'Kadana', 'Morva Hadaf', 'Ghoghamba'],
            'Aravalli': ['Modasa', 'Bhiloda', 'Vadali', 'Bayad', 'Prantij', 'Vijaynagar']
        }
        
        total_villages_added = 0
        
        for item in talukas_with_few_villages:
            taluka = item['taluka']
            district_name = item['district']
            current_count = item['village_count']
            
            self.stdout.write(f'\nProcessing {taluka.name} ({district_name}): {current_count} villages')
            
            # Get district-specific villages if available
            district_specific = district_villages.get(district_name, [])
            
            # Combine district-specific and generic villages
            all_village_options = district_specific + generic_villages
            
            # Add villages until we have at least 8
            villages_to_add = 8 - current_count
            villages_added = 0
            
            for i in range(villages_to_add):
                if i < len(all_village_options):
                    village_name = f"{taluka.name} {all_village_options[i]}"
                else:
                    village_name = f"{taluka.name} Village {i+1}"
                
                # Check if village already exists
                existing_village = Village.objects.filter(name=village_name, taluka=taluka).first()
                if not existing_village:
                    try:
                        village = Village.objects.create(name=village_name, taluka=taluka)
                        self.stdout.write(f'  ✓ Added: {village_name}')
                        villages_added += 1
                        total_villages_added += 1
                    except Exception as e:
                        self.stdout.write(f'  ✗ Error adding {village_name}: {str(e)}')
                else:
                    self.stdout.write(f'  - Already exists: {village_name}')
            
            self.stdout.write(f'  → Added {villages_added} villages to {taluka.name}')
        
        # Final summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\n\n✅ Village addition completed!'
                f'\n📊 Summary:'
                f'\n  - Total talukas processed: {len(talukas_with_few_villages)}'
                f'\n  - Total villages added: {total_villages_added}'
                f'\n  - Final village count: {Village.objects.count()}'
            )
        )
