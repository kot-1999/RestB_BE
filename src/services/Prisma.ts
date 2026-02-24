import { Prisma, PrismaClient } from '@prisma/client'

import logger from './Logger';
import AdminQueries from '../database/queries/AdminQueries';
import BookingQueries from '../database/queries/BookingQueries';
import BrandQueries from '../database/queries/BrandQueries';
import DashboardQueries from '../database/queries/DashboardQueries';
import RestaurantQueries from '../database/queries/RestaurantQueries';
import UserQueries from '../database/queries/UserQueries'

interface Queries {
    user: UserQueries,
    admin: AdminQueries,
    booking: BookingQueries,
    brand: BrandQueries,
    restaurant: RestaurantQueries,
    dashboard: DashboardQueries
}

class PrismaService {
    private client: any
    constructor() {
        this.client = new PrismaClient({
            log: [{
                level: 'warn',
                emit: 'event'
            }, {
                level: 'error',
                emit: 'event'
            },{
                level: 'info',
                emit: 'event'
            }]
        })

        this.client.$on('warn', (e: Prisma.LogEvent) => {
            logger.warn(`[Prisma] ${e.message}`);
        })

        this.client.$on('error', (e: Prisma.LogEvent) => {
            logger.error(`[Prisma] ${e.message}`);
        })

        this.client.$on('info', (e: Prisma.LogEvent) => {
            logger.info(`[Prisma] ${e.message}`);
        })

        logger.info('Prisma client was created')
    }

    public attachQueries (queries: Queries) {
        // NOTE: $extends client method should be used after $on
        // as extended client doesnt support $on and $use
        this.client = this.client.$extends({
            model: {
                user: {
                    findOne: queries.user.findOne,
                    softDelete: queries.user.softDelete,
                    findByID: queries.user.findByID,
                    createOne: queries.user.createOne,
                    updateOne: queries.user.updateOne
                },
                admin: {
                    findOne: queries.admin.findOne,
                    softDelete: queries.admin.softDelete,
                    findByID: queries.admin.findByID,
                    createOne: queries.admin.createOne,
                    updateOne: queries.admin.updateOne
                },
                booking: {
                    findOne: queries.booking.findOne,
                    softDelete: queries.booking.softDelete,
                    findByID: queries.booking.findByID,
                    createOne: queries.booking.createOne,
                    updateOne: queries.booking.updateOne
                },
                brand: {
                    findOne: queries.brand.findOne,
                    softDelete: queries.brand.softDelete,
                    findByID: queries.brand.findByID,
                    createOne: queries.brand.createOne,
                    updateOne: queries.brand.updateOne
                },
                restaurant: {
                    findOne: queries.restaurant.findOne,
                    softDelete: queries.restaurant.softDelete,
                    findByID: queries.restaurant.findByID,
                    createOne: queries.restaurant.createOne,
                    updateOne: queries.restaurant.updateOne
                },
                dashboard: {

                }

            }
        })
    }

    public getPrismaClient() {
        return this.client
    }
}

const prismaService = new PrismaService()

const baseClient = prismaService.getPrismaClient()

prismaService.attachQueries({
    user: new UserQueries(baseClient),
    admin: new AdminQueries(baseClient),
    booking: new BookingQueries(baseClient),
    brand: new BrandQueries(baseClient),
    dashboard: new DashboardQueries(),
    restaurant: new RestaurantQueries(baseClient)
})

const prisma = prismaService.getPrismaClient()

export default prisma