export enum UserRole {
    COSTOMER = 'COSTOMER',
    RESTURANT_OWNER = 'RESTURANT_OWNER',
    DELIVER = 'DELIVER',
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    createdAt: Date;
}

export interface HealthCheckResponse {
    status: string;
    timestamp: Date;   
}