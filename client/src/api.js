import axios from 'axios';

// withCredentials => the browser sends/receives the httpOnly auth cookie
const api = axios.create({ baseURL: '/api', withCredentials: true });

export const errMsg = (e) => e?.response?.data?.message || 'Something went wrong. Please try again.';
export default api;
