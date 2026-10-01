/**
 * How visitors reach the company. Every "Call" and "Book" button on the page is a tap-to-call link to this number.
 * Leave `phone` empty and the buttons open the online request form instead.
 */
export const CONTACT = {
  /** Digits with country code. */
  phone: '14702223827',
  /** How it is shown on screen. */
  display: '(470) 222-3827',
  /** A general inquiries address. Leave empty to hide the email line on the Contact panel. */
  email: '',
  /** Online booking is not connected yet, so the "request online" option stays hidden. */
  onlineBooking: false,
  /** Where "Sign in" goes once the style portal exists, for example 'https://portal.thestylevan.com'. While empty, Sign in shows a friendly note. */
  portalUrl: '',
};

export const callHref = CONTACT.phone ? `tel:+${CONTACT.phone.replace(/\D/g, '')}` : '';
