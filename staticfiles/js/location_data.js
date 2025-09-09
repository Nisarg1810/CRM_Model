// Comprehensive Location Data for India with focus on Gujarat
const locationData = {
  'Gujarat': {
    'Ahmedabad': {
      'Ahmedabad City': ['Ahmedabad City', 'Satellite', 'Vastrapur', 'Navrangpura', 'Ellisbridge', 'Paldi', 'Gujarat College', 'Law Garden', 'Stadium Road', 'Khanpur', 'Dariyapur', 'Jamalpur', 'Kalupur', 'Raikhad', 'Gomtipur', 'Rakhial', 'Odhav', 'Vatva', 'Naroda', 'Bapunagar', 'Isanpur', 'Juhapura', 'Vejalpur', 'Sarkhej', 'Maktampura', 'Jodhpur', 'Bodakdev', 'Thaltej', 'Gota', 'Chandkheda', 'Motera', 'Sabarmati', 'Ranip', 'Asarwa', 'Shahibaug', 'Amraiwadi', 'Nikol', 'Vastral', 'Ramol'],
      'Daskroi': ['Daskroi', 'Bavla', 'Sanand', 'Viramgam', 'Dholka', 'Dhandhuka', 'Ranpur', 'Barwala', 'Detroj', 'Mandal', 'Chaloda', 'Jetalpur', 'Khodiyar', 'Vasna', 'Karnavati'],
      'Sanand': ['Sanand', 'Viramgam', 'Dholka', 'Dhandhuka', 'Ranpur', 'Barwala', 'Detroj', 'Mandal', 'Chaloda', 'Jetalpur', 'Khodiyar', 'Vasna', 'Karnavati'],
      'Viramgam': ['Viramgam', 'Dholka', 'Dhandhuka', 'Ranpur', 'Barwala', 'Detroj', 'Mandal', 'Chaloda', 'Jetalpur', 'Khodiyar', 'Vasna', 'Karnavati']
    },
    'Surat': {
      'Surat City': ['Surat City', 'Adajan', 'Vesu', 'Athwa', 'Pal', 'Piplod', 'Mota Varachha', 'Sarthana', 'Katargam', 'Varachha', 'Udhna', 'Sachin', 'Palsana', 'Olpad', 'Choryasi', 'Kamrej', 'Mahuva', 'Bardoli', 'Vyara', 'Songadh', 'Valod', 'Uchchhal', 'Nizar', 'Mangrol', 'Mandvi', 'Bansda', 'Dang', 'Valsad', 'Pardi', 'Umbergaon', 'Dharampur', 'Kaprada', 'Vapi', 'Silvassa', 'Dadra', 'Nagar Haveli'],
      'Bardoli': ['Bardoli', 'Vyara', 'Songadh', 'Valod', 'Uchchhal', 'Nizar', 'Mangrol', 'Mandvi', 'Bansda', 'Dang', 'Valsad', 'Pardi', 'Umbergaon', 'Dharampur', 'Kaprada', 'Vapi', 'Silvassa', 'Dadra', 'Nagar Haveli'],
      'Vyara': ['Vyara', 'Songadh', 'Valod', 'Uchchhal', 'Nizar', 'Mangrol', 'Mandvi', 'Bansda', 'Dang', 'Valsad', 'Pardi', 'Umbergaon', 'Dharampur', 'Kaprada', 'Vapi', 'Silvassa', 'Dadra', 'Nagar Haveli']
    },
    'Vadodara': {
      'Vadodara City': ['Vadodara City', 'Alkapuri', 'Fatehgunj', 'Gotri', 'Karelibaug', 'Sama', 'Tandalja', 'Vasna', 'Waghodia', 'Savli', 'Vadodara Rural', 'Padra', 'Karjan', 'Dabhoi', 'Chhota Udepur', 'Kavant', 'Naswadi', 'Tilakwada', 'Kevadia', 'Rajpipla', 'Narmada', 'Dediapada', 'Sagbara', 'Valia', 'Ankleshwar', 'Bharuch', 'Jambusar', 'Amod', 'Vagra', 'Hansot', 'Jhagadia', 'Netrang'],
      'Savli': ['Savli', 'Vadodara Rural', 'Padra', 'Karjan', 'Dabhoi', 'Chhota Udepur', 'Kavant', 'Naswadi', 'Tilakwada', 'Kevadia', 'Rajpipla', 'Narmada', 'Dediapada', 'Sagbara', 'Valia', 'Ankleshwar', 'Bharuch', 'Jambusar', 'Amod', 'Vagra', 'Hansot', 'Jhagadia', 'Netrang'],
      'Padra': ['Padra', 'Karjan', 'Dabhoi', 'Chhota Udepur', 'Kavant', 'Naswadi', 'Tilakwada', 'Kevadia', 'Rajpipla', 'Narmada', 'Dediapada', 'Sagbara', 'Valia', 'Ankleshwar', 'Bharuch', 'Jambusar', 'Amod', 'Vagra', 'Hansot', 'Jhagadia', 'Netrang']
    },
    'Rajkot': {
      'Rajkot City': ['Rajkot City', 'Gondal', 'Jetpur', 'Upleta', 'Dhoraji', 'Jamkandorna', 'Kotda Sangani', 'Lodhika', 'Paddhari', 'Jasdan', 'Maliya', 'Wankaner', 'Morbi', 'Tankara', 'Halvad', 'Dhrangadhra', 'Limbdi', 'Sayla', 'Chotila', 'Vinchhiya', 'Wadhwan', 'Chuda', 'Dasada'],
      'Gondal': ['Gondal', 'Jetpur', 'Upleta', 'Dhoraji', 'Jamkandorna', 'Kotda Sangani', 'Lodhika', 'Paddhari', 'Jasdan', 'Maliya', 'Wankaner', 'Morbi', 'Tankara', 'Halvad', 'Dhrangadhra', 'Limbdi', 'Sayla', 'Chotila', 'Vinchhiya', 'Wadhwan', 'Chuda', 'Dasada'],
      'Jetpur': ['Jetpur', 'Upleta', 'Dhoraji', 'Jamkandorna', 'Kotda Sangani', 'Lodhika', 'Paddhari', 'Jasdan', 'Maliya', 'Wankaner', 'Morbi', 'Tankara', 'Halvad', 'Dhrangadhra', 'Limbdi', 'Sayla', 'Chotila', 'Vinchhiya', 'Wadhwan', 'Chuda', 'Dasada']
    },
    'Bharuch': {
      'Bharuch': ['Bharuch', 'Ankleshwar', 'Jambusar', 'Amod', 'Vagra', 'Hansot', 'Jhagadia', 'Netrang', 'Dediapada', 'Sagbara', 'Valia', 'Rajpipla', 'Narmada', 'Kevadia', 'Tilakwada', 'Naswadi', 'Kavant', 'Chhota Udepur', 'Dabhoi', 'Karjan', 'Padra', 'Vadodara Rural', 'Savli', 'Waghodia', 'Vasna', 'Tandalja', 'Sama', 'Karelibaug', 'Gotri', 'Fatehgunj', 'Alkapuri'],
      'Ankleshwar': ['Ankleshwar', 'Jambusar', 'Amod', 'Vagra', 'Hansot', 'Jhagadia', 'Netrang', 'Dediapada', 'Sagbara', 'Valia', 'Rajpipla', 'Narmada', 'Kevadia', 'Tilakwada', 'Naswadi', 'Kavant', 'Chhota Udepur', 'Dabhoi', 'Karjan', 'Padra', 'Vadodara Rural', 'Savli', 'Waghodia', 'Vasna', 'Tandalja', 'Sama', 'Karelibaug', 'Gotri', 'Fatehgunj', 'Alkapuri'],
      'Jambusar': ['Jambusar', 'Amod', 'Vagra', 'Hansot', 'Jhagadia', 'Netrang', 'Dediapada', 'Sagbara', 'Valia', 'Rajpipla', 'Narmada', 'Kevadia', 'Tilakwada', 'Naswadi', 'Kavant', 'Chhota Udepur', 'Dabhoi', 'Karjan', 'Padra', 'Vadodara Rural', 'Savli', 'Waghodia', 'Vasna', 'Tandalja', 'Sama', 'Karelibaug', 'Gotri', 'Fatehgunj', 'Alkapuri']
    },
    'Bhavnagar': {
      'Bhavnagar': ['Bhavnagar', 'Botad', 'Gariadhar', 'Mahuva', 'Palitana', 'Sihor', 'Talaja', 'Umrala', 'Vallabhipur', 'Ghogha'],
      'Botad': ['Botad', 'Gariadhar', 'Mahuva', 'Palitana', 'Sihor', 'Talaja', 'Umrala', 'Vallabhipur', 'Ghogha', 'Bhavnagar'],
      'Palitana': ['Palitana', 'Sihor', 'Talaja', 'Umrala', 'Vallabhipur', 'Ghogha', 'Bhavnagar', 'Botad', 'Gariadhar', 'Mahuva']
    },
    'Kutch': {
      'Bhuj': ['Bhuj', 'Anjar', 'Gandhidham', 'Mundra', 'Mandvi', 'Nakhatrana', 'Abdasa', 'Lakhpat', 'Rapar', 'Bachau'],
      'Anjar': ['Anjar', 'Gandhidham', 'Mundra', 'Mandvi', 'Nakhatrana', 'Abdasa', 'Lakhpat', 'Rapar', 'Bachau', 'Bhuj'],
      'Gandhidham': ['Gandhidham', 'Mundra', 'Mandvi', 'Nakhatrana', 'Abdasa', 'Lakhpat', 'Rapar', 'Bachau', 'Bhuj', 'Anjar']
    },
    'Mehsana': {
      'Mehsana': ['Mehsana', 'Patan', 'Sidhpur', 'Unjha', 'Vijapur', 'Kadi', 'Kalol', 'Visnagar', 'Becharaji', 'Jotana', 'Satlasana', 'Vadnagar', 'Chanasma', 'Harij', 'Sami', 'Kheralu'],
      'Patan': ['Patan', 'Sidhpur', 'Unjha', 'Vijapur', 'Kadi', 'Kalol', 'Visnagar', 'Becharaji', 'Jotana', 'Satlasana', 'Vadnagar', 'Chanasma', 'Harij', 'Sami', 'Kheralu', 'Mehsana'],
      'Sidhpur': ['Sidhpur', 'Unjha', 'Vijapur', 'Kadi', 'Kalol', 'Visnagar', 'Becharaji', 'Jotana', 'Satlasana', 'Vadnagar', 'Chanasma', 'Harij', 'Sami', 'Kheralu', 'Mehsana', 'Patan']
    },
    'Banaskantha': {
      'Palanpur': ['Palanpur', 'Deesa', 'Danta', 'Vadgam', 'Dhanera', 'Tharad', 'Bhabhar', 'Kankrej', 'Vav', 'Suigam', 'Lakhani', 'Amirgadh', 'Deodar'],
      'Deesa': ['Deesa', 'Danta', 'Vadgam', 'Dhanera', 'Tharad', 'Bhabhar', 'Kankrej', 'Vav', 'Suigam', 'Lakhani', 'Amirgadh', 'Deodar', 'Palanpur'],
      'Danta': ['Danta', 'Vadgam', 'Dhanera', 'Tharad', 'Bhabhar', 'Kankrej', 'Vav', 'Suigam', 'Lakhani', 'Amirgadh', 'Deodar', 'Palanpur', 'Deesa']
    }
  },
  'Maharashtra': {
    'Mumbai': {
      'Mumbai City': ['Mumbai City', 'Andheri', 'Bandra', 'Borivali', 'Chembur', 'Dadar', 'Goregaon', 'Juhu', 'Kandivali', 'Kurla', 'Malad', 'Mulund', 'Navi Mumbai', 'Powai', 'Santacruz', 'Thane', 'Vashi', 'Worli'],
      'Thane': ['Thane', 'Kalyan', 'Dombivli', 'Ulhasnagar', 'Ambernath', 'Badlapur', 'Murbad', 'Shahapur', 'Bhiwandi', 'Vasai', 'Virar', 'Palghar', 'Dahanu', 'Talasari', 'Jawhar', 'Mokhada', 'Vikramgad', 'Wada'],
      'Navi Mumbai': ['Navi Mumbai', 'Vashi', 'Nerul', 'Belapur', 'Kharghar', 'Panvel', 'Uran', 'Dronagiri', 'JNPT', 'Taloja', 'Koparkhairane', 'Ghansoli', 'Airoli', 'Rabale', 'Mahape', 'MIDC', 'Turbhe']
    },
    'Pune': {
      'Pune City': ['Pune City', 'Hinjewadi', 'Wakad', 'Baner', 'Aundh', 'Koregaon Park', 'Kalyani Nagar', 'Viman Nagar', 'Kharadi', 'Hadapsar', 'Magarpatta'],
      'Pimpri-Chinchwad': ['Pimpri-Chinchwad', 'Akurdi', 'Chinchwad', 'Pimpri', 'Nigdi', 'Talegaon', 'Dehu Road', 'Chakan', 'Rajgurunagar', 'Lonavala', 'Khandala', 'Maval', 'Mulshi', 'Velhe', 'Bhor', 'Purandar', 'Baramati', 'Indapur', 'Daund', 'Shirur'],
      'Lonavala': ['Lonavala', 'Khandala', 'Maval', 'Mulshi', 'Velhe', 'Bhor', 'Purandar', 'Baramati', 'Indapur', 'Daund', 'Shirur']
    },
    'Nagpur': {
      'Nagpur City': ['Nagpur City', 'Sadar', 'Civil Lines', 'Dhantoli', 'Gandhibagh', 'Itwari', 'Mahal', 'Sitabuldi', 'Dharampeth', 'Ramdaspeth', 'Shankar Nagar', 'Laxmi Nagar', 'Wardha Road', 'Central Avenue', 'North Ambazari', 'South Ambazari', 'Koradi', 'Mouda', 'Narkhed', 'Katol', 'Kalmeshwar', 'Kamptee', 'Umred', 'Bhiwapur', 'Parseoni', 'Ramtek', 'Mansar', 'Saoner', 'Kuhi', 'Umrer']
    }
  },
  'Delhi': {
    'New Delhi': {
      'New Delhi': ['New Delhi', 'Connaught Place', 'Chanakyapuri', 'Lutyens Delhi', 'Rashtrapati Bhavan', 'Parliament House', 'India Gate', 'Rajpath', 'Janpath', 'Khan Market', 'Lodhi Garden', 'Safdarjung', 'Hauz Khas', 'Green Park', 'Greater Kailash', 'Defence Colony', 'Lajpat Nagar', 'Saket', 'Vasant Vihar', 'Vasant Kunj', 'Dwarka', 'Rohini', 'Pitampura', 'Shalimar Bagh', 'Model Town', 'Civil Lines', 'Kashmere Gate', 'Chandni Chowk', 'Old Delhi', 'Shahjahanabad', 'Meena Bazaar', 'Chawri Bazaar', 'Dariba', 'Kinari Bazaar', 'Ballimaran', 'Daryaganj', 'Jama Masjid', 'Red Fort', 'Purana Qila', 'Humayun Tomb', 'Qutub Minar', 'Tughlaqabad', 'Mehrauli', 'Sultanpur', 'Badarpur', 'Faridabad', 'Gurgaon', 'Noida', 'Ghaziabad', 'Greater Noida']
    }
  },
  'Rajasthan': {
    'Jaipur': {
      'Jaipur City': ['Jaipur City', 'Malviya Nagar', 'Raja Park', 'C-Scheme', 'Vaishali Nagar', 'Sodala', 'Vidhyadhar Nagar', 'Sanganer', 'Amber', 'Amer', 'Jhotwara', 'Shastri Nagar', 'Adarsh Nagar', 'Civil Lines', 'Mansarovar', 'Sitapura', 'Mahapura', 'Bagru', 'Phulera', 'Kotputli', 'Shahpura', 'Chomu', 'Phagi', 'Bassi', 'Chaksu', 'Sanganer', 'Amber', 'Amer'],
      'Sanganer': ['Sanganer', 'Amber', 'Amer', 'Jhotwara', 'Shastri Nagar', 'Adarsh Nagar', 'Civil Lines', 'Mansarovar', 'Sitapura', 'Mahapura', 'Bagru', 'Phulera', 'Kotputli', 'Shahpura', 'Chomu', 'Phagi', 'Bassi', 'Chaksu'],
      'Amer': ['Amer', 'Jhotwara', 'Shastri Nagar', 'Adarsh Nagar', 'Civil Lines', 'Mansarovar', 'Sitapura', 'Mahapura', 'Bagru', 'Phulera', 'Kotputli', 'Shahpura', 'Chomu', 'Phagi', 'Bassi', 'Chaksu', 'Sanganer']
    },
    'Jodhpur': {
      'Jodhpur City': ['Jodhpur City', 'Sardarpura', 'Ratanada', 'Shastri Nagar', 'Shivaji Nagar', 'Shastri Nagar', 'Ratanada', 'Sardarpura', 'Umaid Bhawan', 'Pal Road', 'Air Force Area', 'Shastri Nagar', 'Ratanada', 'Sardarpura', 'Umaid Bhawan', 'Pal Road', 'Air Force Area'],
      'Phalodi': ['Phalodi', 'Osian', 'Bilara', 'Bhopalgarh', 'Balesar', 'Shergarh', 'Luni', 'Bilara', 'Bhopalgarh', 'Balesar', 'Shergarh', 'Luni'],
      'Osian': ['Osian', 'Bilara', 'Bhopalgarh', 'Balesar', 'Shergarh', 'Luni', 'Phalodi']
    }
  },
  'Madhya Pradesh': {
    'Bhopal': {
      'Bhopal City': ['Bhopal City', 'MP Nagar', 'Arera Colony', 'Shahpura', 'Kolar Road', 'Hoshangabad Road', 'Raisen Road', 'Sehore Road', 'Vidisha Road', 'Indore Road', 'Jabalpur Road', 'Gwalior Road', 'Ujjain Road', 'Sagar Road', 'Chhindwara Road', 'Betul Road', 'Hoshangabad Road', 'Raisen Road', 'Sehore Road', 'Vidisha Road'],
      'Sehore': ['Sehore', 'Ashta', 'Ichhawar', 'Nasrullaganj', 'Budni', 'Rehti', 'Shyampur', 'Jawar', 'Nasrullaganj', 'Budni', 'Rehti', 'Shyampur', 'Jawar'],
      'Raisen': ['Raisen', 'Gairatganj', 'Silwani', 'Udaipura', 'Bareli', 'Goharganj', 'Begamganj', 'Sanchi', 'Udaipura', 'Bareli', 'Goharganj', 'Begamganj', 'Sanchi']
    },
    'Indore': {
      'Indore City': ['Indore City', 'Vijay Nagar', 'Palasia', 'Rajendra Nagar', 'Saket', 'Scheme 54', 'Scheme 74', 'Scheme 78', 'Scheme 94', 'Scheme 140', 'Scheme 141', 'Scheme 142', 'Scheme 143', 'Scheme 144', 'Scheme 145', 'Scheme 146', 'Scheme 147', 'Scheme 148', 'Scheme 149', 'Scheme 150'],
      'Dewas': ['Dewas', 'Kannod', 'Khategaon', 'Bagli', 'Tonk Khurd', 'Sonkatch', 'Satwas', 'Kannod', 'Khategaon', 'Bagli', 'Tonk Khurd', 'Sonkatch', 'Satwas'],
      'Dhar': ['Dhar', 'Badnawar', 'Sardarpur', 'Gandhwani', 'Kukshi', 'Manawar', 'Dharampuri', 'Badnawar', 'Sardarpur', 'Gandhwani', 'Kukshi', 'Manawar', 'Dharampuri']
    }
  },
  'Uttar Pradesh': {
    'Lucknow': {
      'Lucknow City': ['Lucknow City', 'Hazratganj', 'Gomti Nagar', 'Indira Nagar', 'Aliganj', 'Mahanagar', 'Rajajipuram', 'Aminabad', 'Chowk', 'Kaiserbagh', 'Nishatganj', 'Vikas Nagar', 'Sitapur Road', 'Hardoi Road', 'Rae Bareli Road', 'Kanpur Road', 'Faizabad Road', 'Sultanpur Road', 'Barabanki Road', 'Unnao Road'],
      'Barabanki': ['Barabanki', 'Fatehpur', 'Ramsanehighat', 'Haidergarh', 'Sirauli Gauspur', 'Nawabganj', 'Trivediganj', 'Fatehpur', 'Ramsanehighat', 'Haidergarh', 'Sirauli Gauspur', 'Nawabganj', 'Trivediganj'],
      'Rae Bareli': ['Rae Bareli', 'Dalmau', 'Lalganj', 'Maharajganj', 'Unchahar', 'Salon', 'Bachhrawan', 'Dalmau', 'Lalganj', 'Maharajganj', 'Unchahar', 'Salon', 'Bachhrawan']
    },
    'Kanpur': {
      'Kanpur City': ['Kanpur City', 'Civil Lines', 'Swaroop Nagar', 'Kakadeo', 'Kalyanpur', 'Panki', 'Arra', 'Bithoor', 'Ghatampur', 'Bilhaur', 'Derapur', 'Rasoolabad', 'Akbarpur', 'Bhognipur', 'Sikandra', 'Chaubepur', 'Bilhaur', 'Derapur', 'Rasoolabad', 'Akbarpur', 'Bhognipur', 'Sikandra', 'Chaubepur'],
      'Unnao': ['Unnao', 'Safipur', 'Hasanganj', 'Bighapur', 'Purwa', 'Gangaghat', 'Asoha', 'Safipur', 'Hasanganj', 'Bighapur', 'Purwa', 'Gangaghat', 'Asoha'],
      'Fatehpur': ['Fatehpur', 'Bindki', 'Khaga', 'Malwan', 'Vijayipur', 'Bindki', 'Khaga', 'Malwan', 'Vijayipur']
    }
  },
  'Karnataka': {
    'Bangalore': {
      'Bangalore City': ['Bangalore City', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Electronic City', 'Marathahalli', 'Bellandur', 'Sarjapur', 'JP Nagar', 'Banashankari', 'Jayanagar', 'Basavanagudi', 'Malleshwaram', 'Rajajinagar', 'Vijayanagar', 'Hebbal', 'Yelahanka', 'Yeshwantpur', 'Peenya', 'Nelamangala', 'Doddaballapur', 'Devanahalli', 'Hoskote', 'Anekal'],
      'Mysore': ['Mysore', 'Nanjangud', 'T Narasipura', 'Hunsur', 'Periyapatna', 'Krishnarajanagara', 'Piriyapatna', 'Heggadadevanakote', 'Saragur', 'Nanjangud', 'T Narasipura', 'Hunsur', 'Periyapatna', 'Krishnarajanagara', 'Piriyapatna', 'Heggadadevanakote', 'Saragur'],
      'Mangalore': ['Mangalore', 'Udupi', 'Kundapura', 'Karkala', 'Moodbidri', 'Bantwal', 'Puttur', 'Sullia', 'Belthangady', 'Udupi', 'Kundapura', 'Karkala', 'Moodbidri', 'Bantwal', 'Puttur', 'Sullia', 'Belthangady']
    }
  },
  'Tamil Nadu': {
    'Chennai': {
      'Chennai City': ['Chennai City', 'T Nagar', 'Anna Nagar', 'Adyar', 'Mylapore', 'Triplicane', 'Egmore', 'Nungambakkam', 'Kodambakkam', 'Vadapalani', 'Ashok Nagar', 'KK Nagar', 'Velachery', 'Tambaram', 'Chromepet', 'Pallavaram', 'St Thomas Mount', 'Guindy', 'Saidapet', 'Teynampet', 'Royapettah', 'Mandaveli', 'Alwarpet', 'Abhiramapuram', 'Boat Club', 'Poes Garden', 'Gopalapuram', 'Chetpet', 'Kilpauk', 'Aminjikarai', 'Villivakkam', 'Ambattur', 'Avadi', 'Poonamallee', 'Sriperumbudur', 'Kanchipuram', 'Chengalpattu', 'Tiruvallur', 'Ponneri', 'Gummidipoondi', 'Uthukottai', 'Tiruttani', 'Arakkonam', 'Arcot', 'Vellore', 'Krishnagiri', 'Dharmapuri', 'Salem', 'Namakkal', 'Erode', 'Coimbatore', 'Tiruppur', 'Karur', 'Dindigul', 'Madurai', 'Theni', 'Virudhunagar', 'Sivakasi', 'Ramanathapuram', 'Thoothukkudi', 'Tirunelveli', 'Nagercoil', 'Kanyakumari'],
      'Coimbatore': ['Coimbatore', 'Tiruppur', 'Erode', 'Salem', 'Namakkal', 'Karur', 'Dindigul', 'Madurai', 'Theni', 'Virudhunagar', 'Sivakasi', 'Ramanathapuram', 'Thoothukkudi', 'Tirunelveli', 'Nagercoil', 'Kanyakumari'],
      'Madurai': ['Madurai', 'Theni', 'Virudhunagar', 'Sivakasi', 'Ramanathapuram', 'Thoothukkudi', 'Tirunelveli', 'Nagercoil', 'Kanyakumari', 'Coimbatore', 'Tiruppur', 'Erode', 'Salem', 'Namakkal', 'Karur', 'Dindigul']
    }
  },
  'Kerala': {
    'Thiruvananthapuram': {
      'Thiruvananthapuram City': ['Thiruvananthapuram City', 'Kovalam', 'Varkala', 'Neyyar Dam', 'Ponmudi', 'Kovalam', 'Varkala', 'Neyyar Dam', 'Ponmudi', 'Kattakada', 'Nedumangad', 'Vamanapuram', 'Chirayinkeezhu', 'Attingal', 'Kazhakoottam', 'Kovalam', 'Varkala', 'Neyyar Dam', 'Ponmudi'],
      'Kollam': ['Kollam', 'Karunagappally', 'Kunnathur', 'Pathanapuram', 'Punalur', 'Kottarakkara', 'Kundara', 'Eravipuram', 'Karunagappally', 'Kunnathur', 'Pathanapuram', 'Punalur', 'Kottarakkara', 'Kundara', 'Eravipuram'],
      'Alappuzha': ['Alappuzha', 'Cherthala', 'Ambalappuzha', 'Kuttanad', 'Karthikappally', 'Chengannur', 'Mavelikkara', 'Kayamkulam', 'Cherthala', 'Ambalappuzha', 'Kuttanad', 'Karthikappally', 'Chengannur', 'Mavelikkara', 'Kayamkulam']
    }
  },
  'Andhra Pradesh': {
    'Visakhapatnam': {
      'Visakhapatnam City': ['Visakhapatnam City', 'Beach Road', 'MVP Colony', 'Asilmetta', 'Jagadamba Centre', 'PM Palem', 'Madhurawada', 'Gajuwaka', 'Anakapalle', 'Bheemunipatnam', 'Yelamanchili', 'Narsipatnam', 'Chodavaram', 'Paderu', 'Araku Valley', 'Beach Road', 'MVP Colony', 'Asilmetta', 'Jagadamba Centre', 'PM Palem', 'Madhurawada', 'Gajuwaka', 'Anakapalle', 'Bheemunipatnam', 'Yelamanchili', 'Narsipatnam', 'Chodavaram', 'Paderu', 'Araku Valley'],
      'Vizianagaram': ['Vizianagaram', 'Gajapathinagaram', 'Gurla', 'Cheepurupalli', 'Gajapathinagaram', 'Gurla', 'Cheepurupalli', 'Bobbili', 'Salur', 'Parvathipuram', 'Kurupam', 'Jami', 'Bobbili', 'Salur', 'Parvathipuram', 'Kurupam', 'Jami'],
      'Srikakulam': ['Srikakulam', 'Palakonda', 'Tekkali', 'Pathapatnam', 'Sompeta', 'Ichchapuram', 'Kaviti', 'Gara', 'Narasannapeta', 'Palakonda', 'Tekkali', 'Pathapatnam', 'Sompeta', 'Ichchapuram', 'Kaviti', 'Gara', 'Narasannapeta']
    }
  },
  'Telangana': {
    'Hyderabad': {
      'Hyderabad City': ['Hyderabad City', 'Banjara Hills', 'Jubilee Hills', 'Hitech City', 'Gachibowli', 'Madhapur', 'Kondapur', 'Kukatpally', 'Dilsukhnagar', 'Secunderabad', 'Begumpet', 'Ameerpet', 'KPHB', 'Miyapur', 'Kompally', 'Bachupally', 'Qutbullapur', 'Medchal', 'Shamirpet', 'Uppal', 'LB Nagar', 'Hayathnagar', 'Rajendranagar', 'Shamshabad', 'Maheshwaram', 'Chevella', 'Vikarabad', 'Tandur', 'Bidar', 'Nizamabad', 'Kamareddy', 'Medak', 'Sangareddy', 'Siddipet', 'Jangaon', 'Warangal', 'Karimnagar', 'Nizamabad', 'Adilabad', 'Khammam', 'Nalgonda', 'Suryapet', 'Yadadri Bhuvanagiri', 'Mahabubnagar', 'Wanaparthy', 'Gadwal', 'Jogulamba Gadwal', 'Narayanpet', 'Mahabubabad', 'Warangal Rural', 'Mulugu', 'Jayashankar Bhupalpally', 'Bhadradri Kothagudem', 'Kumuram Bheem', 'Asifabad', 'Mancherial', 'Peddapalli', 'Jagtial', 'Rajanna Sircilla', 'Siddipet', 'Yadadri Bhuvanagiri', 'Suryapet', 'Nalgonda', 'Mahabubnagar', 'Wanaparthy', 'Gadwal', 'Jogulamba Gadwal', 'Narayanpet', 'Mahabubabad', 'Warangal Rural', 'Mulugu', 'Jayashankar Bhupalpally', 'Bhadradri Kothagudem', 'Kumuram Bheem', 'Asifabad', 'Mancherial', 'Peddapalli', 'Jagtial', 'Rajanna Sircilla'],
      'Warangal': ['Warangal', 'Karimnagar', 'Nizamabad', 'Adilabad', 'Khammam', 'Nalgonda', 'Suryapet', 'Yadadri Bhuvanagiri', 'Mahabubnagar', 'Wanaparthy', 'Gadwal', 'Jogulamba Gadwal', 'Narayanpet', 'Mahabubabad', 'Warangal Rural', 'Mulugu', 'Jayashankar Bhupalpally', 'Bhadradri Kothagudem', 'Kumuram Bheem', 'Asifabad', 'Mancherial', 'Peddapalli', 'Jagtial', 'Rajanna Sircilla', 'Siddipet'],
      'Karimnagar': ['Karimnagar', 'Nizamabad', 'Adilabad', 'Khammam', 'Nalgonda', 'Suryapet', 'Yadadri Bhuvanagiri', 'Mahabubnagar', 'Wanaparthy', 'Gadwal', 'Jogulamba Gadwal', 'Narayanpet', 'Mahabubabad', 'Warangal Rural', 'Mulugu', 'Jayashankar Bhupalpally', 'Bhadradri Kothagudem', 'Kumuram Bheem', 'Asifabad', 'Mancherial', 'Peddapalli', 'Jagtial', 'Rajanna Sircilla', 'Siddipet', 'Warangal']
    }
  }
}; 