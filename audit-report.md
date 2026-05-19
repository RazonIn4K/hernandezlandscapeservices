# SEO Audit: Hernandez Landscape & Tree Service LLC
Audit date: 2026-05-18
Auditor: Manus AI
Deliverable type: audit_plus_artifacts
Run profile: home_service
Output audience: both

## Executive Summary
Hernandez Landscape & Tree Service LLC has a solid foundational website but is missing critical local SEO signals that prevent it from ranking for high-intent searches in DeKalb and surrounding areas. The primary issues are missing dedicated service pages for top revenue drivers, suboptimal schema markup, and some NAP (Name, Address, Phone) inconsistencies across the web.

## Top 5 Revenue-Impact Fixes
1. **Build Dedicated Service Pages**: Create dedicated, localized pages for Tree Removal, Lawn Care, and Snow Removal targeting DeKalb, IL to capture specific search intent.
2. **Upgrade Schema Markup**: Change the current `LocalBusiness` schema to `HomeAndConstructionBusiness`, add `BreadcrumbList`, and implement `FAQPage` schema to increase rich result eligibility.
3. **Fix Open Graph Type**: Change `og:type` from `website` to `business.business` on the homepage to improve social sharing signals.
4. **Update Sitemap & Robots**: Add the new service pages to `sitemap.xml` with appropriate priority and ensure `robots.txt` is correctly configured.
5. **Standardize NAP Across Directories**: Address minor NAP inconsistencies found on Yelp, BBB, and other aggregators to ensure Google trusts the business location and contact info.

## Critical Findings Before Implementation

### 1. Site Structure & Content Gaps
- **Missing Service Pages**: The site initially listed all services on the homepage. There were no dedicated pages for high-value services like tree removal or snow removal, which limited ranking potential for queries like "tree removal DeKalb IL".
- **Internal Linking**: Without dedicated service pages, internal linking was limited, weakening the site's overall SEO architecture.

### 2. Schema & Structured Data
- **Current State**: The homepage initially had basic `LocalBusiness` schema.
- **Deficiencies**: 
  - `@type` should be `HomeAndConstructionBusiness` for better specificity.
  - Missing `FAQPage` schema, which can help capture "People Also Ask" SERP features.
  - Missing `BreadcrumbList` schema to help search engines understand site hierarchy.
- **Open Graph**: `og:type` should use a local business-oriented value rather than generic `website`.

### 3. NAP & Local Identity
- **Google Business Profile (GBP)**: Verified and active. Address: 1029 Lewis St, DeKalb, IL 60115. Phone: (815) 501-1478.
- **Inconsistencies**: Searches revealed multiple "Hernandez Landscaping" businesses in IL (e.g., Rockford, Aurora, Chicago). It is crucial that the DeKalb GBP and citations exactly match the website's NAP to avoid confusion with these other entities.
- **Aggregators**: Listings on Yelp and BBB for the DeKalb area need to be claimed and standardized to match the exact GBP NAP.

### 4. Technical SEO
- **Sitemap**: The current `sitemap.xml` is basic and all `lastmod` dates are identical. It needs to be updated dynamically when new pages are added.
- **Robots.txt**: Currently allows all, which is fine, but should be verified after new pages are added.
- **Performance**: The site uses Tailwind CSS and is statically generated, which is excellent for performance. However, ensuring image optimization continues as the gallery grows is important.

## Implementation Status
The following artifacts have been generated to guide and verify the implementation of these fixes:
- `seo-fixes-checklist.md`: A prioritized checklist for the developer.
- `handoff.manifest.json`: A machine-readable manifest for automated implementation tools.
- `schema.jsonld` (Target): The upgraded schema block.
- `sitemap.xml`: The updated sitemap structure.

Completed in the 2026-05-18 implementation pass:

- Homepage schema upgraded to a `HomeAndConstructionBusiness` graph with `BreadcrumbList` and `FAQPage`.
- Service pages created for tree removal, lawn care, and snow removal.
- Homepage service cards linked to the new service pages.
- Sitemap updated with the new service pages.
- Service-page CTAs routed back to the quote form with service prefill parameters.
