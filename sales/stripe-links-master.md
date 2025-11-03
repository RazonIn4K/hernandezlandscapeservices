# Stripe Payment Links - Master Reference

## QUICK COPY-PASTE (Mobile Optimized)

**UPDATE THESE BEFORE FIRST SEND:**

### Esencial Plan
```
ESENCIAL - $16/semana × 24 semanas
🔗 [PASTE YOUR STRIPE LINK HERE]

Example: https://buy.stripe.com/test_xxxxxxxxxxxxx
```

### Estándar Plan
```
ESTÁNDAR - $29/semana × 24 semanas
🔗 [PASTE YOUR STRIPE LINK HERE]

Example: https://buy.stripe.com/test_xxxxxxxxxxxxx
```

### Premium Plan
```
PREMIUM - $46/semana × 24 semanas
🔗 [PASTE YOUR STRIPE LINK HERE]

Example: https://buy.stripe.com/test_xxxxxxxxxxxxx
```

---

## STRIPE PRODUCT SETUP CHECKLIST

If you haven't created your Stripe payment links yet, follow this checklist:

### Step 1: Create Products in Stripe Dashboard

1. **Log in to Stripe** → [https://dashboard.stripe.com/](https://dashboard.stripe.com/)
2. **Navigate to:** Products → Create Product

#### Product 1: Esencial
```
Product Name: Plan Esencial - Mantenimiento Web
Description: Hosting seguro + SSL, monitoreo 24/7, backups automáticos, 1 cambio/semana, soporte por email

Pricing:
- Type: Recurring
- Billing Period: Weekly
- Price: $16.00 USD
- Billing Cycle: Every 1 week for 24 weeks (then continues weekly)

Payment Link Settings:
- Require customer email: YES
- Require customer phone: YES (for WhatsApp follow-ups)
- Collect billing address: NO (not needed for services)
- Collect shipping address: NO
- Allow promotion codes: YES (for future discounts)
- Payment methods: Card, Apple Pay, Google Pay
- After payment: Redirect to success page or send email
```

#### Product 2: Estándar
```
Product Name: Plan Estándar - Crecimiento Web
Description: Todo de Esencial + hasta 3 cambios/semana, reporte mensual de tráfico, soporte prioritario por teléfono

Pricing:
- Type: Recurring
- Billing Period: Weekly
- Price: $29.00 USD
- Billing Cycle: Every 1 week for 24 weeks (then continues weekly)

Payment Link Settings:
- (Same as Esencial)
```

#### Product 3: Premium
```
Product Name: Plan Premium - Dominio Total
Description: Cambios ilimitados, marketing mensual (SEO + contenido), consultoría de estrategia, soporte dedicado

Pricing:
- Type: Recurring
- Billing Period: Weekly
- Price: $46.00 USD
- Billing Cycle: Every 1 week for 24 weeks (then continues weekly)

Payment Link Settings:
- (Same as Esencial)
```

---

### Step 2: Generate Payment Links

1. **In each Product page** → Click "Create payment link"
2. **Configure:**
   - Link name (internal): `Esencial - Gilberto Hernandez` (customize per customer)
   - Adjust quantity: NO (always 1 subscription)
   - Collect tax: NO (adjust based on your tax requirements)
   - Success message: "¡Gracias! Tu plan está activo. Te contactaremos en las próximas 2 horas."
3. **Copy the link** → Paste into this document

---

### Step 3: Test Links Before Sending

**CRITICAL: Test in Stripe TEST mode first!**

1. Switch Stripe to **Test Mode** (toggle in top right)
2. Create test payment links
3. Use test card: `4242 4242 4242 4242` (any future date, any CVC)
4. Verify:
   - ✅ Payment goes through
   - ✅ Email receipt is sent
   - ✅ Subscription shows in dashboard
   - ✅ Webhook fires (if you set up webhooks)
5. **Then switch to LIVE mode** and create real links

---

## URL SHORTENER SETUP (Optional)

If your Stripe links are too long for WhatsApp (ugly UX), shorten them:

### Option 1: Bitly
1. Go to [https://bitly.com/](https://bitly.com/)
2. Create account (free)
3. Paste Stripe link → Generate short link
4. Custom back-half: `bit.ly/hernandez-esencial`

### Option 2: TinyURL
1. Go to [https://tinyurl.com/](https://tinyurl.com/)
2. Paste Stripe link → Create
3. Free, no account needed
4. Example: `tinyurl.com/hls-esencial`

### Option 3: Stripe's Built-In Shortener
- Stripe auto-generates `pay.stripe.com/xxxxx` links
- Already short, use as-is

**Recommendation:** Use Stripe's native short links. Bitly is overkill for one customer.

---

## MASTER LINK TABLE (Update After Creation)

| Plan | Weekly Price | 24-Week Total | Stripe Link | Short Link | Status |
|------|--------------|---------------|-------------|------------|--------|
| Esencial | $16 | $384 | [Paste here] | [Optional] | ⚪ Not Created |
| Estándar | $29 | $696 | [Paste here] | [Optional] | ⚪ Not Created |
| Premium | $46 | $1,104 | [Paste here] | [Optional] | ⚪ Not Created |

**Status Legend:**
- ⚪ Not Created
- 🟡 Created in Test Mode
- 🟢 Created in Live Mode
- ✅ Tested & Active

---

## WEBHOOK SETUP (For Automation)

**Why webhooks?** Get notified instantly when Gilberto pays → Trigger automated onboarding.

### Quick Setup:
1. **Stripe Dashboard** → Developers → Webhooks → Add endpoint
2. **Endpoint URL:**
   - If you have backend: `https://yourdomain.com/stripe-webhook`
   - No backend? Use Zapier/Make.com webhook URL
3. **Events to listen for:**
   - `checkout.session.completed` (payment successful)
   - `customer.subscription.created` (subscription started)
   - `customer.subscription.deleted` (subscription cancelled)
   - `invoice.payment_failed` (payment issue)
4. **Copy webhook secret** → Save in .env file

### No-Code Alternative (Zapier):
1. Create Zap: **Stripe → WhatsApp/Email**
2. Trigger: "New Payment in Stripe"
3. Action: Send yourself WhatsApp message with customer details
4. Free tier supports 100 tasks/month

---

## PRICING BREAKDOWN (For Reference)

### Esencial: $16/week × 24 weeks = $384 total commitment

**Included:**
- Hosting + SSL certificate
- 24/7 uptime monitoring
- Daily backups
- 1 content change per week
- Email support (reply within 24h)

**NOT Included:**
- Phone support (email only)
- Traffic reports
- Marketing/SEO work
- Design changes (only content edits)

---

### Estándar: $29/week × 24 weeks = $696 total commitment

**Everything in Esencial PLUS:**
- Up to 3 content changes per week
- Monthly traffic & performance report
- Priority phone support (reply within 4h)
- Basic SEO monitoring (ranking checks)

**NOT Included:**
- Active marketing campaigns
- Unlimited changes
- Strategy consulting

---

### Premium: $46/week × 24 weeks = $1,104 total commitment

**Everything in Estándar PLUS:**
- Unlimited content changes
- Monthly marketing package (blog post, SEO optimization, social media content)
- Monthly strategy call (15-20 min)
- Dedicated Slack/WhatsApp support (reply within 1h)
- Competitor analysis quarterly

**NOT Included:**
- Paid ad management (Google Ads, Facebook Ads)
- Complete website redesigns (would be separate project)

---

## STRIPE DASHBOARD SHORTCUTS

**Bookmark these:**

- **Live Dashboard:** [https://dashboard.stripe.com/](https://dashboard.stripe.com/)
- **Test Dashboard:** [https://dashboard.stripe.com/test](https://dashboard.stripe.com/test)
- **Products:** [https://dashboard.stripe.com/products](https://dashboard.stripe.com/products)
- **Payment Links:** [https://dashboard.stripe.com/payment-links](https://dashboard.stripe.com/payment-links)
- **Customers:** [https://dashboard.stripe.com/customers](https://dashboard.stripe.com/customers)
- **Subscriptions:** [https://dashboard.stripe.com/subscriptions](https://dashboard.stripe.com/subscriptions)

---

## TROUBLESHOOTING

### "The link doesn't work"
- ✅ Check: Are you in Live mode? Test links don't work in production
- ✅ Check: Did you activate the payment link?
- ✅ Check: Is the link expired? (Set expiration to "Never")

### "Customer says payment failed"
- ✅ Ask for error message (screenshot)
- ✅ Check Stripe logs: Dashboard → Developers → Logs
- ✅ Common issues:
  - Card declined (insufficient funds)
  - 3D Secure authentication failed
  - Billing address mismatch

### "I want to change the price"
- ❌ Can't edit existing subscriptions
- ✅ Create new payment link with new price
- ✅ Update this document with new link

---

## WHEN GILBERTO PAYS

**You'll receive:**
1. ✉️ **Stripe email notification** (instant)
2. 📱 **Webhook trigger** (if you set it up)
3. 💰 **Dashboard notification** (check Payments tab)

**Next steps:**
1. ✅ Send **WhatsApp Template #10** (payment confirmation)
2. ✅ Execute **2-hour technical checklist** (see separate doc)
3. ✅ Log payment in **tracking spreadsheet**
4. ✅ Set reminder for **2-week Premium upsell** (Template #11)

---

## CANCELLATION PROCESS

**If Gilberto wants to cancel:**

1. **During 24-week commitment:**
   - Stripe Dashboard → Subscriptions → Find customer
   - Cancel subscription → Choose "At period end" (he pays through current week)
   - Charge early termination fee if applicable (discuss with customer)

2. **After 24-week commitment:**
   - Same process, no termination fee
   - Offer retention discount: "Would you stay for $12/week?"

3. **Update this doc** with cancellation reason (data for future improvement)

---

**Last Updated:** 2025-11-02
**Next Review:** After first payment received (test workflow)

---

## NOTES TO SELF

- [ ] Create Esencial payment link
- [ ] Create Estándar payment link
- [ ] Create Premium payment link
- [ ] Test all links with test cards
- [ ] Copy final links into WhatsApp templates doc
- [ ] Set up webhook (optional but recommended)
- [ ] Bookmark Stripe dashboard on phone
- [ ] Screenshot payment link QR codes for in-person sales