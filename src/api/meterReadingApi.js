import axiosClient from './axiosClient';

const meterReadingApi = {
  // POST - Tạo hóa đơn điện nước từ danh sách
  createMeterReading: (data) => {
    return axiosClient.post('/meterReading/createMeterReading', data);
  },

  // GET - Lấy danh sách hóa đơn điện nước
  getMeterReading: (params = {}) => {
    return axiosClient.get('/meterReading/getMeterReading', { params });
  },
};

export default meterReadingApi;

