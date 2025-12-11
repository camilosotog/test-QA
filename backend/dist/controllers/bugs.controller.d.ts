import { Request, Response } from 'express';
export declare const listBugs: (req: Request, res: Response) => Promise<void>;
export declare const getBugById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createBug: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateBug: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteBug: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=bugs.controller.d.ts.map