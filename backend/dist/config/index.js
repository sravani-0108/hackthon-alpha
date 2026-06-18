"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function parseDatabaseUrl(url) {
    if (!url)
        return null;
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname,
            port: parseInt(parsed.port || '5432', 10),
            name: parsed.pathname.replace(/^\//, ''),
            user: decodeURIComponent(parsed.username),
            password: decodeURIComponent(parsed.password),
        };
    }
    catch {
        return null;
    }
}
const dbFromUrl = parseDatabaseUrl(process.env.DATABASE_URL);
const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || '/api',
    db: dbFromUrl || {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        name: process.env.DB_NAME || 'aml_system',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    aml: {
        sanctionsList: ['OFAC', 'UN', 'EU', 'Internal Watchlist'],
        pepDatabase: ['World-Check', 'Dow Jones', 'Internal PEP List'],
        thresholds: {
            largeTransaction: 1000000,
            rapidTransactionCount: 10,
            rapidTransactionWindowHours: 1,
            structuringAmount: 50000,
            structuringWindowHours: 24,
            activitySpikeMultiplier: 3,
        },
        riskCategories: {
            low: { min: 0, max: 30 },
            medium: { min: 31, max: 60 },
            high: { min: 61, max: 100 },
        },
    },
    corsOrigin: process.env.CORS_ORIGIN || '*',
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
    useMockScreening: process.env.USE_MOCK_SCREENING === 'true',
    useAdk: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
};
exports.default = config;
//# sourceMappingURL=index.js.map