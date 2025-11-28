import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import InfoBox from '../../components/ui/InfoBox';
import RoomSelection from '../../components/room/RoomSelection';
import roomRegistrationApi from '../../api/roomRegistrationApi';
import roomApi from '../../api/roomApi';

const RoomTransfer = ({ onSuccess, onCancel }) => {
  try {
    return <RoomTransferContent onSuccess={onSuccess} onCancel={onCancel} />;
  } catch (error) {
    console.error('RoomTransfer error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-4">Không thể tải trang chuyển phòng</p>
          <Button
            onClick={() => window.location.reload()}
            variant="primary"
          >
            Tải lại trang
          </Button>
        </div>
      </div>
    );
  }
};

const RoomTransferContent = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRoomSelection, setShowRoomSelection] = useState(false);
  const [selectedRoomData, setSelectedRoomData] = useState(null); // { room, slotId, duration }
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current room data
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        const response = await roomApi.getRoomByUser();
        if (response.success && response.data) {
          setRoomData(response.data);
        }
      } catch (err) {
        console.error('Error fetching room data:', err);
        const errorCode = err?.response?.data?.errorCode;
        const statusCode = err?.response?.status;
        const isNotFoundError = statusCode === 404 || errorCode === 'ROOM_REGISTRATION_NOT_FOUND';
        
        if (!isNotFoundError) {
          const errorMessage = err?.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin phòng.';
          showError(errorMessage);
        }
        setRoomData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleTransferRequest = () => {
    if (!roomData) {
      showError('Không tìm thấy thông tin phòng.');
      return;
    }
    setShowRoomSelection(true);
    setError('');
    setSelectedRoomData(null);
  };

  const handleRoomSelected = (data) => {
    // data contains: { room, slotId, duration }
    // Check if selected room is the same as current room
    if (data.room.roomNumber === roomData?.roomNumber) {
      showError('Phòng bạn chọn trùng với phòng hiện tại. Vui lòng chọn phòng khác.');
      return;
    }

    setSelectedRoomData(data);
    setError('');
  };

  const handleBackToRoomSelection = () => {
    setSelectedRoomData(null);
    setError('');
  };

  const handleTransferConfirm = async () => {
    if (!selectedRoomData) {
      setError('Vui lòng chọn phòng để chuyển');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Gọi API để yêu cầu chuyển phòng
      const response = await roomRegistrationApi.requestRoomMove({
        roomSlotId: selectedRoomData.slotId,
        duration: Number(selectedRoomData.duration)
      });

      if (response.success) {
        const successMessage = response.message || response.data?.message || 'Đơn yêu cầu chuyển phòng đã được gửi thành công!';
        showSuccess(successMessage);
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error('Error submitting transfer request:', err);
      const errorMessage = err?.response?.data?.message || 'Có lỗi xảy ra khi gửi đơn yêu cầu chuyển phòng. Vui lòng thử lại.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToContract = () => {
    setShowRoomSelection(false);
    setSelectedRoomData(null);
    setError('');
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    const numAmount = parseFloat(price);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };


  // Nếu đang chọn phòng và chưa chọn phòng cụ thể, hiển thị RoomSelection full width
  if (showRoomSelection && !selectedRoomData && !loading && roomData) {
    return (
      <RoomSelection
        onRoomSelected={handleRoomSelected}
        onCancel={handleBackToContract}
        excludeRoomNumber={roomData?.roomNumber}
        fixedGender={user?.gender}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Chỉ hiển thị khi không phải đang chọn phòng */}
        {!showRoomSelection && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Chuyển phòng ở KTX</h1>
            <p className="mt-2 text-gray-600">Chuyển từ phòng hiện tại sang phòng khác</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Room Information - Loading */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin phòng hiện tại</h2>
              <LoadingState isLoading={true} loadingText="" className="py-8" />
            </div>

            {/* Transfer Information - Loading */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin chuyển phòng</h2>
              <LoadingState isLoading={true} loadingText="" className="py-8" />
            </div>
          </div>
        ) : !roomData ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center text-gray-500 py-8">
              Bạn chưa có thông tin phòng ở để chuyển.
            </div>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={onCancel}>
                Quay lại
              </Button>
            </div>
          </div>
        ) : showRoomSelection && selectedRoomData ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Xác nhận chuyển phòng</h2>
            
            <div className="space-y-6">
              {/* Current Room Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Phòng hiện tại</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Số phòng:</span>
                    <span className="ml-2 font-medium">{roomData.roomNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phí hàng tháng:</span>
                    <span className="ml-2 font-medium">{formatPrice(roomData.monthlyFee)}</span>
                  </div>
                </div>
              </div>

              {/* Selected Room Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Phòng mới</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Số phòng:</span>
                    <span className="ml-2 font-medium text-blue-900">{selectedRoomData.room.roomNumber}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Loại phòng:</span>
                    <span className="ml-2 font-medium text-blue-900">{selectedRoomData.room.roomType_type || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Vị trí giường:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      Giường {selectedRoomData.room.roomSlots?.find(slot => slot.id === selectedRoomData.slotId)?.slotNumber || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Phí hàng tháng:</span>
                    <span className="ml-2 font-medium text-blue-900">{formatPrice(selectedRoomData.room.monthlyFee)}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Thời hạn thuê:</span>
                    <span className="ml-2 font-medium text-blue-900">{selectedRoomData.duration} tháng</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBackToRoomSelection}
                  disabled={isSubmitting}
                >
                  Quay lại
                </Button>
                <Button
                  variant="primary"
                  onClick={handleTransferConfirm}
                  loading={isSubmitting}
                  loadingText="Đang gửi đơn..."
                >
                  Xác nhận chuyển phòng
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Contract Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin phòng hiện tại</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Số phòng</label>
                  <p className="text-lg font-semibold text-gray-900">{roomData.roomNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Số giường</label>
                  <p className="text-lg font-semibold text-gray-900">Giường {roomData.mySlotNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Loại phòng</label>
                  <p className="text-lg font-semibold text-gray-900">{roomData.roomType?.type || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phí hàng tháng</label>
                  <p className="text-lg font-semibold text-gray-900">{formatPrice(roomData.monthlyFee)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày đăng ký</label>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(roomData.registerDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày kết thúc</label>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(roomData.endDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin chuyển phòng</h2>
            
            <div className="space-y-6">
              <InfoBox
                type="warning"
                title="Lưu ý quan trọng"
                messages={[
                  'Chỉ có thể chuyển đến phòng còn chỗ trống',
                  'Phí phòng có thể thay đổi tùy theo loại phòng',
                  'Thời gian chuyển phòng: 1-2 ngày làm việc',
                  'Email xác nhận sẽ được gửi sau khi chuyển thành công'
                ]}
              />

              <InfoBox
                type="info"
                title="Quy trình chuyển phòng"
                messages={[
                  '1. Chọn phòng muốn chuyển đến',
                  '2. Chọn vị trí giường trong phòng',
                  '3. Chọn thời hạn thuê mới',
                  '4. Xác nhận và chờ phê duyệt từ quản lý KTX'
                ]}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={onCancel}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  onClick={handleTransferRequest}
                >
                  Chọn phòng mới
                </Button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default RoomTransfer;
