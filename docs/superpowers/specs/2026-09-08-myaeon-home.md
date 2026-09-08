# myAEON2go storefront home

Reproduce the public sandbox1.cqsvr.com homepage in the EDS storefront: exact logo, announcement, persistent search, category navigation, three promotion banners, featured product carousel, eight category tiles, and two savings banners. Match the pink/white palette, rounded cards, typography, spacing, and responsive layout. Preserve existing search, account, wishlist and cart functionality.

Use downloaded, optimized copies of the publicly visible reference assets so homepage images do not depend on LAN permissions. Keep curated reference content in scripts/myaeon-content.js. Source product prices are a captured merchandising snapshot, not a new pricing authority; retain source product/category links when no equivalent EDS route is available. Search promotion links use the EDS /search?q= route. Do not invent APIs, prices, checkout actions or subscription behavior.

The existing authored root homepage is the boilerplate. Compose a myaeon-home block at root only, before normal decoration. Do not change PDP/search content or scripts/aem.js. Header branding is shared. Carousel controls support keyboard, touch, pause and reduced motion; offscreen promotion links are not focusable. Product strip has native horizontal scrolling and arrows.

Validate 1440px and 390px views, loaded images, hero arrows/dots/pause, product scrolling, search navigation, category links, and existing search/PDP smoke checks. Full lint, code review, preview checks and main verification are required. GitHub push/PR/main publication remains authorized by prior user messages.
