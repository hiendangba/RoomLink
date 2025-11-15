import axiosClient from "./axiosClient";

const authApi = {
  register(data) {
    return axiosClient.post("/auth/register", data);
  },

  registerAdmin(data) {
    return axiosClient.post("/auth/register-admin", data);
  },

  checkCCCD(data) {
    return axiosClient.post("/auth/checkCCCD", data, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  },

  checkAvatar(data) {
    return axiosClient.post("/auth/checkAvatar", data, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })
  },

  login(data) {
    return axiosClient.post("/auth/login", data);
  },

  forgotPassword(data) {
    return axiosClient.post("/auth/forgot-password", data);
  },

  resendOTP(data) {
    return axiosClient.post("/auth/resend-otp", data);
  },

  verifyOTP(data) {
    return axiosClient.post("/auth/verify-otp", data, {
      withCredentials: true
    });
  },

  resetPassword(data) {
    return axiosClient.patch("/auth/reset-password", data, {
      withCredentials: true
    });
  },
};

export default authApi;