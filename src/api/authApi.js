import axiosClient from "./axiosClient";

const authApi = {
  register(data) {
    return axiosClient.post("/auth/register", data);
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
};

export default authApi;