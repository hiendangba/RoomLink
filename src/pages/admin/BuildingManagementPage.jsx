import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import LoadingState from '../../components/ui/LoadingState';
import PageLayout from '../../components/layout/PageLayout';
import BaseModal, { ModalBody } from '../../components/modal/BaseModal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import buildingApi from '../../api/buildingApi';
import roomApi from '../../api/roomApi';

// BuildingCard component
const BuildingCard = ({ building, onViewDetail }) => {
  const getGenderDisplay = (gender) => {
    switch (gender) {
      case 'male':
        return { text: 'Nam', className: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'female':
        return { text: 'Nữ', className: 'bg-pink-100 text-pink-800 border-pink-200' };
      default:
        return { text: gender || 'Chưa xác định', className: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const genderDisplay = getGenderDisplay(building.genderRestriction);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header: tên tòa nhà */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{building.name || 'N/A'}</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${genderDisplay.className}`}>
          {genderDisplay.text}
        </span>
      </div>

      {/* Nội dung: thông tin cơ bản */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Số tầng:</span>
          <span className="text-sm font-medium">{building.numberFloor || 'N/A'}</span>
        </div>
        {building.roomTypes && building.roomTypes.length > 0 && (
          <div>
            <span className="text-sm text-gray-600">Loại phòng:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {building.roomTypes.slice(0, 2).map((roomType, index) => (
                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {roomType.type || roomType}
                </span>
              ))}
              {building.roomTypes.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{building.roomTypes.length - 2}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hàng nút hành động */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex space-x-2">
          <Button
            onClick={() => onViewDetail(building)}
            variant="outline"
            size="small"
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
          >
            Chi tiết
          </Button>
        </div>
      </div>
    </div>
  );
};

const BuildingManagementPage = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    genderRestriction: 'male',
    numberFloor: '',
    roomTypeIds: []
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const response = await buildingApi.getBuilding();
      if (response.success && Array.isArray(response.data)) {
        setBuildings(response.data);
      } else {
        setBuildings([]);
      }
    } catch (error) {
      console.error('Error loading buildings:', error);
      showError('Không thể tải danh sách tòa nhà. Vui lòng thử lại.');
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const response = await roomApi.getRoomType();
      if (response.data && Array.isArray(response.data)) {
        setRoomTypes(response.data);
      }
    } catch (error) {
      console.error('Error loading room types:', error);
    }
  };

  useEffect(() => {
    fetchBuildings();
    fetchRoomTypes();
  }, []);

  const totalPages = Math.ceil(buildings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBuildings = buildings.slice(startIndex, endIndex);
  const handlePageChange = (page) => setCurrentPage(page);

  const handleAddNew = () => {
    setFormData({
      name: '',
      genderRestriction: 'male',
      numberFloor: '',
      roomTypeIds: []
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleViewDetail = (building) => {
    setSelectedBuilding(building);
    setShowDetailModal(true);
  };

  const handleDelete = (building) => {
    setSelectedBuilding(building);
    setShowDeleteModal(true);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên tòa nhà');
      return false;
    }
    if (!formData.numberFloor || parseInt(formData.numberFloor) < 1 || parseInt(formData.numberFloor) > 20) {
      setFormError('Số tầng phải từ 1 đến 20');
      return false;
    }
    if (formData.roomTypeIds.length === 0) {
      setFormError('Vui lòng chọn ít nhất một loại phòng');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setFormError('');
      setFormLoading(true);
      const requestData = {
        name: formData.name.trim(),
        genderRestriction: formData.genderRestriction,
        numberFloor: parseInt(formData.numberFloor),
        roomTypeIds: formData.roomTypeIds
      };

      const response = await buildingApi.createBuilding(requestData);
      if (response.success) {
        showSuccess('Thêm tòa nhà mới thành công.');
        await fetchBuildings();
        setTimeout(() => {
          setShowAddModal(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving building:', error);
      showError(error.response?.data?.message || 'Không thể lưu tòa nhà. Vui lòng thử lại.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBuilding) return;
    try {
      setFormLoading(true);
      const response = await buildingApi.deleteBuilding(selectedBuilding.id);
      if (response.success) {
        showSuccess('Xóa tòa nhà thành công.');
        await fetchBuildings();
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deleting building:', error);
      showError(error.response?.data?.message || 'Không thể xóa tòa nhà. Vui lòng thử lại.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoomTypeToggle = (roomTypeId) => {
    setFormData(prev => ({
      ...prev,
      roomTypeIds: prev.roomTypeIds.includes(roomTypeId)
        ? prev.roomTypeIds.filter(id => id !== roomTypeId)
        : [...prev.roomTypeIds, roomTypeId]
    }));
  };

  return (
    <PageLayout
      title="Quản lý tòa nhà"
      subtitle="Thêm, xóa và quản lý các tòa nhà trong ký túc xá"
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
          Thêm tòa nhà mới
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Tổng tòa nhà</p>
              <p className="text-2xl font-bold text-blue-900">{buildings.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Tòa nam</p>
              <p className="text-2xl font-bold text-blue-900">
                {buildings.filter(b => b.genderRestriction === 'male').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-pink-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-pink-100 rounded-lg">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pink-600">Tòa nữ</p>
              <p className="text-2xl font-bold text-pink-900">
                {buildings.filter(b => b.genderRestriction === 'female').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <LoadingState
        isLoading={loading}
        isEmpty={!loading && buildings.length === 0}
        emptyState={
          <div className="text-center text-gray-500 mt-8">
            Không có tòa nhà nào.
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {currentBuildings.map((building) => (
            <BuildingCard
              key={building.id}
              building={building}
              onViewDetail={handleViewDetail}
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
              totalItems={buildings.length}
              showInfo={true}
            />
          </div>
        )}
      </LoadingState>

      {/* Add Modal */}
      {showAddModal && (
        <BaseModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setFormError('');
          }}
          title="Thêm tòa nhà mới"
          size="large"
          closeOnOverlayClick={true}
          className="max-h-[90vh] overflow-y-auto"
          zIndex={60}
        >
          <ModalBody className="max-h-[calc(90vh-200px)] overflow-y-auto">
            <div className="space-y-4">
              <Input
                label="Tên tòa nhà"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ví dụ: Tòa A, Tòa B..."
                required
                error={formError && !formData.name.trim() ? formError : ''}
              />

              <Select
                label="Giới hạn giới tính"
                name="genderRestriction"
                value={formData.genderRestriction}
                onChange={handleInputChange}
                required
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </Select>

              <Input
                label="Số tầng"
                name="numberFloor"
                type="number"
                value={formData.numberFloor}
                onChange={handleInputChange}
                placeholder="Ví dụ: 5"
                required
                min="1"
                max="20"
                error={formError && (!formData.numberFloor || parseInt(formData.numberFloor) < 1 || parseInt(formData.numberFloor) > 20) ? formError : ''}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại phòng <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {roomTypes.map((roomType) => (
                    <label
                      key={roomType.id}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.roomTypeIds.includes(roomType.id)}
                        onChange={() => handleRoomTypeToggle(roomType.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{roomType.type || 'N/A'}</span>
                    </label>
                  ))}
                </div>
                {formData.roomTypeIds.length > 0 && (
                  <p className="mt-2 text-xs text-gray-500">
                    Đã chọn {formData.roomTypeIds.length} loại phòng
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t">
              <Button
                onClick={() => {
                  setShowAddModal(false);
                  setFormError('');
                }}
                variant="outline"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                variant="primary"
                disabled={formLoading}
                loading={formLoading}
                loadingText="Đang tạo tòa nhà..."
              >
                Thêm mới
              </Button>
            </div>
          </ModalBody>
        </BaseModal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBuilding && (
        <BaseModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Chi tiết tòa nhà"
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
                    <label className="block text-sm font-medium text-gray-700">Tên tòa nhà</label>
                    <p className="text-gray-900">{selectedBuilding.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giới hạn giới tính</label>
                    <p className="text-gray-900">
                      {selectedBuilding.genderRestriction === 'male' ? 'Nam' : 
                       selectedBuilding.genderRestriction === 'female' ? 'Nữ' : 
                       selectedBuilding.genderRestriction || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số tầng</label>
                    <p className="text-gray-900">{selectedBuilding.numberFloor || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {selectedBuilding.roomTypes && selectedBuilding.roomTypes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Loại phòng</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedBuilding.roomTypes.map((roomType, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-900">{roomType.type || roomType || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button onClick={() => setShowDetailModal(false)} variant="outline">
                Đóng
              </Button>
            </div>
          </ModalBody>
        </BaseModal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedBuilding && (
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
              Bạn có chắc chắn muốn xóa tòa nhà "{selectedBuilding.name || selectedBuilding.id}"?
            </p>
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <Button onClick={() => setShowDeleteModal(false)} variant="outline">
                Hủy
              </Button>
              <Button
                onClick={handleConfirmDelete}
                variant="danger"
                disabled={formLoading}
                loading={formLoading}
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

export default BuildingManagementPage;

