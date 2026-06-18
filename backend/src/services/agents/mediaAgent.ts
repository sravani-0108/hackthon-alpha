/** Result shape for adverse media screening (live source: Google Search via Gemini). */
export interface MediaAnalysisResult {
  negativeNews: boolean;
  articleCount: number;
  articles: Array<{ title: string; source: string; date: string }>;
  summary: string;
  /** google_search = live API; unavailable = API error; mock = offline demo */
  source?: 'google_search' | 'unavailable' | 'mock';
  /** completed = search ran; no_results = search ran, nothing found; failed = API error */
  searchStatus?: 'completed' | 'no_results' | 'failed';
}
