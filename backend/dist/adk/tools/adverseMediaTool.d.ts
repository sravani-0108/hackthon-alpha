import { FunctionTool } from '@google/adk';
import { z } from 'zod';
/** Only registered when USE_MOCK_SCREENING=true — live mode uses GOOGLE_SEARCH only. */
export declare const adverseMediaTool: FunctionTool<z.ZodObject<{
    customer_id: z.ZodNumber;
}, z.core.$strip>>;
//# sourceMappingURL=adverseMediaTool.d.ts.map