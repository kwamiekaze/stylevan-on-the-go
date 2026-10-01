/**
 * Words on the scroll journey. Edit freely: plain language, short lines, friendly for everyone.
 * Nothing here states prices, phone numbers or hours. Add them when they are final.
 */
export type ServiceId = 'salon' | 'barber' | 'nails' | 'lashes';

export type Service = {
  id: ServiceId; number: string; name: string; promise: string; blurb: string; bullets: string[]; comesTo: string; cta: string;
};

export const SERVICES: Service[] = [
  { id: 'salon', number: '01', name: 'Salon', promise: 'Hair that feels like you.', blurb: 'Sit in our chair, right outside your door. Cuts, color and styling by a professional, with the mirror lights and music already on.', bullets: ['Haircuts and trims', 'Color and highlights', 'Blowouts and special occasion styling'], comesTo: 'Your home, your hotel, your event', cta: 'Book Salon' },
  { id: 'barber', number: '02', name: 'Barber', promise: 'Sharp, clean, done.', blurb: 'A proper barber chair with a hot towel finish. Skip the drive and the wait. Come out, sit down, walk back in looking great.', bullets: ['Fades, tapers and classic cuts', 'Beard shaping and lineups', 'Kids and grown ups welcome'], comesTo: 'Your office, your driveway, the groom’s suite', cta: 'Book Barber' },
  { id: 'nails', number: '03', name: 'Nails', promise: 'Polish with a little sparkle.', blurb: 'A comfy nail station with every shade lined up. Bring a friend, bring the whole party, and leave with fresh nails and no smudges.', bullets: ['Manicures and finishing care', 'Color, gel and nail art', 'Fun for groups and parties'], comesTo: 'Girls’ night, bridal parties, birthdays', cta: 'Book Nails' },
  { id: 'lashes', number: '04', name: 'Lashes', promise: 'Soft, fluttery, effortless.', blurb: 'A calm, reclined lash and brow bed under soft light. Lie back, close your eyes, and let us do the careful work.', bullets: ['Lash sets and lifts', 'Brow shaping', 'Touch ups between visits'], comesTo: 'Your living room, your hotel, your big day', cta: 'Book Lashes' },
];

export const STEPS = [
  { n: '1', title: 'Pick your moment', text: 'Choose a service and a time that suits you. It only takes a couple of minutes.' },
  { n: '2', title: 'We pull up', text: 'The van arrives with everything on board: chairs, mirrors, power, water and air conditioning. You do not need to set up a thing.' },
  { n: '3', title: 'Relax and glow', text: 'Sit back while we work. Then step out, see yourself, and get on with your day.' },
];

export const PLACES = ['At home', 'At the office', 'Hotel suites', 'Backyards', 'Bridal mornings', 'Birthdays', 'Girls’ nights', 'Graduations', 'Date nights', 'Family photos'];
