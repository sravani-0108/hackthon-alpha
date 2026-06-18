"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyQueryPagination = exports.buildPaginationMeta = exports.getPaginationParams = void 0;
const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(String(query.page || '1'), 10));
    const limitRaw = query.limit;
    if (limitRaw === undefined ||
        limitRaw === null ||
        limitRaw === '' ||
        String(limitRaw).toLowerCase() === 'all') {
        return { page, limit: null, offset: 0 };
    }
    const limit = Math.max(1, parseInt(String(limitRaw), 10));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};
exports.getPaginationParams = getPaginationParams;
const buildPaginationMeta = (total, page, limit) => ({
    total,
    page,
    limit: limit ?? total,
    totalPages: limit ? Math.ceil(total / limit) || 1 : 1,
});
exports.buildPaginationMeta = buildPaginationMeta;
const applyQueryPagination = (qb, offset, limit) => {
    if (limit != null) {
        qb.skip(offset).take(limit);
    }
    return qb;
};
exports.applyQueryPagination = applyQueryPagination;
//# sourceMappingURL=pagination.js.map