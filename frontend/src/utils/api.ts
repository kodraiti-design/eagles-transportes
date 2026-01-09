export// Automatically determine API URL based on environment
    const isDev = window.location.port === '5173';
let apiUrl = '';

if (isDev) {
    // Development: Frontend on 5173, Backend on 8000
    const hostname = window.location.hostname;
    apiUrl = `http://${hostname}:8000`;
} else {
    // Production / Ngrok: Frontend and Backend on same origin
    // Remove trailing slash if present
    apiUrl = window.location.origin.replace(/\/$/, "");
}

export const API_URL = apiUrl;
