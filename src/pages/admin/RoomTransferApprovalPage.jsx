import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { roomRegistrationApi } from '../../api';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import LoadingState from '../../components/ui/LoadingState';
import StatusBadge from '../../components/ui/StatusBadge';
import RejectionModal from '../../components/modal/RejectionModal';
import BaseModal, { ModalBody } from '../../components/modal/BaseModal';

const RoomTransferApprovalPage = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [transferRequests, setTransferRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filterStatus, setFilterStatus] = useState('All'); // Match backend: All, Unapproved, Approved
  const [searchKeyword, setSearchKeyword] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0
  });

  useEffect(() => {
    loadMoveRoomRequests();
  }, [filterStatus, currentPage, searchKeyword]);

  // Load statistics riêng, không phụ thuộc vào filter hoặc page
  useEffect(() => {
    loadStatistics();
  }, []); // Chỉ load một lần khi component mount

  // Load statistics cho tất cả đơn (không phân trang, không filter)
  const loadStatistics = async () => {
    try {
      // Gọi 3 API riêng để lấy số liệu thống kê
      const [allResponse, unapprovedResponse, approvedResponse] = await Promise.all([
        roomRegistrationApi.getMoveRoomRequests({ status: 'All', page: 1, limit: 1 }),
        roomRegistrationApi.getMoveRoomRequests({ status: 'Unapproved', page: 1, limit: 1 }),
        roomRegistrationApi.getMoveRoomRequests({ status: 'Approved', page: 1, limit: 1 })
      ]);

      setStatistics({
        total: allResponse.totalItems || 0,
        pending: unapprovedResponse.totalItems || 0,
        approved: approvedResponse.totalItems || 0
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Không hiển thị error để tránh làm phiền user
    }
  };

  const loadMoveRoomRequests = async () => {
    try {
      setLoading(true);
      // Map frontend filter to backend status
      const statusParam = filterStatus === 'All' ? 'All' : filterStatus === 'Unapproved' ? 'Unapproved' : 'Approved';
      
      const params = {
        status: statusParam,
        page: currentPage,
        limit: itemsPerPage,
        keyword: searchKeyword.trim() || undefined // Chỉ gửi keyword nếu có giá trị
      };
      
      const response = await roomRegistrationApi.getMoveRoomRequests(params);
      
      // axiosClient already returns response.data, so response is ApiResponse object
      // ApiResponse structure: { success, data, page, limit, totalItems }
      console.log('API Response:', response);
      
      const data = response.data || [];
      const totalItems = response.totalItems || 0;
      
      console.log('Parsed data:', data);
      console.log('First item sample:', data[0]);
      console.log('Total items:', totalItems);
      
      if (Array.isArray(data)) {
        // Transform API response to match component needs
        const transformed = data.map(item => ({
          id: item.id,
          studentId: item.studentId,
          userId: item.userId,
          studentName: item.name,
          studentEmail: item.email || '', // API không trả về email
          studentPhone: item.phone || '', // API không trả về phone
          studentIdNumber: item.identification || item.mssv,
          mssv: item.mssv,
          school: item.school,
          dob: item.dob,
          gender: item.gender,
          address: item.address,
          avatar: item.avatar,
          frontIdentificationImage: item.frontIdentificationImage,
          currentRoom: {
            roomNumber: item.roomNumber || '-',
            building: '-', // API không trả về building
            zone: '-', // API không trả về zone
            roomType: '-', // API không trả về roomType
            monthlyFee: item.monthlyFee || 0,
            floor: 0,
            capacity: 0,
            currentOccupancy: 0
          },
          targetRoom: {
            roomNumber: item.newRoomNumber || '-',
            building: '-',
            zone: '-',
            roomType: '-',
            monthlyFee: item.newMonthlyFee || 0,
            floor: 0,
            capacity: 0,
            currentOccupancy: 0
          },
          slotNumber: item.slotNumber,
          newSlotNumber: item.newSlotNumber,
          transfer: {
            requestDate: item.registerDate || new Date().toISOString(),
            reason: 'Chuyển phòng', // API không trả về reason
            expectedTransferDate: item.newEndDate || '',
            urgency: 'Bình thường',
            notes: ''
          },
          contract: {
            contractId: item.id,
            startDate: item.registerDate || '',
            endDate: item.endDate || '',
            deposit: 0,
            currentMonthlyFee: item.monthlyFee || 0,
            newMonthlyFee: item.newMonthlyFee || 0,
            feeDifference: (item.newMonthlyFee || 0) - (item.monthlyFee || 0),
            totalPaid: 0,
            remainingAmount: 0
          },
          registerDate: item.registerDate,
          approvedDate: item.approvedDate,
          duration: item.duration,
          newDuration: item.newDuration,
          // Determine status from originalRegistration.status
          // MOVE_PENDING = chưa duyệt (pending)
          // MOVED = đã duyệt (approved)
          status: item.status === 'MOVED' ? 'approved' : 
                  item.status === 'MOVE_PENDING' ? 'pending' :
                  // Fallback: use filterStatus if status not available
                  filterStatus === 'Approved' ? 'approved' : 'pending'
        }));
        
        // Sắp xếp: ưu tiên đơn chờ duyệt (pending) lên trên
        const sorted = transformed.sort((a, b) => {
          // Đơn chờ duyệt (pending) lên trước
          if (a.status === 'pending' && b.status === 'approved') return -1;
          if (a.status === 'approved' && b.status === 'pending') return 1;
          // Nếu cùng status, sắp xếp theo registerDate (mới nhất trước)
          return new Date(b.registerDate || 0) - new Date(a.registerDate || 0);
        });
        
        console.log('Transformed data:', sorted);
        setTransferRequests(sorted);
        setTotalItems(totalItems);
        
        // Loại bỏ những đơn đã duyệt khỏi selectedRequests sau khi load
        setSelectedRequests(prev => {
          return prev.filter(id => {
            const request = transformed.find(req => req.id === id);
            return request && request.status !== 'approved';
          });
        });
      } else {
        console.error('Data is not an array:', data);
      }
    } catch (error) {
      console.error('Error loading transfer requests:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tải danh sách đơn chuyển phòng';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentRequests = transferRequests;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedRequests([]);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
    setSelectedRequests([]);
  };

  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
    setSelectedRequests([]);
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    setCurrentPage(1);
    setSelectedRequests([]);
  };

  const handleSelectRequest = (requestId) => {
    // Không cho phép chọn đơn đã duyệt
    const request = currentRequests.find(req => req.id === requestId);
    if (request && request.status === 'approved') {
      return;
    }
    
    setSelectedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    // Chỉ chọn những đơn chưa duyệt
    const unapprovedRequests = currentRequests.filter(req => req.status !== 'approved');
    const unapprovedIds = unapprovedRequests.map(req => req.id);
    
    // Kiểm tra xem tất cả đơn chưa duyệt đã được chọn chưa
    const allUnapprovedSelected = unapprovedIds.every(id => selectedRequests.includes(id));
    
    if (allUnapprovedSelected && unapprovedIds.length > 0) {
      // Bỏ chọn tất cả
      setSelectedRequests(prev => prev.filter(id => !unapprovedIds.includes(id)));
    } else {
      // Chọn tất cả đơn chưa duyệt
      setSelectedRequests(prev => {
        const newSelection = [...prev];
        unapprovedIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleViewDetail = (request) => {
    console.log('Request detail:', request);
    setSelectedRequestDetail(request);
    setShowDetailModal(true);
  };

  const handleApproveRequests = async () => {
    if (selectedRequests.length === 0) {
      showError('Vui lòng chọn ít nhất một đơn để duyệt');
      return;
    }

    setApproveLoading(true);
    try {
      // Gửi một request duyệt nhiều đơn cùng lúc
      const response = await roomRegistrationApi.approveRoomMove(selectedRequests);
      const result = response.data?.data || response.data;
      
      const approvedCount = result.approved?.length || 0;
      const skippedCount = result.skipped?.length || 0;
      
      if (approvedCount > 0) {
        if (skippedCount > 0) {
          showSuccess(`Đã duyệt thành công ${approvedCount} đơn. ${skippedCount} đơn bị bỏ qua.`);
        } else {
          showSuccess(`Đã duyệt thành công ${approvedCount} đơn chuyển phòng!`);
        }
      } else if (skippedCount > 0) {
        showError(`Không thể duyệt đơn. Tất cả ${skippedCount} đơn đều bị bỏ qua.`);
      }
      
      // Reload danh sách và statistics
      await Promise.all([
        loadMoveRoomRequests(),
        loadStatistics()
      ]);
      
      // selectedRequests sẽ được tự động loại bỏ đơn đã duyệt trong loadMoveRoomRequests
      // Nhưng cần clear ngay để tránh hiển thị sai
      setSelectedRequests([]);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi duyệt đơn. Vui lòng thử lại.';
      showError(errorMessage);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRejectRequests = () => {
    if (selectedRequests.length === 0) {
      showError('Vui lòng chọn ít nhất một đơn để từ chối');
      return;
    }
    setShowRejectionModal(true);
  };

  const handleConfirmRejection = async (reasonsData) => {
    if (selectedRequests.length === 0) {
      showError('Vui lòng chọn ít nhất một đơn để từ chối');
      return;
    }

    setRejectLoading(true);
    try {
      console.log('Từ chối đơn với IDs:', selectedRequests);
      console.log('Lý do từ chối:', reasonsData);
      
      // Note: Backend chưa có API reject move, có thể cần implement sau
      // Tạm thời chỉ hiển thị thông báo
      showError('Chức năng từ chối đơn chuyển phòng đang được phát triển. Vui lòng liên hệ quản trị viên.');
      
      setShowRejectionModal(false);
      
      // Reload danh sách và statistics
      await Promise.all([
        loadMoveRoomRequests(),
        loadStatistics()
      ]);
      
      // Clear selectedRequests sau khi reload
      setSelectedRequests([]);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi từ chối đơn. Vui lòng thử lại.';
      showError(errorMessage);
    } finally {
      setRejectLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '-';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };


  return (
    <PageLayout
      title="Duyệt đơn chuyển phòng KTX"
      subtitle="Quản lý và duyệt các đơn chuyển phòng ký túc xá"
      showClose={true}
      onClose={onCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Tổng đơn</p>
              <p className="text-2xl font-bold text-blue-900">{statistics.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Chờ duyệt</p>
              <p className="text-2xl font-bold text-yellow-900">{statistics.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Đã duyệt</p>
              <p className="text-2xl font-bold text-green-900">{statistics.approved}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-32">
            <Select
              value={filterStatus}
              onChange={handleFilterChange}
            >
              <option value="All">Tất cả</option>
              <option value="Unapproved">Chờ duyệt</option>
              <option value="Approved">Đã duyệt</option>
            </Select>
          </div>
          <div className="flex-1">
            <Input
              variant="search"
              placeholder="Tìm kiếm theo tên, MSSV, số phòng..."
              value={searchKeyword}
              onChange={handleSearchChange}
              onClear={handleClearSearch}
              size="medium"
            />
          </div>
        </div>
      </div>

      {selectedRequests.length > 0 && (
        <div className="flex items-center space-x-4 mb-6 p-4 bg-blue-50 rounded-lg">
          <span className="text-blue-800 font-medium">Đã chọn {selectedRequests.length} đơn</span>
          <Button
            onClick={handleApproveRequests}
            variant="success"
            loading={approveLoading}
            loadingText="Đang duyệt..."
          >
            Duyệt đã chọn
          </Button>
          <Button
            onClick={handleRejectRequests}
            variant="danger"
            loading={rejectLoading}
            loadingText="Đang từ chối..."
          >
            Từ chối đã chọn
          </Button>
        </div>
      )}

      <LoadingState
        isLoading={loading}
        isEmpty={!loading && transferRequests.length === 0}
        emptyState={
          <div className="text-center py-12 text-gray-500">
            <p>Không có đơn chuyển phòng nào.</p>
          </div>
        }
      >
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        currentRequests.filter(req => req.status !== 'approved').length > 0 &&
                        currentRequests
                          .filter(req => req.status !== 'approved')
                          .every(req => selectedRequests.includes(req.id))
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={currentRequests.filter(req => req.status !== 'approved').length === 0}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sinh viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chuyển từ → đến
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => handleSelectRequest(request.id)}
                        disabled={request.status === 'approved'}
                        className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                          request.status === 'approved' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.studentName}</div>
                        <div className="text-sm text-gray-500">{request.mssv || request.studentIdNumber}</div>
                        {request.studentEmail && (
                          <div className="text-sm text-gray-500">{request.studentEmail}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.currentRoom.roomNumber} → {request.targetRoom.roomNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          Vị trí {request.slotNumber} → Vị trí {request.newSlotNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(request.currentRoom.monthlyFee)} → {formatCurrency(request.targetRoom.monthlyFee)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={request.status} isApprovalStatus={true} size="small" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="link"
                        onClick={() => handleViewDetail(request)}
                        size="small"
                      >
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-8">
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
      </LoadingState>

      <BaseModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Chi tiết đơn chuyển phòng"
        size="xlarge"
        closeOnOverlayClick={true}
        className="max-h-[105vh] overflow-y-auto"
        zIndex={60}
      >
        <ModalBody className="max-h-[calc(105vh-200px)] overflow-y-auto">
          {selectedRequestDetail && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Thông tin sinh viên</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                    <p className="text-gray-900">{selectedRequestDetail.studentName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">MSSV</label>
                    <p className="text-gray-900">{selectedRequestDetail.mssv || selectedRequestDetail.studentIdNumber}</p>
                  </div>
                  {selectedRequestDetail.dob && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                      <p className="text-gray-900">{formatDate(selectedRequestDetail.dob)}</p>
                    </div>
                  )}
                  {selectedRequestDetail.gender && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                      <p className="text-gray-900">{selectedRequestDetail.gender === 'male' ? 'Nam' : 'Nữ'}</p>
                    </div>
                  )}
                  {selectedRequestDetail.address && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                      <p className="text-gray-900">{selectedRequestDetail.address}</p>
                    </div>
                  )}
                  {selectedRequestDetail.school && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Trường</label>
                      <p className="text-gray-900">{selectedRequestDetail.school}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Thông tin chuyển phòng</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phòng hiện tại</label>
                    <p className="text-gray-900">{selectedRequestDetail.currentRoom.roomNumber}</p>
                    <p className="text-sm text-gray-500">Vị trí {selectedRequestDetail.slotNumber}</p>
                    <p className="text-sm text-gray-500">Phí: {formatCurrency(selectedRequestDetail.currentRoom.monthlyFee)}/tháng</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phòng mới</label>
                    <p className="text-gray-900">{selectedRequestDetail.targetRoom.roomNumber}</p>
                    <p className="text-sm text-gray-500">Vị trí {selectedRequestDetail.newSlotNumber}</p>
                    <p className="text-sm text-gray-500">Phí: {formatCurrency(selectedRequestDetail.targetRoom.monthlyFee)}/tháng</p>
                  </div>
                  {selectedRequestDetail.newDuration && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Thời hạn thuê mới</label>
                      <p className="text-gray-900">{selectedRequestDetail.newDuration} tháng</p>
                    </div>
                  )}
                  {selectedRequestDetail.transfer.expectedTransferDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dự kiến chuyển</label>
                      <p className="text-gray-900">{formatDate(selectedRequestDetail.transfer.expectedTransferDate)}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button onClick={() => setShowDetailModal(false)} variant="outline">
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </ModalBody>
      </BaseModal>

      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onConfirm={handleConfirmRejection}
        title="Nhập lý do từ chối đơn chuyển phòng"
        selectedItems={currentRequests.filter(req => selectedRequests.includes(req.id))}
        onViewDetail={(item) => {
          // Không đóng modal từ chối, chỉ mở modal chi tiết
          handleViewDetail(item);
        }}
        onRemoveItem={(itemId) => {
          // Bỏ đơn khỏi danh sách đã chọn
          setSelectedRequests(prev => {
            const newSelection = prev.filter(id => id !== itemId);
            // Nếu không còn đơn nào, đóng modal từ chối
            if (newSelection.length === 0) {
              setShowRejectionModal(false);
            }
            return newSelection;
          });
        }}
      />
    </PageLayout>
  );
};

export default RoomTransferApprovalPage;
