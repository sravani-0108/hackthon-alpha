declare class HighRiskCountryService {
    private cache;
    private cacheAt;
    private normalize;
    private isCacheValid;
    getCountries(forceRefresh?: boolean): Promise<Set<string>>;
    isHighRiskCountry(country?: string | null): Promise<boolean>;
}
declare const _default: HighRiskCountryService;
export default _default;
//# sourceMappingURL=highRiskCountryService.d.ts.map