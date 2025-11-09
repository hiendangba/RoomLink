import axiosClient from "./axiosClient";

const userApi = {
  getUser() {
    return axiosClient.get("/user");
  },
};

export default userApi;

