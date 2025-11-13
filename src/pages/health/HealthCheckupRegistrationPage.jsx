import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { healthCheckApi } from '../../api';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import LoadingState from '../../components/ui/LoadingState';

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
  const [note, setNote] = useState('');

  useEffect(() => {
    loadHealthChecks();
  }, []);

  const loadHealthChecks = async () => {
    try {
      setLoading(true);
      const response = await healthCheckApi.getHealthChecks();
      if (response.success && response.data) {
        const healthChecks = response.data;
        
        // Transform API response to match component needs
        const transformedSessions = healthChecks.map((hc) => ({
          id: hc.id,
          name: hc.title,
          description: hc.description || '',
          startDate: hc.startDate,
          endDate: hc.endDate,
          registrationDeadline: hc.registrationEndDate,
          maxParticipants: hc.capacity,
          currentParticipants: hc.registeredCount || 0,
          status: hc.status === 'active' && 
                  new Date(hc.registrationEndDate) >= new Date() &&
                  (hc.registeredCount || 0) < hc.capacity ? 'open' : 'closed',
          location: hc.buildingName || hc.location || 'Chưa xác định',
          price: hc.price,
          registrationStartDate: hc.registrationStartDate,
          registrationEndDate: hc.registrationEndDate,
          buildingName: hc.buildingName,
          // Generate available dates and time slots from startDate to endDate
          availableDates: generateAvailableDates(hc.startDate, hc.endDate)
        }));
        
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
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeSlots = ['08:00-09:00', '09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00'];
    
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

    // Get studentId from user object (stored during login)
    const studentId = user?.roleId;
    if (!studentId) {
      showError('Không thể xác định thông tin sinh viên. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Combine date and time slot to create registerDate
      const [startTime] = selectedTimeSlot.split('-');
      const registerDate = new Date(`${selectedDate}T${startTime}:00`);
      
      const registrationData = {
        studentId: studentId,
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
      await loadHealthChecks();
      
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

  // Format date to Vietnamese format (dd/mm/yyyy HH:mm)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
      return dateString;
    }
  };

  // Format date to Vietnamese format (dd/mm/yyyy) - only date, no time
  const formatDateOnly = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      // Get day of week in Vietnamese
      const daysOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const dayOfWeek = daysOfWeek[date.getDay()];
      
      return `${dayOfWeek}, ${day}/${month}/${year}`;
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalPages = Math.ceil(checkupSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = checkupSessions.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
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
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Bước 1: Chọn đợt khám sức khỏe
          </h2>
          
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
              <div className="mt-8">
                {currentSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`border border-gray-200 rounded-xl shadow p-4 mb-4 hover:shadow-lg transition cursor-pointer bg-white ${
                      selectedSession?.id === session.id
                        ? 'border-blue-500'
                        : ''
                    }`}
                    onClick={() => handleSessionSelect(session)}
                  >
                    {/* Header: tiêu đề */}
                    <div className="mb-2">
                      <h2 className="text-xl font-semibold">{session.name}</h2>
                    </div>

                    {/* Nội dung */}
                    <p className="text-gray-700 mb-1">{session.description}</p>
                    <p className="text-gray-600 mb-1">
                      <strong>Tòa nhà:</strong> {session.buildingName || session.location || 'Chưa xác định'}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <strong>Thời gian:</strong> {formatDate(session.startDate)} → {formatDate(session.endDate)}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <strong>Sức chứa:</strong> {session.maxParticipants} |{' '}
                      <strong>Đã đăng ký:</strong> {session.currentParticipants}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <strong>Phí:</strong> {formatCurrency(session.price)}
                    </p>
                    <p className="text-gray-600 mb-3">
                      <strong>Thời gian đăng ký:</strong> {formatDate(session.registrationStartDate)} →{' '}
                      {formatDate(session.registrationEndDate)}
                    </p>
                  </div>
                ))}
              </div>
              
              {checkupSessions.length > itemsPerPage && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    totalItems={checkupSessions.length}
                    showInfo={true}
                  />
                </div>
              )}
            </>
          </LoadingState>
        </div>
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
              <div className="flex gap-3 flex-wrap justify-center">
                {selectedSession.availableDates.map((dateInfo) => (
                  <Button
                    key={dateInfo.date}
                    type="button"
                    onClick={() => handleDateSelect(dateInfo.date)}
                    variant={selectedDate === dateInfo.date ? "primary" : "outline"}
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
                <div className="flex gap-3 flex-wrap justify-center">
                  {selectedSession.availableDates
                    .find((d) => d.date === selectedDate)
                    ?.timeSlots.map((timeSlot) => (
                      <Button
                        key={timeSlot}
                        type="button"
                        onClick={() => handleTimeSlotSelect(timeSlot)}
                        variant={selectedTimeSlot === timeSlot ? "primary" : "outline"}
                      >
                        {timeSlot}
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {/* Note field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú nếu có..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                maxLength={2000}
              />
              <p className="mt-1 text-sm text-gray-500">
                {note.length}/2000 ký tự
              </p>
            </div>

            {/* Requirements notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">
                Lưu ý trước khi khám:
              </h3>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li>Mang theo CMND/CCCD</li>
                <li>Đến đúng giờ đã đăng ký</li>
                <li>Nhịn ăn sáng nếu có yêu cầu</li>
              </ul>
            </div>

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
