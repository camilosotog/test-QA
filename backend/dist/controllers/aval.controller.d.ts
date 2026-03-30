import { Request, Response } from 'express';
export declare const mejorarObservaciones: (req: Request, res: Response) => Promise<void>;
export declare const listAvales: (req: Request, res: Response) => Promise<void>;
export declare const getAvalById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createAval: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateAval: (req: Request, res: Response) => Promise<void>;
export declare const deleteAval: (req: Request, res: Response) => Promise<void>;
export declare const testConfluence: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const publishToConfluence: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=aval.controller.d.ts.map