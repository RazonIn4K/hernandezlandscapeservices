# AI Handoff Prompt - Stripe Payment Links Completion

## Context

I need to complete the setup of Stripe Payment Links for Hernandez Landscape & Tree Service's website care plans. A previous AI session fixed critical pricing errors and created 1 of 9 required Payment Links. This work needs to be completed.

## What Was Already Done

1. ✅ **Fixed Critical Pricing Error**: All 9 incorrect recurring prices (which had the same dollar amounts regardless of billing frequency) were archived
2. ✅ **Created 9 Correct Prices** in Stripe with proper pricing structure
3. ✅ **Created First Payment Link** (1 of 9): Keep-Lights-On Monthly at $45/month
4. ✅ **Prepared HTML files** for success and cancel pages (ready to deploy)

## Your Task

Complete the Stripe Payment Links setup by:

1. **Create 8 remaining Payment Links** in Stripe Dashboard (following the exact process used for the first one)
2. **Record all 9 Payment Link URLs**
3. **Create a pricing page HTML file** with all 9 Payment Links as buttons
4. **Provide deployment instructions** for the 3 HTML files

**DO NOT deploy anything to the website yourself** - just create the files and provide instructions.

---

## Critical Information

### Stripe Account Details
- **Account**: David Ortiz (acct_1RTxsnP5UmVB5UbV)
- **Product**: Website Care & Maintenance - Hernandez Landscape (prod_TMBgiPNwvoV0zD)
- **Dashboard URL**: https://dashboard.stripe.com/acct_1RTxsnP5UmVB5UbV/payment-links

### Completed Payment Link (Reference)
- **Price**: Keep-Lights-On Plan - Monthly ($45/month)
- **Payment Link ID**: plink_1SPWQ5P5UmVB5UbV977yeuBh
- **URL**: https://buy.stripe.com/fZufZjd346BcbKSevQ4ZG01
- **Success redirect**: https://hernandezlandscapeservices.com/pay/success.html

### The 9 Stripe Prices (All Active and Ready)

#### Keep-Lights-On Plan ($540/year)
1. ✅ **Monthly**: $45.00 USD / month (price_1SPW7xP5UmVB5UbVBTbwM9Yo) - PAYMENT LINK CREATED
2. ⬜ **Bi-weekly**: $22.50 USD every 2 weeks (price_1SPWCSP5UmVB5UbV5HFNlXQ0)
3. ⬜ **Weekly**: $11.25 USD / week (find this price - created in previous session)

#### Basic Care Plan ($1,800/year)
4. ⬜ **Monthly**: $150.00 USD / month (price_1SPWFXP5UmVB5UbV2yekFENt)
5. ⬜ **Bi-weekly**: $75.00 USD every 2 weeks (find this price - created in previous session)
6. ⬜ **Weekly**: $37.50 USD / week (find this price - created in previous session)

#### Full Care Plan ($3,600/year)
7. ⬜ **Monthly**: $300.00 USD / month (price_1SPWG8P5UmVB5UbVKpl2g2nm)
8. ⬜ **Bi-weekly**: $150.00 USD every 2 weeks (find this price - created in previous session)
9. ⬜ **Weekly**: $75.00 USD / week (find this price - created in previous session)

---

## Step-by-Step Instructions

### STEP 1: Navigate to Stripe Dashboard

Use Playwright MCP tools to:
1. Navigate to: https://dashboard.stripe.com/acct_1RTxsnP5UmVB5UbV/payment-links
2. Click the **"New"** button to create a Payment Link

### STEP 2: Create Each Payment Link (Repeat 8 Times)

For each of the 8 remaining prices listed above:

1. **Select the price** from the "Find or add a product…" dropdown
   - The dropdown will show options like "$22.50 USD every 2 weeks Keep-Lights-On Plan - Bi-weekly"
   - Click the button for the specific price you're creating a link for

2. **Configure After Payment tab**:
   - Click the "After payment" tab
   - Select the radio button: **"Don't show confirmation page"**
   - In the textbox that appears, enter: `https://hernandezlandscapeservices.com/pay/success.html`

3. **Create the link**:
   - Click the **"Create link"** button
   - Wait for the Payment Link details page to load

4. **Record the URL**:
   - Copy the Payment Link URL (format: `https://buy.stripe.com/...`)
   - Record it in the tracking table below

### STEP 3: URL Tracking Table

As you create each Payment Link, record the URL here:

```
Keep-Lights-On Plan:
1. Monthly ($45): https://buy.stripe.com/fZufZjd346BcbKSevQ4ZG01 ✅
2. Bi-weekly ($22.50): _______________________________________________
3. Weekly ($11.25): _______________________________________________

Basic Care Plan:
4. Monthly ($150): _______________________________________________
5. Bi-weekly ($75): _______________________________________________
6. Weekly ($37.50): _______________________________________________

Full Care Plan:
7. Monthly ($300): _______________________________________________
8. Bi-weekly ($150): _______________________________________________
9. Weekly ($75): _______________________________________________
```

### STEP 4: Create Pricing Page HTML

After collecting all 9 Payment Link URLs, create a file at:
`/Users/davidortiz/Main-Learning-Vault/hernandezlandscapeservices/pricing.html`

Use this template and **replace ALL `[INSERT_X_LINK]` placeholders** with the actual Payment Link URLs from the tracking table:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Website Care Plans | Hernandez Landscape</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;margin:0;background:#f6f8f7;color:#0d1b0d;padding:2rem}
    .container{max-width:1200px;margin:0 auto}
    h1{text-align:center;color:#2e7d32;margin-bottom:1rem}
    .subtitle{text-align:center;color:#4a5a4a;margin-bottom:3rem}
    .plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:2rem}
    .plan{background:#fff;border-radius:16px;padding:2rem;box-shadow:0 10px 30px rgba(0,0,0,.06)}
    .plan h2{margin-top:0;color:#2e7d32}
    .plan .price{font-size:2.5rem;font-weight:700;color:#2e7d32;margin:1rem 0}
    .plan .price small{font-size:1rem;color:#4a5a4a}
    .plan ul{list-style:none;padding:0;margin:1.5rem 0}
    .plan li{padding:.5rem 0;border-bottom:1px solid #f0f4f0}
    .plan li:last-child{border:none}
    .frequency-group{margin-top:1.5rem;padding-top:1.5rem;border-top:2px solid #f0f4f0}
    .frequency-group h3{font-size:1rem;color:#4a5a4a;margin-bottom:1rem}
    .btn{display:block;width:100%;padding:.8rem;margin:.5rem 0;text-align:center;text-decoration:none;background:#2e7d32;color:#fff;border-radius:8px;font-weight:600;transition:background .3s}
    .btn:hover{background:#1b5e20}
    .btn.secondary{background:#4caf50}
    .btn.secondary:hover{background:#388e3c}
    footer{text-align:center;margin-top:3rem;color:#4a5a4a}
  </style>
</head>
<body>
  <div class="container">
    <h1>Website Care & Maintenance Plans</h1>
    <p class="subtitle">Professional website maintenance for hernandezlandscapeservices.com</p>

    <div class="plans">
      <!-- Keep-Lights-On Plan -->
      <div class="plan">
        <h2>Keep-Lights-On</h2>
        <div class="price">$540<small>/year</small></div>
        <ul>
          <li>✓ Domain management</li>
          <li>✓ Basic updates</li>
          <li>✓ Security monitoring</li>
          <li>✓ Email support</li>
        </ul>
        <div class="frequency-group">
          <h3>Choose billing frequency:</h3>
          <a href="https://buy.stripe.com/fZufZjd346BcbKSevQ4ZG01" class="btn">
            Pay Monthly — $45/mo
          </a>
          <a href="[INSERT_KEEPON_BIWEEKLY_LINK]" class="btn secondary">
            Pay Bi-weekly — $22.50 every 2 weeks
          </a>
          <a href="[INSERT_KEEPON_WEEKLY_LINK]" class="btn secondary">
            Pay Weekly — $11.25/week
          </a>
        </div>
      </div>

      <!-- Basic Care Plan -->
      <div class="plan">
        <h2>Basic Care</h2>
        <div class="price">$1,800<small>/year</small></div>
        <ul>
          <li>✓ Everything in Keep-Lights-On</li>
          <li>✓ Content updates</li>
          <li>✓ SEO optimization</li>
          <li>✓ Performance monitoring</li>
          <li>✓ Priority support</li>
        </ul>
        <div class="frequency-group">
          <h3>Choose billing frequency:</h3>
          <a href="[INSERT_BASIC_MONTHLY_LINK]" class="btn">
            Pay Monthly — $150/mo
          </a>
          <a href="[INSERT_BASIC_BIWEEKLY_LINK]" class="btn secondary">
            Pay Bi-weekly — $75 every 2 weeks
          </a>
          <a href="[INSERT_BASIC_WEEKLY_LINK]" class="btn secondary">
            Pay Weekly — $37.50/week
          </a>
        </div>
      </div>

      <!-- Full Care Plan -->
      <div class="plan">
        <h2>Full Care</h2>
        <div class="price">$3,600<small>/year</small></div>
        <ul>
          <li>✓ Everything in Basic Care</li>
          <li>✓ Advanced features</li>
          <li>✓ Custom development</li>
          <li>✓ 24/7 support</li>
          <li>✓ Monthly strategy calls</li>
        </ul>
        <div class="frequency-group">
          <h3>Choose billing frequency:</h3>
          <a href="[INSERT_FULL_MONTHLY_LINK]" class="btn">
            Pay Monthly — $300/mo
          </a>
          <a href="[INSERT_FULL_BIWEEKLY_LINK]" class="btn secondary">
            Pay Bi-weekly — $150 every 2 weeks
          </a>
          <a href="[INSERT_FULL_WEEKLY_LINK]" class="btn secondary">
            Pay Weekly — $75/week
          </a>
        </div>
      </div>
    </div>

    <footer>
      <p>Questions? Call or text (815) 501‑1478 · support@highencodelearning.com</p>
      <p>Hernandez Landscape & Tree Service LLC</p>
    </footer>
  </div>
</body>
</html>
```

### STEP 5: Provide Deployment Summary

Create a summary file with:
1. All 9 Payment Link URLs (from tracking table)
2. List of 3 files that need to be deployed to the website:
   - `/Users/davidortiz/Downloads/pay_success.html` → deploy to `hernandezlandscapeservices.com/pay/success.html`
   - `/Users/davidortiz/Downloads/pay_cancel.html` → deploy to `hernandezlandscapeservices.com/pay/cancel.html`
   - `/Users/davidortiz/Main-Learning-Vault/hernandezlandscapeservices/pricing.html` → deploy to `hernandezlandscapeservices.com/pricing.html`

---

## Important Notes

- **DO NOT** deploy files to the website yourself - just prepare them
- **DO NOT** modify the success/cancel HTML files in Downloads - they're already correct
- **DO** use Playwright MCP browser tools to interact with Stripe Dashboard
- **DO** verify each Payment Link is created successfully before moving to the next
- The pricing structure uses an 8.3% premium for frequent billing (this is intentional)
- All Payment Links should redirect to the same success URL: `https://hernandezlandscapeservices.com/pay/success.html`

---

## Expected Deliverables

When you're done, provide:

1. ✅ **Tracking table** with all 9 Payment Link URLs filled in
2. ✅ **pricing.html file** created with all URLs inserted
3. ✅ **Deployment instructions** summary
4. ✅ **Confirmation** that all 8 new Payment Links were created successfully

---

## Reference Files on System

- Guide: `/Users/davidortiz/Main-Learning-Vault/hernandezlandscapeservices/STRIPE_PAYMENT_LINKS_GUIDE.md`
- Success page: `/Users/davidortiz/Downloads/pay_success.html`
- Cancel page: `/Users/davidortiz/Downloads/pay_cancel.html`
- Project root: `/Users/davidortiz/Main-Learning-Vault/hernandezlandscapeservices/`

---

## If You Encounter Issues

- If Stripe Dashboard layout has changed, adapt the process but maintain the same configuration (success URL, etc.)
- If you can't find a specific weekly price in the dropdown, search the Product Catalog for all prices
- All 9 prices should be visible and active (not archived)
- The weekly prices might be listed without a description suffix - look for the exact dollar amounts

Good luck! This should take approximately 15-20 minutes to complete all 8 Payment Links.
