import axiosClient from './axiosClient';

const roomRegistrationApi = {
  // GET - Lấy danh sách đơn đăng ký (có thể filter theo status, page, limit)
  getRoomRegistrations: (params = {}) => {
    return axiosClient.get('/room-registrations', { params });
  },

  // PATCH - Duyệt đơn đăng ký (nhận mảng ids)
  approveRoomRegistration: (ids) => {
    return axiosClient.patch('/room-registrations', { ids });
  },

  // DELETE - Từ chối đơn đăng ký (nhận mảng ids và lý do)
  // reasonsData có thể là:
  // - { type: 'common', reason: '...' } - lý do chung
  // - { type: 'individual', reasons: { [id]: reason } } - lý do riêng
  rejectRoomRegistration: (ids, reasonsData) => {
    let requestData;
    
    if (reasonsData?.type === 'individual') {
      // Gửi object reasons
      requestData = { ids, reasons: reasonsData.reasons };
    } else {
      // Gửi reason string (backward compatible)
      const reason = reasonsData?.reason || (typeof reasonsData === 'string' ? reasonsData : '');
      requestData = { ids, reason };
    }
    
    return axiosClient.delete('/room-registrations/reject', { data: requestData });
  },

  // DELETE - Hủy đăng ký phòng (cho sinh viên)
  // data: { reason: string (optional), checkoutDate: string (required, ISO date) }
  cancelRoomRegistration: (data) => {
    return axiosClient.delete('/room-registrations/cancel', { data });
  },
};

export default roomRegistrationApi;

