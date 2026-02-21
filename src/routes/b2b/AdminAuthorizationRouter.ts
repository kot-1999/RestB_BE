import { Router } from 'express'

import { AuthorizationController } from '../../controllers/b2b/v1/AuthorizationController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

// Init router and controller
const router = Router()
const authorizationController = new AuthorizationController()

export default function adminAuthorizationRouter() {
    // List endpoints
    router.post(
        /*
            #swagger.tags = ['b2b-v1-AdminAuthorization']
            #swagger.description = 'Register a new admin.',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1RegisterReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1RegisterRes" }
            }
        */
        '/register',
        validationMiddleware(AuthorizationController.schemas.request.register),
        authorizationController.register
    )
    router.post(
        /*
            #swagger.tags = ['b2b-v1-AdminAuthorization']
            #swagger.description = 'Authorize a user',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1LoginReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1LoginRes" }
            }
        */
        '/login',
        validationMiddleware(AuthorizationController.schemas.request.login),
        authorizationController.login
    )

    router.get(
        /*
            #swagger.tags = ['b2b-v1-AdminAuthorization']
            #swagger.description = 'Logout a user.',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1LogoutReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1LogoutRes" }
            }
        */
        '/logout',
        authorizationMiddleware([PassportStrategy.jwtB2b]),
        authorizationController.logout
    )

    router.post(
        /*
            #swagger.tags = ['b2b-v1-AdminAuthorization']
            #swagger.description = 'Send email with password reset link.',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1ForgotPasswordReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1ForgotPasswordRes" }
            }
        */
        '/forgot-password',
        validationMiddleware(AuthorizationController.schemas.request.forgotPassword),
        authorizationController.forgotPassword
    )

    router.post(
        /*
            #swagger.tags = ['b2b-v1-AdminAuthorization']
            #swagger.description = 'Resets a password.',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1ResetPasswordReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1ResetPasswordRes" }
            }
        */
        '/reset-password',
        validationMiddleware(AuthorizationController.schemas.request.resetPassword),
        authorizationMiddleware([PassportStrategy.jwtB2bForgotPassword, PassportStrategy.google]),
        authorizationController.resetPassword
    )

    router.post(
        /*
            #swagger.tags = ['b2b-v1-AdminAuthorization']
            #swagger.description = '(Not Implemented) Send invitation to a new admin.',
            #swagger.security = [{
                "bearerAuth": []
            }]
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1InviteAdminReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1InviteAdminRes" },
            }
        */
        '/auth/invite',
        validationMiddleware(AuthorizationController.schemas.request.inviteAdmin),
        authorizationMiddleware([PassportStrategy.jwtB2b]),
        authorizationController.inviteAdmin
    )

    router.post(
        /*
            #swagger.tags = ['b2b-v1-AdminAuthorization']
            #swagger.description = '(Not Implemented) Register new employee (admin account).',
            #swagger.security = [{
                "bearerAuth": []
            }]
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1RegisterEmployeeReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1RegisterEmployeeRes" },
            }
        */
        '/auth/employee/register',
        validationMiddleware(AuthorizationController.schemas.request.registerEmployee),
        authorizationMiddleware([PassportStrategy.jwtB2bInvite]),
        authorizationController.registerEmployee
    )
    return router
}
