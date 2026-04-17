import { Prisma, PrismaClient } from '@prisma/client'

import logger from './Logger'
import AddressQueries from '../database/queries/AddressQueries'
import AdminQueries from '../database/queries/AdminQueries'
import BookingQueries from '../database/queries/BookingQueries'
import BrandQueries from '../database/queries/BrandQueries'
import DashboardQueries from '../database/queries/DashboardQueries'
import RestaurantQueries from '../database/queries/RestaurantQueries'
import UserQueries from '../database/queries/UserQueries'

/**
 * @interface Queries
 * @description Collection of query classes used to extend Prisma models
 */
interface Queries {
    user: UserQueries,
    admin: AdminQueries,
    booking: BookingQueries,
    brand: BrandQueries,
    restaurant: RestaurantQueries,
    dashboard: DashboardQueries
    address: AddressQueries
}

/**
 * @class PrismaService
 * @description Wrapper around PrismaClient that:
 * - Initializes Prisma with logging
 * - Attaches custom query methods via $extends
 * - Provides a centralized Prisma instance
 *
 * @property client - Prisma client instance (extended with custom queries)
 *
 * @method attachQueries Extends Prisma models with custom query methods
 * @method getPrismaClient Returns the current Prisma client instance
 */
class PrismaService {
    private client: any

    /**
     * @constructor
     * @description Initializes Prisma client with logging and event listeners
     */
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

    /**
     * @method attachQueries
     * @description Extends Prisma models with custom query methods using $extends.
     * NOTE: Must be called after $on, since extended client does not support $on/$use.
     *
     * @param {Queries} queries - Object containing query class instances
     *
     * @returns {void}
     */
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
                address: {
                    findOne: queries.address.findOne,
                    softDelete: queries.address.softDelete,
                    findByID: queries.address.findByID,
                    createOne: queries.address.createOne,
                    updateOne: queries.address.updateOne
                }
            }
        })

        this.client.dashboard = queries.dashboard
    //     this.client.booking = queries.booking
    //     this.client.brand = queries.brand
    //     this.client.restaurant = queries.restaurant
    //     this.client.user = queries.user
    //     this.client.admin = queries.admin
    //     this.client.address = queries.address
    }

    /**
     * @method getPrismaClient
     * @description Returns the current Prisma client instance
     *
     * @returns {any} Prisma client (possibly extended)
     */
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
    restaurant: new RestaurantQueries(baseClient),
    address: new AddressQueries(baseClient)
})

const prisma = prismaService.getPrismaClient()

export default prisma