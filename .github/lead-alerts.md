# Lead notifications — hernandezlandscapeservices.com

When the contact/quote form (`#contactForm`) is submitted, one delivery path is
currently active:

1. **Email (system of record).** The form POSTs to **Web3Forms**
   (`assets/js/main.js`, `https://api.web3forms.com/submit`) → the owner Gmail.
   Recipient is configured in the Web3Forms dashboard (public access key is in the page
   by design; the secret recipient is not in the repo).
The former browser-to-notification webhook was removed on 2026-07-09. Its gate
credential was visible in public JavaScript and therefore could not provide real
authentication. Removing that optional alert does not change Web3Forms email
delivery, which remains the system of record.

Separate, unchanged: the tree-emergency dispatch path (`functions/emergency-dispatch.mjs`
Cloudflare Worker → `N8N_WEBHOOK_URL_LANDSCAPE`) forwards to its own AI triage workflow.

## Restoring an instant owner alert safely

Do not put a webhook URL, bearer token, bot token, or chat identifier in client
JavaScript. Use a server-side endpoint (for example, a Cloudflare Worker) that:

- keeps upstream credentials in platform secrets;
- validates and length-limits every field;
- enforces durable rate limiting and bot protection;
- forwards only after the primary form provider confirms success;
- logs delivery failures without logging full lead contents; and
- supports a request identifier so retries cannot create duplicate alerts.

Rotate the former notification gate before any replacement is activated because
removing a value from the current tree does not remove it from git history.

## GA4 / GTM
Form submit fires `lead_submit_success` and the "Get Free Quote" CTA fires
`quote_cta_click` → GTM container `GTM-NJ4DPSC9` maps `call_click`→**`click_to_call`** and
`quote_cta_click`→**`generate_lead`** (GA4 property `G-K8HJKV8W52`). Mark those as Key
Events once received (daily scheduled task handles this).
