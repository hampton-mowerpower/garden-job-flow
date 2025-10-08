import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a name string to Title Case with special handling for:
 * - O'Brien → O'Brien (preserve apostrophes)
 * - Anna-Marie → Anna-Marie (preserve hyphens)
 * - McDonald → McDonald, MacLeod → MacLeod
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  
  return str
    .trim()
    .split(/\s+/) // Split by whitespace
    .map(word => {
      // Handle hyphenated names
      if (word.includes('-')) {
        return word.split('-').map(part => capitalizeWord(part)).join('-');
      }
      // Handle apostrophes
      if (word.includes("'")) {
        const parts = word.split("'");
        return parts.map((part, idx) => {
          if (idx === 0) return capitalizeWord(part);
          // After apostrophe, capitalize if it's a proper prefix (O'Brien)
          return capitalizeWord(part);
        }).join("'");
      }
      return capitalizeWord(word);
    })
    .join(' ');
}

function capitalizeWord(word: string): string {
  if (!word) return '';
  
  // Handle Mac/Mc prefixes
  if (word.toLowerCase().startsWith('mac') && word.length > 3) {
    return 'Mac' + word.charAt(3).toUpperCase() + word.slice(4).toLowerCase();
  }
  if (word.toLowerCase().startsWith('mc') && word.length > 2) {
    return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
  }
  
  // Standard title case
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
