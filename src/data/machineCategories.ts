import { MachineCategory } from '@/types/job';
import { HAMPTON_MACHINE_CATEGORIES } from './hamptonMachineData';

// Based on Hampton Mower Centre categories and Australian market research + 20% markup
// Labour rates based on competitor analysis: $55-135/hr average, applying 20% markup
export const MACHINE_CATEGORIES: MachineCategory[] = HAMPTON_MACHINE_CATEGORIES;
// Legacy categories still exported for backward compatibility
export const LEGACY_MACHINE_CATEGORIES = [
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
    id: 'demo-saws',
    name: 'Demo Saws',
    labourRate: 135,
    commonBrands: ['Husqvarna', 'Echo', 'Stihl']
  },
  {
    id: 'others',
    name: 'Others',
    labourRate: 95,
    commonBrands: ['Various', 'Honda', 'Husqvarna', 'Echo']
  }
];