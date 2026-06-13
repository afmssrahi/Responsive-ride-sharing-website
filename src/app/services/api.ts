// Centralized API client for UniRide frontend
// All backend communication goes through this module

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// ── Token management ──────────────────────────────────────────────
export function getAccessToken(): string | null {
  return localStorage.getItem('uniride_token');
}
export function getRefreshToken(): string | null {
  return localStorage.getItem('uniride_refresh');
}
export function setTokens(access: string, refresh: string) {
  localStorage.setItem('uniride_token', access);
  localStorage.setItem('uniride_refresh', refresh);
}
export function clearTokens() {
  localStorage.removeItem('uniride_token');
  localStorage.removeItem('uniride_refresh');
}

// ── Core fetch wrapper ────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${getAccessToken()}` };
      const retry = await fetch(`${BASE_URL}${path}`, { ...options, headers: retryHeaders });
      if (!retry.ok) throw new ApiError(retry.status, await retry.json());
      return retry.json();
    } else {
      clearTokens();
      window.location.href = '/login';
      throw new ApiError(401, { message: 'Session expired' });
    }
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = { message: 'Server returned an invalid response (not JSON).' };
  }
  
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.data.accessToken, data.data.refreshToken);
    return true;
  } catch { return false; }
}

export class ApiError extends Error {
  constructor(public status: number, public data: any) {
    super(data?.message || 'API Error');
  }
}

// ── Convenience methods ───────────────────────────────────────────
const get = <T>(path: string) => request<T>(path, { method: 'GET' });
const post = <T>(path: string, body?: any) => request<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) });
const put = <T>(path: string, body?: any) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
const patch = <T>(path: string, body?: any) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

// ── AUTH ──────────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    post<{ success: boolean; data: { user: any; accessToken: string; refreshToken: string } }>('/auth/login', { email, password }),
  register: (data: { name: string; email: string; phone?: string; password: string }) =>
    post<{ success: boolean; data: { user: any; accessToken: string; refreshToken: string } }>('/auth/register', data),
  logout: () => post('/auth/logout'),
  me: () => get<{ success: boolean; data: any }>('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    post('/auth/change-password', data),
  driverApply: (formData: FormData) =>
    post<{ success: boolean; data: { user: any; accessToken: string; refreshToken: string } }>('/auth/driver/apply', formData),
};

// ── USER ──────────────────────────────────────────────────────────
export const users = {
  getProfile: () => get<{ success: boolean; data: any }>('/users/profile'),
  updateProfile: (data: { name?: string; phone?: string }) => put('/users/profile', data),
  getRideHistory: (page = 1) => get<{ success: boolean; rides: any[]; meta: any }>(`/users/rides?page=${page}`),

  getSavedPlaces: () => get<{ success: boolean; data: any[] }>('/users/saved-places'),
  addSavedPlace: (data: { label: string; address: string; lat?: number; lng?: number }) =>
    post('/users/saved-places', data),
  deleteSavedPlace: (id: string) => del(`/users/saved-places/${id}`),

  getPaymentMethods: () => get<{ success: boolean; data: any[] }>('/users/payment-methods'),
  addPaymentMethod: (data: any) => post('/users/payment-methods', data),
  setDefaultPayment: (id: string) => put(`/users/payment-methods/${id}/default`),
  deletePaymentMethod: (id: string) => del(`/users/payment-methods/${id}`),

  getPreferences: () => get<{ success: boolean; data: any }>('/users/preferences'),
  updatePreferences: (data: any) => put('/users/preferences', data),
};

// ── DRIVER ────────────────────────────────────────────────────────
export const drivers = {
  getProfile: () => get<{ success: boolean; data: any }>('/drivers/profile'),
  updateProfile: (data: any) => put('/drivers/profile', data),
  updateVehicle: (data: any) => put('/drivers/vehicle', data),
  updatePayout: (data: any) => put('/drivers/payout', data),
  updateWorkPreferences: (data: any) => put('/drivers/work-preferences', data),
  toggleOnline: () => post<{ success: boolean; data: { isOnline: boolean } }>('/drivers/toggle-online'),
  getEarnings: (period: 'week' | 'month' = 'week') =>
    get<{ success: boolean; data: any }>(`/drivers/earnings?period=${period}`),
  getRatings: (page = 1) => get<{ success: boolean; ratings: any[]; avg: number }>(`/drivers/ratings?page=${page}`),
  getDocuments: () => get<{ success: boolean; data: any[] }>('/drivers/documents'),
  uploadDocument: (formData: FormData) =>
    post('/drivers/documents', formData),
  getTrips: (page = 1) => get<{ success: boolean; trips: any[]; meta: any }>(`/drivers/trips?page=${page}`),
};

// ── RIDES ─────────────────────────────────────────────────────────
export const rides = {
  create: (data: any) => post<{ success: boolean; data: any }>('/rides/create', data),
  search: (params: any) => {
    const query = new URLSearchParams(params).toString();
    return get<{ success: boolean; rides: any[]; meta: any }>(`/rides/search?${query}`);
  },
  getShared: (params?: any) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    return get<{ success: boolean; rides: any[]; meta: any }>(`/rides/shared?${query}`);
  },
  getById: (id: string) => get<{ success: boolean; data: any }>(`/rides/${id}`),
  bookSeat: (id: string, data: any) => post(`/rides/${id}/book-seat`, data),
  approveRequest: (rideId: string, requestId: string) =>
    patch(`/rides/${rideId}/approve/${requestId}`),
  rejectRequest: (rideId: string, requestId: string) =>
    patch(`/rides/${rideId}/reject/${requestId}`),
  cancel: (id: string, reason?: string) => post(`/rides/${id}/cancel`, { reason }),
  start: (id: string) => post(`/rides/${id}/start`),
  complete: (id: string) => post(`/rides/${id}/complete`),
  pay: (id: string, paymentMethod: string) => post<{ success: boolean; data: any }>(`/rides/${id}/pay`, { paymentMethod }),
  accept: (id: string) => post<{ success: boolean; data: any }>(`/rides/${id}/accept`),
  myCreated: (page = 1) => get<{ success: boolean; rides: any[]; meta: any }>(`/rides/my-created?page=${page}`),
  myJoined: (page = 1) => get<{ success: boolean; rides: any[]; meta: any }>(`/rides/my-joined?page=${page}`),
  getTypes: () => get<{ success: boolean; data: any[] }>('/rides/types'),
  getPendingRequests: (page = 1) =>
    get<{ success: boolean; rides: any[]; meta: any }>(`/rides/pending-requests?page=${page}`),
};

// ── ADMIN ─────────────────────────────────────────────────────────
export const admin = {
  getOverview: () => get<{ success: boolean; data: any }>('/admin/overview'),
  getUsers: (page = 1, search?: string, role?: string) => {
    const params = new URLSearchParams({ page: String(page), ...(search && { search }), ...(role && { role }) });
    return get<{ success: boolean; users: any[]; meta: any }>(`/admin/users?${params}`);
  },
  updateUserStatus: (id: string, status: string) => put(`/admin/users/${id}/status`, { status }),
  getDrivers: (page = 1, search?: string) => {
    const params = new URLSearchParams({ page: String(page), ...(search && { search }) });
    return get<{ success: boolean; drivers: any[]; meta: any }>(`/admin/drivers?${params}`);
  },
  approveDriver: (id: string, approved: boolean) => put(`/admin/drivers/${id}/approve`, { approved }),
  getRides: (page = 1, status?: string) => {
    const params = new URLSearchParams({ page: String(page), ...(status && { status }) });
    return get<{ success: boolean; rides: any[]; meta: any }>(`/admin/rides?${params}`);
  },
  getAnalytics: () => get<{ success: boolean; data: any[] }>('/admin/analytics'),
  getSettings: () => get<{ success: boolean; data: Record<string, string> }>('/admin/settings'),
  updateSettings: (data: Record<string, string>) => put('/admin/settings', data),
  getActivityLog: (page = 1) => get<{ success: boolean; logs: any[]; meta: any }>(`/admin/activity-log?page=${page}`),
};

// ── RATINGS ───────────────────────────────────────────────────────
export const ratings = {
  submit: (data: { rideId: string; toUserId: string; rating: number; comment?: string }) =>
    post('/ratings', data),
};

// ── CHAT ──────────────────────────────────────────────────────────
export const chat = {
  getConversation: (rideId: string) =>
    get<{ success: boolean; data: { conversation: any; ride: any } }>(`/chat/${rideId}`),
  sendMessage: (rideId: string, body: string) =>
    post<{ success: boolean; data: any }>(`/chat/${rideId}/send`, { body }),
  getUnreadCount: () =>
    get<{ success: boolean; data: { count: number } }>('/chat/unread-count'),
};

// ── NOTIFICATIONS ────────────────────────────────────────────────
export const notifications = {
  getAll: (page = 1) =>
    get<{ success: boolean; notifications: any[]; unreadCount: number; meta: any }>(`/notifications?page=${page}`),
  markRead: (id: string) => patch(`/notifications/${id}/read`),
  markAllRead: () => patch('/notifications/read-all'),
};

