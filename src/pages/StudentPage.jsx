import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import { renewalApi } from '../api';

const StudentPage = () => {
  const [hasActiveRenewal, setHasActiveRenewal] = useState(false);
  const [loadingRenewal, setLoadingRenewal] = useState(true);

  useEffect(() => {
    const checkActiveRenewal = async () => {
      try {
        setLoadingRenewal(true);
        const response = await renewalApi.getActive();
        if (response.success !== false && response.data) {
          setHasActiveRenewal(true);
        } else {
          setHasActiveRenewal(false);
        }
      } catch (error) {
        setHasActiveRenewal(false);
      } finally {
        setLoadingRenewal(false);
      }
    };

    checkActiveRenewal();
  }, []);
  const handleRoomRegistration = () => {
    window.location.href = '/register-room';
  };

  const handleEditProfile = () => {
    window.location.href = '/edit-profile';
  };


  const handleChangePassword = () => {
    window.location.href = '/change-password';
  };

  const handleRoomExtension = () => {
    window.location.href = '/room-extension';
  };

  const handleRoomTransfer = () => {
    window.location.href = '/room-transfer';
  };

  const handleRoomCancellation = () => {
    window.location.href = '/room-cancellation';
  };

  const handleBillsView = () => {
    window.location.href = '/bills';
  };


  const handleHealthCheckup = () => {
    window.location.href = '/health-checkup';
  };

  const handleVehicleRegistration = () => {
    window.location.href = '/vehicle-registration';
  };

  const handleMyRoom = () => {
    window.location.href = '/my-room';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Trang Sinh Viên</h1>
          
          {/* Nhóm 1: Quản lý phòng ở */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Quản lý phòng ở
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
              <div className="bg-blue-50 p-6 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => window.location.href = '/my-room-info'}>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Xem thông tin phòng</h3>
                <p className="text-blue-600 text-sm">Xem chi tiết thông tin phòng và hợp đồng của bạn</p>
              </div>
              {hasActiveRenewal && (
                <>
                  <div className="bg-orange-50 p-6 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors" onClick={handleRoomExtension}>
                    <h3 className="text-lg font-semibold text-orange-800 mb-2">Gia hạn thời gian ở</h3>
                    <p className="text-orange-600 text-sm">Gia hạn thời gian ở KTX</p>
                  </div>
                  <div className="bg-teal-50 p-6 rounded-lg cursor-pointer hover:bg-teal-100 transition-colors" onClick={handleRoomTransfer}>
                    <h3 className="text-lg font-semibold text-teal-800 mb-2">Chuyển phòng</h3>
                    <p className="text-teal-600 text-sm">Chuyển từ phòng hiện tại sang phòng khác</p>
                  </div>
                </>
              )}
              <div className="bg-red-50 p-6 rounded-lg cursor-pointer hover:bg-red-100 transition-colors" onClick={handleRoomCancellation}>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Hủy phòng</h3>
                <p className="text-red-600 text-sm">Gửi đơn yêu cầu hủy phòng và trả phòng</p>
              </div>
            </div>
          </div>

          {/* Nhóm 2: Thanh toán & Hóa đơn */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
              Thanh toán & Hóa đơn
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
              <div className="bg-indigo-50 p-6 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors" onClick={handleBillsView}>
                <h3 className="text-lg font-semibold text-indigo-800 mb-2">Hóa đơn thanh toán</h3>
                <p className="text-indigo-600 text-sm">Xem và thanh toán tất cả các giao dịch thanh toán</p>
              </div>
            </div>
          </div>

          {/* Nhóm 3: Dịch vụ khác */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
              Dịch vụ khác
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
              <div className="bg-pink-50 p-6 rounded-lg cursor-pointer hover:bg-pink-100 transition-colors" onClick={handleHealthCheckup}>
                <h3 className="text-lg font-semibold text-pink-800 mb-2">Đăng ký khám sức khỏe</h3>
                <p className="text-pink-600 text-sm">Đăng ký tham gia các đợt khám sức khỏe định kỳ</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors" onClick={handleVehicleRegistration}>
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Đăng ký biển số xe</h3>
                <p className="text-purple-600 text-sm">Đăng ký thông tin xe để ra vào KTX</p>
              </div>
            </div>
          </div>

          {/* Nhóm 4: Thông tin cá nhân */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Thông tin cá nhân
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
              <div className="bg-blue-50 p-6 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={handleEditProfile}>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Thông tin cá nhân</h3>
                <p className="text-blue-600 text-sm">Xem và chỉnh sửa thông tin cá nhân</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors" onClick={handleChangePassword}>
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Đặt lại mật khẩu</h3>
                <p className="text-purple-600 text-sm">Thay đổi mật khẩu tài khoản</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <Button
              variant="primary"
              onClick={() => window.location.href = '/'}
            >
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPage;
