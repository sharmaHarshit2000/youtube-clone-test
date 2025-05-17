// src/features/auth/authAPI.js
import axiosInstance from '../../utils/axiosInstance';

// Register (multipart/form-data)
export const register = (formData) =>
  axiosInstance.post('/auth/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const login = (data) => axiosInstance.post('/auth/login', data);

export const getMe = () => axiosInstance.get('/auth/me');
