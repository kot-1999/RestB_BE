export enum PassportStrategy {
    google = 'google',
    jwtB2c = 'jwt-b2c',
    jwtB2cForgotPassword = 'jwt-b2c-forgot_password',
    jwtB2b = 'jwt-b2b',
    jwtB2bForgotPassword = 'jwt-b2b-forgot_password',
    jwtB2bInvite = 'jwt-b2b-invite'
}

export enum EmailType {
    forgotPassword = 'forgotPassword',
    registered = 'registered',
    bookingUpdated = 'bookingUpdated',
    employeeInvite = 'employeeInvite'
}

export enum JwtAudience {
    b2c ='b2c',
    b2b = 'b2b',
    b2cForgotPassword = 'b2cfps',
    b2bForgotPassword = 'b2bfps'
}

export enum NodeEnv {
    Dev = 'dev',
    Prod = 'prod',
    Test = 'test',
}