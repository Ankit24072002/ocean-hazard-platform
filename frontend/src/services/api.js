import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API || "http://localhost:4000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Offline functionality: Cache successful GET requests
api.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get' && response.config.url.includes('/report')) {
      localStorage.setItem(`offline_cache_${response.config.url}`, JSON.stringify(response.data));
    }
    return response;
  },
  (error) => {
    // If offline and making a GET request, serve from cache if available
    if (!navigator.onLine && error.config && error.config.method === 'get' && error.config.url.includes('/report')) {
      const cachedData = localStorage.getItem(`offline_cache_${error.config.url}`);
      if (cachedData) {
        return Promise.resolve({ data: JSON.parse(cachedData), status: 200, statusText: 'OK', isOfflineCache: true });
      }
    }

    // If offline and making a POST request to reports, save as draft
    if (!navigator.onLine && error.config && error.config.method === 'post' && error.config.url.includes('/report')) {
      const drafts = JSON.parse(localStorage.getItem('offline_drafts') || '[]');
      try {
        const payload = typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data;
        drafts.push({ url: error.config.url, data: payload, timestamp: Date.now() });
        localStorage.setItem('offline_drafts', JSON.stringify(drafts));
      } catch (e) {
        console.error("Failed to parse offline draft data", e);
      }
      return Promise.reject(new Error('Offline: Report securely saved as a draft'));
    }
    return Promise.reject(error);
  }
);

// Automatically sync offline drafts when connection is restored
window.addEventListener('online', async () => {
  const drafts = JSON.parse(localStorage.getItem('offline_drafts') || '[]');
  if (drafts.length > 0) {
    localStorage.removeItem('offline_drafts'); // Clear early to avoid duplicate syncs
    for (const draft of drafts) {
      try {
        await api.post(draft.url, draft.data);
      } catch (e) {
        console.error('Failed to sync offline draft:', e);
      }
    }
  }
});

export default api;
