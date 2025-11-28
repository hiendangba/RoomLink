import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import LoadingState from '../../components/ui/LoadingState';
import PageLayout from '../../components/layout/PageLayout';
import BaseModal, { ModalBody } from '../../components/modal/BaseModal';
import Input from '../../components/ui/Input';
import roomApi from '../../api/roomApi';

// RoomTypeCard component
const RoomTypeCard = ({ roomType, onViewDetail, onEdit, onDelete }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header: tên loại phòng */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{roomType.type || 'N/A'}</h3>
        </div>
      </div>

      {/* Nội dung: tiện nghi */}
      <div className="space-y-2 mb-4">
        <div className="flex flex-wrap gap-1">
          {roomType.amenities && roomType.amenities.length > 0 ? (
            <>
              {roomType.amenities.slice(0, 3).map((amenity, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {amenity}
                </span>
              ))}
              {roomType.amenities.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{roomType.amenities.length - 3}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-500">Chưa có tiện nghi</span>
          )}
        </div>
      </div>

      {/* Hàng nút hành động */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex space-x-2">
          <Button
            onClick={() => onViewDetail(roomType)}
            variant="outline"
            size="small"
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
          >
            Chi tiết
          </Button>
          {onEdit && (
            <Button
              onClick={() => onEdit(roomType)}
              variant="outline"
              size="small"
              className="px-3 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200"
            >
              Sửa
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => onDelete(roomType)}
              variant="outline"
              size="small"
              className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200"
            >
              Xóa
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const RoomTypeManagementPage = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [formData, setFormData] = useState({ type: '', amenities: [] });
  const [formError, setFormError] = useState('');
  const [customAmenity, setCustomAmenity] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const availableAmenities = [
    'Giường đơn',
    'Giường tầng',
    'Bàn học',
    'Ghế xoay',
    'Tủ quần áo',
    'Tủ sách',
    'Điều hòa',
    'Quạt trần',
    'WiFi miễn phí',
    'Internet cáp quang',
    'WC riêng',
    'Nhà tắm riêng',
    'Tủ lạnh mini',
    'Máy nước nóng',
    'Ban công',
    'Cửa sổ',
    'Két sắt',
    'Ổ cắm điện',
    'Đèn học',
    'Gương',
    'Máy giặt chung',
    'Phòng giặt ủi chung',
    'Bếp chung',
    'Phòng sinh hoạt chung',
    'Thang máy',
    'Bảo vệ 24/7',
    'Camera an ninh'
  ];

  const fetchRoomTypes = async () => {
    try {
      setLoading(true);
      const response = await roomApi.getRoomType();
      if (response.data && Array.isArray(response.data)) {
        setRoomTypes(response.data);
      } else {
        setRoomTypes([]);
      }
    } catch (error) {
      console.error('Error loading room types:', error);
      showError('Không thể tải danh sách loại phòng. Vui lòng thử lại.');
      setRoomTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const totalPages = Math.ceil(roomTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRoomTypes = roomTypes.slice(startIndex, endIndex);
  const handlePageChange = (page) => setCurrentPage(page);
  const handleAddNew = () => { setFormData({ type: '', amenities: [] }); setFormError(''); setCustomAmenity(''); setShowAddModal(true); };
  const handleEdit = (roomType) => { setFormData({ type: roomType.type || '', amenities: roomType.amenities || [] }); setSelectedRoomType(roomType); setFormError(''); setCustomAmenity(''); setShowEditModal(true); };
  const handleViewDetail = (roomType) => { setSelectedRoomType(roomType); setShowDetailModal(true); };
  const handleDelete = (roomType) => { setSelectedRoomType(roomType); setShowDeleteModal(true); };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !formData.amenities.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, trimmed]
      }));
      setCustomAmenity('');
    }
  };

  const handleRemoveAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const validateForm = () => {
    if (!formData.type.trim()) { setFormError('Vui lòng nhập tên loại phòng'); return false; }
    if (formData.amenities.length === 0) { setFormError('Vui lòng chọn ít nhất một tiện nghi'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setFormError('');
      setFormLoading(true);
      const requestData = {
        type: formData.type.trim(),
        amenities: formData.amenities
      };
      
      if (showEditModal && selectedRoomType) {
        // Update room type
        const response = await roomApi.updateRoomType(selectedRoomType.id, requestData);
        if (response.success !== false && response.data) {
          showSuccess(response.message || response.data?.message || 'Cập nhật loại phòng thành công.');
          await fetchRoomTypes();
          setTimeout(() => {
            setShowEditModal(false);
            setSelectedRoomType(null);
          }, 1500);
        } else {
          showError(response.message || response.data?.message || 'Có lỗi xảy ra khi cập nhật loại phòng.');
        }
      } else {
        // Create new room type
        const response = await roomApi.createRoomType(requestData);
        if (response.success !== false && response.data) {
          showSuccess(response.message || response.data?.message || 'Thêm loại phòng mới thành công.');
          await fetchRoomTypes();
          setTimeout(() => {
            setShowAddModal(false);
          }, 1500);
        } else {
          showError(response.message || response.data?.message || 'Có lỗi xảy ra khi tạo loại phòng.');
        }
      }
    } catch (error) {
      console.error('Error saving room type:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể lưu loại phòng. Vui lòng thử lại.';
      showError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedRoomType) return;
    try {
      setDeleteLoading(true);
      const response = await roomApi.deleteRoomType(selectedRoomType.id);
      if (response.success !== false) {
        showSuccess(response.message || response.data?.message || 'Xóa loại phòng thành công.');
        await fetchRoomTypes();
        setShowDeleteModal(false);
        setSelectedRoomType(null);
      } else {
        showError(response.message || response.data?.message || 'Có lỗi xảy ra khi xóa loại phòng.');
      }
    } catch (error) {
      console.error('Error deleting room type:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể xóa loại phòng. Vui lòng thử lại.';
      showError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <PageLayout
      title="Quản lý loại phòng"
      subtitle="Thêm, sửa, xóa và quản lý các loại phòng ở KTX"
      showClose={true}
      onClose={onCancel}
      headerActions={
        <Button
          onClick={handleAddNew}
          variant="primary"
          size="small"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        >
          Thêm loại phòng mới
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Tổng loại phòng</p>
              <p className="text-2xl font-bold text-blue-900">{roomTypes.length}</p>
            </div>
          </div>
        </div>
      </div>

      <LoadingState
        isLoading={loading}
        isEmpty={!loading && roomTypes.length === 0}
        emptyState={
          <div className="text-center text-gray-500 mt-8">
            Không có loại phòng nào.
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {currentRoomTypes.map((roomType) => (
            <RoomTypeCard
              key={roomType.id}
              roomType={roomType}
              onViewDetail={handleViewDetail}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
              totalItems={roomTypes.length}
              showInfo={true}
            />
          </div>
        )}
      </LoadingState>

      {(showAddModal || showEditModal) && (
        <BaseModal
          isOpen={showAddModal || showEditModal}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setFormError('');
            setCustomAmenity('');
          }}
          title={showAddModal ? 'Thêm loại phòng mới' : 'Chỉnh sửa loại phòng'}
          size="large"
          closeOnOverlayClick={true}
          className="max-h-[90vh] overflow-y-auto"
          zIndex={60}
        >
          <ModalBody className="max-h-[calc(90vh-200px)] overflow-y-auto">
            <div className="space-y-4">
              <Input
                label="Tên loại phòng"
                name="type"
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                placeholder="Ví dụ: Phòng đơn, Phòng đôi..."
                required
                error={formError && !formData.type.trim() ? formError : ''}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiện nghi <span className="text-red-500">*</span>
                </label>
                
                {/* Danh sách tiện nghi có sẵn */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Chọn từ danh sách có sẵn:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                    {availableAmenities.map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity)}
                          onChange={() => {
                            if (formData.amenities.includes(amenity)) {
                              handleRemoveAmenity(amenity);
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                amenities: [...prev.amenities, amenity]
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Nhập tiện nghi tùy chỉnh */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Thêm tiện nghi tùy chỉnh:</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        name="customAmenity"
                        type="text"
                        value={customAmenity}
                        onChange={(e) => setCustomAmenity(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomAmenity();
                          }
                        }}
                        placeholder="Nhập tiện nghi mới..."
                      />
                    </div>
                    <Button
                      onClick={handleAddCustomAmenity}
                      variant="outline"
                      size="small"
                      disabled={!customAmenity.trim()}
                    >
                      Thêm
                    </Button>
                  </div>
                </div>

                {/* Hiển thị danh sách tiện nghi đã chọn */}
                {formData.amenities.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Tiện nghi đã chọn ({formData.amenities.length}):</p>
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px]">
                      {formData.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {amenity}
                          <button
                            type="button"
                            onClick={() => handleRemoveAmenity(amenity)}
                            className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t">
              <Button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setFormError('');
                  setCustomAmenity('');
                  setSelectedRoomType(null);
                }}
                variant="outline"
                disabled={formLoading}
              >
                Hủy
              </Button>
              <Button 
                onClick={handleSave} 
                variant="primary"
                loading={formLoading}
                loadingText={showAddModal ? 'Đang thêm...' : 'Đang cập nhật...'}
              >
                {showAddModal ? 'Thêm mới' : 'Cập nhật'}
              </Button>
            </div>
          </ModalBody>
        </BaseModal>
      )}

      {showDetailModal && selectedRoomType && (
        <BaseModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Chi tiết loại phòng"
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
                    <label className="block text-sm font-medium text-gray-700">Tên loại phòng</label>
                    <p className="text-gray-900">{selectedRoomType.type || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Tiện nghi</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedRoomType.amenities && selectedRoomType.amenities.length > 0 ? (
                    selectedRoomType.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-900">{amenity}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Chưa có tiện nghi</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button onClick={() => setShowDetailModal(false)} variant="outline">
                Đóng
              </Button>
            </div>
          </ModalBody>
        </BaseModal>
      )}

      {showDeleteModal && (
        <BaseModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Xác nhận xóa"
          size="small"
          closeOnOverlayClick={true}
          zIndex={60}
        >
          <ModalBody>
            <p className="text-gray-600 mb-6">
              {selectedRoomType ? `Bạn có chắc chắn muốn xóa loại phòng "${selectedRoomType.type || selectedRoomType.id}"?` : 'Bạn có chắc chắn muốn xóa loại phòng này?'}
            </p>
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <Button 
                onClick={() => setShowDeleteModal(false)} 
                variant="outline"
                disabled={deleteLoading}
              >
                Hủy
              </Button>
              <Button 
                onClick={handleConfirmDelete} 
                variant="danger"
                loading={deleteLoading}
                loadingText="Đang xóa..."
              >
                Xóa
              </Button>
            </div>
          </ModalBody>
        </BaseModal>
      )}
    </PageLayout>
  );
};

export default RoomTypeManagementPage;
