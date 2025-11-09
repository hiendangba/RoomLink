import React from 'react';
import Button from '../components/ui/Button';

const AdminPage = () => {
  const handleChangePassword = () => {
    window.location.href = '/change-password';
  };

  const handleFaceRegistration = () => {
    window.location.href = '/register-face';
  };

  const handleExtensionApproval = () => {
    window.location.href = '/extension-approval';
  };

  const handleRoomRegistrationApproval = () => {
    window.location.href = '/room-registration-approval';
  };

  const handleRoomCancellationApproval = () => {
    window.location.href = '/room-cancellation-approval';
  };

  const handleVehicleRegistrationApproval = () => {
    window.location.href = '/vehicle-registration-approval';
  };

  const handleRoomTypeManagement = () => {
    window.location.href = '/room-type-management';
  };

  const handleCreateAdminAccount = () => {
    window.location.href = '/create-admin-account';
  };

  const handleRoomManagement = () => {
    window.location.href = '/room-management';
  };

  const handleGoToHealthCheckup = () => {
    window.location.href = '/health-checkup-admin';
  };

  const handleUIDemo = () => {
    window.location.href = '/ui-demo';
  };

  const handleElectricityWaterBillCreation = () => {
    window.location.href = '/electricity-water-bill-creation';
  };

  const handleRoomTransferApproval = () => {
    window.location.href = '/room-transfer-approval';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Trang Quản Trị</h1>
          
          {/* Nhóm 1: Quản lý sinh viên */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Quản lý sinh viên
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
              <div className="bg-blue-50 p-6 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={handleRoomRegistrationApproval}>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Duyệt đơn đăng ký</h3>
                <p className="text-blue-600 text-sm">Xem và duyệt các đơn đăng ký phòng ở với AI</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={handleExtensionApproval}>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Duyệt gia hạn</h3>
                <p className="text-blue-600 text-sm">Xem và duyệt các đơn gia hạn phòng ở</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={handleRoomCancellationApproval}>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Duyệt hủy phòng</h3>
                <p className="text-blue-600 text-sm">Xem và duyệt các đơn hủy phòng</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={handleRoomTransferApproval}>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Duyệt chuyển phòng</h3>
                <p className="text-blue-600 text-sm">Xem và duyệt các đơn chuyển phòng</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={handleVehicleRegistrationApproval}>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Duyệt đăng ký xe</h3>
                <p className="text-blue-600 text-sm">Xem và duyệt các đơn đăng ký biển số xe</p>
              </div>
            </div>
          </div>

          {/* Nhóm 2: Quản lý phòng */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Quản lý phòng
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
              <div className="bg-green-50 p-6 rounded-lg cursor-pointer hover:bg-green-100 transition-colors" onClick={handleRoomTypeManagement}>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Quản lý loại phòng</h3>
                <p className="text-green-600 text-sm">Thêm, sửa, xóa và quản lý các loại phòng ở KTX</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg cursor-pointer hover:bg-green-100 transition-colors" onClick={handleRoomManagement}>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Quản lý phòng</h3>
                <p className="text-green-600 text-sm">CRUD phòng ở - Thêm, sửa, xóa phòng</p>
              </div>
            </div>
          </div>

          {/* Nhóm 3: Quản lý tài chính */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
              Quản lý tài chính
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
              <div className="bg-orange-50 p-6 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors" onClick={handleElectricityWaterBillCreation}>
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Tạo hóa đơn điện nước</h3>
                <p className="text-orange-600 text-sm">Nhập tài liệu và tự động tạo hóa đơn điện nước</p>
              </div>
            </div>
          </div>

          {/* Nhóm 4: Dịch vụ & Hỗ trợ */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Dịch vụ & Hỗ trợ
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
              <div className="bg-blue-50 p-6 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={handleGoToHealthCheckup}>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Khám sức khỏe</h3>
                <p className="text-blue-600 text-sm">Quản lý đợt khám sức khỏe cho sinh viên</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors" onClick={handleUIDemo}>
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Demo UI Components</h3>
                <p className="text-purple-600 text-sm">Xem demo các component UI chuẩn</p>
              </div>
            </div>
          </div>

          {/* Nhóm 5: Cài đặt & Bảo mật */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
              Cài đặt & Bảo mật
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
              <div className="bg-purple-50 p-6 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors" onClick={handleChangePassword}>
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Đặt lại mật khẩu</h3>
                <p className="text-purple-600 text-sm">Thay đổi mật khẩu tài khoản</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg cursor-pointer hover:bg-green-100 transition-colors" onClick={handleFaceRegistration}>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Đăng ký khuôn mặt</h3>
                <p className="text-green-600 text-sm">Đăng ký khuôn mặt để đăng nhập nhanh</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors" onClick={handleCreateAdminAccount}>
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Tạo tài khoản Admin</h3>
                <p className="text-purple-600 text-sm">Tạo tài khoản quản trị viên mới</p>
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

export default AdminPage;
