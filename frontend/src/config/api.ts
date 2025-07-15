// src/config/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE}/auth/login`,
  REGISTER: `${API_BASE}/auth/register`,
  PROFILE: `${API_BASE}/auth/profile`,
  DASHBOARD_STATS: `${API_BASE}/dashboard/stats`,
  DASHBOARD_ACTIVITIES: `${API_BASE}/dashboard/activities`,
  TALENTS: `${API_BASE}/talents`,
  MISSIONS: `${API_BASE}/missions`,
  CONTRACTS: `${API_BASE}/contracts`,
  PAYMENTS: `${API_BASE}/payments`,
  ACADEMY_COURSES: `${API_BASE}/academy/courses`,
  ACADEMY_PROGRESS: `${API_BASE}/academy/progress`,
  MATCHING: `${API_BASE}/matching`,
  NOTIFICATIONS: `${API_BASE}/notifications`,
}; 