"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const config_1 = __importDefault(require("./config"));
const swagger_1 = __importDefault(require("./config/swagger"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
const utils_1 = require("./adk/utils");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: config_1.default.corsOrigin }));
app.use((0, morgan_1.default)(config_1.default.env === 'development' ? 'dev' : 'combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), mode: (0, utils_1.getSystemMode)() });
});
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
app.use(config_1.default.apiPrefix, routes_1.default);
app.use(errorHandler_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map