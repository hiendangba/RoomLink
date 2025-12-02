import axios from "axios";
import refreshAxios from "./refreshAxios";
let getToken = () => localStorage.getItem("access_token");

export const setTokenGetter = (fn) => {
  getToken = fn;
};



const axiosClient = axios.create({
  baseURL: "https://roomlink-6im6.onrender.com/api",
  // baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false
})


axiosClient.interceptors.request.use((config) => {
  const token = getToken ? getToken() : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  async (response) => {
    return response.data; // trả về luôn data
  },
  async (error) => {
    const originalRequest = error.config;
    const publicAuthEndpoints = ['/auth/login', '/auth/register', '/auth/checkCCCD', '/auth/checkAvatar'];
    const isPublicAuthEndpoint = publicAuthEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));
    if (error.response?.status === 401 && !originalRequest._retry && !isPublicAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const res = await refreshAxios.post("/auth/refreshToken");
        console.log("Token đã được làm mới:", res);
        const newToken = res.data.token;
        setTokenGetter(() => newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        const retryResponse = await axios(originalRequest);
        return retryResponse.data; // trả về data của request cũ
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
