To implement the "click to scroll" functionality, I will link the navbar items to the corresponding sections on the landing page.

### 1. Assign IDs to Landing Page Sections
I will modify `app/[locale]/page.tsx` to wrap the existing components in container elements with specific IDs. This allows the anchor links to target them.
- `HowItWorks` → `id="about"`
- `ComparisonSection` → `id="plans"`
- `TeamSection` → `id="team"`

### 2. Update Navbar Links
I will update `components/landing/LandingNavbar.tsx` to replace the placeholder `href="#"` with the actual section IDs:
- **About**: `#` → `#about`
- **Plans**: `#` → `#plans`
- **Team**: `#` → `#team`
- **FAQ**: `#` → `#faq` (I will add a placeholder ID or leave it pending if no FAQ section exists yet, but I'll ensure the structure is ready).

### 3. Enable Smooth Scrolling
I will add `scroll-behavior: smooth;` to `app/globals.css`. This ensures that when a user clicks a link, the page scrolls smoothly to the section instead of jumping instantly.
