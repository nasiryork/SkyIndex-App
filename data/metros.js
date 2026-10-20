// Hand-curated city (metropolitan) codes. Airports are listed in the order a traveler is most likely to want them.
// Codes that are also an airport's own code (e.g. LAX, MIA, HOU) live in CLUSTERS instead.
window.METROS = {
  NYC: { name: 'New York City', cc: 'US', airports: ['JFK', 'LGA', 'EWR'] },
  LON: { name: 'London', cc: 'GB', airports: ['LHR', 'LGW', 'STN', 'LCY', 'LTN', 'SEN'] },
  PAR: { name: 'Paris', cc: 'FR', airports: ['CDG', 'ORY', 'BVA'] },
  CHI: { name: 'Chicago', cc: 'US', airports: ['ORD', 'MDW'] },
  WAS: { name: 'Washington, D.C.', cc: 'US', airports: ['IAD', 'DCA', 'BWI'] },
  ORL: { name: 'Orlando', cc: 'US', airports: ['MCO', 'SFB'] },
  YTO: { name: 'Toronto', cc: 'CA', airports: ['YYZ', 'YTZ', 'YHM'] },
  YMQ: { name: 'Montreal', cc: 'CA', airports: ['YUL', 'YMX'] },
  TYO: { name: 'Tokyo', cc: 'JP', airports: ['HND', 'NRT'] },
  OSA: { name: 'Osaka', cc: 'JP', airports: ['KIX', 'ITM', 'UKB'] },
  SPK: { name: 'Sapporo', cc: 'JP', airports: ['CTS', 'OKD'] },
  SEL: { name: 'Seoul', cc: 'KR', airports: ['ICN', 'GMP'] },
  BJS: { name: 'Beijing', cc: 'CN', airports: ['PEK', 'PKX'] },
  JKT: { name: 'Jakarta', cc: 'ID', airports: ['CGK', 'HLP'] },
  MIL: { name: 'Milan', cc: 'IT', airports: ['MXP', 'LIN', 'BGY'] },
  ROM: { name: 'Rome', cc: 'IT', airports: ['FCO', 'CIA'] },
  STO: { name: 'Stockholm', cc: 'SE', airports: ['ARN', 'BMA', 'NYO', 'VST'] },
  MOW: { name: 'Moscow', cc: 'RU', airports: ['SVO', 'DME', 'VKO'] },
  BUE: { name: 'Buenos Aires', cc: 'AR', airports: ['EZE', 'AEP'] },
  SAO: { name: 'São Paulo', cc: 'BR', airports: ['GRU', 'CGH', 'VCP'] },
  RIO: { name: 'Rio de Janeiro', cc: 'BR', airports: ['GIG', 'SDU'] },
  BHZ: { name: 'Belo Horizonte', cc: 'BR', airports: ['CNF', 'PLU'] },
};

// Groups of airports that serve the same area but have no separate city code.
window.CLUSTERS = [
  ['LAX', 'BUR', 'SNA', 'LGB', 'ONT'],
  ['SFO', 'OAK', 'SJC'],
  ['MIA', 'FLL', 'PBI'],
  ['DFW', 'DAL'],
  ['IAH', 'HOU'],
  ['BOS', 'PVD', 'MHT'],
  ['TPA', 'PIE', 'SRQ'],
  ['SEA', 'PAE'],
  ['CLE', 'CAK'],
  ['PHL', 'ACY'],
  ['PVG', 'SHA'],
  ['IST', 'SAW'],
  ['BKK', 'DMK'],
  ['DXB', 'SHJ', 'DWC'],
  ['BCN', 'GRO', 'REU'],
  ['MEL', 'AVV'],
  ['MEX', 'TLC'],
  ['BRU', 'CRL'],
  ['AMS', 'EIN', 'RTM'],
  ['FRA', 'HHN'],
  ['VIE', 'BTS'],
  ['ZRH', 'BSL'],
  ['MNL', 'CRK'],
];

// Alternate names people type. Only used when a search finds nothing. Keys: lowercase, no accents or apostrophes.
window.ALIASES = {
  // countries
  'turkey': 'Türkiye', 'czech republic': 'Czechia', 'ivory coast': 'Ivoire', 'swaziland': 'Eswatini', 'burma': 'Myanmar',
  'holland': 'Netherlands', 'the netherlands': 'Netherlands', 'england': 'United Kingdom', 'scotland': 'United Kingdom',
  'wales': 'United Kingdom', 'uk': 'United Kingdom', 'britain': 'United Kingdom', 'great britain': 'United Kingdom',
  'usa': 'United States', 'america': 'United States', 'uae': 'United Arab Emirates', 'east timor': 'Timor',
  'cape verde': 'Cabo Verde', 'macau': 'Macao', 'zaire': 'Congo', 'south korea': 'Korea', 'russian federation': 'Russia',
  // old names, nicknames, spellings
  'bombay': 'Mumbai', 'calcutta': 'Kolkata', 'madras': 'Chennai', 'peking': 'Beijing', 'saigon': 'Ho Chi Minh',
  'rangoon': 'Yangon', 'vegas': 'Las Vegas', 'philly': 'Philadelphia', 'nola': 'New Orleans', 'washington dc': 'Washington',
  'kiev': 'Kyiv', 'katmandu': 'Kathmandu', 'pnom penh': 'Phnom Penh', 'new york city': 'New York', 'big apple': 'New York',
  'sao paulo': 'Sao Paulo', 'bangalore': 'Bengaluru', 'siem reap': 'Siem Reap', 'peiping': 'Beijing',
};
