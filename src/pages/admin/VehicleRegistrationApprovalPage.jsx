import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { numberPlateApi } from '../../api';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import LoadingState from '../../components/ui/LoadingState';
import RejectionModal from '../../components/modal/RejectionModal';
import BaseModal, { ModalBody } from '../../components/modal/BaseModal';

const VehicleRegistrationApprovalPage = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [numberPlates, setNumberPlates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected
  const [searchKeyword, setSearchKeyword] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    loadNumberPlates();
  }, [filterStatus, currentPage, searchKeyword]);

  // Load statistics riêng, không phụ thuộc vào filter hoặc page
  useEffect(() => {
    loadStatistics();
  }, []); // Chỉ load một lần khi component mount

  // Load statistics cho tất cả đơn (không phân trang, không filter)
  const loadStatistics = async () => {
    try {
      // Gọi 4 API riêng để lấy số liệu thống kê
      const [allResponse, pendingResponse, approvedResponse, rejectedResponse] = await Promise.all([
        numberPlateApi.getNumberPlates({ page: 1, limit: 1 }),
        numberPlateApi.getNumberPlates({ status: 'pending', page: 1, limit: 1 }),
        numberPlateApi.getNumberPlates({ status: 'approved', page: 1, limit: 1 }),
        numberPlateApi.getNumberPlates({ status: 'rejected', page: 1, limit: 1 })
      ]);

      setStatistics({
        total: allResponse.totalItems || 0,
        pending: pendingResponse.totalItems || 0,
        approved: approvedResponse.totalItems || 0,
        rejected: rejectedResponse.totalItems || 0
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Không hiển thị error để tránh làm phiền user
    }
  };

  const loadNumberPlates = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        keyword: searchKeyword.trim() || undefined, // Chỉ gửi keyword nếu có giá trị
      };
      
      // Chỉ thêm status nếu không phải 'all'
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const response = await numberPlateApi.getNumberPlates(params);
      
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
          mssv: item.mssv,
          school: item.school,
          dob: item.dob,
          gender: item.gender,
          address: item.address,
          identification: item.identification,
          number: item.number,
          image: item.image,
          registerDate: item.registerDate,
          status: item.status || 'pending'
        }));
        
        // Sắp xếp: ưu tiên đơn chờ duyệt (pending) lên trên
        const sorted = transformed.sort((a, b) => {
          // Đơn chờ duyệt (pending) lên trước
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          // Nếu cùng status, sắp xếp theo registerDate (mới nhất trước)
          return new Date(b.registerDate) - new Date(a.registerDate);
        });
        
        console.log('Transformed data:', sorted);
        setNumberPlates(sorted);
        setTotalItems(totalItems);
        
        // Loại bỏ những đơn đã duyệt khỏi selectedRequests sau khi load
        setSelectedRequests(prev => {
          return prev.filter(id => {
            const request = transformed.find(req => req.id === id);
            return request && request.status === 'pending';
          });
        });
      } else {
        console.error('Data is not an array:', data);
      }
    } catch (error) {
      console.error('Error loading number plates:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tải danh sách đơn đăng ký biển số';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentRequests = numberPlates;

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
    // Chỉ cho phép chọn đơn chờ duyệt
    const request = currentRequests.find(req => req.id === requestId);
    if (request && request.status !== 'pending') {
      return;
    }
    
    setSelectedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    // Chỉ chọn những đơn chờ duyệt
    const pendingRequests = currentRequests.filter(req => req.status === 'pending');
    const pendingIds = pendingRequests.map(req => req.id);
    
    // Kiểm tra xem tất cả đơn chờ duyệt đã được chọn chưa
    const allPendingSelected = pendingIds.every(id => selectedRequests.includes(id));
    
    if (allPendingSelected && pendingIds.length > 0) {
      // Bỏ chọn tất cả
      setSelectedRequests(prev => prev.filter(id => !pendingIds.includes(id)));
    } else {
      // Chọn tất cả đơn chờ duyệt
      setSelectedRequests(prev => {
        const newSelection = [...prev];
        pendingIds.forEach(id => {
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
      const response = await numberPlateApi.approveNumberPlate(selectedRequests);
      const result = response.data?.data || response.data;
      
      const approvedCount = result.approved?.length || 0;
      const skippedCount = result.skipped?.length || 0;
      
      if (approvedCount > 0) {
        if (skippedCount > 0) {
          showSuccess(`Đã duyệt thành công ${approvedCount} đơn. ${skippedCount} đơn bị bỏ qua.`);
        } else {
          showSuccess(`Đã duyệt thành công ${approvedCount} đơn đăng ký biển số!`);
        }
      } else if (skippedCount > 0) {
        showError(`Không thể duyệt đơn. Tất cả ${skippedCount} đơn đều bị bỏ qua.`);
      }
      
      // Reload danh sách và statistics
      await Promise.all([
        loadNumberPlates(),
        loadStatistics()
      ]);
      
      // selectedRequests sẽ được tự động loại bỏ đơn đã duyệt trong loadNumberPlates
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
      
      // Gửi một request từ chối nhiều đơn cùng lúc (kèm lý do)
      const response = await numberPlateApi.rejectNumberPlate(selectedRequests, reasonsData);
      console.log('API Response:', response);
      
      const result = response.data?.data || response.data;
      console.log('Kết quả từ chối:', result);
      
      const rejectedCount = result.rejected?.length || 0;
      const skippedCount = result.skipped?.length || 0;
      
      if (rejectedCount > 0) {
        if (skippedCount > 0) {
          showSuccess(`Đã từ chối ${rejectedCount} đơn. ${skippedCount} đơn bị bỏ qua.`);
        } else {
          showSuccess(`Đã từ chối ${rejectedCount} đơn đăng ký biển số!`);
        }
      } else if (skippedCount > 0) {
        showError(`Không thể từ chối đơn. Tất cả ${skippedCount} đơn đều bị bỏ qua.`);
      }
      
      setShowRejectionModal(false);
      
      // Reload danh sách và statistics
      await Promise.all([
        loadNumberPlates(),
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <PageLayout
      title="Duyệt đơn đăng ký biển số xe"
      subtitle="Quản lý và duyệt các đơn đăng ký biển số xe của sinh viên"
      showClose={true}
      onClose={onCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Từ chối</p>
              <p className="text-2xl font-bold text-red-900">{statistics.rejected}</p>
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
              <option value="all">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </Select>
          </div>
          <div className="flex-1">
            <Input
              variant="search"
              placeholder="Tìm kiếm theo tên, MSSV, số biển số, CCCD..."
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
        isEmpty={!loading && numberPlates.length === 0}
        emptyState={
          <div className="text-center py-12 text-gray-500">
            <p>Không có đơn đăng ký biển số nào.</p>
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
                        currentRequests.filter(req => req.status === 'pending').length > 0 &&
                        currentRequests
                          .filter(req => req.status === 'pending')
                          .every(req => selectedRequests.includes(req.id))
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={currentRequests.filter(req => req.status === 'pending').length === 0}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sinh viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MSSV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Biển số
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày đăng ký
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
                        disabled={request.status !== 'pending'}
                        className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                          request.status !== 'pending' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.studentName}</div>
                        <div className="text-sm text-gray-500">{request.address}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.mssv}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(request.registerDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : request.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status === 'pending' ? 'Chờ duyệt' : request.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                      </span>
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
        title="Chi tiết đơn đăng ký biển số"
        size="xlarge"
        closeOnOverlayClick={true}
        className="max-h-[105vh] overflow-y-auto"
        zIndex={60}
      >
        <ModalBody className="max-h-[calc(105vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Thông tin sinh viên</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                  <p className="text-gray-900">{selectedRequestDetail?.studentName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">MSSV</label>
                  <p className="text-gray-900">{selectedRequestDetail?.mssv}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                  <p className="text-gray-900">{formatDate(selectedRequestDetail?.dob)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                  <p className="text-gray-900">{selectedRequestDetail?.gender === 'male' ? 'Nam' : 'Nữ'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                  <p className="text-gray-900">{selectedRequestDetail?.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CCCD</label>
                  <p className="text-gray-900">{selectedRequestDetail?.identification}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Thông tin biển số</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số biển số</label>
                  <p className="text-gray-900">{selectedRequestDetail?.number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày đăng ký</label>
                  <p className="text-gray-900">{formatDate(selectedRequestDetail?.registerDate)}</p>
                </div>
                {selectedRequestDetail?.image && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh biển số</label>
                    <div className="border border-gray-300 rounded-lg p-2 bg-gray-50">
                      <img
                        src={selectedRequestDetail.image}
                        alt="Ảnh biển số"
                        className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(selectedRequestDetail.image, '_blank')}
                        onError={(e) => {
                          console.error('Error loading image:', selectedRequestDetail.image);
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
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
        </ModalBody>
      </BaseModal>

      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onConfirm={handleConfirmRejection}
        title="Nhập lý do từ chối đơn đăng ký biển số"
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

export default VehicleRegistrationApprovalPage;
