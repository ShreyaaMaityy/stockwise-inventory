import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorDetails = {
      message: 'An unexpected error occurred.',
      status: error.response?.status,
      data: error.response?.data,
    };

    if (error.response?.data) {
      const data = error.response.data;
      if (data.message) {
        errorDetails.message = data.message;
      } else if (data.detail) {
        if (typeof data.detail === 'string') {
          errorDetails.message = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorDetails.message = data.detail
            .map((d) => `${d.loc[d.loc.length - 1] || 'Field'}: ${d.msg}`)
            .join(', ');
        }
      }
    } else if (error.message) {
      errorDetails.message = error.message;
    }

    return Promise.reject(errorDetails);
  }
);

export default apiClient;
