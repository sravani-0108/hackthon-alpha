"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const index_1 = __importDefault(require("./index"));
const extension = __filename.endsWith('.ts') ? 'ts' : 'js';
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'AML Alert Triage & Investigation System API',
            version: '1.0.0',
            description: 'Backend API for AML alert triage, investigation, and risk monitoring',
        },
        servers: [
            {
                url: `http://localhost:${index_1.default.port}${index_1.default.apiPrefix}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: [
        path_1.default.join(__dirname, `../routes/*.${extension}`),
        path_1.default.join(__dirname, '../docs/swagger.yaml'),
    ],
};
exports.default = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map