/**
 * Shared list helper: text search, equality filters, date range, sort and pagination.
 */
import { inDateRange } from './dateUtils.js';

export function applyListQuery(items, { q, searchFields = [], filters = {}, dateField, startDate, endDate, sortBy, order = 'desc', page = 1, pageSize = 50 }) {
  let result = items;

  if (q) {
    const needle = String(q).toLowerCase();
    result = result.filter((item) => searchFields.some((field) => String(item[field] ?? '').toLowerCase().includes(needle)));
  }

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue;
    result = result.filter((item) => String(item[key]) === String(value));
  }

  if (dateField && (startDate || endDate)) {
    result = result.filter((item) => inDateRange(item[dateField], startDate, endDate));
  }

  if (sortBy) {
    const direction = order === 'asc' ? 1 : -1;
    result = [...result].sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return (av > bv ? 1 : -1) * direction;
    });
  } else if (dateField) {
    result = [...result].sort((a, b) => new Date(b[dateField]) - new Date(a[dateField]));
  }

  const total = result.length;
  const size = Math.min(Math.max(Number(pageSize) || 50, 1), 200);
  const currentPage = Math.max(Number(page) || 1, 1);
  const data = result.slice((currentPage - 1) * size, currentPage * size);
  return { data, meta: { total, page: currentPage, pageSize: size, totalPages: Math.max(Math.ceil(total / size), 1) } };
}
