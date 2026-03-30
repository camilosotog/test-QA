import { Request, Response } from 'express';
/**
 * Crea una nueva ejecución de suite Y automáticamente un registro en boards
 */
export declare const createTestExecution: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Obtiene todas las ejecuciones
 */
export declare const getTestExecutions: (req: Request, res: Response) => Promise<void>;
/**
 * Obtiene los meses disponibles con conteo de ejecuciones
 */
export declare const getTestExecutionMonths: (req: Request, res: Response) => Promise<void>;
/**
 * Obtiene una ejecución específica con sus resultados
 */
export declare const getTestExecution: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Guarda el resultado de un caso de prueba en una ejecución
 */
export declare const saveTestResult: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Marca una ejecución como completada
 */
export declare const completeTestExecution: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Reabre una ejecución completada (marca como "en progreso")
 */
export declare const reopenTestExecution: (req: Request, res: Response) => Promise<void>;
/**
 * Recalcula el estado de todas las ejecuciones basado en sus resultados
 * Útil para actualizar ejecuciones anteriores que pudieron haber sido guardadas con estado incorrecto
 */
export declare const recalculateAllExecutionStatuses: (req: Request, res: Response) => Promise<void>;
/**
 * Elimina una evidencia específica de un resultado de prueba
 */
export declare const deleteEvidence: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Elimina una ejecución de prueba y todos sus resultados asociados
 */
export declare const deleteTestExecution: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTestResult: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=testExecution.controller.d.ts.map