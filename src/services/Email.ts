import * as path from 'node:path'

import { BookingStatus } from '@prisma/client';
import config from 'config'
import dayjs from 'dayjs';
import ejs from 'ejs'
import { compile, compiledFunction } from 'html-to-text'
import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

import logger from './Logger';
import { IConfig } from '../types/config'
import { EmailDataType } from '../types/types'
import { EmailType } from '../utils/enums'
import { IError } from '../utils/IError'

/**
 * @class EmailService
 * @description Service responsible for building and sending transactional emails.
 * Supports multiple email types using EJS templates and Nodemailer.
 *
 * @param {IConfig['email']} config - Email configuration (SMTP host, port, credentials, etc.)
 *
 * @property {nodemailer.Transporter} transporter - Nodemailer transporter instance
 * @property {IConfig['email']} config - Email configuration object
 * @property {compiledFunction} htmlToTextCompiler - Utility to convert HTML to plain text
 *
 * @method sendEmail Sends an email based on provided type and data
 */
class EmailService {
    private transporter: nodemailer.Transporter
    private config: IConfig['email']
    private htmlToTextCompiler: compiledFunction

    /**
     * @method initTransporter
     * @description Initializes the Nodemailer transporter with SMTP configuration
     * @private
     * @returns {void}
     */
    private initTransporter(): void {
        this.transporter = nodemailer.createTransport({
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure,
            auth: {
                user: this.config.auth.user,
                pass: this.config.auth.pass
            }
        }).on('error', (err) => {
            logger.error('Email Service error', err)
        })
    }

    /**
     * @constructor
     * @param {IConfig['email']} config - Email service configuration
     */
    constructor(config: IConfig['email']) {
        this.config = config
        this.initTransporter()
        this.htmlToTextCompiler = compile()
        logger.info(`Connected to email server at PORT ${config.port}`)
        if (!config.secure) {
            logger.warn('Email service is running in unsecured mode')
        }
    }

    /**
     * @method buildRegistered
     * @description Builds email content for user registration (welcome email)
     *
     * @param {EmailDataType<EmailType.registered>} data - Email data payload
     * @returns {Promise<Mail.Options & { html: string }>}
     */
    private async buildRegistered(data: EmailDataType<EmailType.registered>): Promise<Mail.Options & { html: string }> {
        const templatePath = path.join(__dirname, 'emailTemplates', 'registration.ejs')
        const templateData = {
            firstName: data.firstName ?? 'dear customer',
            lastName: data.lastName ?? '',
            email: data.email
        }

        const htmlContent = await ejs.renderFile(templatePath, templateData)

        const mailOptions = {
            from: this.config.fromAddress,
            to: data.email,
            subject: 'Welcome to BE-proj!',
            html: htmlContent
        }

        return mailOptions
    }
    /**
     * @method buildForgotPassword
     * @description Builds email content for password reset requests
     *
     * @param {EmailDataType<EmailType.forgotPassword>} data - Email data payload
     * @returns {Promise<Mail.Options & { html: string }>}
     */
    private async buildForgotPassword(data: EmailDataType<EmailType.forgotPassword>)
        : Promise<Mail.Options & { html: string }> {
        const templatePath = path.join(__dirname, 'emailTemplates', 'forgotPassword.ejs')
        const templateData = {
            firstName: data.firstName ?? 'dear customer',
            lastName: data.lastName ?? '',
            link: data.link
        }
        const htmlContent = await ejs.renderFile(templatePath, templateData)

        const mailOptions = {
            from: this.config.fromAddress,
            to: data.email,
            subject: 'RestBoo - Reset password link',
            html: htmlContent
        }

        return mailOptions 
    }
    /**
     * @method buildEmployeeInvite
     * @description Builds email content for inviting an employee to a restaurant
     *
     * @param {EmailDataType<EmailType.employeeInvite>} data - Email data payload
     * @returns {Promise<Mail.Options & { html: string }>}
     */
    private async buildEmployeeInvite(data: EmailDataType<EmailType.employeeInvite>)
        : Promise<Mail.Options & { html: string }> {
        const templatePath = path.join(__dirname, 'emailTemplates', 'employeeInvite.ejs')
        const templateData = {
            email: data.email,
            restaurantName: data.restaurantName,
            managerFirstName: data.managerFirstName,
            managerLastName: data.managerLastName,
            position: data.position,
            link: data.link,
            expiryDate: data.expiryDate
        }
        const htmlContent = await ejs.renderFile(templatePath, templateData)

        const mailOptions = {
            from: this.config.fromAddress,
            to: data.email,
            subject: `RestBoo - Join ${data.restaurantName}`,
            html: htmlContent
        }

        return mailOptions
    }
    /**
     * @method bookingUpdate
     * @description Builds email content for booking status updates
     *
     * @param {EmailDataType<EmailType.bookingUpdated>} data - Email data payload
     * @returns {Promise<Mail.Options & { html: string }>}
     */
    private async bookingUpdate(data: EmailDataType<EmailType.bookingUpdated>)
        : Promise<Mail.Options & { html: string }> {
        const templatePath = path.join(__dirname, 'emailTemplates', 'bookingUpdated.ejs')

        const templateData = {
            firstName: data.firstName,
            lastName: data.lastName,
            restaurantName: data.restaurantName,
            bookingDate: dayjs(data.bookingDate).format('YYYY-MM-DD HH:mm'),
            guestsNumber: data.guestsNumber,
            newStatus: data.newStatus,
            updatedAt: data.updatedAt,
            message: data.message
        }
        const htmlContent = await ejs.renderFile(templatePath, templateData)

        const subject = data.newStatus === BookingStatus.Pending ? 'RestBoo - New booking was created' : `RestBoo - Booking was ${data.newStatus}`

        const mailOptions = {
            from: this.config.fromAddress,
            to: data.email,
            subject,
            html: htmlContent
        }

        return mailOptions
    }

    /**
     * @method sendEmail
     * @description Sends an email based on the provided email type and data
     *
     * @template T extends EmailType
     * @param {T} emailType - Type of email to send
     * @param {EmailDataType<T>} data - Email payload specific to the type
     *
     * @returns {Promise<void>}
     *
     * @throws {IError} If email type is unknown
     */
    public async sendEmail<T extends EmailType>(
        emailType: T,
        data: EmailDataType<T>
    ): Promise<void> {
        let mailOptions
        switch (emailType) {
        case EmailType.registered:
            mailOptions = await this.buildRegistered(data as EmailDataType<EmailType.registered>)
            break
        case EmailType.forgotPassword:
            mailOptions = await this.buildForgotPassword(data as EmailDataType<EmailType.forgotPassword>)
            break
        case EmailType.employeeInvite:
            mailOptions = await this.buildEmployeeInvite(data as EmailDataType<EmailType.employeeInvite>)
            break
        case EmailType.bookingUpdated:
            mailOptions = await this.bookingUpdate(data as EmailDataType<EmailType.bookingUpdated>)
            break
        default:
            throw new IError(500, `Unknown email type: ${emailType}`)
        }

        await this.transporter.sendMail({
            ...mailOptions,
            text: this.htmlToTextCompiler(mailOptions.html) // text version of html
        }).catch((err) => {
            logger.error('Email sending error', err)
        })
    }
}
const emailConfig = config.get<IConfig['email']>('email')
const emailService = new EmailService(emailConfig)

export default emailService
