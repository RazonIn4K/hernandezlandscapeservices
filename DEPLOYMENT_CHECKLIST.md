# 🚀 Deployment Checklist - New Pricing System

## ✅ Pre-Deployment Verification (COMPLETED)

- [x] All 12 payment links created in Stripe
- [x] All payment links tested and loading correctly
- [x] pricing-new.html updated with correct URLs
- [x] Keep-Lights-On Annual URL corrected
- [x] Success and cancel pages ready
- [x] Old payment links deactivated in Stripe

---

## 📦 Files Ready for Deployment

### Required Files
All files are located at: `/Users/davidortiz/Main-Learning-Vault/hernandezlandscapeservices/`

1. **pricing-new.html** → Deploy as `pricing.html`
   - Contains all 12 correct payment link URLs
   - Industry-aligned pricing ($20/$75/$175 monthly base)

2. **pay/success.html** → Deploy to `/pay/success.html`
   - Payment success confirmation page
   - Redirects configured in all Stripe payment links

3. **pay/cancel.html** → Deploy to `/pay/cancel.html`
   - Payment cancellation page
   - Provides support contact information

---

## 🔄 Deployment Steps

### Step 1: Backup Current Files

```bash
# Create backup of current pricing page
cp pricing.html pricing-old-backup-$(date +%Y%m%d).html

# Verify backup was created
ls -la pricing-old-backup-*.html
```

### Step 2: Deploy New Pricing Page

```bash
# Replace old pricing page with new one
cp pricing-new.html pricing.html

# Verify file was updated
cat pricing.html | grep "buy.stripe.com" | head -3
```

### Step 3: Deploy Success and Cancel Pages

```bash
# Ensure pay directory exists
mkdir -p pay

# Deploy success page
cp pay/success.html pay/success.html

# Deploy cancel page
cp pay/cancel.html pay/cancel.html

# Verify files exist
ls -la pay/
```

### Step 4: Deploy to Hosting

**Choose your deployment method:**

#### Option A: Firebase Hosting (if using Firebase)
```bash
npm run build
firebase deploy --only hosting
```

#### Option B: Static Hosting (FTP/SFTP)
Upload these files to your web server:
- `pricing.html`
- `pay/success.html`
- `pay/cancel.html`
- `styles.css` (if updated)

#### Option C: GitHub Pages (if using)
```bash
git add pricing.html pay/success.html pay/cancel.html
git commit -m "Update to industry-aligned pricing with Stripe payment links"
git push origin main
```

#### Option D: Netlify/Vercel
```bash
# Netlify
netlify deploy --prod --dir=.

# Vercel
vercel --prod
```

---

## 🧪 Post-Deployment Testing

### Test 1: Verify Pricing Page Loads
- [ ] Navigate to: `https://hernandezlandscapeservices.com/pricing.html`
- [ ] Confirm page loads without errors
- [ ] Verify all 3 plan cards display correctly

### Test 2: Test Payment Links

**Keep-Lights-On Plan:**
- [ ] Click Monthly ($20) button → Verify Stripe checkout shows $20.00/month
- [ ] Click Bi-weekly ($10) button → Verify $10.00 every 2 weeks
- [ ] Click Weekly ($5) button → Verify $5.00/week
- [ ] Click Annual ($200) button → Verify $200.00/year

**Basic Care Plan:**
- [ ] Click Monthly ($75) button → Verify $75.00/month
- [ ] Click Bi-weekly ($37.50) button → Verify $37.50 every 2 weeks
- [ ] Click Weekly ($18.75) button → Verify $18.75/week
- [ ] Click Annual ($800) button → Verify $800.00/year

**Full Care Plan:**
- [ ] Click Monthly ($175) button → Verify $175.00/month
- [ ] Click Bi-weekly ($87.50) button → Verify $87.50 every 2 weeks
- [ ] Click Weekly ($43.75) button → Verify $43.75/week
- [ ] Click Annual ($1,800) button → Verify $1,800.00/year

### Test 3: Test Success Flow
- [ ] Use Stripe test card: `4242 4242 4242 4242`
- [ ] Complete a test payment
- [ ] Verify redirect to: `https://hernandezlandscapeservices.com/pay/success.html`
- [ ] Confirm success page displays correctly

### Test 4: Test Cancel Flow
- [ ] Start a payment
- [ ] Click browser back or cancel
- [ ] Verify redirect to: `https://hernandezlandscapeservices.com/pay/cancel.html`
- [ ] Confirm cancel page displays correctly

---

## 🔍 Verification Checklist

### Stripe Dashboard Verification
- [ ] Login to Stripe Dashboard
- [ ] Navigate to Payment Links
- [ ] Confirm all 12 new links show "Active" status
- [ ] Confirm old expensive links show "Deactivated" status

### Website Verification
- [ ] Pricing page displays all 3 plans correctly
- [ ] All pricing amounts match the new structure
- [ ] All buttons link to correct Stripe checkout pages
- [ ] Mobile responsive design works
- [ ] No broken links or console errors

### SEO & Analytics (Optional)
- [ ] Update sitemap if needed
- [ ] Add pricing.html to robots.txt (if not already)
- [ ] Set up conversion tracking for payment completions
- [ ] Monitor analytics for pricing page visits

---

## 📊 Pricing Summary

### New Pricing (Industry-Aligned)
- **Keep-Lights-On:** $20/mo, $200/yr (17% savings annually)
- **Basic Care:** $75/mo, $800/yr (11% savings annually)
- **Full Care:** $175/mo, $1,800/yr (14% savings annually)

### Old Pricing (Deactivated)
- ~~Keep-Lights-On: $45/month~~
- ~~Basic Care: $150/month~~
- ~~Full Care: $300/month~~

**Savings for customers:**
- Keep-Lights-On: **56% reduction** ($45 → $20)
- Basic Care: **50% reduction** ($150 → $75)
- Full Care: **42% reduction** ($300 → $175)

---

## ⚠️ Important Notes

1. **Do NOT delete old payment links** from Stripe
   - Keep them deactivated for record-keeping
   - Existing subscriptions on old pricing will continue

2. **Monitor first week carefully**
   - Check for any customer confusion
   - Watch for payment completion rate
   - Monitor support inquiries

3. **Customer Communication**
   - Consider sending email to existing customers about new pricing options
   - Update any marketing materials with new pricing
   - Update invoices/proposals with new pricing structure

4. **Backup Strategy**
   - Keep `pricing-old-backup-*.html` file
   - Document old pricing in case of questions
   - Keep FINAL_PAYMENT_LINKS.md for reference

---

## 🎯 Success Criteria

Deployment is successful when:
- ✅ All 12 payment links load correctly
- ✅ Test payment completes successfully
- ✅ Success and cancel pages load properly
- ✅ No console errors on pricing page
- ✅ Mobile experience is smooth
- ✅ Old links are deactivated

---

## 📞 Support Contacts

**If issues arise:**
- Stripe Support: https://support.stripe.com/
- Hosting Support: Check your hosting provider's docs
- Revert Command: `cp pricing-old-backup-*.html pricing.html`

---

## 📋 Reference Documents

- **FINAL_PAYMENT_LINKS.md** - All verified payment link URLs
- **COMPLETE_IMPLEMENTATION_GUIDE.md** - Full implementation details
- **QUICK_REFERENCE.md** - Quick pricing reference

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Verification Completed:** _______________
**Go-Live Confirmed:** _______________

---

🎉 **Ready to deploy!** All systems verified and tested.
