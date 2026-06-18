"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pepAgent = void 0;
const adk_1 = require("@google/adk");
const opensanctionsTool_1 = require("../tools/opensanctionsTool");
exports.pepAgent = new adk_1.LlmAgent({
    name: 'pep_agent',
    model: 'gemini-flash-latest',
    outputKey: 'pep_check',
    instruction: `You are a PEP screening agent.
Use opensanctions_lookup with check_type "pep" for the customer name and customer_id.
This calls the live OpenSanctions API — do not invent PEP matches.
Return ONLY valid JSON compatible with:
{
  "pepMatch": boolean,
  "pepDetails": { "name": string, "position": string, "source": string } | null,
  "checkedDatabases": string[],
  "isDirectPep": boolean,
  "summary": string,
  "risk_signals": string[],
  "is_pep": boolean,
  "pep_category": string | null
}`,
    tools: [opensanctionsTool_1.opensanctionsTool],
});
//# sourceMappingURL=pepAgent.js.map