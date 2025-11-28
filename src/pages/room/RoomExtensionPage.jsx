import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import InfoBox from '../../components/ui/InfoBox';
import roomRegistrationApi from '../../api/roomRegistrationApi';
import roomApi from '../../api/roomApi';

const RoomExtension = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedExtension, setSelectedExtension] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extension options
  const extensionOptions = [
    { value: '8-months', label: '8 tháng', duration: 8 },
    { value: '10-months', label: '10 tháng', duration: 10 }
  ];

  // Fetch room data
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

  const handleExtensionSelect = (value) => {
    setSelectedExtension(value);
    setError('');
  };

  const handleExtensionSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedExtension) {
      setError('Vui lòng chọn thời gian gia hạn');
      return;
    }

    if (!roomData) {
      setError('Không tìm thấy thông tin phòng.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const selectedOption = extensionOptions.find(opt => opt.value === selectedExtension);
      
      // Gọi API để yêu cầu gia hạn
      const response = await roomRegistrationApi.requestRoomExtend({
        duration: selectedOption.duration
      });

      if (response.success) {
        const successMessage = response.message || response.data?.message || 'Đơn yêu cầu gia hạn đã được gửi thành công!';
        showSuccess(successMessage);
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error('Error submitting extension request:', err);
      const errorMessage = err?.response?.data?.message || 'Có lỗi xảy ra khi gửi đơn yêu cầu gia hạn. Vui lòng thử lại.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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

  const calculateDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const remainingDays = roomData ? calculateDaysRemaining(roomData.endDate) : 0;
  const monthlyFee = roomData?.monthlyFee || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Luôn hiển thị */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gia hạn thời gian ở KTX</h1>
          <p className="mt-2 text-gray-600">Gia hạn thời gian ở ký túc xá của bạn</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contract Information - Loading */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin hợp đồng hiện tại</h2>
              <LoadingState isLoading={true} loadingText="" className="py-8" />
            </div>

            {/* Extension Form - Loading */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Chọn thời gian gia hạn</h2>
              <LoadingState isLoading={true} loadingText="" className="py-8" />
            </div>
          </div>
        ) : !roomData ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center text-gray-500 py-8">
              Bạn chưa có thông tin phòng ở để gia hạn.
            </div>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={onCancel}>
                Quay lại
              </Button>
            </div>
          </div>
        ) : !loading && roomData ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contract Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin hợp đồng hiện tại</h2>
                
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
                  <p className="text-lg font-semibold text-gray-900">{formatPrice(monthlyFee)}</p>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Thời gian còn lại</label>
                  <p className={`text-lg font-semibold ${
                    remainingDays > 30 ? 'text-green-600' : 
                    remainingDays > 7 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {remainingDays} ngày
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    remainingDays > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {remainingDays > 0 ? 'Đang hoạt động' : 'Hết hạn'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Extension Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Chọn thời gian gia hạn</h2>
            
            <form onSubmit={handleExtensionSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Thời gian gia hạn
                </label>
                <div className="space-y-3">
                  {extensionOptions.map((option) => {
                    const estimatedPrice = monthlyFee * option.duration;
                    return (
                      <div
                        key={option.value}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedExtension === option.value
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleExtensionSelect(option.value)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-gray-900">{option.label}</h3>
                            <p className="text-sm text-gray-600">{option.duration} tháng</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{formatPrice(estimatedPrice)}</p>
                            <p className="text-xs text-gray-500">
                              {formatPrice(monthlyFee)}/tháng
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedExtension && (() => {
                const selectedOption = extensionOptions.find(opt => opt.value === selectedExtension);
                const newEndDate = new Date(roomData.endDate);
                newEndDate.setMonth(newEndDate.getMonth() + selectedOption.duration);
                const estimatedPrice = monthlyFee * selectedOption.duration;
                
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Thông tin gia hạn</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• Thời gian gia hạn: {selectedOption.label}</p>
                      <p>• Ngày hết hạn mới: {formatDate(newEndDate.toISOString())}</p>
                      <p>• Số tiền dự kiến: <span className="font-bold">{formatPrice(estimatedPrice)}</span></p>
                    </div>
                  </div>
                );
              })()}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  variant="success"
                  type="submit"
                  loading={isSubmitting}
                  loadingText="Đang gửi đơn..."
                  disabled={!selectedExtension}
                >
                  Xác nhận gia hạn
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Extension Info */}
        <div className="mt-8">
          <InfoBox
            type="info"
            title="Thông tin gia hạn"
            messages={[
              'Đơn yêu cầu gia hạn cần được gửi trước khi hợp đồng hết hạn',
              'Đơn yêu cầu sẽ được xem xét và phê duyệt bởi quản lý KTX trong vòng 24-48 giờ',
              'Sau khi được phê duyệt, bạn sẽ nhận được email xác nhận',
              'Phí gia hạn sẽ được tính dựa trên phí thuê hàng tháng và thời gian gia hạn'
            ]}
          />
        </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default RoomExtension;
