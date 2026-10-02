# The EPC Engineer

A fast, responsive static website for Gupta Sahu. No build tool is required.

## Publish with GitHub Pages

1. Create a new GitHub repository.
2. Upload every file and folder from this project. Keep `index.html` in the repository root.
3. Open **Settings > Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then save.
6. Wait for GitHub Pages to provide the live URL.

## Custom domain

1. Rename `CNAME.example` to `CNAME`.
2. Replace its content with your actual domain.
3. Update canonical URLs, Open Graph URLs, `robots.txt`, and `sitemap.xml`.
4. Configure the DNS records shown by your hosting provider.

## Before launch

- Replace GS portrait placeholders with your real optimized WebP photo.
- Add `assets/images/og-image.jpg` or update the Open Graph image path.
- Replace email, LinkedIn, WhatsApp, pricing, testimonials, and case-study placeholders.
- Connect forms to a real form provider.
- Add Microsoft Bookings or Calendly.
- Obtain legal review for privacy, terms, disclaimers and consulting agreements.
- Test all pages on mobile and run Lighthouse checks.

## Editing

- Global design: `assets/css/style.css`
- Navigation/footer: repeated in each HTML file
- Interactions: `assets/js/main.js`
- SEO title and meta description: `<head>` of each HTML file
