import axios from 'axios';

const backendUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
const apiBaseUrl = backendUrl
  ? `${backendUrl.replace(/\/api$/i, '')}/api`
  : import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : undefined;

if (!apiBaseUrl) {
  throw new Error('VITE_API_URL must be set to the Render backend URL in production.');
}

// withCredentials => the browser sends/receives the httpOnly auth cookie
const api = axios.create({ baseURL: apiBaseUrl, withCredentials: true });

export const errMsg = (e) => e?.response?.data?.message || 'Something went wrong. Please try again.';
export default api;
