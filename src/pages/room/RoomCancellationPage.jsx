import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import InfoBox from '../../components/ui/InfoBox';
import LoadingState from '../../components/ui/LoadingState';
import BaseModal, { ModalBody, ModalFooter } from '../../components/modal/BaseModal';
import roomRegistrationApi from '../../api/roomRegistrationApi';
import roomApi from '../../api/roomApi';

const RoomCancellation = ({ onSuccess, onCancel }) => {
  try {
    return <RoomCancellationContent onSuccess={onSuccess} onCancel={onCancel} />;
  } catch (error) {
    console.error('RoomCancellation error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-4">Không thể tải trang hủy phòng</p>
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

const RoomCancellationContent = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancellationForm, setShowCancellationForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cancellationForm, setCancellationForm] = useState({
    reason: '',
    checkoutDate: '',
    additionalNotes: '',
    agreeToTerms: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Predefined cancellation reasons
  const cancellationReasons = [
    'Tốt nghiệp',
    'Chuyển trường',
    'Hoàn cảnh gia đình',
    'Sức khỏe',
    'Tài chính',
    'Chuyển về nhà',
    'Lý do cá nhân khác'
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

  const handleCancellationRequest = () => {
    if (!roomData) {
      showError('Không tìm thấy thông tin phòng.');
      return;
    }
    setShowCancellationForm(true);
    setFormErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCancellationForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user changes input
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!cancellationForm.reason) {
      errors.reason = 'Vui lòng chọn lý do hủy phòng';
    }

    if (!cancellationForm.checkoutDate) {
      errors.checkoutDate = 'Vui lòng chọn ngày dự kiến trả phòng';
    } else {
      const checkoutDate = new Date(cancellationForm.checkoutDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysDifference = Math.ceil((checkoutDate - today) / (1000 * 60 * 60 * 24));

      if (daysDifference < 7) {
        errors.checkoutDate = 'Ngày trả phòng phải cách ngày hiện tại ít nhất 7 ngày';
      }

      if (roomData && new Date(cancellationForm.checkoutDate) > new Date(roomData.endDate)) {
        errors.checkoutDate = 'Ngày trả phòng không được sau ngày hết hạn hợp đồng';
      }
    }

    if (!cancellationForm.agreeToTerms) {
      errors.agreeToTerms = 'Vui lòng đồng ý với các điều khoản hủy phòng';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitCancellation = async () => {
    if (!validateForm()) {
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmCancellation = async () => {
    setIsSubmitting(true);
    try {
      // Ghép ghi chú thêm vào reason nếu có
      let reason = cancellationForm.reason || '';
      if (cancellationForm.additionalNotes && cancellationForm.additionalNotes.trim()) {
        reason = reason ? `${reason}. Ghi chú: ${cancellationForm.additionalNotes.trim()}` : cancellationForm.additionalNotes.trim();
      }

      const requestData = {
        reason: reason,
        checkoutDate: cancellationForm.checkoutDate
      };

      const response = await roomRegistrationApi.cancelRoomRegistration(requestData);
      
      if (response.success) {
        showSuccess('Đơn yêu cầu hủy phòng đã được gửi thành công! Vui lòng chờ phê duyệt từ quản lý KTX.');
        setShowConfirmModal(false);
        setShowCancellationForm(false);
        setCancellationForm({
          reason: '',
          checkoutDate: '',
          additionalNotes: '',
          agreeToTerms: false
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error('Error submitting cancellation:', err);
      const errorMessage = err?.response?.data?.message || 'Có lỗi xảy ra khi gửi đơn yêu cầu hủy phòng. Vui lòng thử lại.';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToContract = () => {
    setShowCancellationForm(false);
    setCancellationForm({
      reason: '',
      checkoutDate: '',
      additionalNotes: '',
      agreeToTerms: false
    });
    setFormErrors({});
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    // Format: ngày/tháng/năm (ví dụ: 15/03/2024)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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

  const getMinCheckoutDate = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 7);
    return minDate.toISOString().split('T')[0];
  };

  const getMaxCheckoutDate = () => {
    if (!roomData) return '';
    const endDate = new Date(roomData.endDate);
    return endDate.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Luôn hiển thị */}
        {showCancellationForm ? (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Yêu cầu hủy phòng</h1>
            <p className="mt-2 text-gray-600">Điền thông tin để gửi đơn yêu cầu hủy phòng</p>
          </div>
        ) : (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Hủy phòng ở KTX</h1>
            <p className="mt-2 text-gray-600">Gửi đơn yêu cầu hủy phòng và trả phòng</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Room Information - Loading */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin phòng hiện tại</h2>
              <LoadingState isLoading={true} loadingText="" className="py-8" />
            </div>

            {/* Cancellation Form - Loading */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin hủy phòng</h2>
              <LoadingState isLoading={true} loadingText="" className="py-8" />
            </div>
          </div>
        ) : !roomData ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <InfoBox 
              type="info" 
              messages={['Bạn chưa có thông tin phòng ở để hủy.']} 
            />
            <div className="mt-4">
              <Button variant="outline" onClick={onCancel}>
                Quay lại
              </Button>
            </div>
          </div>
        ) : showCancellationForm ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Current Room Information */}
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
                    <label className="text-sm font-medium text-gray-500">Phí thuê/tháng</label>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(roomData.monthlyFee)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ngày đăng ký</label>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(roomData.registerDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ngày hết hạn</label>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(roomData.endDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin hủy phòng</h2>
              
              <div className="space-y-6">
                <Select
                  label="Lý do hủy phòng"
                  name="reason"
                  value={cancellationForm.reason}
                  onChange={handleFormChange}
                  error={formErrors.reason}
                  required
                >
                  <option value="">Chọn lý do hủy phòng</option>
                  {cancellationReasons.map((reason, index) => (
                    <option key={index} value={reason}>{reason}</option>
                  ))}
                </Select>

                <Input
                  label="Ngày dự kiến trả phòng"
                  name="checkoutDate"
                  type="date"
                  value={cancellationForm.checkoutDate}
                  onChange={handleFormChange}
                  error={formErrors.checkoutDate}
                  required
                  min={getMinCheckoutDate()}
                  max={getMaxCheckoutDate()}
                  helperText="Ngày trả phòng phải cách ngày hiện tại ít nhất 7 ngày"
                />

                <Textarea
                  label="Ghi chú thêm (tùy chọn)"
                  name="additionalNotes"
                  value={cancellationForm.additionalNotes}
                  onChange={handleFormChange}
                  placeholder="Mô tả chi tiết lý do hủy phòng hoặc các yêu cầu đặc biệt..."
                  rows={4}
                />

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={cancellationForm.agreeToTerms}
                      onChange={handleFormChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                      Tôi đồng ý với các điều khoản hủy phòng <span className="text-red-500">*</span>
                    </label>
                    <p className="text-gray-500 mt-1">
                      Tôi hiểu rằng việc hủy phòng có thể phải chịu phí hủy và cần được phê duyệt từ quản lý KTX.
                    </p>
                    {formErrors.agreeToTerms && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.agreeToTerms}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handleBackToContract}
                    disabled={isSubmitting}
                  >
                    Quay lại
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleSubmitCancellation}
                    loading={isSubmitting}
                    loadingText="Đang gửi đơn..."
                  >
                    Gửi đơn yêu cầu hủy phòng
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Terms */}
          <div className="mt-8">
            <InfoBox
              type="warning"
              title="Điều khoản hủy phòng"
              messages={[
                'Đơn yêu cầu hủy phòng cần được gửi trước ít nhất 7 ngày so với ngày dự kiến trả phòng',
                'Phí hủy phòng có thể được áp dụng tùy theo thời điểm hủy và điều khoản hợp đồng',
                'Đơn yêu cầu sẽ được xem xét và phê duyệt bởi quản lý KTX trong vòng 3-5 ngày làm việc',
                'Sau khi được phê duyệt, sinh viên cần hoàn tất thủ tục trả phòng và thanh toán các khoản phí còn lại',
                'Email xác nhận sẽ được gửi đến địa chỉ email đã đăng ký'
              ]}
            />
          </div>
            </>
          ) : !loading && roomData ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Current Room Information */}
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
                        <label className="text-sm font-medium text-gray-500">Phí thuê/tháng</label>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(roomData.monthlyFee)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Ngày đăng ký</label>
                        <p className="text-lg font-semibold text-gray-900">{formatDate(roomData.registerDate)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Ngày hết hạn</label>
                        <p className="text-lg font-semibold text-gray-900">{formatDate(roomData.endDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cancellation Information */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin hủy phòng</h2>
                  
                  <div className="space-y-6">
                    <InfoBox
                      type="warning"
                      title="Lưu ý quan trọng"
                      messages={[
                        'Việc hủy phòng cần được thực hiện trước ít nhất 7 ngày',
                        'Phí hủy phòng có thể được áp dụng tùy theo thời điểm',
                        'Đơn yêu cầu cần được phê duyệt từ quản lý KTX',
                        'Email xác nhận sẽ được gửi sau khi gửi đơn thành công'
                      ]}
                    />

                    <InfoBox
                      type="info"
                      title="Quy trình hủy phòng"
                      messages={[
                        '1. Điền thông tin yêu cầu hủy phòng',
                        '2. Chọn ngày dự kiến trả phòng',
                        '3. Gửi đơn yêu cầu và chờ phê duyệt',
                        '4. Nhận email xác nhận và hoàn tất thủ tục'
                      ]}
                    />

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={onCancel}
                      >
                        Hủy
                      </Button>
                      <Button
                        variant="danger"
                        onClick={handleCancellationRequest}
                      >
                        Yêu cầu trả phòng
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
      </div>

      {/* Confirmation Modal */}
      <BaseModal
        isOpen={showConfirmModal}
        onClose={() => !isSubmitting && setShowConfirmModal(false)}
        title="Xác nhận gửi đơn yêu cầu hủy phòng"
        size="medium"
      >
        <ModalBody>
          <div className="space-y-4">
            <p className="text-gray-700">
              Bạn có chắc chắn muốn gửi đơn yêu cầu hủy phòng với thông tin sau?
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div>
                <span className="font-medium text-gray-700">Lý do: </span>
                <span className="text-gray-900">{cancellationForm.reason}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Ngày trả phòng: </span>
                <span className="text-gray-900">{formatDate(cancellationForm.checkoutDate)}</span>
              </div>
              {cancellationForm.additionalNotes && cancellationForm.additionalNotes.trim() && (
                <div>
                  <span className="font-medium text-gray-700">Ghi chú thêm: </span>
                  <span className="text-gray-900">{cancellationForm.additionalNotes}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Đơn yêu cầu sẽ được gửi đến quản lý KTX để xem xét và phê duyệt.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowConfirmModal(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmCancellation}
            loading={isSubmitting}
            loadingText="Đang gửi..."
          >
            Xác nhận gửi đơn
          </Button>
        </ModalFooter>
      </BaseModal>
    </div>
  );
};

export default RoomCancellation;

