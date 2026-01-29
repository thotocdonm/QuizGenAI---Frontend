export const setToken = (accessToken: string, refreshToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
}

export const getAccessToken = () => {
    return localStorage.getItem("accessToken");
}

export const getRefreshToken = () => {
    return localStorage.getItem("refreshToken");
}

export const clearToken = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
}