/** Central legal hub sections — used by /legal page and site footer. */
export const LEGAL_SECTIONS = [
  { id: 'privacy', title: 'Privacy Policy' },
  { id: 'terms', title: 'Terms of Use' },
  { id: 'data-security', title: 'Passwords & User Data' },
  { id: 'how-to-use', title: 'How to Use GigConnection' },
  { id: 'subscriptions', title: 'Subscription Plans' },
  { id: 'payments', title: 'Payment Management' },
  { id: 'cookies', title: 'Cookies & Local Storage' },
] as const;

export type LegalSectionId = (typeof LEGAL_SECTIONS)[number]['id'];

export function legalSectionHref(id: LegalSectionId | string) {
  return `/legal#${id}`;
}

export const LEGAL_HUB_PATH = '/legal';
