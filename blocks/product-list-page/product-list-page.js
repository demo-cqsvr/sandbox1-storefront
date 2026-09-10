// Product Discovery Dropins
import SearchResults from '@dropins/storefront-product-discovery/containers/SearchResults.js';
import Facets from '@dropins/storefront-product-discovery/containers/Facets.js';
import SortBy from '@dropins/storefront-product-discovery/containers/SortBy.js';
import Pagination from '@dropins/storefront-product-discovery/containers/Pagination.js';
import { render as provider } from '@dropins/storefront-product-discovery/render.js';
import { Button, Icon, provider as UI } from '@dropins/tools/components.js';
import { search } from '@dropins/storefront-product-discovery/api.js';
// Wishlist Dropin
import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';
// Cart Dropin
import * as cartApi from '@dropins/storefront-cart/api.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
// Event Bus
import { events } from '@dropins/tools/event-bus.js';
// AEM
import { readBlockConfig } from '../../scripts/aem.js';
import { fetchPlaceholders, getProductLink } from '../../scripts/commerce.js';
import { categories, getCategoryLink } from '../../scripts/catalog-routes.js';
import { getCategoryContext } from './category-context.js';
import { getSearchStateFromUrl, applySearchStateToUrl } from './search-url.js';
import { categoryFacetSlots } from './facet-labels.js';

// Initializers
import '../../scripts/initializers/search.js';
import '../../scripts/initializers/wishlist.js';

function updateCategoryMetadata(context) {
  const title = `${context.error ? 'Category not found' : context.title} | myAEON2go`;
  document.title = title;
  function setMeta(attribute, name, content) {
    let meta = document.head.querySelector(`meta[${attribute}="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      document.head.append(meta);
    }
    meta.content = content;
  }
  setMeta('property', 'og:title', title);
  if (context.error) {
    setMeta('name', 'robots', 'noindex');
    return;
  }
  const canonicalUrl = new URL(getCategoryLink(context.isAll ? 'all' : context.path), window.location);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.append(canonical);
  }
  canonical.href = canonicalUrl.href;
  setMeta('property', 'og:url', canonicalUrl.href);
}

function buildCategoryHeading(context) {
  const heading = document.createElement('div');
  heading.className = 'search__category-heading';
  const breadcrumbs = document.createElement('nav');
  breadcrumbs.className = 'search__category-breadcrumbs';
  breadcrumbs.setAttribute('aria-label', 'Breadcrumb');
  const list = document.createElement('ol');
  const crumbs = [{ name: 'Home', href: '/' }];
  if (!context.isAll) crumbs.push({ name: 'All products', href: getCategoryLink('all') });
  context.ancestors.forEach((category) => crumbs.push({
    name: category.name, href: getCategoryLink(category.path),
  }));
  crumbs.forEach(({ name, href }) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.textContent = name;
    link.href = href;
    item.append(link);
    list.append(item);
  });
  const current = document.createElement('li');
  current.textContent = context.title;
  current.setAttribute('aria-current', 'page');
  list.append(current);
  breadcrumbs.append(list);
  const title = document.createElement('h1');
  title.textContent = context.title;
  heading.append(breadcrumbs, title);
  if (context.children.length) {
    const children = document.createElement('nav');
    children.className = 'search__category-children';
    children.setAttribute('aria-label', 'Shop subcategories');
    context.children.forEach((category) => {
      const link = document.createElement('a');
      link.href = getCategoryLink(category.path);
      link.textContent = category.name;
      children.append(link);
    });
    heading.append(children);
  }
  return heading;
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const categoryContext = getCategoryContext(new URL(window.location.href), categories);
  if (categoryContext) updateCategoryMetadata(categoryContext);
  if (categoryContext?.error) {
    const title = document.createElement('h1');
    title.textContent = 'Category not found';
    const message = document.createElement('p');
    message.textContent = 'This category is not available. Browse all products to continue shopping.';
    const link = document.createElement('a');
    link.href = getCategoryLink('all');
    link.textContent = 'Browse all products';
    block.replaceChildren(title, message, link);
    return;
  }
  if (categoryContext) config.urlpath = categoryContext.path;
  const isCatalog = Boolean(categoryContext || config.urlpath);
  const labels = await fetchPlaceholders();
  const pageSize = parseInt(config.pagesize, 10) || 9;

  const fragment = document.createRange().createContextualFragment(`
    <div class="search__wrapper">
      <div class="search__result-info"></div>
      <div class="search__view-facets"></div>
      <div class="search__facets"></div>
      <div class="search__product-sort"></div>
      <div class="search__product-list"></div>
      <div class="search__pagination"></div>
    </div>
  `);

  const $resultInfo = fragment.querySelector('.search__result-info');
  const $viewFacets = fragment.querySelector('.search__view-facets');
  const $facets = fragment.querySelector('.search__facets');
  const $productSort = fragment.querySelector('.search__product-sort');
  const $productList = fragment.querySelector('.search__product-list');
  const $pagination = fragment.querySelector('.search__pagination');

  block.innerHTML = '';
  if (categoryContext) block.append(buildCategoryHeading(categoryContext));
  block.appendChild(fragment);

  // Add url path back to the block for enrichment, incase enrichment block is
  // executed after the plp block and block config is not available
  if (config.urlpath) {
    block.dataset.urlpath = config.urlpath;
  }

  const searchState = getSearchStateFromUrl(new URL(window.location.href));

  // Default visibility filter for all of our requests
  if (isCatalog) searchState.phrase = '';
  const visibilityFilter = {
    attribute: 'visibility',
    in: [isCatalog ? 'Catalog' : 'Search', 'Catalog, Search'],
  };
  const userFilters = searchState.filter.filter((f) => f.attribute !== 'visibility'
    && !(isCatalog && f.attribute === 'categoryPath'));

  // Normalize URL (e.g. pipe-separated filter values)
  const normalizedUrl = new URL(window.location.href);
  applySearchStateToUrl(normalizedUrl, searchState);
  window.history.replaceState({}, '', normalizedUrl.toString());

  // Request search based on the page type on block load
  if (config.urlpath) {
    // If it's a category page...
    await search({
      phrase: '', // search all products in the category
      currentPage: searchState.currentPage,
      pageSize,
      sort: searchState?.sort?.length ? searchState.sort : [{ attribute: 'position', direction: 'DESC' }],
      filter: [
        { attribute: 'categoryPath', eq: config.urlpath }, // Add category filter
        // Always add visibility filter to the request
        visibilityFilter,
        ...userFilters,
      ],
    }).catch(() => {
      console.error('Error searching for products');
    });
  } else {
    // Search page: dropin uses only the request (no URL parsing).
    await search({
      phrase: searchState.phrase,
      currentPage: searchState.currentPage,
      pageSize,
      sort: searchState.sort,
      // Always add visibility filter to the request
      filter: [visibilityFilter, ...userFilters],
    }).catch((e) => {
      console.error('Error searching for products', e);
    });
  }

  const requiresPdpConfiguration = (product) => product.typename === 'ComplexProductView'
    || product.attributes?.some((attr) => attr.name === 'ac_giftcard');

  const getAddToCartButton = (product) => {
    const productName = product.name || product.sku;
    const addToCartLabel = `${labels.Global?.AddProductToCart} ${productName}`;

    if (requiresPdpConfiguration(product)) {
      const button = document.createElement('div');
      UI.render(Button, {
        'aria-label': addToCartLabel,
        children: labels.Global?.AddProductToCart,
        icon: Icon({ source: 'Cart' }),
        href: getProductLink(product.urlKey, product.sku),
        variant: 'primary',
      })(button);
      return button;
    }
    const button = document.createElement('div');
    UI.render(Button, {
      'aria-label': addToCartLabel,
      children: labels.Global?.AddProductToCart,
      icon: Icon({ source: 'Cart' }),
      onClick: () => cartApi.addProductsToCart([{ sku: product.sku, quantity: 1 }]),
      variant: 'primary',
      disabled: !product.inStock,
    })(button);
    return button;
  };

  await Promise.all([
    // Sort By
    provider.render(SortBy, {})($productSort),

    // Pagination
    provider.render(Pagination, {
      onPageChange: () => {
        // scroll to the top of the page
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    })($pagination),

    // View Facets Button
    UI.render(Button, {
      children: labels.Global?.Filters,
      icon: Icon({ source: 'Burger' }),
      variant: 'secondary',
      onClick: () => {
        $facets.classList.toggle('search__facets--visible');
      },
    })($viewFacets),

    // Facets
    provider.render(Facets, { slots: categoryFacetSlots })($facets),
    // Product List
    provider.render(SearchResults, {
      routeProduct: (product) => getProductLink(product.urlKey, product.sku),
      slots: {
        ProductImage: (ctx) => {
          const { product, defaultImageProps } = ctx;
          const anchorWrapper = document.createElement('a');
          anchorWrapper.href = getProductLink(product.urlKey, product.sku);
          anchorWrapper.setAttribute('aria-label', product.name || product.sku);

          tryRenderAemAssetsImage(ctx, {
            alias: product.sku,
            imageProps: defaultImageProps,
            wrapper: anchorWrapper,
            params: {
              width: defaultImageProps.width,
              height: defaultImageProps.height,
            },
          });
        },
        ProductActions: (ctx) => {
          const actionsWrapper = document.createElement('div');
          actionsWrapper.className = 'product-discovery-product-actions';
          // Add to Cart Button
          const addToCartBtn = getAddToCartButton(ctx.product);
          addToCartBtn.className = 'product-discovery-product-actions__add-to-cart';
          // Wishlist Button
          const $wishlistToggle = document.createElement('div');
          $wishlistToggle.classList.add('product-discovery-product-actions__wishlist-toggle');
          wishlistRender.render(WishlistToggle, {
            product: ctx.product,
            variant: 'tertiary',
          })($wishlistToggle);
          actionsWrapper.appendChild(addToCartBtn);
          actionsWrapper.appendChild($wishlistToggle);
          ctx.replaceWith(actionsWrapper);
        },
      },
    })($productList),
  ]);

  // Listen for search results (event is fired before the block is rendered; eager: true)
  events.on('search/result', (payload) => {
    const totalCount = payload.result?.totalCount || 0;

    block.classList.toggle('product-list-page--empty', totalCount === 0);

    // Results Info
    $resultInfo.innerHTML = payload.request?.phrase
      ? `${totalCount} results found for <strong>"${payload.request.phrase}"</strong>.`
      : `${totalCount} results found.`;

    // Update the view facets button with the number of filters
    if (payload.request.filter.length > 0) {
      $viewFacets.querySelector('button').setAttribute('data-count', payload.request.filter.length);
    } else {
      $viewFacets.querySelector('button').removeAttribute('data-count');
    }
  }, { eager: true });

  // Listen for search results (event is fired after the block is rendered; eager: false)
  // URL is owned by this project; update it when search state changes.
  events.on('search/result', (payload) => {
    const url = new URL(window.location.href);
    applySearchStateToUrl(url, payload.request);
    window.history.pushState({}, '', url.toString());
  }, { eager: false });
}
