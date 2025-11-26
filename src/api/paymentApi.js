import axiosClient from "./axiosClient";

const paymentApi = {
  // GET - Lấy danh sách payment theo userId
  // params: { userId, type, page, limit, keyword }
  getPaymentByUserId: (params = {}) => {
    return axiosClient.get("/payment/getPayment", { params });
  },

  // POST - Lấy payment URL để thanh toán
  getPaymentUrl: (data) => {
    return axiosClient.post("/payment/getPaymentUrl", data);
  },

  // GET - Kiểm tra trạng thái thanh toán
  checkPayment: (params = {}) => {
    return axiosClient.get("/payment/checkPayment", { params });
  }
};

export default paymentApi;

