import { Request, Response } from 'express';
export declare const getAvailableProjects: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSummary: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDaily: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTopFailures: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listResults: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getContractResults: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getControlledResponseResults: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getOtherResponseResults: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=playwright.controller.d.ts.map