/**
 * Adds Critical-severity alerts that are false positives — AI investigation should return CLEAR.
 * Safe to re-run (upserts by alert_code).
 */
declare function seedFalsePositiveCritical(): Promise<void>;
export default seedFalsePositiveCritical;
//# sourceMappingURL=runFalsePositiveSamples.d.ts.map