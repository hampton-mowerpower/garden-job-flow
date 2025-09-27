import { MachineCategory } from '@/types/job';

// Machine data sourced from Hampton Mower Centre website (hamptonmowercentre.com.au)
// Updated labour rates based on competitor analysis + 20% markup for Australian market

export const HAMPTON_MACHINE_CATEGORIES: MachineCategory[] = [
  {
    id: 'lawn-mowers',
    name: 'Lawn Mowers',
    labourRate: 79,
    commonBrands: ['Honda', 'Victa', 'Masport', 'Husqvarna', 'Al-Ko', 'Atom', 'Kawasaki']
  },
  {
    id: 'ride-on-mowers',
    name: 'Ride-On Mowers',
    labourRate: 155,
    commonBrands: ['Honda', 'Husqvarna', 'Victa', 'Al-Ko', 'Kawasaki', 'Billy Goat', 'Masport']
  },
  {
    id: 'chainsaws',
    name: 'Chainsaws',
    labourRate: 79,
    commonBrands: ['Husqvarna', 'Echo', 'Shindaiwa', 'Honda', 'Kress']
  },
  {
    id: 'brushcutters',
    name: 'Brushcutters',
    labourRate: 79,
    commonBrands: ['Echo', 'Shindaiwa', 'Husqvarna', 'Honda', 'Kress']
  },
  {
    id: 'hedge-trimmers',
    name: 'Hedge Trimmers',
    labourRate: 79,
    commonBrands: ['Echo', 'Shindaiwa', 'Husqvarna', 'Honda', 'Kress']
  },
  {
    id: 'blowers',
    name: 'Blowers',
    labourRate: 79,
    commonBrands: ['Echo', 'Shindaiwa', 'Husqvarna', 'Billy Goat', 'Honda']
  },
  {
    id: 'pressure-washers',
    name: 'Pressure Washers',
    labourRate: 98,
    commonBrands: ['Honda', 'Supaswift', 'Atom', 'Karcher']
  },
  {
    id: 'generators',
    name: 'Generators',
    labourRate: 155,
    commonBrands: ['Honda', 'Briggs & Stratton', 'Atom', 'Yamaha']
  },
  {
    id: 'pumps',
    name: 'Pumps',
    labourRate: 79,
    commonBrands: ['Honda', 'Atom', 'Supaswift', 'Davey']
  },
  {
    id: 'tillers',
    name: 'Tillers',
    labourRate: 79,
    commonBrands: ['Honda', 'Atom', 'Husqvarna']
  },
  {
    id: 'log-splitters',
    name: 'Log Splitters',
    labourRate: 98,
    commonBrands: ['Honda', 'Atom', 'Supaswift']
  },
  {
    id: 'engines',
    name: 'Engines',
    labourRate: 135,
    commonBrands: ['Honda', 'Briggs & Stratton', 'Kawasaki', 'Kohler']
  },
  {
    id: 'others',
    name: 'Others',
    labourRate: 95,
    commonBrands: ['Various', 'Honda', 'Husqvarna', 'Echo']
  }
];

// Common models by brand (examples from website analysis)
export const BRAND_MODELS: { [category: string]: { [brand: string]: string[] } } = {
  'lawn-mowers': {
    'Honda': ['HRU19R1', 'HRU216M3', 'HRN216VKA', 'HRX217VKA', 'HRX217HYA'],
    'Victa': ['Mustang', 'Corvette', 'Charger', 'Tornado'],
    'Husqvarna': ['LC221A', 'LC221AH', 'LB248S', 'LC347V'],
    'Masport': ['President', 'Contractor', 'Olympic', 'S18'],
    'Al-Ko': ['Classic', 'Comfort', 'Premium'],
    'Kawasaki': ['KLM48SR', 'KLM53SP']
  },
  'chainsaws': {
    'Husqvarna': ['120 Mark II', '135 Mark II', '140', '240', '365', '372XP', '562XP Mark II'],
    'Echo': ['CS-2511TES', 'CS-271T', 'CS-361P', 'CS-400', 'CS-501P'],
    'Shindaiwa': ['251TCS', '285S', '352S', '377', '488P'],
    'Honda': ['HHT25S', 'HHT35S']
  },
  'generators': {
    'Honda': ['EU10i', 'EU20i', 'EU22i', 'EU30is', 'EB2800i', 'EM5000is'],
    'Briggs & Stratton': ['P2200', 'P3000', 'P4500', 'Q6500'],
    'Atom': ['YG2600i', 'YG3600i', 'YG5500E']
  },
  'ride-on-mowers': {
    'Honda': ['HF2417', 'HF2622', 'HF2417K4'],
    'Husqvarna': ['YTH18542', 'YTH22V46', 'Z254F', 'Z448'],
    'Billy Goat': ['Outback', 'BC2600HH', 'BC2600ICM']
  },
  'brushcutters': {
    'Echo': ['SRM-225', 'SRM-266', 'SRM-280', 'SRM-4305'],
    'Shindaiwa': ['T242X', 'T262X', 'T282X', 'C344'],
    'Husqvarna': ['129R', '135R', '143R-II', '545RX']
  },
  'hedge-trimmers': {
    'Echo': ['HC-152', 'HC-155', 'HC-2020', 'HCR-185ES'],
    'Shindaiwa': ['DH232', 'H23', 'H45', 'AH230'],
    'Husqvarna': ['122HD45', '122HD60', '525HE3', '525HE4']
  },
  'blowers': {
    'Echo': ['PB-2520', 'PB-255LN', 'PB-580T', 'PB-770T'],
    'Shindaiwa': ['EB240', 'EB633RT', 'EB854RT'],
    'Billy Goat': ['KV600', 'KV650H', 'F902SPH']
  },
  'pressure-washers': {
    'Honda': ['GC160', 'GC190', 'GX160', 'GX200'],
    'Supaswift': ['2200PSI', '2500PSI', '3000PSI'],
    'Atom': ['HPW2500', 'HPW3000', 'HPW4000']
  },
  'pumps': {
    'Honda': ['WB20XT', 'WB30XT', 'WT20X', 'WT30X'],
    'Davey': ['Transfer', 'Firefighter', 'Pressure'],
    'Atom': ['WP20X', 'WP30X', 'WP40X']
  }
};