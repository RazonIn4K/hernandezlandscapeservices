# Apple Maps Listing Runbook

Last updated: 2026-07-07

## Diagnosis

Public search did not surface a stable `maps.apple.com` place card for:

`Hernandez Landscape & Tree Service LLC, 1029 Lewis St, DeKalb, IL 60115`

The website also had address schema coordinates set to a generic DeKalb city point:

`41.9294, -88.7504`

That has been corrected to the address-level geocode returned by the U.S. Census geocoder:

`41.935162495016, -88.740720124283`

This is now enforced by `npm run nap:check`.

## What The Website Can Fix

- Keep the same NAP everywhere:
  - Name: `Hernandez Landscape & Tree Service LLC`
  - Address: `1029 Lewis St, DeKalb, IL 60115`
  - Phone: `(815) 501-1478`
  - Email: `hernandezlandscapetreeservices@gmail.com`
  - Website: `https://hernandezlandscapeservices.com/`
  - Hours: Monday-Friday 7:00 AM-6:00 PM, Saturday 8:00 AM-4:00 PM
- Keep `index.html` embedded JSON-LD and `schema.jsonld` in sync.
- Do not add an Apple Maps `sameAs` URL until Apple publishes a real place card URL for this business.

## Owner-Side Apple Business Steps

Apple Maps listings are controlled through Apple Business. This cannot be fully completed from code because Apple requires owner login and business verification.

1. Go to `https://businessconnect.apple.com/`.
2. Sign in with the owner's Apple Account.
3. Go to `Brands > Locations`.
4. Search for `Hernandez Landscape & Tree Service LLC`.
5. If Apple finds an existing listing, add or claim that location.
6. If Apple does not find it, choose `Add a new location with this name`.
7. Enter the NAP exactly as listed above.
8. Set the map marker to:
   - Latitude: `41.935162495016`
   - Longitude: `-88.740720124283`
9. Choose the closest available category, starting with `Landscaper` or `Landscape Services`; add tree-service related secondary categories if Apple offers them.
10. Add the website, phone, hours, and business description.
11. Upload brand/location assets:
    - Logo: `hernandez_images/web_Logo_New_256.png`
    - Cover/equipment: `hernandez_images/google-profile-2026-branded-truck-trailers.jpg`
    - Tree service: `hernandez_images/google-profile-2026-tree-removal-cut-logs.jpg`
    - Completed work: `hernandez_images/google-photos-2026-backyard-lawn-finish.webp`
12. Complete Apple's verification flow. If Apple says the location is already managed, request transfer and attach proof such as business license, utility bill, or ownership documentation.

## After Apple Publishes

1. Search Apple Maps for the exact business name.
2. Copy the live Apple Maps place URL.
3. Add that URL to `sameAs` in:
   - `index.html`
   - `schema.jsonld`
4. Run:

```bash
npm run seo:check
npm run nap:check
npm run publish:prepare
npm run publish:check-layout
```

5. Commit and deploy.
