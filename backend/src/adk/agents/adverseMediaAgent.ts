import { GOOGLE_SEARCH, LlmAgent } from '@google/adk';
import config from '../../config';
import { adverseMediaTool } from '../tools/adverseMediaTool';

const mediaTools = config.useMockScreening ? [adverseMediaTool] : [GOOGLE_SEARCH];

export const adverseMediaAgent = new LlmAgent({
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
