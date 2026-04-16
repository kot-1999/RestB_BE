import { faker } from '@faker-js/faker';
import { Admin, AdminRole } from '@prisma/client'
import { expect } from 'chai'
import supertest from 'supertest'

import app from '../../../../../src/app'
import { BrandController } from '../../../../../src/controllers/b2b/v1/BrandController'
import { JwtService } from '../../../../../src/services/Jwt'
import prisma from '../../../../../src/services/Prisma'
import { JwtAudience } from '../../../../../src/utils/enums'

const endpoint = (val: string = '') => '/api/b2b/v1/brand/' + val

describe('PATCH ' + endpoint(''), () => {
    let admin: Admin

    beforeEach(async () => {
        admin = await prisma.admin.findOne({
            id: true,
            brandID: true
        }, {
            role: AdminRole.Admin
        })
    })
    
    it('Update brand (200)', async () => {
        const res = await supertest(app)
            .patch(endpoint(admin.brandID))
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: admin.id,
                aud: JwtAudience.b2b
            })}`)
            .send({
                name: 'My new brand',
                logoURL: faker.image.url()
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = BrandController.schemas.response.updateBrand.validate(res.body)
        expect(validationResult.error).to.eq(undefined)
    })

    it('Update brand logo (200)', async () => {
        const res = await supertest(app)
            .patch(endpoint(admin.brandID))
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: admin.id,
                aud: JwtAudience.b2b
            })}`)
            .send({
                logoURL: faker.image.url()
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = BrandController.schemas.response.updateBrand.validate(res.body)
        expect(validationResult.error).to.eq(undefined)
    })

    it('Brand not found (404)', async () => {
        const res = await supertest(app)
            .patch(endpoint(faker.string.uuid()))
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: admin.id,
                aud: JwtAudience.b2b
            })}`)
            .send({
                name: 'My new brand',
                logoURL: faker.image.url()
            })
        expect(res.statusCode).to.equal(404)
        expect(res.type).to.eq('application/json')
    })

    it('Can not update not own brand (403)', async () => {
        const newBrand = await prisma.brand.findOne({ id: true }, {
            id: {
                not: admin.brandID
            }
        })

        const res = await supertest(app)
            .patch(endpoint(newBrand.id))
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: admin.id,
                aud: JwtAudience.b2b
            })}`)
            .send({
                name: 'My new brand',
                logoURL: faker.image.url()
            })

        expect(res.statusCode).to.equal(403)
        expect(res.type).to.eq('application/json')
    })

    it('Employee can not update brand (401)', async () => {
        await prisma.admin.updateOne(admin.id, {
            role: AdminRole.Employee
        })

        const res = await supertest(app)
            .patch(endpoint(admin.brandID))
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${JwtService.generateToken({
                id: admin.id,
                aud: JwtAudience.b2b
            })}`)
            .send({
                name: 'My new brand',
                logoURL: faker.image.url()
            })

        expect(res.statusCode).to.equal(401)
        expect(res.type).to.eq('application/json')
    })
})