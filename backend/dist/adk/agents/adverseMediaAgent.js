"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adverseMediaAgent = void 0;
const adk_1 = require("@google/adk");
const config_1 = __importDefault(require("../../config"));
const adverseMediaTool_1 = require("../tools/adverseMediaTool");
const mediaTools = config_1.default.useMockScreening ? [adverseMediaTool_1.adverseMediaTool] : [adk_1.GOOGLE_SEARCH];
exports.adverseMediaAgent = new adk_1.LlmAgent({
    name: 'adverse_media_agent',
    model: 'gemini-flash-latest',
    outputKey: 'media_analysis',
    instruction: `You are an adverse media screening agent.
You MUST call the google_search tool at least once before answering. Never skip the search.

Read the customer name from the user message / alert context, then search with queries like:
- "<customer name> fraud"
- "<customer name> money laundering"
- "<customer name> scandal"

If articles are found, set negativeNews=true and list them. If none found after searching, set negativeNews=false and say so in summary.

Return ONLY valid JSON:
{
  "negativeNews": boolean,
  "articleCount": number,
  "articles": [{ "title": string, "source": string, "date": string }],
  "summary": string,
  "risk_signals": string[],
  "article_urls": string[],
  "sentiment_summary": string,
  "source": "google_search"
}`,
    tools: mediaTools,
});
//# sourceMappingURL=adverseMediaAgent.js.map