import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import hero from '@/assets/hero.png.asset.json';
import vanSide from '@/assets/van-side.png.asset.json';
import trailerSide from '@/assets/trailer-side.png.asset.json';
import vanInterior from '@/assets/van-interior.png.asset.json';
import trailerInterior from '@/assets/trailer-interior.png.asset.json';
import nailLash from '@/assets/nail-lash.png.asset.json';
import twilight from '@/assets/twilight.png.asset.json';
import vanPlan from '@/assets/van-plan.png.asset.json';
import trailerPlan from '@/assets/trailer-plan.png.asset.json';

export type Panel = 'services' | 'tour' | 'events' | 'gallery' | 'booking' | 'contact';
export const navigation: { id: Panel; label: string }[] = [
  { id: 'services', label: 'Services' }, { id: 'tour', label: 'Van tour' }, { id: 'events', label: 'Bridal & events' },
  { id: 'gallery', label: 'Gallery' }, { id: 'booking', label: 'Book online' }, { id: 'contact', label: 'Contact' },
];
const gallery = [
  { src: hero.url, alt: 'The Style Van and trailer at a luxury event', label: 'The arrival' },
  { src: vanSide.url, alt: 'Blush marble livery on the van', label: 'The signature van' },
  { src: trailerSide.url, alt: 'Trailer with its service awning opened', label: 'The beauty suite' },
  { src: vanInterior.url, alt: 'Hair and barber chairs inside the van', label: 'Inside the van' },
  { src: trailerInterior.url, alt: 'Bridal styling lounge in the trailer', label: 'Inside the trailer' },
  { src: nailLash.url, alt: 'Nail and lash station', label: 'The details' },
  { src: twilight.url, alt: 'The mobile salon glowing at twilight', label: 'After hours' },
] as const;
const services = [
  { n: '01', name: 'Salon', detail: 'Hair styling, cuts, color & finishing' },
  { n: '02', name: 'Barber', detail: 'Precision cuts, grooming & styling' },
  { n: '03', name: 'Nails', detail: 'Manicures, polish & nail artistry' },
  { n: '04', name: 'Lashes', detail: 'Lashes, brows & finishing touches' },
];

export function ExperiencePanels({ panel, onClose, onOpen }: { panel: Panel | null; onClose: () => void; onOpen: (panel: Panel) => void }) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [tourIndex, setTourIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [service, setService] = useState('');
  const [deliveryError, setDeliveryError] = useState(false);
  if (!panel) return null;
  const tour = [
    { image: vanInterior.url, alt: 'Van salon interior', label: '01 / The van', title: 'Beauty, beautifully in motion.', description: 'Approximately 14 ft × 6 ft · 85 sq ft. A hair and barber chair, shampoo bowl, two-chair manicure station, folding lash and brow bed, refreshment nook and a 28 in aisle.' },
    { image: trailerInterior.url, alt: 'Trailer bridal lounge interior', label: '02 / The trailer', title: 'Room to make it yours.', description: '20 ft × 8 ft · 160 sq ft. Bridal prep zone, lounge sofa, vanity with two styling chairs, product storage wall and a flexible photo and event area.' },
    { image: vanPlan.url, alt: 'Van floor plan', label: '03 / The layout', title: 'Every detail considered.', description: 'Together, approximately 245 sq ft of self-contained beauty space, with power, water and A/C. Comfortably serves 5 to 6 clients.' },
    { image: trailerPlan.url, alt: 'Trailer floor plan', label: '04 / The layout', title: 'More room for the moment.', description: 'A dedicated 160 sq ft trailer adds space for bridal parties, private styling and events without leaving the venue.' },
  ] as const;
  const currentTour = tour[tourIndex] ?? tour[0];
  const currentImage = gallery[galleryIndex] ?? gallery[0];
  function submitBooking(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // The form is ready for a Cloud-backed request endpoint; do not imply an unsent request was booked.
    setDeliveryError(true);
    setSubmitted(false);
  }
  return <div className="panel-layer" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className={`glass-panel ${panel === 'gallery' ? 'glass-panel-wide' : ''}`} role="dialog" aria-modal="true" aria-label={navigation.find(item => item.id === panel)?.label}>
      <div className="panel-topline"><span className="eyebrow">THE STYLE VAN <span className="eyebrow-dot">✦</span> BEAUTY ON THE WAY</span><Button variant="panelIcon" size="icon" onClick={onClose} aria-label="Close panel"><X size={18} /></Button></div>
      <div className="panel-scroll" key={panel}>
        {panel === 'services' && <>
          <p className="panel-kicker">01 / WHAT WE DO</p><h2 className="panel-title">Beauty meets<br /><em>you there.</em></h2>
          <p className="panel-intro">Your favorite beauty rituals, reimagined around your day. Come as you are; we’ll bring the salon.</p>
          <div className="service-list">{services.map(item => <div className="service-row" key={item.n}><span className="service-num">{item.n}</span><div><h3>{item.name}</h3><p>{item.detail}</p></div><ArrowUpRight size={19} /></div>)}</div>
          <Button variant="luxury" onClick={() => onOpen('booking')}>Request an appointment <ArrowUpRight size={16} /></Button>
        </>}
        {panel === 'tour' && <>
          <p className="panel-kicker">02 / STEP INSIDE</p><h2 className="panel-title">A salon with<br /><em>no address.</em></h2>
          <div className="tour-image-wrap"><img src={currentTour.image} alt={currentTour.alt} /><span className="image-tag">{currentTour.label}</span></div>
          <div className="tour-detail"><div><h3>{currentTour.title}</h3><p>{currentTour.description}</p></div><div className="small-arrows"><Button variant="panelIcon" size="icon" aria-label="Previous tour image" onClick={() => setTourIndex((tourIndex + tour.length - 1) % tour.length)}><ArrowLeft size={16} /></Button><Button variant="panelIcon" size="icon" aria-label="Next tour image" onClick={() => setTourIndex((tourIndex + 1) % tour.length)}><ArrowRight size={16} /></Button></div></div>
          <div className="spec-strip"><span><strong>245</strong> sq ft total</span><span><strong>5–6</strong> clients</span><span>Power · Water · A/C</span></div>
        </>}
        {panel === 'events' && <>
          <p className="panel-kicker">03 / THE OCCASION</p><h2 className="panel-title">The day is yours.<br /><em>So is the moment.</em></h2>
          <div className="editorial-photo"><img src={trailerInterior.url} alt="Bridal-ready styling lounge inside the trailer" /></div>
          <p className="panel-intro">From getting ready with your favorite people to an intimate private appointment, we create space for beauty that feels entirely your own.</p>
          <div className="event-types"><span>Bridal mornings</span><span>Private experiences</span><span>On-site events</span><span>Luxe gatherings</span></div>
          <Button variant="luxury" onClick={() => onOpen('booking')}>Plan your experience <ArrowUpRight size={16} /></Button>
        </>}
        {panel === 'gallery' && <>
          <p className="panel-kicker">04 / A CLOSER LOOK</p><h2 className="panel-title">The beauty<br /><em>is in the details.</em></h2>
          <div className="gallery-feature"><img src={currentImage.src} alt={currentImage.alt} /><div className="gallery-caption"><span>{String(galleryIndex + 1).padStart(2,'0')} / {String(gallery.length).padStart(2,'0')} &nbsp; {currentImage.label}</span><div className="small-arrows"><Button variant="panelIcon" size="icon" aria-label="Previous gallery image" onClick={() => setGalleryIndex((galleryIndex + gallery.length - 1) % gallery.length)}><ChevronLeft size={18} /></Button><Button variant="panelIcon" size="icon" aria-label="Next gallery image" onClick={() => setGalleryIndex((galleryIndex + 1) % gallery.length)}><ChevronRight size={18} /></Button></div></div></div>
          <div className="gallery-thumbs">{gallery.map((item,i) => <Button variant="imageThumb" key={item.label} className={galleryIndex === i ? 'selected' : ''} onClick={() => setGalleryIndex(i)} aria-label={`View ${item.label}`}><img src={item.src} alt="" loading="lazy" /></Button>)}</div>
        </>}
        {panel === 'booking' && <>
          <p className="panel-kicker">05 / YOUR APPOINTMENT</p><h2 className="panel-title">Something lovely<br /><em>is on the way.</em></h2>
          <p className="panel-intro">Tell us what you’re dreaming of. We’ll take it from there.</p>
          {submitted ? <div className="booking-success"><Check size={28} /><h3>Request received</h3><p>We’ll be in touch soon.</p></div> : <form className="booking-form" onSubmit={submitBooking}>
            <label>Service <select required value={service} onChange={e => setService(e.target.value)}><option value="">Select a service</option>{['Salon','Barber','Nails','Lashes','Bridal and Event'].map(s => <option key={s}>{s}</option>)}</select></label>
            <div className="form-grid"><label>Preferred date <input required type="date" min={new Date().toISOString().slice(0,10)} /></label><label>Your name <input required type="text" placeholder="Full name" autoComplete="name" /></label></div>
            <label>Service address <input required type="text" placeholder="Street address, city and ZIP" autoComplete="street-address" /></label>
            <div className="form-grid"><label>Email address <input required type="email" placeholder="you@example.com" autoComplete="email" /></label><label>Phone number <input required type="tel" placeholder="(000) 000-0000" autoComplete="tel" /></label></div>
            <label>Anything else? <textarea rows={3} placeholder="Occasion, number of guests, special requests..." /></label>
            {deliveryError && <p className="form-notice" role="alert">Online requests are not available yet. Your details have not been sent. Please try again once booking is connected.</p>}
            <Button type="submit" variant="luxury" className="form-submit">Send booking request <ArrowUpRight size={16} /></Button>
          </form>}
        </>}
        {panel === 'contact' && <>
          <p className="panel-kicker">06 / GET IN TOUCH</p><h2 className="panel-title">Let’s make it<br /><em>beautiful.</em></h2>
          <p className="panel-intro">For private bookings, bridal parties, collaborations, and every beautiful thing in between.</p>
          <div className="contact-divider" /><p className="contact-label">GENERAL INQUIRIES</p><a className="contact-link" href="mailto:hello@thestylevan.com">hello@thestylevan.com <ArrowUpRight size={18} /></a>
          <p className="contact-label contact-spaced">CALL US</p><a className="contact-link" href="tel:+10000000000">(000) 000-0000 <ArrowUpRight size={18} /></a><p className="placeholder-note">Phone number coming soon.</p>
          <div className="contact-divider" /><Button variant="luxury" onClick={() => onOpen('booking')}>Book your visit <ArrowUpRight size={16} /></Button>
        </>}
      </div>
      <div className="panel-footer"><span>BEAUTY ON THE WAY</span><span>THE STYLE VAN © 2026</span></div>
    </section>
  </div>;
}
