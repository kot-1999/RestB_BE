import * as fs from 'node:fs'
import * as path from 'node:path'

import config from 'config'
import { RedisStore as RedisSessionStore } from 'connect-redis'
import cors from 'cors'
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat'
import express from 'express'
import rateLimit from 'express-rate-limit';
import session from 'express-session'
import helmet from 'helmet'
import passport from 'passport'
import { RedisStore as RedisRateLimitStore } from 'rate-limit-redis'
import swaggerUi from 'swagger-ui-express'

import errorMiddleware from './middlewares/errorMiddleware' // eslint-disable-next-line import/order
import authorizeRouters from './routes'

// Initialize services
import './services/Passport'
import './services/Prisma'
import './services/AwsS3'
import logger from './services/Logger'
import redis from './services/Redis'
import { IConfig } from './types/config'
import { NodeEnv } from './utils/enums';

dayjs.extend(customParseFormat);

// Configs
const cookieSessionConfig = config.get<IConfig['cookieSession']>('cookieSession')
const helmetConfig = config.get<IConfig['helmet']>('helmet')
const appConfig = config.get<IConfig['app']>('app')
const rateLimitConfig = config.get<IConfig['rateLimiter']>('rateLimiter')

// Local variables
const app = express()
const redisClient = redis.getRedisClient()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: true,
    credentials: true
}))
// Create and use security policy middleware
app.use(helmet.contentSecurityPolicy(helmetConfig.contentSecurity))

// Create and use the rate limiter
if (appConfig.env !== NodeEnv.Test) {
    app.use(rateLimit({
    // Rate limiter configuration
        ...rateLimitConfig,

        // Redis store configuration
        store: new RedisRateLimitStore({
            sendCommand: (...args: string[]) => redisClient.sendCommand(args)
        }),
        keyGenerator: (req) => {
            const forwarded = req.headers['x-forwarded-for'];

            if (forwarded) {
                return forwarded.toString().split(',')[0].trim();
            }

            return req.ip || 'unknown';
        },
        handler: (req, res) => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}`)
            res.status(429).json({ error: 'Too many requests' });
        }
    }))
}

// Create and express-session middleware
app.use(session({
    secret: cookieSessionConfig.secret,
    resave: cookieSessionConfig.resave,
    store: new RedisSessionStore({
        client: redisClient,
        prefix: 'app_session: '
    }),
    saveUninitialized: cookieSessionConfig.saveUninitialized,
    name: cookieSessionConfig.name,
    cookie: {
        maxAge: cookieSessionConfig.cookie.maxAge,
        secure: cookieSessionConfig.cookie.secure,
        httpOnly: cookieSessionConfig.cookie.httpOnly
    }
}))

// Initialize passport and passport-session (express-session should be initialized before).
app.use(passport.initialize())
app.use(passport.session())

// Routes initialization
app.use('/api', authorizeRouters())
app.get('/api/test/sentry', (req, res) => {
    res.status(200).json({ message: 'done' })
})

const apiDocPath = path.join(__dirname, '../dist/apiDoc/swaggerApi.json')
if (fs.existsSync(apiDocPath)) {
    const swaggerDocument = JSON.parse(fs.readFileSync(apiDocPath, 'utf-8'))

    // Serve Swagger UI at /api/docs
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
}

// The error handler must be registered before any other error middleware and after all controllers

// Error middleware initialization.
// NOTE: Should be defined as the last middleware to prevent
// losing information about bugs and errors
app.use(errorMiddleware)

// Default route
app.get('/', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`
    const mailUrl = `${req.protocol}://${req.hostname}`
    res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>${appConfig.name}</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            max-width: 700px;
            margin: 60px auto;
            line-height: 1.6;
            padding: 0 20px;
        }
        h1 { margin-bottom: 5px; }
        .box {
            background: #f7f7f7;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
        }
        a { color: #0b6cff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .tag {
            display: inline-block;
            background: #eee;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 12px;
            margin-left: 6px;
        }
    </style>
</head>

<body>
    <h1>${appConfig.name}</h1>
    <p>Backend REST API service is running successfully.</p>
    <p>Checkout our frontend app at /index.html</p>
    <div class="box">
        <strong>📚 API Documentation</strong>
        <p>
            <a href="${baseUrl}/api/docs" target="_blank">${baseUrl}/api/docs</a>
        </p>
    </div>

    <div class="box">
        <strong>📧 Mail Server UI</strong>
        <p>Email HTTP server is available for development testing.</p>
        <a href="${mailUrl}:8025" target="_blank">${mailUrl}:8025</a>
    </div>
    
    <div class="box">
        <strong>📊 UML Diagram .drawio</strong>
        <p>
            <a href="https://drive.google.com/file/d/1jBwhy8yuRduCu-nWBWwJf8l_qkBhIvqG/view?usp=sharing" target="_blank"> Google Drive File</a>
        </p>
    </div>
    
    <div class="box">
        <strong>📊 Monitoring</strong>
        <p>Sentry is enabled for error monitoring and performance tracking.</p>
    </div>
    
    <div class="box">
        <strong>⚙ Environment</strong>
         <p style="margin-top:40px; font-size:13px; color:#777;">
            ${appConfig.name} • Node.js • Express
        </p>
    </div>
</body>
</html>
`)
})

const fePath = path.join(__dirname, '..', 'RestB_FE', 'dist')
if (fs.existsSync(fePath)) {
    app.use(express.static(fePath))
    logger.info('Frontend is available at /index.html')
} else {
    logger.error(`index.html file wasn't found in ${fePath}`)
}

export default app