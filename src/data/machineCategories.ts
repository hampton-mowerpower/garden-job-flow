import { MachineCategory } from '@/types/job';

// Based on Hampton Mower Centre categories and Australian market research + 20% markup
// Labour rates based on competitor analysis: $55-135/hr average, applying 20% markup
export const MACHINE_CATEGORIES: MachineCategory[] = [
  {
    id: 'lawn-mowers',
    name: 'Lawn Mowers',
    labourRate: 95, // Market average $79 + 20% markup
    labelCharge: 30,
    commonBrands: ['Honda', 'Victa', 'Masport', 'Husqvarna', 'Al-Ko', 'Atom', 'Kawasaki']
  },
  {
    id: 'ride-on-mowers',
    name: 'Ride-On Mowers',
    labourRate: 186, // Market average $155 + 20% markup
    labelCharge: 54,
    commonBrands: ['Honda', 'Husqvarna', 'Victa', 'Al-Ko', 'Kawasaki', 'Billy Goat', 'Masport']
  },
  {
    id: 'chainsaws',
    name: 'Chainsaws',
    labourRate: 95, // Market average $79 + 20% markup
    labelCharge: 36,
    commonBrands: ['Husqvarna', 'Echo', 'Shindaiwa', 'Honda', 'Kress']
  },
  {
    id: 'brushcutters',
    name: 'Brushcutters',
    labourRate: 95, // Market average $79 + 20% markup
    labelCharge: 30,
    commonBrands: ['Echo', 'Shindaiwa', 'Husqvarna', 'Honda', 'Kress']
  },
  {
    id: 'hedge-trimmers',
    name: 'Hedge Trimmers',
    labourRate: 95, // Market average $79 + 20% markup
    labelCharge: 24,
    commonBrands: ['Echo', 'Shindaiwa', 'Husqvarna', 'Honda', 'Kress']
  },
  {
    id: 'blowers',
    name: 'Blowers',
    labourRate: 95, // Market average $79 + 20% markup
    labelCharge: 24,
    commonBrands: ['Echo', 'Shindaiwa', 'Husqvarna', 'Billy Goat', 'Honda']
  },
  {
    id: 'pressure-washers',
    name: 'Pressure Washers',
    labourRate: 118, // Market average $98 + 20% markup
    labelCharge: 42,
    commonBrands: ['Honda', 'Supaswift', 'Atom', 'Karcher']
  },
  {
    id: 'generators',
    name: 'Generators',
    labourRate: 186, // Market average $155 + 20% markup
    labelCharge: 60,
    commonBrands: ['Honda', 'Briggs & Stratton', 'Atom', 'Yamaha']
  },
  {
    id: 'pumps',
    name: 'Pumps',
    labourRate: 95, // Market average $79 + 20% markup
    labelCharge: 36,
    commonBrands: ['Honda', 'Atom', 'Supaswift', 'Davey']
  },
  {
    id: 'tillers',
    name: 'Tillers',
    labourRate: 95, // Market average $79 + 20% markup
    labelCharge: 42,
    commonBrands: ['Honda', 'Atom', 'Husqvarna']
  },
  {
    id: 'demo-saws',
    name: 'Demo Saws',
    labourRate: 162, // Market average $135 + 20% markup
    labelCharge: 48,
    commonBrands: ['Husqvarna', 'Echo', 'Stihl']
  },
  {
    id: 'others',
    name: 'Others',
    labourRate: 114, // Market average $95 + 20% markup
    labelCharge: 36,
    commonBrands: ['Various', 'Honda', 'Husqvarna', 'Echo']
  }
];