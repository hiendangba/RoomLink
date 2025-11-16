import axiosClient from "./axiosClient";

const userApi = {
  getUser() {
    return axiosClient.get("/user");
  },

  changePassword(data) {
    return axiosClient.patch("/user/change-password", data);
  },

  updateProfile(data) {
    return axiosClient.patch("/user/profile", data);
  },
};

export default userApi;

