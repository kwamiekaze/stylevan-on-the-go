/**
 * Words on the scroll journey. Edit freely: plain language, short lines, friendly for everyone.
 * Nothing here states prices, phone numbers or hours. Add them when they are final.
 */
export type ServiceId = 'salon' | 'barber' | 'nails' | 'lashes';

export type Service = {
  id: ServiceId; number: string; name: string; promise: string; blurb: string; bullets: string[]; comesTo: string; cta: string;
};

export const SERVICES: Service[] = [
  { id: 'salon', number: '01', name: 'Salon', promise: 'Hair that feels like you.', blurb: 'Imagine your own salon chair, mirror lights glowing and your favorite music playing, with no waiting room in sight. Tell us the look you have in mind and we will take it from there.', bullets: ['Cuts and trims', 'Color and highlights', 'Styling for special days'], comesTo: 'Your home, a hotel suite, a big day', cta: 'Call about Salon' },
  { id: 'barber', number: '02', name: 'Barber', promise: 'Sharp, clean, done.', blurb: 'Imagine a proper barber chair and a hot towel finish, without the drive or the wait. Tell us the fresh cut you are after and we will take it from there.', bullets: ['Fades, tapers and classic cuts', 'Beard shaping and lineups', 'Kids and grown ups alike'], comesTo: 'Your office, your driveway, the groom’s suite', cta: 'Call about Barber' },
  { id: 'nails', number: '03', name: 'Nails', promise: 'Polish with a little sparkle.', blurb: 'Imagine a cozy nail bar with every shade lined up and a friend in the next seat. Tell us the colors and the occasion and we will take it from there.', bullets: ['Manicures and finishing care', 'Color, gel and nail art', 'Made for groups and parties'], comesTo: 'Girls’ night, bridal mornings, birthdays', cta: 'Call about Nails' },
  { id: 'lashes', number: '04', name: 'Lashes', promise: 'Soft, fluttery, effortless.', blurb: 'Imagine a calm, reclined lash and brow bed under soft light. Tell us the look you love and we will take it from there.', bullets: ['Lash sets and lifts', 'Brow shaping', 'Touch ups between visits'], comesTo: 'Your living room, a hotel, the morning of your wedding', cta: 'Call about Lashes' },
];

export const STEPS = [
  { n: '1', title: 'Picture it', text: 'Think about the look, the day and the place you have in mind. Big or small, it all starts as a picture.' },
  { n: '2', title: 'Make the call', text: 'Tell us what you are dreaming up. We listen, ask a few easy questions and shape the plan around you.' },
  { n: '3', title: 'Enjoy the moment', text: 'Step into the experience you imagined, then get on with your day feeling like yourself, only better.' },
];

export const PLACES = ['At home', 'At the office', 'Hotel suites', 'Backyards', 'Bridal mornings', 'Birthdays', 'Girls’ nights', 'Graduations', 'Date nights', 'Family photos'];
