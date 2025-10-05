/**
 * Hampton Mowerpower Company Details
 * Single source of truth for all company information
 */

export const COMPANY_DETAILS = {
  name: 'HAMPTON MOWERPOWER',
  tagline: 'Garden Equipment Sales & Service',
  address: {
    street: '87 Ludstone Street',
    suburb: 'Hampton',
    postcode: '3188',
    state: 'VIC',
    country: 'Australia',
  },
  contact: {
    phone: '(03) 9598 6741',
    email: 'hamptonmowerpower@gmail.com',
    website: 'https://www.hamptonmowerpower.com.au',
  },
  business: {
    abn: '97 161 289 069',
  },
} as const;

/**
 * Formatted company details for different use cases
 */
export const getCompanyHeader = (format: 'thermal' | 'a4' | 'email' = 'thermal') => {
  const { name, tagline, address, contact, business } = COMPANY_DETAILS;
  
  const fullAddress = `${address.street}, ${address.suburb} ${address.postcode}`;
  const line1 = `${name} — ${tagline}`;
  const line2 = `${fullAddress} | ${contact.phone}`;
  const line3 = `${contact.website} | ${contact.email} | ABN: ${business.abn}`;
  
  const alignment = format === 'thermal' ? 'center' : 'left';
  
  return {
    line1,
    line2,
    line3,
    alignment,
    fullText: `${line1}\n${line2}\n${line3}`,
  };
};

/**
 * Get clickable HTML version for emails and PDFs
 */
export const getCompanyHeaderHTML = () => {
  const { line1, line2, line3 } = getCompanyHeader('email');
  const { contact } = COMPANY_DETAILS;
  
  const line3WithLinks = line3
    .replace(contact.website, `<a href="${contact.website}">${contact.website}</a>`)
    .replace(contact.email, `<a href="mailto:${contact.email}">${contact.email}</a>`);
  
  return `
    <div style="text-align: left; margin-bottom: 16px; line-height: 1.5;">
      <div><strong>${line1}</strong></div>
      <div>${line2}</div>
      <div>${line3WithLinks}</div>
    </div>
  `;
};
