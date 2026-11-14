import axios from 'axios';

/**
 * Single Axios instance for every backend call. The frontend never reads JSON files directly.
 * The demo role travels in a header (prototype only; see README "Demo authentication").
 */
export const ROLE_STORAGE_KEY = 'msk.demoRole';
const ROLES = ['administrator', 'medical-specialist', 'astronaut'];

export const getStoredRole = () => {
  try {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY);
    return ROLES.includes(stored) ? stored : 'administrator';
  } catch {
    return 'administrator';
  }
};

let activeRole = getStoredRole();
export const setApiRole = (role) => { activeRole = role; };

export class ApiError extends Error {
  constructor(message, { status, details, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details ?? [];
    this.code = code;
  }
}

const client = axios.create({
  baseURL: '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  config.headers['x-demo-role'] = activeRole;
  return config;
});

// Success responses resolve to the body: { success, message, data, meta? }.
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const body = error.response?.data;
    let message = body?.message;
    if (!message) {
      message = error.code === 'ECONNABORTED'
        ? 'The request timed out. Check that the backend is still running.'
        : 'Cannot reach the API. Start the backend with "npm run dev" from the project root.';
    }
    return Promise.reject(new ApiError(message, { status, details: body?.details, code: body?.error }));
  },
);

/** Clean params: drops empty, "all" and null values so filters stay optional. */
export const cleanParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'all'));

export default client;
