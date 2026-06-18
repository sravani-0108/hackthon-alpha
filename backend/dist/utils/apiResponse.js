"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginated = exports.error = exports.success = void 0;
const success = (res, data, message = 'Success', statusCode = 200) => res.status(statusCode).json({ success: true, message, data });
exports.success = success;
const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => res.status(statusCode).json({ success: false, message, errors });
exports.error = error;
const paginated = (res, data, pagination, message = 'Success') => res.status(200).json({ success: true, message, data, pagination });
exports.paginated = paginated;
//# sourceMappingURL=apiResponse.js.map