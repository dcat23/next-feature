import axios from 'axios';
import { auth } from '../auth';
import { BACKEND_API_URL } from '../config';

export const api = axios.create({
  baseURL: BACKEND_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const session = await auth();

    if (session?.user && 'jwtToken' in session.user) {
      config.headers['Authorization'] = session.user.jwtToken as string;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
