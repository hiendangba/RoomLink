import axiosClient from './axiosClient';

const numberPlateApi = {
  // GET - Lấy danh sách đơn đăng ký biển số (có thể filter theo status, page, limit, keyword)
  getNumberPlates: (params = {}) => {
    return axiosClient.get('/number-plate', { params });
  },

  // PATCH - Duyệt đơn đăng ký biển số (nhận mảng ids)
  approveNumberPlate: (ids) => {
    return axiosClient.patch('/number-plate', { ids });
  },

  // DELETE - Từ chối đơn đăng ký biển số (nhận mảng ids và lý do/lý do riêng)
  // reasonsData có thể là:
  // - { type: 'common', reason: '...' } - lý do chung
  // - { type: 'individual', reasons: { [id]: reason } } - lý do riêng
  rejectNumberPlate: (ids, reasonsData) => {
    let requestData;
    
    if (reasonsData?.type === 'individual') {
      // Gửi object reasons
      requestData = { ids, reasons: reasonsData.reasons };
    } else {
      // Gửi reason string (backward compatible)
      const reason = reasonsData?.reason || (typeof reasonsData === 'string' ? reasonsData : '');
      requestData = { ids, reason };
    }
    
    return axiosClient.delete('/number-plate/reject', { data: requestData });
  },
};

export default numberPlateApi;

