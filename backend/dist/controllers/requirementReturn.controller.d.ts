import { Request, Response } from 'express';
export declare const listReturns: (req: Request, res: Response) => Promise<void>;
export declare const getReturnById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createReturn: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateReturn: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteReturn: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getReturnsByDateRange: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getStatisticsByPO: (req: Request, res: Response) => Promise<void>;
export declare const getStatisticsByMonth: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=requirementReturn.controller.d.ts.map