export declare const getOnlineUsers: (req: Request, res: Response) => Promise<void>;
import { Request, Response } from 'express';
export declare const getUsers: (req: Request, res: Response) => Promise<void>;
/**
 * Obtiene usuarios filtrados por rol
 */
export declare const getUsersByRole: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 🚀 OPTIMIZACIÓN: Obtiene usuarios de múltiples roles en una sola consulta
 */
export declare const getUsersByRoles: (req: Request, res: Response) => Promise<void>;
export declare const getUserById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateUser: (req: Request, res: Response) => Promise<void>;
export declare const deleteUser: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=users.controller.d.ts.map