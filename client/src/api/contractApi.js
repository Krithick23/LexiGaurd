import api from './axios.js';

export const contractApi = {
  uploadAndAnalyze: async (formData, onProgress) => {
    const res = await api.post('/contracts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },

  getContracts: async (params = {}) => {
    const res = await api.get('/contracts', { params });
    return res.data;
  },

  getContractById: async (id) => {
    const res = await api.get(`/contracts/${id}`);
    return res.data;
  },

  deleteContract: async (id) => {
    const res = await api.delete(`/contracts/${id}`);
    return res.data;
  },

  compareContracts: async (contractId1, contractId2) => {
    const res = await api.post('/contracts/compare', {
      contractId1,
      contractId2,
    });
    return res.data;
  },

  getUserStats: async () => {
    const res = await api.get('/contracts/stats');
    return res.data;
  },

  loadSampleContract: async (sampleType = 'toxic') => {
    const res = await api.post('/contracts/sample-demo', {
      sampleType,
    });
    return res.data;
  },
};

export default contractApi;
