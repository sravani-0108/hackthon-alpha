import { ParsedQs } from 'qs';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationMeta, PaginationParams, QueryFilters } from '../types';
export declare const getPaginationParams: (query: ParsedQs | QueryFilters) => PaginationParams;
export declare const buildPaginationMeta: (total: number, page: number, limit: number | null) => PaginationMeta;
export declare const applyQueryPagination: <T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, offset: number, limit: number | null) => SelectQueryBuilder<T>;
//# sourceMappingURL=pagination.d.ts.map