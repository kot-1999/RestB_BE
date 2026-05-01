import { AdminRole } from '@prisma/client';
import config from 'config';
import dayjs from 'dayjs';
import { Request, Response, NextFunction, AuthAdminRequest, EmployeeRegisterRequest } from 'express'
import Joi from 'joi'

import emailService from '../../../services/Email'
import { EncryptionService } from '../../../services/Encryption'
import { JwtService } from '../../../services/Jwt'
import prisma from '../../../services/Prisma'
import { AbstractController } from '../../../types/AbstractController'
import { IConfig } from '../../../types/config';
import { JoiCommon } from '../../../types/JoiCommon'
import { EmailType, JwtAudience } from '../../../utils/enums'
import { IError } from '../../../utils/IError'

const appConfig = config.get<IConfig['app']>('app')

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
                    phone: Joi.string().required(),
                    brandName: Joi.string().min(3)
                        .max(255)
                        .required()
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
                    email: JoiCommon.string.email.required(),
                    restaurantID: JoiCommon.string.id
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

            const result = await prisma.$transaction(async (tx: any) => {
                const brand = await tx.brand.create({
                    data: { name: body.brandName }
                });

                admin = await tx.admin.create({
                    data: {
                        firstName: body.firstName,
                        lastName: body.lastName,
                        email: body.email,
                        brandID: brand.id,
                        emailVerified: false,
                        password: EncryptionService.hashSHA256(body.password),
                        phone: body.phone
                    }
                });

                return {
                    brand,
                    admin 
                };
            });

            admin = result.admin;

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
                    email: user.email,
                    link: appConfig.frontendUrl + '/#reset-password' + `?userType=b2b&token=${JwtService.generateToken({
                        id: user.id,
                        aud: JwtAudience.b2bForgotPassword
                    })}`
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
            const { body, user } = req

            const restaurant = await prisma.restaurant.findByID(body.restaurantID, {
                id: true,
                name: true 
            })

            if (!restaurant) {
                throw new IError(404, 'Restaurant not found')
            }

            await emailService.sendEmail(EmailType.employeeInvite, {
                email: body.email,
                restaurantName: restaurant.name,
                managerFirstName: user.firstName,
                managerLastName: user.lastName,
                position: AdminRole.Employee,
                link: appConfig.frontendUrl + '/#register-employee' + `?token=${JwtService.generateToken({
                    id: user.id,
                    aud: JwtAudience.inviteEmployee,
                    restID: restaurant.id,
                    email: body.email
                }, 72 * 60 * 60 * 1000)}`,
                expiryDate: dayjs().add(3, 'days')
                    .format('YYYY-MM-DD HH:mm')
            })

            res.status(200).json({
                message: 'Invitation email was sent successfully'
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
            const { body, user } = req

            const [restaurant, admin] = await Promise.all([
                prisma.restaurant.findByID(user.restaurantID, {
                    id: true,
                    brandID: true
                }),
                prisma.admin.findFirst({
                    where: { email: user.email }
                })
            ])
            if (admin) {
                throw new IError(403, 'Admin already exists')
            }

            if (!restaurant) {
                throw new IError(404, 'Restaurant not found')
            }
            const employee = await prisma.admin.createOne({
                firstName: body.firstName,
                lastName: body.lastName,
                email: user.email,
                brand: {
                    connect: {
                        id: restaurant.brandID
                    }
                },
                emailVerified: false,
                password: EncryptionService.hashSHA256(body.password),
                phone: body.phone,
                role: AdminRole.Employee,
                restaurants: {
                    create: {
                        restaurantID: restaurant.id
                    }
                }
            })

            const jwt = JwtService.generateToken({
                id: employee.id,
                aud: JwtAudience.b2b
            })

            req.session.jwt = jwt

            res.status(200).json({
                admin: {
                    id: employee.id,
                    role: employee.role,
                    token: jwt
                },
                message: 'Employee registered successfully'
            })
        } catch (err) {
            return next(err)
        }
    }
}