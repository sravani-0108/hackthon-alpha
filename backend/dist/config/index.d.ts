import { RiskCategory } from '../types';
declare const config: {
    env: string;
    port: number;
    apiPrefix: string;
    db: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    aml: {
        sanctionsList: string[];
        pepDatabase: string[];
        thresholds: {
            largeTransaction: number;
            rapidTransactionCount: number;
            rapidTransactionWindowHours: number;
            structuringAmount: number;
            structuringWindowHours: number;
            activitySpikeMultiplier: number;
        };
        riskCategories: {
            low: {
                min: number;
                max: number;
            };
            medium: {
                min: number;
                max: number;
            };
            high: {
                min: number;
                max: number;
            };
        };
    };
    corsOrigin: string;
    geminiApiKey: string;
    useMockScreening: boolean;
    useAdk: boolean;
};
export type RiskCategoryType = RiskCategory;
export default config;
//# sourceMappingURL=index.d.ts.map