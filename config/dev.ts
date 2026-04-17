import 'dotenv/config'
import process from 'node:process';

import { S3ClientConfig } from '@aws-sdk/client-s3';
import { Request } from 'express'
import { ExtractJwt } from 'passport-jwt'

import { IConfig } from '../src/types/config'
import { NodeEnv } from '../src/utils/enums'

const isProd = process.env.NODE_ENV === NodeEnv.Prod

const options: IConfig = {
    app: {
        name: 'RestBoo',
        port: process.env.PORT as string,
        env: process.env.NODE_ENV as NodeEnv,
        frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3055'
    },
    cookieSession: {
        name: 'session',
        secret: [process.env.COOKIE_SECRET_KEY as string],
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            secure: isProd,
            httpOnly: isProd
        }
        // NOTE: 'store' option will be defined in app.ts
    },
    database: {
        dbURL: process.env.MYSQL_URL as string
    },
    googleStrategy: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: '/api/b2c/v1/authorization/google/redirect'
    } : null,
    passport: {
        jwtFromCookie: ExtractJwt.fromExtractors([
            (req: Request) => {
                return req?.session?.jwt ?? null // Extract JWT from cookies
            }
        ]),
        jwtFromRequestHeader: ExtractJwt.fromAuthHeaderAsBearerToken()
    },
    jwt: {
        secret: process.env.JWT_SECRET as string,
        expiresIn: 24 * 60 * 60 * 1000, // 24 hours
        algorithm: 'HS256'
    },
    encryption: {
        key: process.env.ENCRYPTION_KEY as string
    },
    email: {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.EMAIL_PASSWORD  as string,
            pass: process.env.EMAIL_PASSWORD as string
        },
        fromAddress: process.env.EMAIL_FROM_ADDRESS as string
    },
    redis: {
        name: 'redis_' + process.env.NODE_ENV,
        password: process.env.REDIS_PASSWORD,
        username: process.env.REDIS_USER,
        socket: {
            host: process.env.REDIS_HOST as string,
            port: Number(process.env.REDIS_PORT)
        }
    },
    helmet: {
        contentSecurity: {
            useDefaults: false,
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", 'apis.google.com', 'code.jquery.com', 'cdn.jsdelivr.net'],
                styleSrc: ["'self'", 'fonts.googleapis.com', "'unsafe-inline'"],
                fontSrc: ["'self'", 'fonts.gstatic.com'],
                imgSrc: ["'self'", '*'],
                connectSrc: ["'self'", '*'],
                frameSrc: [
                    "'self'",
                    'https://www.google.com',
                    'https://maps.google.com'
                ]
            }
        }
    },
    rateLimiter: {
        windowMs: 1 * 60 * 1000, // 1 minutes
        limit: 50000, // Limit each IP to 45 requests per `window` (here, per 1 minutes)
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false // Disable the `X-RateLimit-*` headers
        // NOTE: 'store' option will be defined in app.ts
    },
    logger: {
        debug: {
            isLoggedToConsole: true
        },
        error: {
            isLoggedToConsole: true,
            isLoggedToSentry: false
        },
        info: {
            isLoggedToConsole: true
        },
        warn: {
            isLoggedToConsole: true
        }
    },
    sentry: process.env.SENTRY_DNS ? {
        environment: process.env.NODE_ENV as NodeEnv,
        dsn: process.env.SENTRY_DNS as string,
        tracesSampleRate: 1.0, //  Capture 100% of the transactions
        profilesSampleRate: 1.0,
        release: 'latest',
        debug: false
    } : null,
    s3: {
        region: process.env.S3_REGION as string,

        endpoint: process.env.S3_ENDPOINT as string,

        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string
        },

        forcePathStyle: true,
        requestChecksumCalculation: 'WHEN_REQUIRED'
    }
}
export default options