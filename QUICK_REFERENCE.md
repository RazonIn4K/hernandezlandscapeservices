# Stripe Quick Reference - Pricing Fix

## 🎯 GOAL
Replace overpriced links ($45/$150/$300) with fair pricing ($20/$75/$175)

## 📊 NEW PRICES TO CREATE
Keep-Lights-On: $20/mo | $10 bi-weekly | $5/week
Basic Care: $75/mo | $37.50 bi-weekly | $18.75/week  
Full Care: $175/mo | $87.50 bi-weekly | $43.75/week

## 🔗 STRIPE URLS
Dashboard: https://dashboard.stripe.com/acct_1RTxsnP5UmVB5UbV/payment-links
Products: https://dashboard.stripe.com/products

## ⚙️ PAYMENT LINK SETTINGS
Success URL: https://hernandezlandscapeservices.com/pay/success.html
Cancel URL: https://hernandezlandscapeservices.com/pay/cancel.html
Email collection: ON
Recurring billing: ON

## 📋 COPY-PASTE TEMPLATE
After creating each link, copy URL here:

[ ] Keep-Lights-On Monthly ($20): https://buy.stripe.com/...
[ ] Keep-Lights-On Bi-weekly ($10): https://buy.stripe.com/...
[ ] Keep-Lights-On Weekly ($5): https://buy.stripe.com/...
[ ] Basic Care Monthly ($75): https://buy.stripe.com/...
[ ] Basic Care Bi-weekly ($37.50): https://buy.stripe.com/...
[ ] Basic Care Weekly ($18.75): https://buy.stripe.com/...
[ ] Full Care Monthly ($175): https://buy.stripe.com/...
[ ] Full Care Bi-weekly ($87.50): https://buy.stripe.com/...
[ ] Full Care Weekly ($43.75): https://buy.stripe.com/...

## 🗂️ FILES READY
- pricing-new.html (placeholders for your URLs)
- pay/success.html (payment confirmation page)
- pay/cancel.html (cancelled payment page)

## ⚠️ OLD LINKS TO ARCHIVE AFTER
- Any link with $45, $150, or $300 pricing
- All bi-weekly/weekly variants of old pricing

## ✅ WHEN DONE
1. Paste URLs into pricing-new.html
2. Replace old pricing.html
3. Deploy success/cancel pages
4. Archive old Stripe links
5. Test one payment link

**Need help? Paste your URLs and I'll update the HTML instantly!**
