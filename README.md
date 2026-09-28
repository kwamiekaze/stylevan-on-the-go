# Style Van Mobile Salon

Build THE STYLE VAN (thestylevan.com), a luxury mobile beauty salon brand. Slogan: "Beauty on the way". Services: Salon, Barber, Nails, Lashes. Also bridal and event styling, private and luxe experiences, book online.

EXPERIENCE: One full screen, immersive, cinematic 3D homepage (React Three Fiber + drei), built in the same spirit as kleanupcrew.com and fixing365.com. The hero is a realistic 3D white high roof luxury cargo van with blush pink and champagne gold marble livery, towing a 20 ft enclosed trailer, parked at golden hour on a glossy driveway of a luxury estate. Orbit and scroll driven camera moves. Van sliding door and trailer awning open to reveal glowing interiors. Every other section (Services, Van Tour, Bridal and Events, Gallery, Book Online, Contact) opens as a see through glass pop up over the 3D scene, never a separate page. Load only what is near the camera so it runs well on mobile and desktop. Mobile first polish, 60fps target, graceful fallback to a static hero image when WebGL is unavailable.

BRAND: Palette blush pink, cream, champagne gold, deep burgundy text. High contrast serif wordmark THE STYLE VAN with flowing script tagline. Warm gold LED glow accents. Award level luxury, not templated.

REALISTIC SPECS (must be shown accurately): Van interior about 14 ft x 6 ft (about 85 sq ft): hair and barber chair, shampoo bowl, manicure station with two chairs, folding lash and brow bed, refreshment nook, 28 in aisle. Trailer 20 ft x 8 ft (160 sq ft): bridal prep zone, lounge sofa, vanity with two styling chairs, product storage wall, flexible photo and event area. Total about 245 sq ft, self contained power, water, A/C. Comfortably serves 5 to 6 clients.

BOOKING: A booking pop up with service picker (Salon, Barber, Nails, Lashes, Bridal and Event), date, address, contact, and notes. Store requests in the database. Use a placeholder phone number to be replaced later.

ASSETS (Higgsfield generated references, download and place in the project public folder, use as textures, hero fallbacks and gallery): 
Hero: https://d8j0ntlcm91z4.cloudfront.net/user_2zkin0wWd1fqvOlkf1ZVTn9Up98/hf_20260928_223852_c7fa3296-971e-498b-97df-807a2ad7bbb7.png
Van side elevation: https://d8j0ntlcm91z4.cloudfront.net/user_2zkin0wWd1fqvOlkf1ZVTn9Up98/hf_20260928_223852_bb750c01-2341-468e-a6e3-8865cd0ac642.png
Trailer side elevation: https://d8j0ntlcm91z4.cloudfront.net/user_2zkin0wWd1fqvOlkf1ZVTn9Up98/hf_20260928_223852_7823cbc1-cd5d-470a-93b6-71bd43008f17.png
Van front and rear: https://d8j0ntlcm91z4.cloudfront.net/user_2zkin0wWd1fqvOlkf1ZVTn9Up98/hf_20260928_223852_7817a79f-e818-4840-a7d7-9dff3e486a7f.png
Van floor plan: https://d8j0ntlcm91z4.cloudfront.net/user_2zkin0wWd1fqvOlkf1ZVTn9Up98/hf_20260928_223932_83617d2a-dd1d-4752-9bb0-fe9b2e960d58.png
Trailer floor plan: https://d8j0ntlcm91z4.cloudfront.net/user_2zkin0wWd1fqvOlkf1ZVTn9Up98/hf_20260928_223853_a84411f3-6387-4722-8157-271ede9b8e69.png
Van interior: https://d8j0ntlcm91z4.cloudfront.net/user_2zkin0wWd1fqvOlkf1ZVTn9Up98/hf_20260928_223853_fba8995b-e2cf-4121-b8da-db40daac03c5.png
Trailer interior: https://d8j0ntlcm91z4.cloudfront.net/user_2zkin0wWd1fqvOlkf1ZVTn9Up98/hf_20260928_223933_113fcbca-8a76-4f52-b375-d3710af26f7a.png
Nail and lash detail: https://d8j0ntlcm91z4.cloudfront.net/user_2zkin0wWd1fqvOlkf1ZVTn9Up98/hf_20260928_223852_c2c3a2f6-6380-4b78-b3bf-0ab08b14c7ef.png
Brand lockup: https://d8j0ntlcm91z4.cloudfront.net/user_2zkin0wWd1fqvOlkf1ZVTn9Up98/hf_20260928_223852_d055d749-45df-4d4f-999d-7ed1ac1bf5cb.png
Marble wrap texture: https://d8j0ntlcm91z4.cloudfront.net/user_2zkin0wWd1fqvOlkf1ZVTn9Up98/hf_20260928_223933_3ffcc76b-1a11-471a-b4b0-9837ef08d678.png
Twilight estate: https://d8j0ntlcm91z4.cloudfront.net/user_2zkin0wWd1fqvOlkf1ZVTn9Up98/hf_20260928_223853_2777c60d-50f6-4250-a79f-2bd229e6fab0.png

For this first pass, build the site shell, brand system, pop up architecture, booking form and a placeholder procedural 3D van and trailer scene using the marble texture, so detailed 3D models can be swapped in later. Keep code clean and modular for editing outside Lovable via GitHub.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://stylevan-on-the-go.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8ed355ef-84d3-4530-adb8-0d27b3de56c9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
