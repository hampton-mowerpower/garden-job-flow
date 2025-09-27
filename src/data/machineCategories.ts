import { MachineCategory } from '@/types/job';

// Based on Hampton Mower Centre categories and Australian market research + 20% markup
export const MACHINE_CATEGORIES: MachineCategory[] = [
  {
    id: 'lawn-mowers',
    name: 'Lawn Mowers',
    labourRate: 79,
    labelCharge: 25,
    commonBrands: ['Honda', 'Victa', 'Masport', 'Husqvarna', 'Al-Ko', 'Atom']
  },
  {
    id: 'ride-on-mowers',
    name: 'Ride-On Mowers',
    labourRate: 155,
    labelCharge: 45,
    commonBrands: ['Honda', 'Husqvarna', 'Victa', 'Al-Ko', 'Kawasaki', 'Billy Goat']
  },
  {
    id: 'chainsaws',
    name: 'Chainsaws',
    labourRate: 79,
    labelCharge: 30,
    commonBrands: ['Husqvarna', 'Echo', 'Shindaiwa', 'Honda', 'Kress']
  },
  {
    id: 'brushcutters',
    name: 'Brushcutters',
    labourRate: 79,
    labelCharge: 25,
    commonBrands: ['Echo', 'Shindaiwa', 'Husqvarna', 'Honda']
  },
  {
    id: 'hedge-trimmers',
    name: 'Hedge Trimmers',
    labourRate: 79,
    labelCharge: 20,
    commonBrands: ['Echo', 'Shindaiwa', 'Husqvarna', 'Honda', 'Kress']
  },
  {
    id: 'blowers',
    name: 'Blowers',
    labourRate: 79,
    labelCharge: 20,
    commonBrands: ['Echo', 'Shindaiwa', 'Husqvarna', 'Billy Goat']
  },
  {
    id: 'pressure-washers',
    name: 'Pressure Washers',
    labourRate: 98,
    labelCharge: 35,
    commonBrands: ['Honda', 'Supaswift', 'Atom']
  },
  {
    id: 'generators',
    name: 'Generators',
    labourRate: 155,
    labelCharge: 50,
    commonBrands: ['Honda', 'Briggs & Stratton', 'Atom']
  },
  {
    id: 'pumps',
    name: 'Pumps',
    labourRate: 79,
    labelCharge: 30,
    commonBrands: ['Honda', 'Atom', 'Supaswift']
  },
  {
    id: 'tillers',
    name: 'Tillers',
    labourRate: 79,
    labelCharge: 35,
    commonBrands: ['Honda', 'Atom']
  },
  {
    id: 'demo-saws',
    name: 'Demo Saws',
    labourRate: 135,
    labelCharge: 40,
    commonBrands: ['Husqvarna', 'Echo']
  },
  {
    id: 'others',
    name: 'Others',
    labourRate: 95,
    labelCharge: 30,
    commonBrands: ['Various']
  }
];