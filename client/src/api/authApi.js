import api from './axios.js';

export const authApi = {
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  updateProfile: async (profileData) => {
    const res = await api.put('/user/profile', profileData);
    return res.data;
  },

  changePassword: async (passwordData) => {
    const res = await api.put('/user/password', passwordData);
    return res.data;
  },

  deleteAccount: async () => {
    const res = await api.delete('/user/account');
    return res.data;
  },
};

export default authApi;
