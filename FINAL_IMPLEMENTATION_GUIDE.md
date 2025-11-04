# FINAL STRIPE IMPLEMENTATION - Step-by-Step Execution Guide

## 🎯 MISSION: Complete Stripe pricing overhaul with zero clutter

---

## 🧹 STEP 1: ARCHIVE OLD PRICES (7 searches, 7 clicks)

### 🔗 Go to: https://dashboard.stripe.com/acct_1RTxsnP5UmVB5UbV/products

### Search & Archive These Legacy Amounts:
1. **Search: "$45"** → Click price → Confirm "0 subscriptions" → **Archive price**
2. **Search: "$22.50"** → Click price → Confirm "0 subscriptions" → **Archive price**
3. **Search: "$11.25"** → Click price → Confirm "0 subscriptions" → **Archive price**
4. **Search: "$150"** → Click price → Confirm "0 subscriptions" → **Archive price**
5. **Search: "$75"** → Click price → Confirm "0 subscriptions" → **Archive price**
6. **Search: "$37.50"** → Click price → Confirm "0 subscriptions" → **Archive price**
7. **Search: "$300"** → Click price → Confirm "0 subscriptions" → **Archive price**

✅ **Result: All old expensive prices cleared in <5 minutes**

---

## 🛠️ STEP 2: CREATE 12 CLEAN PAYMENT LINKS

### 📊 New Price Matrix:
| Plan | Monthly | Bi-weekly | Weekly | Annual |
|------|---------|-----------|--------|--------|
| Keep-Lights-On | $20 | $10 | $5 | $200 |
| Basic Care | $75 | $37.50 | $18.75 | $800 |
| Full Care | $175 | $87.50 | $43.75 | $1,800 |

### 🔗 Payment Links Dashboard: https://dashboard.stripe.com/acct_1RTxsnP5UmVB5UbV/payment-links

### Create Each Link With:
1. **Label Format**: `Plan – cadence – amount`
   - `Keep-Lights-On – Monthly – $20`
   - `Keep-Lights-On – Bi-weekly – $10`
   - `Keep-Lights-On – Weekly – $5`
   - `Keep-Lights-On – Annual – $200`
   - `Basic Care – Monthly – $75`
   - `Basic Care – Bi-weekly – $37.50`
   - `Basic Care – Weekly – $18.75`
   - `Basic Care – Annual – $800`
   - `Full Care – Monthly – $175`
   - `Full Care – Bi-weekly – $87.50`
   - `Full Care – Weekly – $43.75`
   - `Full Care – Annual – $1,800`

2. **Settings**:
   - ✅ Success URL: `https://hernandezlandscapeservices.com/pay/success.html`
   - ✅ Cancel URL: `https://hernandezlandscapeservices.com/pay/cancel.html`
   - ✅ Email collection: Enabled
   - ✅ Recurring billing: Enabled

---

## 📝 STEP 3: UPDATE PRICING PAGE BUTTONS

### 📁 File: `/Users/davidortiz/Main-Learning-Vault/hernandezlandscapeservices/pricing-new.html`

### Replace These Placeholder hrefs:

```html
<!-- Keep-Lights-On Plan -->
<a class="pricing-btn best-value" href="https://buy.stripe.com/live_keep-monthly">Best value · $20/month</a>
<a class="pricing-btn" href="https://buy.stripe.com/live_keep-biweekly">$10 every 2 weeks</a>
<a class="pricing-btn" href="https://buy.stripe.com/live_keep-weekly">$5 per week (convenience fee)</a>
<a class="pricing-btn secondary" href="https://buy.stripe.com/live_keep-annual">Pay $200 for 1 year · save 17%</a>

<!-- Basic Care Plan -->
<a class="pricing-btn best-value" href="https://buy.stripe.com/live_basic-monthly">$75/month</a>
<a class="pricing-btn" href="https://buy.stripe.com/live_basic-biweekly">$37.50 every 2 weeks</a>
<a class="pricing-btn" href="https://buy.stripe.com/live_basic-weekly">$18.75 per week</a>
<a class="pricing-btn secondary" href="https://buy.stripe.com/live_basic-annual">Pay $800 for 1 year · save 11%</a>

<!-- Full Care Plan -->
<a class="pricing-btn best-value" href="https://buy.stripe.com/live_full-monthly">$175/month</a>
<a class="pricing-btn" href="https://buy.stripe.com/live_full-biweekly">$87.50 every 2 weeks</a>
<a class="pricing-btn" href="https://buy.stripe.com/live_full-weekly">$43.75 per week</a>
<a class="pricing-btn secondary" href="https://buy.stripe.com/live_full-annual">Pay $1,800 for 1 year · save 14%</a>
```

---

## 🗂️ STEP 4: RETIRE OLD LINKS

### In Stripe Payment Links Dashboard:
1. Find any links pointing to old prices ($45, $150, $300, etc.)
2. Click "..." menu → **Archive** or **Disable**
3. Confirm only new fair-priced links are active

---

## 🧪 STEP 5: QA PAYMENT FLOW

### Test Mode Verification:
1. **Toggle to Test Mode** in Stripe Dashboard
2. **Open each new Payment Link** → Verify correct price displays
3. **Test payment** with card: `4242 4242 4242 4242` (any future date, any CVV)
4. **Confirm redirect** to `/pay/success.html`
5. **Test cancel** → Redirect to `/pay/cancel.html`
6. **Check Stripe logs** for test subscriptions

### Live Mode Sanity Check:
1. **Toggle to Live Mode**
2. **Run a real $5 test payment** from your own card
3. **Verify receipt email** and webhook firing
4. **Refund yourself** if desired

---

## 📋 STEP 6: DOCUMENT & NOTIFY

### Update Documentation:
- ✅ Record final price matrix in `COMPLETE_IMPLEMENTATION_GUIDE.md`
- ✅ Note any annual discount percentages
- ✅ Save all new Payment Link URLs

### Send Gilberto Message:

**Subject:** Renew your website + choose optional care plan

Hola Gilberto,

Your hernandezlandscapeservices.com domain renews in less than two weeks. I've already prepared the checkout options so you can renew in seconds—no invoices or paperwork.

Choose the option that fits best:

**Keep Lights On** (domain + SSL + emergency fixes)
• Best value: $20/month
• Easy cadence: $10 every 2 weeks or $5/week
• 1-year prepay: $200 (save 17%)

**Basic Care** (adds quarterly refreshes + gallery updates)
• $75/month or $800/year (save 11%)
• Bi-weekly and weekly options available

**Full Care** (unlimited edits + quarterly strategy)
• $175/month or $1,800/year (save 14%)
• Includes analytics and growth check-ins

Here's the link to pick your plan and billing frequency:
https://hernandezlandscapeservices.com/pricing.html

If you prefer we jump on a short call to review, let me know. Once payment goes through I'll renew the domain immediately and lock in your plan.

Gracias,
[Your Name]

---

## ⏰ TIME ESTIMATE

| Step | Time | Status |
|------|------|--------|
| Archive old prices | 5 minutes | ⬜ |
| Create 12 payment links | 15 minutes | ⬜ |
| Update HTML buttons | 10 minutes | ⬜ |
| Retire old links | 5 minutes | ⬜ |
| QA testing | 10 minutes | ⬜ |
| Documentation & notify | 5 minutes | ⬜ |
| **TOTAL** | **50 minutes** | |

---

## ✅ SUCCESS CHECKLIST

- [ ] All 7 old prices archived ($45, $22.50, $11.25, $150, $75, $37.50, $300)
- [ ] 12 new payment links created with proper labeling
- [ ] Success/cancel URLs configured correctly
- [ ] Pricing page updated with real Stripe URLs
- [ ] Old payment links archived/disabled
- [ ] Test mode payments successful
- [ ] Live mode sanity check passed
- [ ] Gilberto notification sent
- [ ] Documentation updated

---

## 🆘 OPTIONAL HELP AVAILABLE

If you need any of these, just ask:
- **Stripe CLI commands** for mass archiving/fetching price IDs
- **HTML/CSS tweaks** for additional styling
- **WhatsApp/email translations** or template modifications
- **Success/cancel page enhancements**
- **Automated testing scripts**

---

**🎯 Result: Professional, transparent, fair-priced payment system ready for immediate customer use!**
