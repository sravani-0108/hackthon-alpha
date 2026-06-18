import { AppDataSource } from '../config/database';

const CACHE_TTL_MS = 5 * 60 * 1000;

class HighRiskCountryService {
  private cache: Set<string> | null = null;
  private cacheAt = 0;

  private normalize(country: string): string {
    return country.trim().toLowerCase();
  }

  private isCacheValid(): boolean {
    return this.cache !== null && Date.now() - this.cacheAt < CACHE_TTL_MS;
  }

  async getCountries(forceRefresh = false): Promise<Set<string>> {
    if (!forceRefresh && this.isCacheValid() && this.cache) {
      return this.cache;
    }

    const rows = (await AppDataSource.query(
      `SELECT country_name FROM high_risk_countries WHERE is_active = true`
    )) as Array<{ country_name: string }>;

    const countries = new Set(rows.map((row) => this.normalize(row.country_name)));
    this.cache = countries;
    this.cacheAt = Date.now();
    return countries;
  }

  async isHighRiskCountry(country?: string | null): Promise<boolean> {
    if (!country) return false;
    const countries = await this.getCountries();
    return countries.has(this.normalize(country));
  }
}

export default new HighRiskCountryService();
