import { ParsedQs } from 'qs';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationMeta, PaginationParams, QueryFilters } from '../types';

export const getPaginationParams = (query: ParsedQs | QueryFilters): PaginationParams => {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10));
  const limitRaw = query.limit;

  if (
    limitRaw === undefined ||
    limitRaw === null ||
    limitRaw === '' ||
    String(limitRaw).toLowerCase() === 'all'
  ) {
    return { page, limit: null, offset: 0 };
  }

  const limit = Math.max(1, parseInt(String(limitRaw), 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const buildPaginationMeta = (total: number, page: number, limit: number | null): PaginationMeta => ({
  total,
  page,
  limit: limit ?? total,
  totalPages: limit ? Math.ceil(total / limit) || 1 : 1,
});

export const applyQueryPagination = <T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  offset: number,
  limit: number | null
): SelectQueryBuilder<T> => {
  if (limit != null) {
    qb.skip(offset).take(limit);
  }
  return qb;
};
