import { FunctionTool } from '@google/adk';
import { z } from 'zod';
export declare const opensanctionsTool: FunctionTool<z.ZodObject<{
    entity_name: z.ZodString;
    check_type: z.ZodEnum<{
        sanctions: "sanctions";
        pep: "pep";
    }>;
    customer_id: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
export declare function resolveCustomerName(customerId: number): Promise<string>;
//# sourceMappingURL=opensanctionsTool.d.ts.map