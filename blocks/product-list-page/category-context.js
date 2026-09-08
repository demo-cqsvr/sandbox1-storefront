/** Resolves a requested catalog category without making a search request. */
export function getCategoryContext(url, categories) {
  if (!url.searchParams.has('category')) return null;
  const path = url.searchParams.get('category');
  if (path === 'all') {
    const ids = new Set(categories.map((category) => String(category.id)));
    return {
      isAll: true,
      path: '',
      title: 'All products',
      ancestors: [],
      children: categories.filter((category) => !ids.has(String(category.parentId))),
    };
  }
  const category = categories.find((item) => item.path === path);
  if (!category) return { error: true };
  const ancestors = [];
  const visited = new Set([String(category.id)]);
  let parent = categories.find((item) => String(item.id) === String(category.parentId));
  while (parent && !visited.has(String(parent.id))) {
    ancestors.unshift(parent);
    visited.add(String(parent.id));
    const parentId = String(parent.parentId);
    parent = categories.find((item) => String(item.id) === parentId);
  }
  return {
    isAll: false,
    path: category.path,
    title: category.name,
    ancestors,
    children: categories.filter((item) => String(item.parentId) === String(category.id)),
  };
}
