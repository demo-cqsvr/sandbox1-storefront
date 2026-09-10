import { categories } from '../../scripts/catalog-routes.js';

const categoryLabels = new Map(categories.map((category) => {
  const duplicate = categories.some((other) => other.id !== category.id
    && other.name === category.name);
  const parent = categories.find((other) => other.id === category.parentId);
  const label = duplicate && parent ? `${parent.name} / ${category.name}` : category.name;
  return [category.path, label];
}));

export const categoryFacetSlots = {
  FacetBucketLabel: (ctx) => {
    if (!categoryLabels.has(ctx.data.title)) return;
    const label = document.createElement('span');
    ctx.replaceWith(label);
    const render = ({ data }) => {
      const name = categoryLabels.get(data.title);
      label.textContent = `${name} (${data.count})`;
    };
    render(ctx);
    ctx.onChange(render);
  },
  SelectedFacets: (ctx, element) => {
    if (!element) return;
    // Preserve Drop-in buttons and their removal handlers; change only their labels.
    // The slot callback precedes the default children's DOM commit.
    ctx.onRender(({ data }) => requestAnimationFrame(() => {
      data.filter((facet) => facet.attribute === 'categories').forEach((facet) => {
        facet.buckets.filter((bucket) => bucket.selected).forEach((bucket) => {
          const name = categoryLabels.get(bucket.title);
          if (!name) return;
          const button = [...element.querySelectorAll('button')].find((item) => (
            item.dataset.testid === `${bucket.title}-selected-btn`
          ));
          const label = button?.querySelector('span');
          if (label) label.textContent = name;
          button?.setAttribute('aria-label', `Remove ${facet.title} filter: ${name}`);
        });
      });
    }));
  },
};
