// Central API Configuration for Local Dev & Cloud Deployment (Render / Vercel)
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';
