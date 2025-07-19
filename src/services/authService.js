import axios from 'axios';

const API_URL = 'http://localhost:8080/cursos/auth';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const login = (credentials) => {
  return apiClient.post('/login', credentials);
};

const register = (userData) => {
  return apiClient.post('/register', userData);
};

const authService = {
  login,
  register,
};

export default authService;