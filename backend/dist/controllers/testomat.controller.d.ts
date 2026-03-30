import { Request, Response } from 'express';
export declare const getTestProjects: (req: Request, res: Response) => Promise<void>;
export declare const getTestProjectById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createTestProject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateTestProject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTestSuites: (req: Request, res: Response) => Promise<void>;
export declare const createTestSuite: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteTestSuite: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTestCases: (req: Request, res: Response) => Promise<void>;
export declare const getTestCaseById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createTestCase: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateTestCase: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteTestCase: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTestExecutions: (req: Request, res: Response) => Promise<void>;
export declare const getTestExecutionById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createTestExecution: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createTestResult: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getProjectAnalytics: (req: Request, res: Response) => Promise<void>;
export declare const importFromTestomat: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Sube un archivo adjunto a S3
 */
export declare const uploadAttachment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 📋 Duplica todos los casos de una suite a otra suite destino
 * Los casos se copian sin evidencias ni resultados (ejecución limpia)
 */
export declare const duplicateSuiteCases: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const _default: {
    getTestProjects: (req: Request, res: Response) => Promise<void>;
    getTestProjectById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    createTestProject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getTestSuites: (req: Request, res: Response) => Promise<void>;
    createTestSuite: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteTestSuite: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getTestCases: (req: Request, res: Response) => Promise<void>;
    getTestCaseById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    createTestCase: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateTestCase: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getTestExecutions: (req: Request, res: Response) => Promise<void>;
    getTestExecutionById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    createTestExecution: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    createTestResult: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getProjectAnalytics: (req: Request, res: Response) => Promise<void>;
    importFromTestomat: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    uploadAttachment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    duplicateSuiteCases: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
//# sourceMappingURL=testomat.controller.d.ts.map