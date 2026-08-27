# Architecture

This repository's system map is an [Archify](https://tt-a1i.github.io/archify/) specification.

- Spec: `docs/archify/hernandez-architecture.json`
- Type: architecture (showcase)
- Captured: 2026-08-27

## Summary

Hernandez Landscape Services is a custom static site hosted on GitHub Pages at hernandezlandscapeservices.com, including a homepage, service landing pages, EN/ES service-areas, gallery, and PWA. Lead capture uses a #contactForm that POSTs to Web3Forms. Analytics are tracked via Google Tag Manager GTM-NJ4DPSC9 and self-hosted Umami on Cloud Run. Billing is handled through Stripe payment-link redirects from pricing.html and /pay/*.

## Regenerate the interactive HTML

Do not commit the generated HTML (~700KB).

```bash
npx -y skills add tt-a1i/archify --skill archify --agent cursor --global --copy --yes
node bin/archify.mjs deliver architecture docs/archify/hernandez-architecture.json /tmp/hernandez.html --quality showcase
```
