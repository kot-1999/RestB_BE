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
        bookingId: string,
        restaurantName: string,
        bookingDate: string,
        bookingTime: string,
        guestsNumber: number,
        previousStatus: string,
        newStatus: string,
        updatedAt: string,
        message?: string
    } :
    T extends typeof EmailType.employeeInvite ? {
        email: string,
        firstName: string | null,
        lastName: string | null,
        restaurantName: string,
        managerName: string,
        position: string,
        inviteCode: string,
        expiryDate: string,
        message?: string
    } : never