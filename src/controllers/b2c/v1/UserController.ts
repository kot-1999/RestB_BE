import { UserType } from '@prisma/client'
import { Response, NextFunction, AuthUserRequest } from 'express'
import Joi from 'joi'

import UserQueries from '../../../database/queries/UserQueries';
import s3Service from '../../../services/AwsS3';
import prisma from '../../../services/Prisma'
import { AbstractController } from '../../../types/AbstractController'
import { JoiCommon } from '../../../types/JoiCommon'
import { IError } from '../../../utils/IError'

const userQueries = new UserQueries(prisma)

export class UsersController extends AbstractController {
    private static readonly userSchema = Joi.object({
        id: JoiCommon.string.id,
        firstName: JoiCommon.string.name.allow(null),
        lastName: JoiCommon.string.name.allow(null),
        email: JoiCommon.string.email,
        emailVerified: Joi.boolean().required(),
        avatarURL: Joi.string().uri()
            .allow(null)
            .optional(),
        phone: Joi.string().required(),
        type: Joi.string().valid(...Object.values(UserType))
            .required(),
        createdAt: Joi.date().iso()
            .required(),
        updatedAt: Joi.date().iso()
            .allow(null)
            .required()
    })
    public static readonly schemas = {
        request: {
            getUser: JoiCommon.object.request.keys({
                params: Joi.object({
                    userID: JoiCommon.string.id
                }).required()
            }).required(),

            deleteUser: JoiCommon.object.request.required(),
            updateUser: JoiCommon.object.request.keys({
                body: Joi.object({
                    firstName: JoiCommon.string.name.optional(),
                    lastName: JoiCommon.string.name.optional(),
                    email: JoiCommon.string.email.optional(),
                    phone: Joi.string().optional(),
                    avatarURL: Joi.string()
                        .optional()
                }).required()
            }).required()
        },
        response: {
            getUser: Joi.object({
                user: this.userSchema.required()
            }),
            updateUser: Joi.object({
                user: Joi.object({
                    id: JoiCommon.string.id
                }),
                message: Joi.string().required()
            }).required(),
            deleteUser: Joi.object({
                user: Joi.object({
                    id: JoiCommon.string.id
                }),
                message: Joi.string().required()
            }).required()
        }
    }

    constructor() {
        super()
    }

    private GetUserReqType: Joi.extractType<typeof UsersController.schemas.request.getUser>
    private GetUserResType: Joi.extractType<typeof UsersController.schemas.response.getUser>
    async getUser(
        req: AuthUserRequest & typeof this.GetUserReqType,
        res: Response<typeof this.GetUserResType>,
        next: NextFunction
    ) {
        try {
            let resultUser: typeof this.GetUserResType['user'] | null = null
            const { user, params: { userID } } = req
            if (user.id === userID) {
                resultUser = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    type: user.type,
                    avatarURL: user.avatarURL,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    phone: user.phone
                }
            } else {
                resultUser = await prisma.user.findOne({
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    emailVerified: true,
                    avatarURL: true,
                    createdAt: true,
                    updatedAt: true,
                    phone: true
                }, {
                    id: {
                        equals: userID
                    }
                })
            }
            
            if (!resultUser) {
                throw new IError(404, 'User was not found')
            }

            return res.status(200).json({
                user: {
                    ...resultUser,
                    avatarURL: resultUser.avatarURL ? await s3Service.getPublicUrl(resultUser.avatarURL) : null
                }
            })
        } catch (err) {
            return next(err)
        }
    }

    private DeleteUserReqType: Joi.extractType<typeof UsersController.schemas.request.deleteUser>
    private DeleteUserResType: Joi.extractType<typeof UsersController.schemas.response.deleteUser>
    public async deleteUser(
        req: AuthUserRequest & typeof this.DeleteUserReqType,
        res: Response<typeof this.DeleteUserResType>,
        next: NextFunction
    ) {
        try {
            const { user } = req

            await prisma.user.softDelete(user.id)

            return res.status(200).json({
                user: {
                    id: user.id
                },
                message: 'User was deleted successfully.'
            })
        } catch (err) {
            return next(err)
        }
    }

    private UpdateUserReqType: Joi.extractType<typeof UsersController.schemas.request.updateUser>
    private UpdateUserResType: Joi.extractType<typeof UsersController.schemas.response.updateUser>
    public async updateUser(
        req: AuthUserRequest & typeof this.UpdateUserReqType,
        res: Response<typeof this.UpdateUserResType>,
        next: NextFunction
    ) {
        try {
            const { user, body } = req

            await userQueries.updateOne(
                user.id,
                {
                    ...body,
                    deletedAt: null 
                }
            )

            return res.status(200).json({
                user: {
                    id: user.id
                },
                message: 'User was updated successfully.'
            })
        } catch (err) {
            return next(err)
        }
    }
}