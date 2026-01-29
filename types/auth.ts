

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}