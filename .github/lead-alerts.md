# Lead notifications — hernandezlandscapeservices.com

When the contact/quote form (`#contactForm`) is submitted, two things happen:

1. **Email (system of record).** The form POSTs to **Web3Forms**
   (`assets/js/main.js`, `https://api.web3forms.com/submit`) → the owner Gmail.
   Recipient is configured in the Web3Forms dashboard (public access key is in the page
   by design; the secret recipient is not in the repo).
2. **Instant Telegram alert (added 2026-07).** *Only after* Web3Forms returns
   `data.success`, `main.js` fires a fire-and-forget POST to the shared n8n
   "Website Lead → Telegram" webhook. It is guarded to the production host, so
   tests/localhost never ping.

**A contact-form Telegram alert therefore means the email was sent too.** (The reverse
isn't guaranteed — if Telegram is down the email still sends.)

Separate, unchanged: the tree-emergency dispatch path (`functions/emergency-dispatch.mjs`
Cloudflare Worker → `N8N_WEBHOOK_URL_LANDSCAPE`) forwards to its own AI triage workflow.

## Shared n8n "Website Lead → Telegram" webhook
- **URL:** `https://34-172-247-12.sslip.io/webhook/website-lead` (n8n workflow id `WebsiteLeadTG01`, GCP VM `n8n`, project `dizera-n8n-prod-1758`).
- **Auth token:** `WEBLEAD_TOKEN` in `/opt/n8n/.env` on the VM. On this static site the token is embedded in `assets/js/main.js` (client-visible) — it only gates who can ping the owner's Telegram, so it's a low-severity, revocable spam-gate. To rotate: change it in `/opt/n8n/.env`, `docker compose up -d --force-recreate n8n`, and update the literal in `main.js`. (Can be moved behind the Cloudflare Worker later to hide it entirely.)
- **Delivery:** Telegram bot **@DizeraOpsBot**, using `TELEGRAM_BOT_TOKEN` (`/opt/n8n/secrets.env`) + `TELEGRAM_CHAT_ID` (`/opt/n8n/.env`).
- **Test:** submit the real form once from a browser on the production domain (you get email + Telegram), or `curl -X POST https://34-172-247-12.sslip.io/webhook/website-lead -H 'content-type: application/json' -d '{"token":"<WEBLEAD_TOKEN>","site":"hernandezlandscapeservices.com","name":"Test","phone":"555-0100","message":"test"}'`.

## GA4 / GTM
Form submit fires `lead_submit_success` and the "Get Free Quote" CTA fires
`quote_cta_click` → GTM container `GTM-NJ4DPSC9` maps `call_click`→**`click_to_call`** and
`quote_cta_click`→**`generate_lead`** (GA4 property `G-K8HJKV8W52`). Mark those as Key
Events once received (daily scheduled task handles this).

## VM access (reference)
`gcloud compute ssh n8n --zone us-central1-a` · container `n8n-n8n-1` · config in `/opt/n8n/`.
