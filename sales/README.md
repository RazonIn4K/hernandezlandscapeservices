# Sales Materials for Web Maintenance Plans

This directory contains all materials needed to sell and deliver web maintenance plans to small business customers like Gilberto Hernandez.

## 📁 Directory Contents

### Strategy & Planning Documents

- **MASTER-PLAYBOOK.md** - Comprehensive sales playbook (read this first!)
- **quick-reference-cheatsheet.md** - One-page cheat sheet for quick reference

### Communication Templates

- **whatsapp-templates.md** - All WhatsApp templates (#1-11) for the messaging sequence
- **objection-flashcards.md** - 8 ready-to-use objection handling responses

### Technical Setup

- **stripe-links-master.md** - Stripe payment link setup guide and link storage
- **post-sale-checklist.md** - 2-hour technical onboarding checklist

### Tracking & Optimization

- **tracking-system.md** - Spreadsheet template and metrics tracking system

### Screenshots (Generated)

- **screenshots/** - Homepage screenshots in English and Spanish for WhatsApp sharing

---

## 🚀 Quick Start Guide

### First Time Setup (1-2 hours)

1. **Read MASTER-PLAYBOOK.md** (30-45 min)
   - Comprehensive overview of entire sales process
   - Understand messaging sequence and timing
   - Learn objection handling strategies

2. **Set up Stripe** (30 min)
   - Follow stripe-links-master.md
   - Create 3 payment links (Esencial, Estándar, Premium)
   - Test in TEST mode, then activate LIVE mode
   - Copy links to stripe-links-master.md

3. **Prepare marketing materials** (15 min)
   - Export PDFs from Canva (strategy guide + plan comparison)
   - Save to phone for easy WhatsApp sending
   - Generate screenshots (see below)

4. **Set up tracking** (15 min)
   - Copy tracking-system.md spreadsheet template to Google Sheets
   - Set calendar reminders (Day 3, 4, 5, 7, Week 2-3, Week 23, Day 30)

5. **Mobile setup** (10 min)
   - Copy whatsapp-templates.md to Notes app
   - Screenshot objection-flashcards.md (save to Photos)
   - Save Stripe links to clipboard manager
   - Save customer contact: +1-815-501-1478

---

## 📸 Generating Screenshots

Screenshots are used in WhatsApp messages to show customers how their site looks.

### Prerequisites

```bash
# Ensure dependencies are installed
npm install

# Build CSS
npm run build-css
```

### Start Local Server

```bash
# Install serve if you don't have it
npm install -g serve

# Start server
serve -p 3000
```

### Generate Screenshots

```bash
# Run screenshot script
npx ts-node scripts/generate-screenshots.ts
```

This creates 12 screenshots in `sales/screenshots/`:
- Full page (EN/ES)
- Hero section (EN/ES)
- Gallery section (EN/ES)
- Pricing section (EN/ES)
- Contact section (EN/ES)
- Mobile views (EN/ES)

**Transfer to phone:** Save screenshots to Google Photos or Dropbox for mobile access.

---

## 📅 Messaging Timeline (Quick Reference)

| Day | Action | Template | Attachments |
|-----|--------|----------|-------------|
| **1-2** | Preparation | - | Set up everything |
| **3** | Initial outreach | #1 | Infographic + Selector |
| **4** | Follow-up (if silent) | #2 | Full PDF |
| **5** | Final nudge (if silent) | #3 | None |
| **6-7** | Objection handling | Flashcards | As needed |
| **After pay** | Confirmation | #10 | None |
| **Week 1** | Check-in | Custom | None |
| **Week 2-3** | Upsell (optional) | #11 | None |
| **Day 30** | Revival (if no response) | Custom | Mini-audit |

---

## 💰 Pricing Quick Reference

| Plan | Weekly | 24-Week Total | Monthly Equiv. |
|------|--------|---------------|----------------|
| **Esencial** | $16 | $384 | ~$69 |
| **Estándar** | $29 | $696 | ~$125 |
| **Premium** | $46 | $1,104 | ~$199 |

---

## 🎯 Target Metrics

| Metric | Target |
|--------|--------|
| Open Rate | >80% |
| Reply Rate | >50% |
| Link Click Rate | >60% |
| Conversion Rate | >30% |
| Time to First Reply | <6 hours |
| Time to Payment | <72 hours |

---

## 📱 Day-Of Checklist (Before Sending First Message)

**Print this and check off:**

- [ ] Stripe links created and tested
- [ ] PDFs saved to phone
- [ ] Screenshots saved to phone
- [ ] Templates copied to Notes app
- [ ] Objection cards screenshotted
- [ ] Tracking spreadsheet open
- [ ] Calendar reminders set
- [ ] Customer contact saved
- [ ] Local server running (if showing site live)
- [ ] 2-hour block reserved for onboarding (in case of fast conversion)

**When all checked → Send Template #1**

---

## 🔄 After First Conversion

1. ✅ Complete 2-hour onboarding (post-sale-checklist.md)
2. ✅ Send summary report to customer
3. ✅ Update tracking spreadsheet
4. ✅ Set Week 1 check-in reminder
5. ✅ Review what worked (update playbook)
6. ✅ Clone process for next prospect

---

## 📚 Recommended Reading Order

1. **MASTER-PLAYBOOK.md** - Start here (comprehensive guide)
2. **quick-reference-cheatsheet.md** - Print and keep on desk
3. **whatsapp-templates.md** - Save to phone
4. **objection-flashcards.md** - Screenshot for phone
5. **stripe-links-master.md** - Complete Stripe setup
6. **tracking-system.md** - Open spreadsheet
7. **post-sale-checklist.md** - Review once, reference later

**Total reading time:** 30-45 minutes
**Total setup time:** 1-2 hours

---

## 🆘 Need Help?

**Common Issues:**

- **Screenshots not generating?** Ensure local server is running on port 3000
- **Stripe links not working?** Verify you're in LIVE mode (not TEST)
- **Templates too long for WhatsApp?** Split into 2 messages at natural break
- **Customer not responding?** Follow the "No Response Protocol" in MASTER-PLAYBOOK.md

**Troubleshooting:** See relevant section in MASTER-PLAYBOOK.md

---

## 📊 File Structure

```
sales/
├── README.md (this file)
├── MASTER-PLAYBOOK.md (comprehensive guide)
├── whatsapp-templates.md (messaging templates)
├── objection-flashcards.md (objection responses)
├── stripe-links-master.md (payment links)
├── tracking-system.md (metrics & spreadsheet)
├── post-sale-checklist.md (onboarding guide)
├── quick-reference-cheatsheet.md (one-page cheat sheet)
└── screenshots/ (generated screenshots)
    ├── homepage-en-full.png
    ├── homepage-es-full.png
    ├── hero-section-en.png
    ├── hero-section-es.png
    ├── gallery-section-en.png
    ├── gallery-section-es.png
    ├── pricing-section-en.png
    ├── pricing-section-es.png
    ├── contact-section-en.png
    ├── contact-section-es.png
    ├── homepage-en-mobile.png
    └── homepage-es-mobile.png
```

---

## 🚀 Ready to Launch?

**Your sales system is complete. Here's what you have:**

✅ Comprehensive playbook with messaging sequences
✅ 11 WhatsApp templates ready to send
✅ 8 objection handling flashcards
✅ Stripe payment links (create if not done)
✅ Tracking system for optimization
✅ 2-hour onboarding checklist
✅ Screenshot generation script
✅ Quick reference cheat sheet

**Next step:** Message Gilberto on Day 3 using Template #1.

**Good luck! 🎉**

---

**Last Updated:** 2025-11-02
**Next Review:** After first 3 conversions