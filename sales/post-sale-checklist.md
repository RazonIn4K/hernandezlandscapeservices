# 2-Hour Post-Sale Technical Onboarding Checklist

## TRIGGER: Stripe Payment Notification Received

**Timeline:** Complete within 2 hours of payment confirmation.

**Goal:** Deliver immediate value, impress customer, set up infrastructure for ongoing service.

---

## PHASE 1: IMMEDIATE CONFIRMATION (0-5 minutes)

### Task 1.1: Send WhatsApp Template #10
```
⏱ Time: 2 minutes
✅ Copy Template #10 from whatsapp-templates.md
✅ Replace [PLAN NAME] with actual plan (Esencial/Estándar/Premium)
✅ Send to customer's WhatsApp
✅ Log in tracking spreadsheet: "Payment confirmed, onboarding started"
```

### Task 1.2: Update Internal Systems
```
⏱ Time: 3 minutes
✅ Mark customer as ACTIVE in tracking spreadsheet
✅ Log payment details (plan, amount, date, Stripe subscription ID)
✅ Set calendar reminder for:
   - Day 7: Check-in message
   - Week 2-3: Premium upsell offer (Template #11)
   - Week 23: Renewal reminder (approaching end of 24-week commitment)
```

---

## PHASE 2: TECHNICAL SETUP (5-60 minutes)

### Task 2.1: Verify DNS & SSL Configuration
```
⏱ Time: 10 minutes

Current status (from codebase exploration):
✅ Domain: hernandezlandscapeservices.com (or similar - verify actual)
✅ SSL: Already configured (check cert expiration)

Actions:
1. Run DNS check:
   $ dig hernandezlandscapeservices.com +short

2. Verify SSL certificate:
   $ curl -vI https://hernandezlandscapeservices.com 2>&1 | grep "expire"

   OR use online tool: https://www.ssllabs.com/ssltest/

3. Check SSL expiration date:
   - If <30 days: Set up auto-renewal reminder
   - If Let's Encrypt: Verify certbot cron job is active

4. Update DNS if needed (customer may have changed hosting):
   - A record points to correct IP
   - WWW CNAME points to root domain
   - MX records for email (if applicable)

✅ Document current DNS settings in customer file
```

### Task 2.2: Configure Uptime Monitoring
```
⏱ Time: 15 minutes

Options (choose one based on plan tier):

OPTION A: UptimeRobot (Free - Esencial plan)
1. Sign up: https://uptimerobot.com/
2. Add monitor:
   - Type: HTTPS
   - URL: https://hernandezlandscapeservices.com
   - Interval: 5 minutes
3. Alert contacts:
   - Your email: [your-email]@gmail.com
   - Customer email: hernandezlandscapetreeservices@gmail.com (if Premium)
4. Test: Trigger test alert to verify notifications work

OPTION B: Better Uptime (Paid - Estándar/Premium)
1. More detailed reports, status page
2. Set up similar to above

✅ Send customer screenshot of monitoring dashboard
✅ Save login credentials in password manager
```

### Task 2.3: Set Up Automated Backups
```
⏱ Time: 20 minutes

Current state: Static HTML site (no database)

Backup Strategy:
1. Git repository backup (daily):
   $ cd /path/to/hernandezlandscapeservices
   $ git remote add backup [backup-repo-url]
   $ git push backup main

   Set up cron job:
   0 2 * * * cd /path/to/hernandezlandscapeservices && git push backup main

2. Full file system backup:
   - Option A: GitHub automated backups (if using GitHub Pages)
   - Option B: rsync to cloud storage (Dropbox, Google Drive, S3)

   Example rsync:
   $ rsync -avz --delete /path/to/hernandezlandscapeservices/ ~/Dropbox/Backups/hernandez-site/

3. Image backup (hernandez_images folder):
   $ tar -czf hernandez-images-$(date +%F).tar.gz hernandez_images/
   $ cp hernandez-images-*.tar.gz ~/Backups/

4. Document backup locations in customer file

✅ Verify first backup completed successfully
✅ Set calendar reminder: Monthly backup verification
```

### Task 2.4: Optimize Service Worker Cache
```
⏱ Time: 10 minutes

Current state: Basic service worker likely not configured for caching

Quick Wins:
1. Check if service-worker.js exists:
   $ ls hernandezlandscapeservices/service-worker.js

2. If not, create basic service worker for static assets:
   - Cache CSS, JS, images for offline access
   - Reduce load time on repeat visits

3. If exists, verify caching strategy:
   - Static assets: Cache first
   - HTML: Network first with cache fallback
   - Images: Cache with expiration (7 days)

4. Test caching:
   - Open site in browser
   - Chrome DevTools → Application → Service Workers
   - Verify "activated and running"
   - Check Cache Storage → Verify assets cached

✅ Take before/after PageSpeed Insights screenshot
```

### Task 2.5: Test Contact Form Functionality
```
⏱ Time: 5 minutes

Current setup: Web3Forms (access key: 61e8b0ea-97d8-434c-8c2d-e54a44a63743)

Test:
1. Navigate to: https://hernandezlandscapeservices.com/#contact
2. Fill out form with test data:
   - Name: "Test Submission - Onboarding"
   - Phone: Your phone number
   - Email: Your email
   - Service: Lawn Care
   - Message: "Testing form post-onboarding"
3. Submit and verify:
   ✅ Success message appears
   ✅ Email received at hernandezlandscapetreeservices@gmail.com
   ✅ Auto-reply email received (if configured)

4. If PREMIUM plan: Set up form submission notifications to your phone (Zapier)

✅ Confirm form is working correctly
```

---

## PHASE 3: CONTENT & OPTIMIZATION (60-90 minutes)

### Task 3.1: Review & Update Contact Information
```
⏱ Time: 10 minutes

Verify all contact info is current:
1. Open index.html (line 1058-1098: contact form section)
2. Check:
   ✅ Phone: +1-815-501-1478
   ✅ Email: hernandezlandscapetreeservices@gmail.com
   ✅ Address: 1029 Lewis St, DeKalb, IL 60115
   ✅ Business hours (if displayed)

3. Update JSON-LD schema (for SEO):
   - Verify telephone, email, address in structured data
   - Check opening hours specification

4. If customer wants changes:
   - Update immediately (Esencial = 1 change/week budget)
   - Document change in changelog

✅ Screenshot current contact section for records
```

### Task 3.2: Page Speed Audit & Quick Fixes
```
⏱ Time: 20 minutes

1. Run PageSpeed Insights:
   https://pagespeed.web.dev/

2. Check scores:
   - Desktop: Target >90
   - Mobile: Target >80

3. Quick wins if scores are low:
   ✅ Compress images (hernandez_images/*.jpeg):
      $ cd hernandez_images
      $ mogrify -quality 85 -resize 1920x1080\> *.jpeg

   ✅ Minify CSS (already done with Tailwind, verify):
      $ npm run build-css

   ✅ Enable gzip compression (server-side):
      - Add .htaccess rule OR
      - Configure in hosting panel

   ✅ Lazy load images (already implemented in static-gallery.js, verify working)

4. Take before/after screenshots

✅ Document improvements in summary report
```

### Task 3.3: SEO Quick Check
```
⏱ Time: 15 minutes

1. Verify meta tags in index.html:
   ✅ <title> tag (unique, descriptive)
   ✅ <meta name="description"> (150-160 chars)
   ✅ <meta name="keywords"> (if present, optional)
   ✅ Open Graph tags (og:title, og:description, og:image)
   ✅ Canonical URL

2. Check mobile-friendliness:
   https://search.google.com/test/mobile-friendly

3. Verify robots.txt and sitemap.xml:
   $ curl https://hernandezlandscapeservices.com/robots.txt
   $ curl https://hernandezlandscapeservices.com/sitemap.xml

   If missing:
   - Create basic robots.txt
   - Generate simple sitemap.xml

4. Submit to Google Search Console (if not already):
   - Add property
   - Verify ownership (HTML tag method)
   - Submit sitemap

✅ Document SEO baseline for future comparison
```

### Task 3.4: Accessibility Quick Wins
```
⏱ Time: 10 minutes

1. Run Lighthouse audit (Chrome DevTools):
   - Accessibility score: Target >90

2. Quick fixes:
   ✅ Check all images have alt tags
   ✅ Verify form labels are associated with inputs
   ✅ Test keyboard navigation (Tab through entire page)
   ✅ Check color contrast (text readable on backgrounds)

3. Test with screen reader (VoiceOver on Mac):
   $ Press Cmd + F5 to enable VoiceOver
   Navigate site, ensure logical reading order

✅ Fix critical issues only (defer minor issues to regular maintenance)
```

### Task 3.5: Security Hardening
```
⏱ Time: 15 minutes

1. Verify HTTPS everywhere:
   $ grep -r "http://" index.html assets/
   - Replace any http:// links with https:// (except external CDNs that require http)

2. Check for exposed secrets:
   $ grep -r "API_KEY\|SECRET\|PASSWORD" . --exclude-dir=node_modules
   - Move any secrets to .env (already done, verify)
   - Ensure .env is in .gitignore

3. Review .env file:
   ✅ Firebase keys present
   ✅ No plaintext passwords
   ✅ File permissions: chmod 600 .env

4. Update dependencies (if any vulnerabilities):
   $ npm audit
   $ npm audit fix

5. Set up security headers (if Premium plan):
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Strict-Transport-Security: max-age=31536000

✅ Document security posture in customer file
```

---

## PHASE 4: DOCUMENTATION & HANDOFF (90-120 minutes)

### Task 4.1: Create Customer Dashboard (Premium Only)
```
⏱ Time: 30 minutes (Premium plan only, skip for Esencial/Estándar)

If customer is on Premium, set up:
1. Google Analytics dashboard (if not already configured)
2. Monthly traffic report template
3. Shared Google Doc with:
   - Login credentials (hosting, domain, email)
   - Service history log
   - Change request form
   - FAQ section

✅ Share dashboard link via WhatsApp
```

### Task 4.2: Compile Onboarding Summary Report
```
⏱ Time: 20 minutes

Create simple summary document (email or WhatsApp message):

---
Subject: ✅ Tu sitio web está 100% activo y protegido

Hola Gilberto,

Tu plan [ESENCIAL/ESTÁNDAR/PREMIUM] ya está completamente configurado. Aquí está el resumen:

🔒 SEGURIDAD:
✅ SSL activo (certificado válido hasta [DATE])
✅ Backups automáticos configurados (diario)
✅ Monitoreo 24/7 activo (te aviso si algo falla)

⚡ RENDIMIENTO:
✅ Velocidad optimizada (PageSpeed Score: [XX]/100 móvil, [XX]/100 escritorio)
✅ Caché configurado para carga instantánea
✅ Imágenes optimizadas

📊 FUNCIONALIDAD:
✅ Formulario de contacto probado y funcionando
✅ Todas las páginas funcionando correctamente
✅ Compatible con móviles y tablets

📈 PRÓXIMOS PASOS:
• Cada [semana/mes]: Recibirás reporte de actividad
• Cambios incluidos: [1/3/ilimitados] por semana
• Para solicitar cambio: Solo mándame WhatsApp

¿Algún retoque rápido que quieras hacer de inmediato?

Saludos,
[Tu nombre]
---

✅ Send via WhatsApp
✅ CC yourself to keep record
```

### Task 4.3: Set Up Change Request System
```
⏱ Time: 10 minutes

Create simple change request process:

1. For Esencial/Estándar (limited changes/week):
   - Google Form or Notion form
   - Fields: Name, Date, Priority, Description, Screenshot (optional)
   - Auto-emails you when submitted

2. For Premium (unlimited changes):
   - Dedicated WhatsApp or Slack channel
   - Trello board for task tracking

3. Document process in customer file:
   "How to request changes: Send WhatsApp to [YOUR NUMBER] with description and screenshot"

✅ Test submission process
✅ Share link/instructions with customer
```

---

## PHASE 5: QUALITY ASSURANCE (Final 10 minutes)

### Task 5.1: Full Site Smoke Test
```
⏱ Time: 10 minutes

Test every major page/feature:
1. Homepage: ✅ Loads, hero image visible, text readable
2. Gallery: ✅ Static images load, carousel works
3. Pricing: ✅ 3 plan cards display correctly ($16, $29, $46)
4. Contact form: ✅ Already tested in Task 2.5
5. Language toggle: ✅ EN/ES switch works
6. Mobile view: ✅ Responsive on 375px width

Use Playwright tests (already exist):
$ npm run test

Expected: All 8 tests pass
If any fail: Fix immediately before closing onboarding

✅ All tests passing
✅ No console errors in browser DevTools
```

---

## FINAL CHECKLIST (Sign Off)

```
⏱ Total time: 2 hours (max)

✅ Phase 1: Confirmation sent (5 min)
✅ Phase 2: Technical setup complete (55 min)
   ✅ DNS/SSL verified
   ✅ Uptime monitoring active
   ✅ Backups configured
   ✅ Cache optimized
   ✅ Contact form tested
✅ Phase 3: Optimization done (30 min)
   ✅ Contact info verified
   ✅ Page speed improved
   ✅ SEO baseline documented
   ✅ Accessibility checked
   ✅ Security hardened
✅ Phase 4: Documentation sent (20 min)
   ✅ Summary report delivered
   ✅ Change request system set up
✅ Phase 5: QA passed (10 min)
   ✅ All tests passing
   ✅ Site fully functional

TOTAL TIME: _____ hours _____ minutes

CUSTOMER STATUS: 🟢 ACTIVE & SATISFIED
```

---

## POST-ONBOARDING ACTIONS

### Immediate (Today):
```
✅ Update tracking spreadsheet: "Onboarding complete"
✅ Set calendar reminders:
   - Day 7: "How's everything going?" check-in
   - Week 2-3: Premium upsell (Template #11)
   - Week 23: Renewal reminder
✅ Invoice customer (Stripe handles this automatically)
✅ Log all work done in customer file
```

### Week 1:
```
✅ Monitor uptime alerts (should be zero downtime)
✅ Respond to any change requests within SLA:
   - Esencial: 24-48h response
   - Estándar: 4-8h response
   - Premium: 1-2h response
✅ Send quick check-in message (Template below)
```

**Week 1 Check-In Template:**
```
Hola Gilberto,

¿Cómo ha ido la primera semana con el plan [PLAN]?

Todo se ve estable de mi lado:
✅ Uptime: 100% (sin caídas)
✅ Velocidad: Carga en [X] segundos
✅ Backups: 7 copias guardadas

¿Necesitas algún cambio o tienes alguna duda?

Saludos! 🤙
```

---

## TROUBLESHOOTING

### If something breaks during onboarding:

**Problem:** DNS changes not propagating
- **Fix:** Wait 24-48h, use `dig` to check propagation
- **Workaround:** Tell customer it can take up to 48h

**Problem:** SSL certificate expired or invalid
- **Fix:** Renew via Let's Encrypt or hosting provider
- **Time:** 15-30 minutes

**Problem:** Contact form not sending emails
- **Fix:** Check Web3Forms access key, verify email in Spam folder
- **Time:** 10 minutes

**Problem:** Site loading slowly (<50 PageSpeed score)
- **Fix:** Compress images, enable caching, minify CSS/JS
- **Time:** 30-60 minutes

**Problem:** Uptime monitor not working
- **Fix:** Re-add monitor with correct URL (https, not http)
- **Time:** 5 minutes

---

## NOTES TO SELF

- **First time?** This checklist will take 2.5-3 hours. That's OK.
- **Second time?** You'll get it down to 2 hours.
- **After 5 customers?** You'll finish in 90 minutes.

**Efficiency tips:**
- Create templates for common tasks (backup scripts, monitoring configs)
- Use Playwright tests to automate smoke testing
- Keep screenshots/recordings for future reference
- Document edge cases in this file as you encounter them

---

**Last Updated:** 2025-11-02
**Next Review:** After first 3 onboardings (optimize workflow)