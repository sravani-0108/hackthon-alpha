"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const CACHE_TTL_MS = 5 * 60 * 1000;
class HighRiskCountryService {
    constructor() {
        this.cache = null;
        this.cacheAt = 0;
    }
    normalize(country) {
        return country.trim().toLowerCase();
    }
    isCacheValid() {
        return this.cache !== null && Date.now() - this.cacheAt < CACHE_TTL_MS;
    }
    async getCountries(forceRefresh = false) {
        if (!forceRefresh && this.isCacheValid() && this.cache) {
            return this.cache;
        }
        const rows = (await database_1.AppDataSource.query(`SELECT country_name FROM high_risk_countries WHERE is_active = true`));
        const countries = new Set(rows.map((row) => this.normalize(row.country_name)));
        this.cache = countries;
        this.cacheAt = Date.now();
        return countries;
    }
    async isHighRiskCountry(country) {
        if (!country)
            return false;
        const countries = await this.getCountries();
        return countries.has(this.normalize(country));
    }
}
exports.default = new HighRiskCountryService();
//# sourceMappingURL=highRiskCountryService.js.map