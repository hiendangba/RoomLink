import axiosClient from "./axiosClient";

const renewalApi = {
  // POST - Tạo đợt renewal mới (Admin only)
  createRenewal: () => {
    return axiosClient.post("/renewals");
  },

  // PATCH - Dừng đợt renewal đang active (Admin only)
  stopRenewal: () => {
    return axiosClient.patch("/renewals");
  },

  // GET - Lấy renewal đang active
  getActive: () => {
    return axiosClient.get("/renewals/active");
  },

  // GET - Lấy lịch sử renewal (Admin only)
  // params: { page, limit, keyword, status } (status: All/Active/Inactive)
  getHistory: (params = {}) => {
    return axiosClient.get("/renewals/history", { params });
  }
};

export default renewalApi;

