"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGoogleSearchMedia = runGoogleSearchMedia;
const genai_1 = require("@google/genai");
const config_1 = __importDefault(require("../config"));
const utils_1 = require("./utils");
const SEARCH_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];
const MAX_ATTEMPTS_PER_MODEL = 3;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function isRetryableError(message) {
    return (message.includes('429') ||
        message.includes('503') ||
        message.includes('UNAVAILABLE') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('high demand') ||
        message.includes('overloaded'));
}
function formatApiError(error) {
    const raw = error instanceof Error ? error.message : String(error);
    try {
        const parsed = JSON.parse(raw);
        if (parsed.error?.message) {
            return `${parsed.error.status ?? parsed.error.code ?? 'Error'}: ${parsed.error.message}`;
        }
    }
    catch {
        // not JSON
    }
    return raw.slice(0, 400);
}
function articlesFromGrounding(response) {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    return chunks
        .map((chunk) => chunk.web)
        .filter((web) => Boolean(web?.title || web?.uri))
        .map((web) => ({
        title: web.title ?? web.uri ?? 'Web result',
        source: web.domain ?? 'Google Search',
        date: '',
    }));
}
function buildResult(customerName, partial) {
    return {
        negativeNews: partial.negativeNews,
        articleCount: partial.articleCount,
        articles: partial.articles,
        summary: partial.summary,
        source: partial.source ?? 'google_search',
        searchStatus: partial.searchStatus ?? (partial.negativeNews ? 'completed' : 'no_results'),
    };
}
function parseSearchResponse(customerName, response) {
    const text = response.text ?? '';
    const groundingArticles = articlesFromGrounding(response);
    if (text.trim()) {
        const parsed = (0, utils_1.parseJsonFromLlm)(text, {
            negativeNews: false,
            articleCount: 0,
            articles: [],
            summary: '',
        });
        const articles = parsed.articles?.length
            ? parsed.articles
            : groundingArticles.length
                ? groundingArticles
                : parsed.article_urls?.map((url) => ({
                    title: url,
                    source: 'Google Search',
                    date: '',
                })) ?? [];
        const articleCount = parsed.articleCount ?? articles.length;
        const negativeNews = parsed.negativeNews ?? articleCount > 0;
        if (negativeNews || articleCount > 0 || parsed.summary) {
            return buildResult(customerName, {
                negativeNews,
                articleCount,
                articles,
                summary: parsed.summary ||
                    (negativeNews
                        ? `${articleCount} adverse media article(s) found for "${customerName}" via Google Search.`
                        : `No adverse media found via Google Search for "${customerName}".`),
                source: 'google_search',
                searchStatus: negativeNews ? 'completed' : 'no_results',
            });
        }
    }
    if (groundingArticles.length > 0) {
        return buildResult(customerName, {
            negativeNews: true,
            articleCount: groundingArticles.length,
            articles: groundingArticles,
            summary: `${groundingArticles.length} adverse media source(s) found for "${customerName}" via Google Search.`,
            source: 'google_search',
            searchStatus: 'completed',
        });
    }
    return null;
}
/**
 * Live adverse media screening via Gemini + Google Search grounding (no static name lists).
 */
async function runGoogleSearchMedia(customerName, context) {
    const apiKey = config_1.default.geminiApiKey;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY is required for Google Search media screening.');
    }
    const prompt = (0, utils_1.buildMediaSearchPrompt)({ ...context, customer_name: customerName });
    const ai = new genai_1.GoogleGenAI({ apiKey });
    console.log(`[ADK] Google Search media screening for "${customerName}"...`);
    let lastError = '';
    for (const model of SEARCH_MODELS) {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    contents: prompt,
                    config: {
                        tools: [{ googleSearch: {} }],
                    },
                });
                const parsed = parseSearchResponse(customerName, response);
                if (parsed) {
                    console.log(`[ADK] Google Search OK (${model}): negativeNews=${parsed.negativeNews}, articles=${parsed.articleCount}`);
                    return parsed;
                }
                console.warn(`[ADK] Google Search (${model}) returned no parseable results`);
                break;
            }
            catch (error) {
                lastError = formatApiError(error);
                const retryable = isRetryableError(lastError);
                console.warn(`[ADK] Google Search (${model}) attempt ${attempt}/${MAX_ATTEMPTS_PER_MODEL}: ${lastError.slice(0, 120)}`);
                if (retryable && attempt < MAX_ATTEMPTS_PER_MODEL) {
                    await sleep(1500 * attempt);
                    continue;
                }
                break;
            }
        }
    }
    return buildResult(customerName, {
        negativeNews: false,
        articleCount: 0,
        articles: [],
        summary: `Google Search could not complete for "${customerName}". ${lastError || 'API unavailable — retry later or check Gemini API quota.'}`,
        source: 'unavailable',
        searchStatus: 'failed',
    });
}
//# sourceMappingURL=googleSearchMedia.js.map