// In production (Vercel), frontend and backend share the same domain.
// In development, the backend runs on localhost:5000.
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const apiService = {
    // Generic request helper that includes the JWT token
    request: async (endpoint: string, options: any = {}) => {
        const token = sessionStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (response.status === 401) {
            // Only redirect if we're not already trying to login
            if (!endpoint.includes('/auth/login')) {
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
                window.location.href = '/login';
                throw new Error('Session expired. Please login again.');
            }
        }

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    },

    get: (endpoint: string) => apiService.request(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: any) => apiService.request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint: string, body: any) => apiService.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint: string) => apiService.request(endpoint, { method: 'DELETE' }),
};

export const authService = {
    register: async (userData: any) => {
        return apiService.post('/auth/register', userData);
    },

    login: async (credentials: any) => {
        const data = await apiService.post('/auth/login', credentials);
        if (data.token) {
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    logout: () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const user = sessionStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    getMembersList: async () => {
        return apiService.get('/user/members-list');
    },

    refresh: async () => {
        const data = await apiService.post('/auth/refresh', {});
        if (data.token) {
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    }
};

export const projectService = {
    getAll: async (params: { search?: string, page?: number, limit?: number }) => {
        const query = new URLSearchParams(params as any).toString();
        return apiService.get(`/projects?${query}`);
    },
    create: async (projectData: any) => {
        return apiService.post('/projects', projectData);
    },
    update: async (id: number, projectData: any) => {
        return apiService.put(`/projects/${id}`, projectData);
    },
    delete: async (id: number) => {
        return apiService.delete(`/projects/${id}`);
    }
};

export const ticketService = {
    getAll: async (params: { search?: string, type?: string, priority?: string, status?: string, projectId?: any, startDate?: string, endDate?: string, assigneeId?: any, page?: number, limit?: number }) => {
        const filteredParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== 'All')
        );
        const query = new URLSearchParams(filteredParams as any).toString();
        return apiService.get(`/tickets?${query}`);
    },
    getById: async (id: number) => {
        return apiService.get(`/tickets/${id}`);
    },
    create: async (ticketData: any) => {
        return apiService.post('/tickets', ticketData);
    },
    updateStatus: async (id: number, status: string) => {
        return apiService.put(`/tickets/${id}/status`, { status });
    },
    update: async (id: number, ticketData: any) => {
        return apiService.put(`/tickets/${id}`, ticketData);
    },
    delete: async (id: number) => {
        return apiService.delete(`/tickets/${id}`);
    }
};

export const noteService = {
    getAll: async (params: { search?: string, type?: string, projectId?: any, filter?: string, page?: number, limit?: number }) => {
        const filteredParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
        );
        const query = new URLSearchParams(filteredParams as any).toString();
        return apiService.get(`/notes?${query}`);
    },
    create: async (noteData: any) => {
        return apiService.post('/notes', noteData);
    },
    update: async (id: number, noteData: any) => {
        return apiService.put(`/notes/${id}`, noteData);
    },
    delete: async (id: number) => {
        return apiService.delete(`/notes/${id}`);
    },
    togglePin: async (id: number) => {
        return apiService.put(`/notes/${id}/pin`, {});
    },
    share: async (id: number, shares: { userId: number, canEdit: boolean }[]) => {
        return apiService.post(`/notes/${id}/share`, { shares });
    }
};

export const commentService = {
    getAllByTicket: async (ticketId: number) => {
        return apiService.get(`/comments/ticket/${ticketId}`);
    },
    create: async (ticketId: number, content: string) => {
        return apiService.post('/comments', { ticketId, content });
    }
};

export const notificationService = {
    getAll: async () => {
        return apiService.get('/notifications');
    },
    markRead: async (id: number) => {
        return apiService.put(`/notifications/${id}/read`, {});
    },
    markAllRead: async () => {
        return apiService.put('/notifications/mark-all-read', {});
    },
    delete: async (id: number) => {
        return apiService.delete(`/notifications/${id}`);
    }
};

