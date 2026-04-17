# RestBoo - Backend

- Frontend repository: [https://github.com/kot-1999/RestB_FE](https://github.com/kot-1999/RestB_FE)
- Backend template: [https://github.com/kot-1999/BE-express](https://github.com/kot-1999/BE-express)
## Content

- [About RestBoo](#about-restboo)
- [How to start](#how-to-start)
  - [Prerequisites](#prerequisites)
  - [Run application](#run-application)
  - [Test data](#test-data)
- [Useful links](#useful-links)
- [Project Structure](#project-structure)
- [Backend and DevOps features](#backend-and-devops-features)
- [Application overview](#application-overview)
- [Team](#team)
- [License](#license)

---

## About RestBoo

**RestBoo** is a multi-role restaurant booking platform designed to simplify and centralise the reservation process for both customers and restaurant operators.

The system allows users to discover restaurants, view availability in real time, and make reservations instantly without the need for phone calls or manual coordination. At the same time, restaurant owners and administrators gain a powerful dashboard to manage bookings, staff, locations, and availability across multiple branches.

RestBoo focuses on eliminating common problems in the hospitality industry such as double bookings, fragmented tools, and inefficient communication between staff and customers. By centralising all operations into a single system, it improves operational efficiency, reduces administrative workload, and increases table occupancy rates.

The platform supports both B2C and B2B workflows, enabling:
- Customers to easily book, modify, and cancel reservations
- Administrators to manage restaurants, brands, and staff at scale
- Real-time updates across all bookings and availability
- Secure authentication and role-based access control

Overall, RestBoo provides a scalable and structured solution for modern restaurant booking management, combining usability for customers with operational control for businesses.

![alt text](./docs/images/home.png)

---

## How to start
### Prerequisites
- Ensure that Docker engine alongside with Docker Desktop app are installed on your system;
- `docker compose` must be available.

### Run application

Following steps describe how to run the application in **dev** mode on local machine

Feel free to copy-paste following commands.

**1. Clone GitHub repo:**

```terminaloutput
git clone https://github.com/kot-1999/RestB_BE.git
```

**2. Enter the directory:**

```terminaloutput
cd RestB_BE
```

**3. Create `.env.dev` file:**

```terminaloutput
cat <<EOF > .env.dev
NODE_ENV=dev
PORT=3000

ENCRYPTION_KEY=someKey
COOKIE_SECRET_KEY=someSalt

JWT_SECRET=jwt_secret
JWT_EXPIRES_IN=1h

MYSQL_URL=mysql://admin:mysql@dev_mysql:3306/development
MYSQL_PORT=3306
MYSQL_USER=admin
MYSQL_PASSWORD=mysql
MYSQL_DB=development

EMAIL_HOST=mailhog
EMAIL_SMTP_PORT=1025
EMAIL_HTTP_PORT=8025
EMAIL_USER=admin
EMAIL_PASSWORD=mailhog
EMAIL_FROM_ADDRESS=app@dev.com

REDIS_PORT=6379
REDIS_HOST=redis
REDIS_PASSWORD=redisDevPass
REDIS_MAX_MEMORY=256

S3_ACCESS_KEY_ID=admin
S3_SECRET_ACCESS_KEY=admin123
S3_REGION=eu-west-2
S3_ENDPOINT=http://rustfs_dev:9000
S3_PORT=9000

ALLOW_CONFIG_MUTATIONS=true
EOF
```

> 📝 Given environmental file profides config for docker containers.
> It doesn't carry any secret variables or keys.

**4. When all preparations are done run the application in one of two ways:**
```terminaloutput
## Using npm
npm run docker:dev

## Directly via docker compose
docker compose  --env-file .env.dev --profile dev up
```

When the application is up and running you can open the app on localhost http://localhost:3000


> 📝 Starting time varies from one machine to another.
> Running the project might take from several seconds up to several minutes.  

### Test data

The application automatically seeds the database with a large set of demo data when running in the development environment.

This is handled via the `seed.ts` script and is executed as part of the initial setup process.

The database is populated with realistic sample data to simulate a production-like environment, including.

- **Users:** `user1@gmail.com` → `user300@gmail.com`
- **Admins:** `admin1@gmail.com` → `admin300@gmail.com`
- **Employees:** `employee1-1@gmail.com` → `employee300-1@gmail.com`

All seeded user accounts share a common development password for convenience:

- **Password:** `test123`

Email addresses are generated dynamically during the seeding process.

> ⚠️ This data is intended for development and testing purposes only and should not be used in production environments.

---

## Useful links

Once the application is up and running, the following services will be available:

- **http://localhost:3000**  
  Main application entry point (backend API and frontend access)

- **http://localhost:3000/info**  
  Backend welcome/info page

- **http://localhost:3000/api/docs**  
  API documentation (Swagger UI)

- **http://localhost:8025**  
  Mailhog interface for viewing emails sent by the application

---

## Project Structure
This project follows a layered, feature-based backend architecture with clear separation between B2C and B2B domains and strong service abstraction.
```
RestB_BE/
│
├── .husky/           # Pre commit script
│   ├── pre-commit
│
├── .github/          # CI/CD workflows
│   ├── workflows/ci.yml
│
├── config/           # Environment configs for the backend (dev/test)
│   ├── dev.ts
│   ├── test.ts
│
├── src/
│   ├── index.ts      # Application entry point
│   ├── app.ts        # Express app setup
│   │
│   ├── controllers/  # HTTP layer (request handling)
│   │
│   ├── routes/       # API routing layer
│   │
│   ├── types/        # TypeScript definitions & extensions
│   │
│   ├── services/     # Business logic + external integrations
│   │   ├── Jwt.ts               # JWT creation, verification, and token lifecycle management
│   │   ├── Redis.ts             # Redis client setup and caching/session utilities
│   │   ├── Prisma.ts            # Prisma client initialization and database connection handling
│   │   ├── Passport.ts          # Authentication strategies and Passport.js configuration
│   │   ├── Sentry.ts            # Error tracking and monitoring setup (Sentry integration)
│   │   ├── Logger.ts            # Centralized logging service for application events and errors
│   │   ├── Email.ts             # Email sending logic (SMTP integration, template usage)
│   │   ├── AwsS3.ts             # File upload and storage service (S3-compatible API)
│   │   ├── Encryption.ts        # Data encryption and hashing utilities (e.g., passwords, secrets)
│   │   ├── OpenStreetMapService.ts  # Geolocation and address-related operations via OSM APIs
│   │   │
│   │   ├── emailTemplates/      # EJS templates for transactional emails
│   │       ├── bookingUpdated.ejs   # Template for booking update notifications
│   │       ├── registration.ejs     # Template for user registration emails
│   │       ├── forgotPassword.ejs   # Template for password reset emails
│   │       ├── employeeInvite.ejs   # Template for employee invitation emails
│   │
│   ├── database/
│   │   ├── queries/              # Query layer (DB abstraction)
│   │
│   ├── middlewares/              # Express middlewares
│   │   ├── authorizationMiddleware.ts    # Verifies user authentication (e.g., JWT/session) and attaches user context
│   │   ├── permissionMiddleware.ts       # Enforces role-based or resource-based access control
│   │   ├── validationMiddleware.ts       # Validates incoming requests against schemas (e.g., Joi) and rejects invalid data
│   │   ├── errorMiddleware.ts            # Global error handler that formats and sends consistent error responses
│   │
│   ├── utils/                    # Helpers & shared utilities
│       ├── enums.ts
│       ├── Constants.ts
│       ├── helpers.ts
│       ├── IError.ts
│   
│
├── prisma/                       # Database schema (Prisma)
│   ├── schema.prisma
│
├── scripts/                      # Seeders, assets, utilities
│   ├── seed.ts                   # Populates the database with initial or test data
│   ├── apiDoc.ts                 # Generates API documentation (e.g., Swagger/OpenAPI)
│
├── tests/                        # Unit & integration tests
│
├── docker-compose.yml            # Defines full local development environment (app, DB, Redis, etc.)
├── docker-compose.base.yml       # Base/shared Docker configuration used across environments
├── .gitignore                    # Specifies files and folders ignored by Git
├── eslint.config.js              # ESLint configuration for code linting rules
├── tsconfig.json                 # Main TypeScript configuration
├── tsconfig.eslint.json          # TypeScript config used specifically for ESLint
├── package.json                  # Project metadata, dependencies, and npm scripts
├── package-lock.json             # Locked dependency versions for consistent installs
├── .mocharc.js                   # Mocha test runner configuration
```

---
## Backend and DevOps features

- **Full Dockerization:** The entire application is containerized using Docker, allowing for seamless setup and deployment. With Docker, you can run the project without worrying about environment configurations.
- **Express with TypeScript:** Combines the flexibility of Express.js with the type safety of TypeScript, enhancing code quality and developer experience.
- **Authentication:**
    - **Google OAuth:** Enables users to authenticate using their Google accounts.
    - **JWT Authentication:** Implements JSON Web Token (JWT) authentication for stateless and secure user sessions.
    - **Session Management:** Manages authentication sessions with cookies for persistent user sessions. Ass session key storage is used Redis
    - **Forgot Password Workflow**: Secure forgot-password mechanism with token-based authentication and email verification.
- **Prisma ORM:** Utilizes Prisma as the Object-Relational Mapping tool, facilitating seamless database interactions and migrations.
- **Security:**
    - **AES Encryption:** Protects sensitive data which are sent via HTTP TCP connection by encrypting it using the AES algorithm.
    - **SHA256 Hashing:** Ensures data integrity and security through the SHA256 hashing algorithm.
    - **Rate Limiting with Redis**: Limits the number of incoming requests. Use Redis as storage
    - **Content Security Policy (CSP) with Helmet**:  A strict Content Security Policy is set using helmet to prevent malicious content from being loaded (Prevents XSS attacks for example).
- **Centralized Error Handling:** Implements a centralized mechanism to handle errors consistently across the application.
- **Testing with Mocha and Chai:** Sets up testing frameworks Mocha and Chai for writing and running unit and integration tests. Tests can also be executed within Docker containers for consistency.
- **Input Validation with Joi:** Uses Joi for validating request inputs, ensuring data integrity and reliability. Additionally, leverages @goodrequest/joi-type-extract to extract TypeScript types from Joi schemas.
- **Environment Configuration:** Manages configuration using a .env file, allowing for easy environment variable management.
- **Husky**: Runs `npm run lint` and `npm run db:validate` scripts before each commit to ensure code quality and schema validity.
- **Soft Deletion**: Implements logical deletion for database records using a deletedAt column, ensuring data integrity while maintaining recoverability.
- **Email Service**: Built-in email functionality for sending transactional emails, including support for password recovery.
- **RESTful API Design:**: Clean and intuitive API endpoints.
- **Logging**: The application uses Winston with DailyRotateFile for logging. Logs are stored based on severity levels (`info`, `warn`, `error`, `debug`) and are rotated daily.
    - Logs are stored in the `logs/{env}/{level}/%DATE%.log` directory.
    - Console logging is configurable per log level using isLoggedToConsole.
- **Sentry**: Application uses Sentry for:
    - Performance Monitoring: Tracks API request performance and latency.
    - Request Tracing: Provides insights into slow endpoints and bottlenecks.
    - Error Tracking: Automatically captures and reports unhandled exceptions and errors.
    - SentryErrorTransport: Supports manual error reporting with contextual information depending on `winston` settings.
- **GitHub Actions:**  Are used for  continuous integration. The CI pipeline automatically runs tests when changes are pushed or pull requests are created.

---

## Application Overview


### Application From User Perspective

From a user’s perspective, the application provides a simple and intuitive way to discover restaurants and manage bookings.

Users can browse available restaurants, view detailed information such as location, categories, and other relevant details, and select a restaurant that suits their preferences.

Once a restaurant is selected, users can create a booking by choosing a suitable date and time.

After creating a booking, users can:
- View their existing reservations
- Chat with restaurant administration
- Cancel bookings if needed (only before the scheduled time and date)

---

#### Home Page
<a href="./docs/images/home.png" target="_blank">
  <img src="./docs/images/home.png" alt="Home page" width="320"/>
</a>  

<sub>Main entry point where users can browse available restaurants.</sub>

#### Home Footer
<a href="./docs/images/home-footer.png" target="_blank">
  <img src="./docs/images/home-footer.png" alt="Home footer" width="320"/>
</a>  

<sub>Footer section containing additional navigation and general information.</sub>

#### Restaurant Details
<a href="./docs/images/restDetails.png" target="_blank">
  <img src="./docs/images/restDetails.png" alt="Restaurant details" width="320"/>
</a>  

<sub>Additional restaurant information including location and extended details.</sub>

#### User Bookings Overview
<a href="./docs/images/userBookings.png" target="_blank">
  <img src="./docs/images/userBookings.png" alt="User bookings overview" width="320"/>
</a>  

<sub>List of all bookings created by the user with status tracking.</sub>

#### User Profile
<a href="./docs/images/user-profile.png" target="_blank">
  <img src="./docs/images/user-profile.png" alt="User profile" width="320"/>
</a>  

<sub>User account page for managing personal information and preferences.</sub>

---

### Application From Admin Perspective

From an administrator’s perspective, the application provides full control over restaurant management and booking operations.

Admins are responsible for managing core business entities within the system. They can create, update, and delete restaurants, configure availability, and manage associated data such as addresses and brands.

The platform supports multi-restaurant management, allowing admins to oversee multiple locations from a single interface.

In addition to restaurant management, admins can:
- View and manage all bookings across their restaurants
- Approve, reject, or update booking details
- Monitor booking activity and system usage
- Manage staff by assigning employees to specific restaurants

The system enforces role-based access control, ensuring that only authorized administrators can perform high-level operations.

---

#### Admin Dashboard
<a href="./docs/images/dashboard.png" target="_blank">
  <img src="./docs/images/dashboard.png" alt="Admin dashboard" width="320"/>
</a>  

<sub>Central dashboard providing an overview of restaurants load.</sub>


#### Booking Management
<a href="./docs/images/adminManageBookings.png" target="_blank">
  <img src="./docs/images/adminManageBookings.png" alt="Admin booking management" width="320"/>
</a>  

<sub>Admin view of booking restaurant cards with today's summaries such as numbers of expecting guests and pending bookings.</sub>

#### Bookings per Restaurant
<a href="./docs/images/bookingAdmin.png" target="_blank">
  <img src="./docs/images/bookingAdmin.png" alt="Bookings per restaurant overview" width="320"/>
</a>  

<sub>Overview of bookings grouped by restaurant.</sub>

#### Restaurants Overview
<a href="./docs/images/restPage.png" target="_blank">
  <img src="./docs/images/restPage.png" alt="Restaurants overview" width="320"/>
</a>  

<sub>List of all managed restaurants with options to edit or remove them.</sub>

#### Restaurant Create / Edit
<a href="./docs/images/restmanage.png" target="_blank">
  <img src="./docs/images/restmanage.png" alt="Restaurant create or edit" width="320"/>
</a>  

<sub>Interface for creating or updating restaurant details and configuration.</sub>

---

### Application From Employee Perspective

From an employee’s perspective, the application focuses on booking management within a specific restaurant.

Employees are assigned to one restaurant and have limited access. Their primary responsibility is to manage bookings and ensure smooth day-to-day operations.

Employees can:
- View bookings for their assigned restaurant
- Update booking statuses (e.g., confirm, modify, or cancel reservations)
- Handle customer requests related to bookings

Unlike administrators, employees do not have permission to:
- Create, update, or delete restaurants
- Manage brands or system-wide configurations
- Assign or manage other staff members

This restricted access ensures a clear separation of responsibilities and prevents unauthorized modifications to critical business data.

---

### Authentication Flows

The application supports multiple authorization flows tailored for different user roles and scenarios.

#### Login
<a href="./docs/images/auth/login.png" target="_blank">
  <img src="./docs/images/auth/login.png" alt="User login form" width="180"/>
</a>  

<sub>Standard user authentication with email and password.</sub>

#### Admin Registration
<a href="./docs/images/auth/register-partner.png" target="_blank">
  <img src="./docs/images/auth/register-partner.png" alt="Admin registration" width="180"/>
</a>  

<sub>Partner (admin) account creation with extended permissions.</sub>

#### Employee Registration
<a href="./docs/images/auth/registerNewEmployee.png" target="_blank">
  <img src="./docs/images/auth/registerNewEmployee.png" alt="Employee registration" width="180"/>
</a>  

<sub>Onboarding flow for employees invited by admins.</sub>

#### Forgot Password
<a href="./docs/images/auth/forgot-password.png" target="_blank">
  <img src="./docs/images/auth/forgot-password.png" alt="Forgot password" width="180"/>
</a> 

<sub>Allows users to request a password reset via email.</sub>

#### Reset Password
<a href="./docs/images/auth/reset-password.png" target="_blank">
  <img src="./docs/images/auth/reset-password.png" alt="Reset password" width="180"/>
</a>  

<sub>Secure form to set a new password using a reset token.</sub>

---

### Email Notifications

The system sends automated email notifications for key user actions and events.

#### Password Reset Email
<a href="./docs/images/email/emailReset.png" target="_blank">
  <img src="./docs/images/email/emailReset.png" alt="Password reset email" width="320"/>
</a>  

<sub>Contains a secure link for resetting the user's password.</sub>

#### Booking Approved
<a href="./docs/images/email/emailBookingApproved.png" target="_blank">
  <img src="./docs/images/email/emailBookingApproved.png" alt="Booking approved email" width="320"/>
</a> 

<sub>Notifies users when their booking request is confirmed.</sub>

#### Employee Invitation
<a href="./docs/images/email/emailInvitation.png" target="_blank">
  <img src="./docs/images/email/emailInvitation.png" alt="Employee invitation email" width="320"/>
</a>  

<sub>Invitation email allowing new employees to join the platform.</sub>

#### New Booking Notification
<a href="./docs/images/email/emailNewBooking.png" target="_blank">
  <img src="./docs/images/email/emailNewBooking.png" alt="New booking notification email" width="320"/>
</a>  

<sub>Alerts admins and employees about newly created bookings.</sub>

---


## Team
- **Oleksandr Kashytskyi** — [sashakashytskyy@gmail.com](mailto:sashakashytskyy@gmail.com)  
  Idea creator, backend developer, system architect, database designer

- **Stephen Lyne** — [slyne234@gmail.com](mailto:slyne234@gmail.com)  
  Frontend developer, UI/UX designer
---



---

## License
This project is licensed under the Apache-2.0 License.

