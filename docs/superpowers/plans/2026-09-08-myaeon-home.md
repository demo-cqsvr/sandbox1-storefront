# myAEON2go Home Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement the independent tasks with review.

**Goal:** Reproduce the reference myAEON2go storefront homepage and shared brand header.
**Architecture:** Root-only EDS block composition, curated reference content module and local optimized assets. Preserve Commerce drop-ins and existing routes.
**Tech Stack:** Native JavaScript, CSS, EDS blocks, existing Drop-ins, Playwright browser validation.
**Spec:** docs/superpowers/specs/2026-09-08-myaeon-home.md

## Global Constraints
- Do not edit scripts/aem.js or existing Commerce behavior.
- Use actual reference assets; preserve intrinsic image proportions.
- Scope CSS; support keyboard, touch, reduced motion and 390px layout.
- Source prices remain reference merchandising snapshots; no fabricated prices or nonfunctional purchase controls.

## Tasks
- [x] Root: capture reference hero/product/category/promotion data and download optimized assets into images/myaeon; export homeContent from scripts/myaeon-content.js. Record source URLs.
- [x] Header worker: update blocks/header/header.js and header.css (and README) for exact local logo, announcement, persistent search and category row, while retaining existing search results, account/wishlist/cart. Consume homeContent.brand, announcement and navigation. Verify desktop/mobile header.
- [x] Homepage worker: implement blocks/myaeon-home/myaeon-home.js, CSS and README. Consume homeContent.promotions/products/categories/offers; export standard decorate(block). Render accessible hero, scrolling featured cards, category grid and offers. Verify controls.
- [x] Root: inject root-only block before decorateMain in scripts/scripts.js, add home stylesheet sizing/theme only under body.myaeon-homepage, retain existing non-home flows. Set home page title/description.
- [x] Root: run browser regression first against current main (expected absence), then code-intercept preview with all changes. Check screenshots and interaction assertions on desktop/mobile. Run lint and independent review; resolve findings.
- [ ] Root: commit, publish feature branch/PR, inspect CI and branch preview, merge and verify main. Report source catalog fallback limitations if still present.
