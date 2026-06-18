"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const utils_1 = require("../adk/utils");
const router = (0, express_1.Router)();
router.get('/mode', auth_1.authenticate, (0, rbac_1.authorize)(rbac_1.ROLES.BANK_MANAGER, rbac_1.ROLES.ADMIN), (_req, res) => {
    res.json({ success: true, message: 'System mode', data: (0, utils_1.getSystemMode)() });
});
exports.default = router;
//# sourceMappingURL=systemRoutes.js.map