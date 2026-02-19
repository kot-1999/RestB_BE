import { AdminRole } from '@prisma/client';
import { Request, Response, NextFunction, AuthAdminRequest, EmployeeRegisterRequest } from 'express'
import Joi from 'joi'

import emailService from '../../../../services/Email'
import { EncryptionService } from '../../../../services/Encryption'
import { JwtService } from '../../../../services/Jwt'
import prisma from '../../../../services/Prisma'
import { AbstractController } from '../../../../types/AbstractController'
import { JoiCommon } from '../../../../types/JoiCommon'
import { EmailType, JwtAudience } from '../../../../utils/enums'
import { IError } from '../../../../utils/IError'

export class AuthorizationController extends AbstractController {
    private static readonly adminSchema = Joi.object({
        admin: Joi.object({
            id: JoiCommon.string.id,
            token: JoiCommon.string.token.required(),
            role: Joi.string().allow(...Object.values(AdminRole))
                .required()
        }).required(),
        message: Joi.string().required()
    })

    public static readonly schemas = {
        request: {
            register: JoiCommon.object.request.keys({
                body: Joi.object({
                    firstName: JoiCommon.string.name.required(),
                    lastName: JoiCommon.string.name.required(),
                    email: JoiCommon.string.email.required(),
                    password: Joi.string().min(3)
                        .required(),
                    phone: Joi.string().required()
                }).required()
            }).required(),

            login: JoiCommon.object.request.keys({
                body: Joi.object({
                    email: JoiCommon.string.email.required(),
                    password: Joi.string().required()
                })
            }),

            forgotPassword: JoiCommon.object.request.keys({
                body: Joi.object({
                    email: JoiCommon.string.email.required()
                }).required()
            }),
            logout: JoiCommon.object.request,
            resetPassword: JoiCommon.object.request.keys({
                body: Joi.object({
                    newPassword: Joi.string().required()
                }).required()
            }),
            inviteAdmin: JoiCommon.object.request.keys({
                body: Joi.object({
                    email: JoiCommon.string.email.required()
                }).required()
            }),
            registerEmployee: JoiCommon.object.request.keys({
                body: Joi.object({
                    firstName: JoiCommon.string.name.required(),
                    lastName: JoiCommon.string.name.required(),
                    password: Joi.string().min(3)
                        .required(),
                    phone: Joi.string().required()
                }).required()
            }).required()
        },
        response: {
            register: AuthorizationController.adminSchema.required(),
            login: AuthorizationController.adminSchema.required(),
            logout: Joi.object({
                admin: Joi.object({
                    id: JoiCommon.string.id.required()
                }),
                message: Joi.string().required()
            }).required(),
            forgotPassword: Joi.object({
                message: Joi.string().required()
            }).required(),
            resetPassword: Joi.object({
                admin: Joi.object({
                    id: JoiCommon.string.id.required()
                }),
                message: Joi.string().required()
            }).required(),
            inviteAdmin: Joi.object({
                message: Joi.string().required()
            }).required(),
            registerEmployee: AuthorizationController.adminSchema.required()
        }
    }

    constructor() {
        super()
    }

    private RegisterReqType: Joi.extractType<typeof AuthorizationController.schemas.request.register>
    private RegisterResType: Joi.extractType<typeof AuthorizationController.schemas.response.register>
    public async register(
        req: Request & typeof this.RegisterReqType,
        res: Response<typeof this.RegisterResType>,
        next: NextFunction
    ) {
        try {
            const { body } = req
            let admin = await prisma.admin.findOne(
                null,
                {
                    email: {
                        equals: body.email
                    }
                }
            )

            if (admin) {
                throw new IError(409, 'Profile already exists. Go to login, or use forgot password')
            }

            admin = await prisma.admin.create({
                data: {
                    firstName: body.firstName,
                    lastName: body.lastName,
                    email: body.email,
                    emailVerified: false,
                    password: EncryptionService.hashSHA256(body.password),
                    phone: body.phone
                }
            })
            const jwt = JwtService.generateToken({
                id: admin.id,
                aud: JwtAudience.b2b
            })

            req.session.jwt = jwt

            if (admin) {
                emailService.sendEmail(EmailType.registered, {
                    firstName: admin.firstName,
                    lastName: admin.lastName,
                    email: admin.email
                })
            }

            return res
                .status(200)
                .json({
                    admin: {
                        id: admin.id,
                        token: jwt,
                        role: admin.role
                    },
                    message: 'Registration was successful'
                })
        } catch (err) {
            return next(err)
        }
    }

    private LoginReqType: Joi.extractType<typeof AuthorizationController.schemas.request.login>
    private LoginResType: Joi.extractType<typeof AuthorizationController.schemas.response.login>
    public async login(
        req: Request & typeof this.LoginReqType,
        res: Response<typeof this.LoginResType>,
        next: NextFunction
    ) {
        try {
            const { body } = req
            // Find admin
            const admin = await prisma.admin.findOne(
                null,
                {
                    email: {
                        equals: body.email
                    }
                }
            )

            if (!admin) {
                throw new IError(401, 'Password or email is incorrect')
            }

            // Check password
            if (admin.password !== EncryptionService.hashSHA256(body.password)) {
                throw new IError(401, 'Password or email is incorrect')
            }

            const jwt = JwtService.generateToken({
                id: admin.id,
                aud: JwtAudience.b2b
            })

            req.session.jwt = jwt

            return res
                .status(200)
                .json({
                    admin: {
                        id: admin.id,
                        token: jwt,
                        role: admin.role
                    },
                    message: 'Logged in successfully'
                })
        } catch (err) {
            return next(err)
        }
    }

    private LogoutResType: Joi.extractType<typeof AuthorizationController.schemas.response.logout>
    public async logout(
        req: AuthAdminRequest,
        res: Response<typeof this.LogoutResType>,
        next: NextFunction
    ) {
        try {
            const userID = req.user.id
            // Wrap req.logout() in a Promise
            await new Promise<void>((resolve) => {
                req.logout((err) => {
                    if (err) {
                        throw err
                    }
                    resolve()
                })
            })

            // Destroy the session after logout
            await new Promise<void>((resolve) => {
                req.session.destroy((err) => {
                    if (err) {
                        throw err
                    }
                    resolve()
                })
            })
            res
                .clearCookie('connect.sid')
                .status(200)
                .json({
                    admin: {
                        id: userID
                    },
                    message: 'Admin was logged out'
                })
        } catch (err) {
            return next(err)
        }
    }

    private ForgotPasswordReqType: Joi.extractType<typeof AuthorizationController.schemas.request.forgotPassword>
    private ForgotPasswordResType: Joi.extractType<typeof AuthorizationController.schemas.response.forgotPassword>
    public async forgotPassword(
        req: Request & typeof this.ForgotPasswordReqType,
        res: Response<typeof this.ForgotPasswordResType>,
        next: NextFunction
    ) {
        try {
            const { body: { email } } = req

            const user = await prisma.user.findOne({
                id: true,
                email: true,
                firstName: true,
                lastName: true
            },{
                email: {
                    equals: email
                }
            })

            if (user) {
                emailService.sendEmail(EmailType.forgotPassword, {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                })
            }

            res.status(200).json({
                message: 'Email with password recovery link was successfully sent'
            })
        } catch (err) {
            return next(err)
        }
    }
    private ResetPasswordReqType: Joi.extractType<typeof AuthorizationController.schemas.request.resetPassword>
    private ResetPasswordResType: Joi.extractType<typeof AuthorizationController.schemas.response.resetPassword>
    public async resetPassword(
        req: AuthAdminRequest & typeof this.ResetPasswordReqType,
        res: Response<typeof this.ResetPasswordResType>,
        next: NextFunction
    ) {
        try {
            const { body: { newPassword }, user } = req

            const updatedUser = await prisma.admin.update({
                data: {
                    password: EncryptionService.hashSHA256(newPassword)
                },
                where: {
                    id: user.id
                },
                select: {
                    id: true
                }
            })

            res.status(200).json({
                admin: {
                    id: updatedUser.id
                },
                message: 'Password was successfully reset'
            })
        } catch (err) {
            return next(err)
        }

    }

    private InviteAdminReqType: Joi.extractType<typeof AuthorizationController.schemas.request.inviteAdmin>
    private InviteAdminResType: Joi.extractType<typeof AuthorizationController.schemas.response.inviteAdmin>
    public async inviteAdmin(
        req: AuthAdminRequest & typeof this.InviteAdminReqType,
        res: Response<typeof this.InviteAdminResType>,
        next: NextFunction
    ) {
        try {

            res.status(200).json({
                message: 'Response from backend template'
            })
        } catch (err) {
            return next(err)
        }
    }

    private RegisterEmployeeReqType: Joi.extractType<typeof AuthorizationController.schemas.request.registerEmployee>
    private RegisterEmployeeResType: Joi.extractType<typeof AuthorizationController.schemas.response.registerEmployee>
    public async registerEmployee(
        req: EmployeeRegisterRequest & typeof this.RegisterEmployeeReqType,
        res: Response<typeof this.RegisterEmployeeResType>,
        next: NextFunction
    ) {
        try {
            res.status(200).json({
                admin: {
                    id: 'asdasdasd',
                    role: 'asdsad',
                    token: 'asdsad'
                },
                message: 'Response from backend template'
            })
        } catch (err) {
            return next(err)
        }
    }
}