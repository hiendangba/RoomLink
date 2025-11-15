import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { healthCheckApi } from '../../api';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import LoadingState from '../../components/ui/LoadingState';
import Textarea from '../../components/ui/Textarea';
import InfoBox from '../../components/ui/InfoBox';
import BaseModal, { ModalBody } from '../../components/modal/BaseModal';

const HealthCheckupRegistrationPage = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [checkupSessions, setCheckupSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [totalItems, setTotalItems] = useState(0);
  const [note, setNote] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);

  useEffect(() => {
    loadHealthChecks(currentPage);
  }, [currentPage]);

  // Parse backend date format (dd-mm-yyyy HH:mm:ss) to Date object
  const parseBackendDateToDate = (dateString) => {
    if (!dateString || dateString === "-" || typeof dateString !== 'string') {
      return null;
    }
    const str = String(dateString).trim();
    if (!str || str === "-") {
      return null;
    }
    try {
      // Backend format: "dd-mm-yyyy HH:mm:ss" (e.g., "01-11-2025 20:22:00")
      const backendFormatMatch = str.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
      if (backendFormatMatch) {
        const [, day, month, year, hours, minutes] = backendFormatMatch;
        const dateStr = `${year}-${month}-${day}T${hours}:${minutes}:00`;
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      // Fallback: Try parsing as ISO string or any other format
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return date;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const loadHealthChecks = async (page = 1) => {
    try {
      setLoading(true);
      // Call API with availableForRegistration filter and pagination
      const response = await healthCheckApi.getHealthChecks({ 
        availableForRegistration: true,
        page: page,
        limit: itemsPerPage
      });
      if (response.success && response.data) {
        const healthChecks = response.data;
        
        // Get totalItems from response metadata
        if (response.metadata && response.metadata.totalItems !== undefined) {
          setTotalItems(response.metadata.totalItems);
        }
        
        // Transform API response to match component needs
        // Backend already filtered to only return available sessions
        const transformedSessions = healthChecks.map((hc) => {
          return {
            id: hc.id,
            name: hc.title,
            description: hc.description || '',
            startDate: hc.startDate,
            endDate: hc.endDate,
            registrationDeadline: hc.registrationEndDate,
            maxParticipants: hc.capacity,
            currentParticipants: hc.registeredCount || 0,
            status: 'open', // All returned sessions are available for registration
            location: hc.buildingName || hc.location || 'Chưa xác định',
            price: hc.price,
            registrationStartDate: hc.registrationStartDate,
            registrationEndDate: hc.registrationEndDate,
            buildingName: hc.buildingName,
            // Generate available dates and time slots from startDate to endDate
            availableDates: generateAvailableDates(hc.startDate, hc.endDate)
          };
        });
        
        setCheckupSessions(transformedSessions);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tải danh sách đợt khám';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Generate available dates and time slots
  const generateAvailableDates = (startDate, endDate) => {
    const dates = [];
    // Parse dates from backend format
    const start = parseBackendDateToDate(startDate);
    const end = parseBackendDateToDate(endDate);
    
    if (!start || !end) {
      return dates; // Return empty if dates are invalid
    }
    
    // Fixed working hours: 08:00 to 17:00 (540 minutes to 1020 minutes)
    const startTime = 8 * 60; // 08:00 in minutes from midnight
    const endTime = 17 * 60; // 17:00 in minutes from midnight
    const slotDuration = 10; // 10 minutes
    
    // Generate time slots with 10-minute intervals from 08:00 to 17:00
    // Only store start time (e.g., "08:00", "08:10") instead of range (e.g., "08:00-08:10")
    const timeSlots = [];
    for (let minutes = startTime; minutes < endTime; minutes += slotDuration) {
      const startHour = Math.floor(minutes / 60);
      const startMin = minutes % 60;
      
      const startTimeStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
      
      timeSlots.push(startTimeStr);
    }
    
    // Generate dates from start to end
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push({
        date: d.toISOString().split('T')[0],
        timeSlots: timeSlots
      });
    }
    
    return dates;
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setSelectedDate('');
    setSelectedTimeSlot('');
  };

  const handleRegister = (session) => {
    handleSessionSelect(session);
  };

  const handleBackToStep1 = () => {
    setSelectedSession(null);
    setSelectedDate('');
    setSelectedTimeSlot('');
    setNote('');
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot('');
  };

  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSession) {
      showError('Vui lòng chọn đợt khám sức khỏe');
      return;
    }
    
    if (!selectedDate) {
      showError('Vui lòng chọn ngày khám');
      return;
    }
    
    if (!selectedTimeSlot) {
      showError('Vui lòng chọn khung giờ khám');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Combine date and time slot to create registerDate
      // selectedTimeSlot is now just the start time (e.g., "08:00") instead of range (e.g., "08:00-08:10")
      const registerDate = new Date(`${selectedDate}T${selectedTimeSlot}:00`);
      
      // Backend lấy userId từ req.userId (từ token), không cần gửi studentId
      const registrationData = {
        healthCheckId: selectedSession.id,
        registerDate: registerDate.toISOString(),
        note: note || null
      };

      const response = await healthCheckApi.registerHealthCheck(registrationData);
      
      showSuccess('Đăng ký khám sức khỏe thành công!');
      
      // Reset form
      setSelectedSession(null);
      setSelectedDate('');
      setSelectedTimeSlot('');
      setNote('');
      
      // Reload health checks to update registered count
      await loadHealthChecks(currentPage);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(response.data);
        }, 1000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Parse backend date format (dd-mm-yyyy HH:mm:ss) to Date object
  const parseBackendDate = (dateString) => {
    if (!dateString || dateString === "-" || typeof dateString !== 'string') {
      return null;
    }
    const str = String(dateString).trim();
    if (!str || str === "-") {
      return null;
    }
    try {
      // Backend format: "dd-mm-yyyy HH:mm:ss" (e.g., "01-11-2025 20:22:00")
      const backendFormatMatch = str.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
      if (backendFormatMatch) {
        const [, day, month, year, hours, minutes] = backendFormatMatch;
        const dateStr = `${year}-${month}-${day}T${hours}:${minutes}:00`;
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      // Fallback: Try parsing as ISO string or any other format
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return date;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Format date to Vietnamese format (dd/mm/yyyy HH:mm)
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = parseBackendDate(dateString);
      if (!date || isNaN(date.getTime())) {
        return '-';
      }
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
      return '-';
    }
  };

  // Format date to Vietnamese format (dd/mm/yyyy) - only date, no time
  const formatDateOnly = (dateString) => {
    if (!dateString) return '';
    try {
      const date = parseBackendDate(dateString);
      if (!date || isNaN(date.getTime())) {
        return '';
      }
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      // Get day of week in Vietnamese
      const daysOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const dayOfWeek = daysOfWeek[date.getDay()];
      
      return `${dayOfWeek}, ${day}/${month}/${year}`;
    } catch (e) {
      return '';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Pagination calculations using backend totalItems
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle view detail
  const handleViewDetail = async (session) => {
    try {
      setLoading(true);
      const response = await healthCheckApi.getHealthCheckById(session.id);
      if (response.success && response.data) {
        setSelectedSessionDetail(response.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Lỗi khi tải chi tiết đợt khám");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // HealthCheckCard component for student view
  const HealthCheckCard = ({ session, onViewDetail, onRegister }) => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        {/* Header: tiêu đề */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
          <p className="text-sm text-gray-500">{session.buildingName || session.location || 'Chưa xác định'}</p>
        </div>

        {/* Nội dung */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Thời gian:</span>
            <span className="text-sm font-medium">{formatDate(session.startDate)} → {formatDate(session.endDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Sức chứa:</span>
            <span className="text-sm font-medium">{session.currentParticipants}/{session.maxParticipants}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Phí:</span>
            <span className="text-sm font-medium text-green-600">
              {formatCurrency(session.price)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Đăng ký:</span>
            <span className="text-sm font-medium">{formatDate(session.registrationStartDate)} → {formatDate(session.registrationEndDate)}</span>
          </div>
        </div>

        {/* Hàng nút hành động */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex space-x-2">
            <Button
              onClick={() => onViewDetail(session)}
              variant="outline"
              size="small"
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              Chi tiết
            </Button>
            <Button
              onClick={() => onRegister(session)}
              variant="primary"
              size="small"
              className="px-3 py-1 text-xs"
            >
              Đăng ký
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Detail Modal
  const renderDetailModal = () => {
    if (!selectedSessionDetail) return null;

    const hc = selectedSessionDetail;

    return (
      <BaseModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Chi tiết đợt khám sức khỏe"
        size="xlarge"
        closeOnOverlayClick={true}
        className="max-h-[105vh] overflow-y-auto"
        zIndex={60}
      >
        <ModalBody className="max-h-[calc(105vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Thông tin cơ bản</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên đợt khám</label>
                  <p className="text-gray-900">{hc.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tòa nhà</label>
                  <p className="text-gray-900">{hc.buildingName || 'Chưa xác định'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sức chứa</label>
                  <p className="text-gray-900">{hc.registeredCount}/{hc.capacity}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phí</label>
                  <p className="text-gray-900 text-green-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      minimumFractionDigits: 0,
                    }).format(hc.price)}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Thời gian</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Thời gian khám</label>
                  <p className="text-gray-900">
                    {formatDate(hc.startDate)} → {formatDate(hc.endDate)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Thời gian đăng ký</label>
                  <p className="text-gray-900">
                    {formatDate(hc.registrationStartDate)} → {formatDate(hc.registrationEndDate)}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Mô tả</h3>
              <p className="text-gray-900 whitespace-pre-wrap">
                {hc.description || 'Không có mô tả'}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button onClick={() => setShowDetailModal(false)} variant="outline">
              Đóng
            </Button>
          </div>
        </ModalBody>
      </BaseModal>
    );
  };


  return (
    <PageLayout
      title={selectedSession ? "Chọn ngày và giờ khám" : "Đăng ký khám sức khỏe"}
      subtitle={selectedSession ? "Vui lòng chọn ngày và khung giờ khám sức khỏe" : "Đăng ký tham gia các đợt khám sức khỏe định kỳ"}
      showClose={!selectedSession}
      onClose={onCancel}
      showBack={!!selectedSession}
      backText="Quay lại"
      onBack={selectedSession ? handleBackToStep1 : undefined}
    >
      {!selectedSession ? (
        /* Step 1: Select Health Check Session */
        <>
          {renderDetailModal()}
          <LoadingState
            isLoading={loading}
            isEmpty={!loading && checkupSessions.length === 0}
            emptyState={
              <div className="text-center py-12 text-gray-500">
                <p>Hiện tại không có đợt khám sức khỏe nào đang mở đăng ký.</p>
              </div>
            }
          >
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {checkupSessions.map((session) => (
                  <HealthCheckCard
                    key={session.id}
                    session={session}
                    onViewDetail={handleViewDetail}
                    onRegister={handleRegister}
                  />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                    showInfo={true}
                  />
                </div>
              )}
            </>
          </LoadingState>
        </>
      ) : selectedSession.status === 'open' ? (
        /* Step 2: Select Date and Time */
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Selected Health Check Info */}
          {selectedSession && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Thông tin Đợt khám</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Tên đợt khám:</span> {selectedSession.name}
                </div>
                <div>
                  <span className="font-medium">Tòa nhà:</span> {selectedSession.buildingName || selectedSession.location || 'Chưa xác định'}
                </div>
                <div>
                  <span className="font-medium">Thời gian:</span> {formatDate(selectedSession.startDate)} → {formatDate(selectedSession.endDate)}
                </div>
                <div>
                  <span className="font-medium">Sức chứa:</span> {selectedSession.currentParticipants}/{selectedSession.maxParticipants}
                </div>
                <div>
                  <span className="font-medium">Phí:</span> {formatCurrency(selectedSession.price)}
                </div>
                <div>
                  <span className="font-medium">Thời gian đăng ký:</span> {formatDate(selectedSession.registrationStartDate)} → {formatDate(selectedSession.registrationEndDate)}
                </div>
              </div>
            </div>
          )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Chọn ngày khám <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {selectedSession.availableDates.map((dateInfo) => (
                  <Button
                    key={dateInfo.date}
                    type="button"
                    onClick={() => handleDateSelect(dateInfo.date)}
                    variant={selectedDate === dateInfo.date ? "primary" : "outline"}
                    fullWidth
                  >
                    {formatDateOnly(dateInfo.date)}
                  </Button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Chọn khung giờ khám <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {selectedSession.availableDates
                    .find((d) => d.date === selectedDate)
                    ?.timeSlots.map((timeSlot) => (
                      <Button
                        key={timeSlot}
                        type="button"
                        onClick={() => handleTimeSlotSelect(timeSlot)}
                        variant={selectedTimeSlot === timeSlot ? "primary" : "outline"}
                        fullWidth
                      >
                        {timeSlot}
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {/* Note field */}
            <div className="mb-6">
              <Textarea
                label="Ghi chú (tùy chọn)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú nếu có..."
                rows={3}
                maxLength={2000}
              />
            </div>

            {/* Requirements notice */}
            <InfoBox
              type="warning"
              title="Lưu ý trước khi khám:"
              messages={[
                'Mang theo CMND/CCCD',
                'Đến đúng giờ đã đăng ký',
                'Nhịn ăn sáng nếu có yêu cầu'
              ]}
            />

          {/* Submit buttons */}
          {selectedDate && selectedTimeSlot && (
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={onCancel} type="button">
                Hủy
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Đăng ký khám sức khỏe
              </Button>
            </div>
          )}
        </form>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>Đợt khám này đã đóng đăng ký hoặc đã đầy.</p>
          <Button
            variant="outline"
            size="small"
            onClick={handleBackToStep1}
            className="mt-4"
          >
            Quay lại chọn đợt khám khác
          </Button>
        </div>
      )}
    </PageLayout>
  );
};

export default HealthCheckupRegistrationPage;
