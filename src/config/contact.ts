/**
 * How visitors reach the company. Add the real phone number here and every "Call" button on the page
 * becomes a tap to call link. While it is empty, those buttons open the online request form instead.
 */
export const CONTACT = {
  /** Digits with country code, for example '14045550123'. */
  phone: '',
  /** How it is shown on screen, for example '(404) 555-0123'. */
  display: '',
  /** Where "Sign in" goes once a customer portal exists, for example 'https://portal.thestylevan.com'. While empty, Sign in shows a friendly note. */
  portalUrl: '',
};

export const callHref = CONTACT.phone ? `tel:+${CONTACT.phone.replace(/\D/g, '')}` : '';
