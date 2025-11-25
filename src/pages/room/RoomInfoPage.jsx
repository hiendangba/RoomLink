import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import InfoBox from '../../components/ui/InfoBox';
import StatusBadge from '../../components/ui/StatusBadge';
import roomApi from '../../api/roomApi';

const RoomInfoPage = ({ onCancel }) => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        const response = await roomApi.getRoomByUser();
        if (response.success && response.data) {
          // Map API response to component format
          const mappedData = {
            registerDate: response.data.registerDate,
            endDate: response.data.endDate,
            duration: response.data.duration,
            status: response.data.status,
            name: response.data.name,
            identification: response.data.identification,
            mySlotNumber: response.data.mySlotNumber,
            roomNumber: response.data.roomNumber,
            capacity: response.data.capacity,
            monthlyFee: response.data.monthlyFee,
            roomSlot: response.data.roomSlot || [],
            roomType: response.data.roomType || {}
          };
          setRoomData(mappedData);
        } else {
          const errorMessage = response?.message || 'Không tìm thấy thông tin phòng.';
          showError(errorMessage);
        }
      } catch (err) {
        console.error('Error fetching room data:', err);
        // Chỉ hiển thị lỗi nếu không phải lỗi "không tìm thấy phòng" (404 hoặc RoomRegistrationNotFound)
        const errorCode = err?.response?.data?.errorCode;
        const statusCode = err?.response?.status;
        const isNotFoundError = statusCode === 404 || errorCode === 'ROOM_REGISTRATION_NOT_FOUND';
        
        if (!isNotFoundError) {
          const errorMessage = err?.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin phòng.';
          showError(errorMessage);
        }
        // Nếu là lỗi "không tìm thấy phòng", chỉ set roomData = null, không hiển thị notification
        setRoomData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ gọi một lần khi component mount

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };


  return (
    <PageLayout
      title="Thông tin phòng ở"
      subtitle="Chi tiết thông tin phòng và hợp đồng của bạn"
      showClose={true}
      onClose={onCancel}
      headerActions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="small"
            onClick={() => window.location.href = '/room-extension'}
          >
            Gia hạn phòng
          </Button>
          <Button
            variant="outline"
            size="small"
            onClick={() => window.location.href = '/room-transfer'}
          >
            Chuyển phòng
          </Button>
          <Button
            variant="outline"
            size="small"
            onClick={() => window.location.href = '/room-cancellation'}
          >
            Hủy phòng
          </Button>
        </div>
      }
    >
      <LoadingState
        isLoading={loading}
        isEmpty={!loading && !roomData}
        emptyState={
          <InfoBox type="info" messages={['Bạn chưa có thông tin phòng ở.']} />
        }
      >
        {roomData ? (
          <div className="space-y-6">
        {/* Hàng 1: Thông tin cá nhân và Trạng thái hợp đồng */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Thông tin cá nhân */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin cá nhân</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-gray-600">Họ và tên</p>
                <p className="text-base font-medium text-gray-900">{roomData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">CCCD/CMND</p>
                <p className="text-base font-medium text-gray-900">{roomData.identification}</p>
              </div>
            </div>
          </div>

          {/* Trạng thái hợp đồng */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Trạng thái hợp đồng</h2>
              <StatusBadge status={roomData.status} />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-gray-600">Ngày đăng ký</p>
                <p className="text-base font-medium text-gray-900">{formatDate(roomData.registerDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày hết hạn</p>
                <p className="text-base font-medium text-gray-900">{formatDate(roomData.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Thời hạn</p>
                <p className="text-base font-medium text-gray-900">{roomData.duration} tháng</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hàng 2: Thông tin phòng và Tiện ích phòng */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Thông tin phòng */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin phòng</h2>
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Số phòng</p>
                  <p className="text-base font-medium text-gray-900">{roomData.roomNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số giường của bạn</p>
                  <p className="text-base font-medium text-gray-900">Giường {roomData.mySlotNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Loại phòng</p>
                  <p className="text-base font-medium text-gray-900">{roomData.roomType.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phí thuê/tháng</p>
                  <p className="text-base font-medium text-gray-900">{formatCurrency(roomData.monthlyFee)}</p>
                </div>
              </div>
            </div>

            {/* Danh sách giường */}
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Tình trạng các giường trong phòng</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {roomData.roomSlot.map((slot) => (
                  <div
                    key={slot.slotNumber}
                    className={`p-4 rounded-lg border-2 ${
                      slot.slotNumber === roomData.mySlotNumber
                        ? 'bg-blue-50 border-blue-500'
                        : slot.isOccupied
                        ? 'bg-gray-100 border-gray-300'
                        : 'bg-green-50 border-green-300'
                    }`}
                  >
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${
                        slot.slotNumber === roomData.mySlotNumber
                          ? 'text-blue-700'
                          : slot.isOccupied
                          ? 'text-gray-700'
                          : 'text-green-700'
                      }`}>
                        Giường {slot.slotNumber}
                      </p>
                      <p className={`text-xs mt-1 ${
                        slot.slotNumber === roomData.mySlotNumber
                          ? 'text-blue-600'
                          : slot.isOccupied
                          ? 'text-gray-600'
                          : 'text-green-600'
                      }`}>
                        {slot.slotNumber === roomData.mySlotNumber
                          ? 'Của bạn'
                          : slot.isOccupied
                          ? 'Đã có người'
                          : 'Trống'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tiện ích phòng */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tiện ích phòng</h2>
            <div className="flex flex-wrap gap-2">
              {roomData.roomType.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        </div>
          </div>
        ) : null}
      </LoadingState>
    </PageLayout>
  );
};

export default RoomInfoPage;

