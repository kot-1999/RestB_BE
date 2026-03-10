import { EmailType } from '../utils/enums'

export type EmailDataType<T extends EmailType> =
    T extends typeof EmailType.registered ? {
        email: string,
        firstName: string | null,
        lastName: string | null
    } :
    T extends typeof EmailType.forgotPassword ? {
        id: string,
        email: string,
        firstName: string | null,
        lastName: string | null,
        link: string
    } :
    T extends typeof EmailType.bookingUpdated ? {
        email: string,
        firstName: string | null,
        lastName: string | null,
        restaurantName: string,
        bookingDate: string,
        guestsNumber: number,
        newStatus: string,
        updatedAt: string,
        message?: string
    } :
    T extends typeof EmailType.employeeInvite ? {
        email: string,
        restaurantName: string,
        managerFirstName: string,
        managerLastName: string,
        position: string,
        link: string,
        expiryDate: string
    } : never