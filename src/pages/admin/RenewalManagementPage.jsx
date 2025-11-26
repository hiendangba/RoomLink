import React, { useState, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { renewalApi } from '../../api';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import LoadingState from '../../components/ui/LoadingState';
import StatusBadge from '../../components/ui/StatusBadge';
import BaseModal, { ModalBody, ModalFooter } from '../../components/modal/BaseModal';

const RenewalManagementPage = ({ onCancel }) => {
  const { showSuccess, showError } = useNotification();
  const [activeRenewal, setActiveRenewal] = useState(null);
  const [loadingActive, setLoadingActive] = useState(true);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('All'); // All, Active, Inactive
  const [searchKeyword, setSearchKeyword] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);
  const [stopLoading, setStopLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'create' or 'stop'

  // Load active renewal
  useEffect(() => {
    loadActiveRenewal();
  }, []);

  // Load history when filters change
  useEffect(() => {
    loadHistory();
  }, [filterStatus, currentPage, searchKeyword]);

  const loadActiveRenewal = async () => {
    try {
      setLoadingActive(true);
      const response = await renewalApi.getActive();
      if (response.success !== false && response.data) {
        setActiveRenewal(response.data);
      } else {
        setActiveRenewal(null);
      }
    } catch (error) {
      // Không có renewal active là bình thường, không hiển thị error
      setActiveRenewal(null);
    } finally {
      setLoadingActive(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: filterStatus,
        keyword: searchKeyword.trim() || undefined
      };
      
      const response = await renewalApi.getHistory(params);
      if (response.success !== false && Array.isArray(response.data)) {
        setHistory(response.data);
        setTotalItems(response.totalItems || 0);
      } else {
        setHistory([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Error loading renewal history:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tải lịch sử renewal.';
      showError(errorMessage);
      setHistory([]);
      setTotalItems(0);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateRenewal = () => {
    setConfirmAction('create');
    setShowConfirmModal(true);
  };

  const handleStopRenewal = () => {
    setConfirmAction('stop');
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    try {
      if (confirmAction === 'create') {
        setCreateLoading(true);
        const response = await renewalApi.createRenewal();
        if (response.success !== false) {
          showSuccess(response.message || response.data?.message || 'Tạo đợt renewal thành công!');
          await loadActiveRenewal();
          await loadHistory();
        } else {
          showError(response.message || response.data?.message || 'Có lỗi xảy ra khi tạo renewal.');
        }
      } else if (confirmAction === 'stop') {
        setStopLoading(true);
        const response = await renewalApi.stopRenewal();
        if (response.success !== false) {
          showSuccess(response.message || response.data?.message || 'Dừng đợt renewal thành công!');
          await loadActiveRenewal();
          await loadHistory();
        } else {
          showError(response.message || response.data?.message || 'Có lỗi xảy ra khi dừng renewal.');
        }
      }
      setShowConfirmModal(false);
      setConfirmAction(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      showError(errorMessage);
    } finally {
      setCreateLoading(false);
      setStopLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
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

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <PageLayout
      title="Quản lý đợt yêu cầu"
      subtitle="Quản lý các đợt yêu cầu về phòng ở (gia hạn, chuyển phòng, hủy phòng)"
      showClose={true}
      onClose={onCancel}
    >
      {/* Active Renewal Status Card */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Trạng thái đợt yêu cầu hiện tại</h2>
            {activeRenewal && (
              <Button
                variant="danger"
                onClick={handleStopRenewal}
                loading={stopLoading}
                loadingText="Đang dừng..."
              >
                Dừng đợt yêu cầu
              </Button>
            )}
          </div>

          <LoadingState isLoading={loadingActive} loadingText="Đang tải..." className="py-8">
            {activeRenewal ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <StatusBadge status="active" size="medium" />
                  <span className="text-gray-700">Đang có đợt yêu cầu đang hoạt động</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ngày bắt đầu</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(activeRenewal.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                    <p className="text-lg font-semibold text-green-600">Đang hoạt động</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Hiện tại không có đợt yêu cầu nào đang hoạt động.</p>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    onClick={handleCreateRenewal}
                    loading={createLoading}
                    loadingText="Đang tạo..."
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    }
                  >
                    Tạo đợt yêu cầu mới
                  </Button>
                </div>
              </div>
            )}
          </LoadingState>
        </div>
      </div>

      {/* History Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-32">
            <Select
              value={filterStatus}
              onChange={handleFilterChange}
            >
              <option value="All">Tất cả</option>
              <option value="Active">Đang hoạt động</option>
              <option value="Inactive">Đã dừng</option>
            </Select>
          </div>
          <div className="flex-1">
            <Input
              variant="search"
              placeholder="Tìm kiếm theo tên admin..."
              value={searchKeyword}
              onChange={handleSearchChange}
              onClear={handleClearSearch}
              size="medium"
            />
          </div>
        </div>
      </div>

      <LoadingState
        isLoading={loadingHistory}
        isEmpty={!loadingHistory && history.length === 0}
        emptyState={
          <div className="text-center py-12 text-gray-500">
            <p>Không có lịch sử đợt gia hạn nào.</p>
          </div>
        }
      >
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người bắt đầu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người dừng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày bắt đầu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày dừng
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge 
                        status={item.isActive ? 'active' : 'inactive'} 
                        size="small" 
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.startedName || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.stoppedName || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(item.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(item.stoppedAt)}</div>
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

      {/* Confirm Modal */}
      <BaseModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        title={confirmAction === 'create' ? 'Xác nhận tạo đợt yêu cầu' : 'Xác nhận dừng đợt yêu cầu'}
        size="medium"
      >
        <ModalBody>
          <p className="text-gray-700">
            {confirmAction === 'create'
              ? 'Bạn có chắc chắn muốn tạo đợt yêu cầu mới? Điều này sẽ cho phép sinh viên thực hiện các yêu cầu về phòng ở (gia hạn, chuyển phòng, hủy phòng).'
              : 'Bạn có chắc chắn muốn dừng đợt yêu cầu hiện tại? Sinh viên sẽ không thể thực hiện các yêu cầu về phòng ở sau khi dừng.'}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowConfirmModal(false);
              setConfirmAction(null);
            }}
          >
            Hủy
          </Button>
          <Button
            variant={confirmAction === 'create' ? 'primary' : 'danger'}
            onClick={handleConfirmAction}
            loading={createLoading || stopLoading}
            loadingText={confirmAction === 'create' ? 'Đang tạo...' : 'Đang dừng...'}
          >
            {confirmAction === 'create' ? 'Tạo' : 'Dừng'}
          </Button>
        </ModalFooter>
      </BaseModal>
    </PageLayout>
  );
};

export default RenewalManagementPage;

