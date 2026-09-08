# EDS catalog pages

Use the writing-plans and subagent-driven-development workflows. User requests all products and categories on EDS, without navigating to the source storefront.

## Design

Use existing published HTTP 200 content templates: `/products/default?sku=<exact SKU>` and `/search?category=<category path>`. Query routes avoid requiring a separately published content document for each product. Existing authored product URLs remain valid. Product data comes from Catalog Service; category paths come from the current Commerce category tree.

## Tasks

1. Add `scripts/catalog-routes.js` with the complete category tree and case-preserving internal URL helpers. Update commerce product routing and homepage links. Verify special characters in SKU encode safely.
2. Clean the shared product template and select its explicit SKU before loading PDP. Handle missing products and update metadata. Verify legacy featured and imported product images/titles.
3. Extend the existing product-list-page block with category heading, breadcrumbs, children, Catalog visibility, and unknown-category handling. Keep category identity during pagination, sorting, filtering.
4. Run lint and browser checks for homepage navigation, every category, representative products, search and pagination. Query every catalog SKU for product availability. Review changes, push feature, verify preview, merge and verify main.

## Acceptance

All catalog-generated product/category links stay on EDS. All current 155 products and 11 navigable categories (excluding the store root) can be opened through reusable pages with HTTP 200. Product images preserve aspect ratio. Empty categories and unknown identifiers display useful messages. No API credentials beyond the existing public storefront configuration are introduced.

## Verification results

- Catalog Service: all 155 distinct SKUs resolve with images; all 11 navigable categories return expected totals (5 fresh products and 150 imported products).
- Browser: all categories and All products, seven representative PDPs (all five legacy featured products and imported SKUs), unknown SKU/category, same-origin navigation passed.
- Desktop 1440px and mobile 390px: pagination, sorting, reload state, PDP navigation and no horizontal overflow passed. Long imported attribute URLs now wrap.
- Routing/category tests: 5 passed. Repository JS/CSS lint passed.
- Independent review found legacy mini-cart PDP URLs; all three were changed to the shared helper.
