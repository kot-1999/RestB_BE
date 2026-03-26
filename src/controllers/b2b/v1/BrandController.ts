import { Response, NextFunction, AuthAdminRequest } from 'express'
import Joi from 'joi'

import prisma from '../../../services/Prisma';
import { AbstractController } from '../../../types/AbstractController'
import { JoiCommon } from '../../../types/JoiCommon'
import { IError } from '../../../utils/IError';

export class BrandController extends AbstractController {
    public static readonly schemas = {
        request: {
            updateBrand: JoiCommon.object.request.keys({
                params: Joi.object({
                    brandID: JoiCommon.string.id
                }).required(),

                body: Joi.object({
                    name: JoiCommon.string.companyName.optional(),

                    logoURL: Joi.string()
                        .allow(null)
                        .optional()
                })
                    .min(1) // at least one field must be updated
                    .required()
            })
        },
        response: {
            updateBrand: Joi.object({
                brand: Joi.object({
                    id: JoiCommon.string.id
                }).required(),
                message: Joi.string().required()
            }).required()
        }
    }

    constructor() {
        super()
    }

    private UpdateBrandReqType: Joi.extractType<typeof BrandController.schemas.request.updateBrand>
    private UpdateBrandResType: Joi.extractType<typeof BrandController.schemas.response.updateBrand>
    /**
     * @method updateBrand
     * @param req Authenticated admin request with brand ID and updated brand details.
     * @param res Response object to confirm the brand update.
     * @param next NextFunction to pass control to the next middleware.
     * @returns Returns the ID of the updated brand and a success message.
     * @throws IError(404) if the brand is not found.
     * @throws IError(403) if the admin is not the owner of the brand.
     */
    public async updateBrand(
        req: AuthAdminRequest & typeof this.UpdateBrandReqType,
        res: Response<typeof this.UpdateBrandResType>,
        next: NextFunction
    ) {
        try {
            const { user, params, body } = req

            const brand = await prisma.brand.findByID(params.brandID, {
                id: true,
                name: true,
                logoURL: true
            })

            if (!brand) {
                throw new IError(404, 'Brand not found')
            }

            if (user.brandID !== brand.id) {
                throw new IError(403, 'Not a brand owner')
            }

            prisma.brand.updateOne({ brandID: params.brandID }, {
                name: body.name ?? brand.name,
                logoURL: body.logoURL ?? brand.logoURL
            })

            return res.status(200).json({
                brand: { id: brand.id },
                message: 'Brand was successfully updated'
            })
        } catch (err) {
            return next(err)
        }
    }
}