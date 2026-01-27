export const SPORTS_POSITIONS: Record<string, string[]> = {
  Football: [
    'Gardien',
    'Défenseur central',
    'Arrière gauche',
    'Arrière droit',
    'Milieu défensif',
    'Milieu central',
    'Milieu offensif',
    'Ailier gauche',
    'Ailier droit',
    'Attaquant',
    'Avant-centre'
  ],
  Basketball: [
    'Meneur de jeu',
    'Arrière',
    'Ailier',
    'Ailier fort',
    'Pivot'
  ],
  Athlétisme: [
    'Sprint',
    'Demi-fond',
    'Fond',
    'Haies',
    'Steeple',
    'Marche',
    'Saut en longueur',
    'Saut en hauteur',
    'Triple saut',
    'Lancer de poids',
    'Lancer de disque',
    'Lancer de javelot',
    'Décathlon'
  ],
  Tennis: [
    'Simple',
    'Double',
    'Mixte'
  ],
  Volleyball: [
    'Passeur',
    'Attaquant',
    'Réceptionneur',
    'Libéro',
    'Central'
  ],
  Handball: [
    'Gardien',
    'Ailier gauche',
    'Ailier droit',
    'Arrière gauche',
    'Arrière droit',
    'Demi-centre',
    'Pivot'
  ],
  Boxe: [
    'Poids mouche',
    'Poids coq',
    'Poids plume',
    'Poids léger',
    'Poids welter',
    'Poids moyen',
    'Poids mi-lourd',
    'Poids lourd'
  ],
  Cyclisme: [
    'Sprinteur',
    'Grimpeur',
    'Rouleur',
    'Coureur polyvalent',
    'Pistard'
  ]
};

export const MAJOR_CITIES: Record<string, string[]> = {
  'Sénégal': ['Dakar', 'Thiès', 'Kaolack', 'Tambacounda', 'Saint-Louis', 'Kolda', 'Ziguinchor', 'Matam'],
  'Côte d\'Ivoire': ['Abidjan', 'Yamoussoukro', 'Bouaké', 'Daloa', 'Korhogo', 'San-Pédro', 'Gagnoa', 'Dimbokro'],
  'Mali': ['Bamako', 'Ségou', 'Mopti', 'Kayes', 'Koulikoro', 'Gao', 'Tombouctou', 'Kidal'],
  'Burkina Faso': ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora', 'Dédougou', 'Tenkodogo', 'Fada N\'Gourma'],
  'Cameroun': ['Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Bafoussam', 'Buea', 'Kumba', 'Limbe'],
  'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Cape Coast', 'Tema', 'Koforidua', 'Obuasi'],
  'Nigeria': ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Benin City', 'Katsina', 'Port Harcourt', 'Maiduguri'],
  'Maroc': ['Casablanca', 'Fès', 'Rabat', 'Marrakech', 'Agadir', 'Tanger', 'Meknes', 'Oujda'],
  'Algérie': ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Sétif', 'Tlemcen', 'Béjaïa'],
  'Tunisie': ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Gabès', 'Bizerte', 'Gafsa', 'Djerba'],
  'Égypte': ['Le Caire', 'Alexandrie', 'Gizeh', 'Charm el-Cheikh', 'Louxor', 'Assouan', 'Mansoura', 'Tanta'],
  'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kericho', 'Nyeri', 'Machakos'],
  'Ouganda': ['Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Masaka', 'Soroti', 'Kabale'],
  'Tanzanie': ['Dar es-Salaam', 'Dodoma', 'Mwanza', 'Arusha', 'Mbeya', 'Iringa', 'Zanzibar', 'Morogoro'],
  'Afrique du Sud': ['Johannesburg', 'Le Cap', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'Soweto', 'Pietermaritzburg'],
  'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier'],
  'Belgique': ['Bruxelles', 'Anvers', 'Gand', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Mons'],
  'Suisse': ['Zurich', 'Bâle', 'Berne', 'Lausanne', 'Genève', 'Lucerne', 'Saint-Gall', 'Winterthour'],
  'Espagne': ['Madrid', 'Barcelone', 'Valence', 'Séville', 'Bilbao', 'Malaga', 'Murcie', 'Palma'],
  'Italie': ['Rome', 'Milan', 'Naples', 'Turin', 'Palerme', 'Gênes', 'Bologne', 'Florence'],
  'Allemagne': ['Berlin', 'Munich', 'Cologne', 'Francfort', 'Hambourg', 'Dusseldorf', 'Dortmund', 'Essen'],
  'Pays-Bas': ['Amsterdam', 'Rotterdam', 'La Haye', 'Utrecht', 'Eindhoven', 'Groningue', 'Arnhem', 'Alkmaar'],
  'Portugal': ['Lisbonne', 'Porto', 'Covilhã', 'Braga', 'Aveiro', 'Funchal', 'Viseu', 'Guarda'],
  'Brésil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Recife'],
  'Argentine': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán', 'Mar del Plata', 'Salta'],
  'Canada': ['Toronto', 'Montréal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Québec'],
  'États-Unis': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphie', 'San Antonio', 'San Diego'],
  'Australie': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adélaïde', 'Gold Coast', 'Newcastle', 'Canberra'],
  'Japon': ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kyoto'],
  'Chine': ['Pékin', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chongqing', 'Xi\'an', 'Hangzhou', 'Wuhan'],
  'Inde': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'],
};
