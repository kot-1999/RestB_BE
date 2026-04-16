import { AdminRole } from '@prisma/client';
import { Response, NextFunction, AuthAdminRequest } from 'express'

import { IError } from '../utils/IError'

export default function permissionMiddleware(allowedRoles: AdminRole[]) {
    return (req: AuthAdminRequest, res: Response, next: NextFunction) => {

        const { user } = req

        if (!user?.role || !allowedRoles.find((role) => role === user.role)) {
            throw new IError(401, 'You do not have permission to perform this action')
        }

        return next()
    }
}