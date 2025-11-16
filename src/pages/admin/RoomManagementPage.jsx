import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import PageLayout from '../../components/layout/PageLayout';
import BaseModal, { ModalBody } from '../../components/modal/BaseModal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import roomApi from '../../api/roomApi';
import buildingApi from '../../api/buildingApi';
import floorApi from '../../api/floorApi';

const RoomManagementPage = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [totalItems, setTotalItems] = useState(0);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterBuildingId, setFilterBuildingId] = useState('All');
  const [filterFloorId, setFilterFloorId] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [formData, setFormData] = useState({ 
    roomNumber: '', 
    buildingId: '', 
    floorId: '', 
    roomTypeId: '', 
    capacity: '', 
    monthlyFee: '' 
  });
  const [formLoading, setFormLoading] = useState(false);

  // Fetch buildings
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await buildingApi.getBuilding();
        if (res.success) setBuildings(res.data);
      } catch (err) {
        showError(err?.response?.data?.message || "Không tải được danh sách tòa nhà");
      }
    };
    fetchBuildings();
  }, []);

  // Fetch room types when building changes (for add room form)
  useEffect(() => {
    const fetchRoomTypes = async () => {
      if (!formData.buildingId) {
        setRoomTypes([]);
        return;
      }
      try {
        const res = await roomApi.getRoomTypeForAdmin(formData.buildingId);
        if (res.success) setRoomTypes(res.data);
      } catch (err) {
        showError(err?.response?.data?.message || "Không tải được danh sách loại phòng");
      }
    };
    fetchRoomTypes();
  }, [formData.buildingId]);

  // Fetch floors when building changes
  useEffect(() => {
    const fetchFloors = async () => {
      if (!formData.buildingId) {
        setFloors([]);
        return;
      }
      try {
        const res = await floorApi.getFloor({ buildingId: formData.buildingId });
        if (res.success) setFloors(res.data);
      } catch (err) {
        showError(err?.response?.data?.message || "Không tải được danh sách tầng");
      }
    };
    fetchFloors();
  }, [formData.buildingId]);

  // Fetch rooms
  const fetchRooms = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: itemsPerPage,
        status: filterStatus,
        floorId: filterFloorId,
      };
      const response = await roomApi.getRoomForAdmin(params);
      if (response.success && response.data) {
        // Map backend data to frontend format
        const mappedRooms = response.data.map(room => {
          const occupiedSlots = room.roomSlots?.filter(slot => slot.isOccupied) || [];
          const totalSlots = room.roomSlots?.length || 0;
          const isFull = totalSlots > 0 && occupiedSlots.length === totalSlots;
          const isAvailable = totalSlots > 0 && occupiedSlots.length < totalSlots;
          
          let status = 'maintenance';
          if (isFull) status = 'occupied';
          else if (isAvailable) status = 'available';

          return {
            id: room.id,
            roomNumber: room.roomNumber,
            building: room.floor_number ? `Tầng ${room.floor_number}` : 'N/A',
            floor: room.floor_number || 0,
            floorId: room.floorId,
            roomType: room.roomType_type || 'N/A',
            roomTypeId: room.roomTypeId,
            capacity: room.capacity,
            monthlyFee: room.monthlyFee,
            amenities: room.roomType_amenities || [],
            status,
            roomSlots: room.roomSlots || [],
            currentResidents: occupiedSlots.length,
            totalSlots: totalSlots,
          };
        });
        setRooms(mappedRooms);
        if (response.metadata && response.metadata.totalItems !== undefined) {
          setTotalItems(response.metadata.totalItems);
        }
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Lỗi khi tải dữ liệu phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms(currentPage);
  }, [currentPage, filterStatus, filterBuildingId, filterFloorId]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterBuildingId, filterFloorId]);

  // Reset floor filter when building changes
  useEffect(() => {
    if (filterBuildingId !== 'All') {
      setFilterFloorId('All');
    }
  }, [filterBuildingId]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (type, value) => {
    if (type === 'status') setFilterStatus(value);
    else if (type === 'building') setFilterBuildingId(value);
    else if (type === 'floor') setFilterFloorId(value);
  };

  const handleAddRoom = () => {
    setFormData({ 
      roomNumber: '', 
      buildingId: '', 
      floorId: '', 
      roomTypeId: '', 
      capacity: '', 
      monthlyFee: '' 
    });
    setShowAddModal(true);
  };

  const handleViewDetail = (room) => {
    setSelectedRoom(room);
    setShowDetailModal(true);
  };

  const handleDeleteRoom = (room) => {
    setSelectedRoom(room);
    setShowDeleteModal(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!formData.roomNumber.trim() || !formData.buildingId || !formData.floorId || !formData.roomTypeId || !formData.capacity || !formData.monthlyFee) {
      showError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setFormLoading(true);
      const payload = {
        roomNumber: formData.roomNumber.trim(),
        floorId: formData.floorId,
        roomTypeId: formData.roomTypeId,
        capacity: parseInt(formData.capacity),
        monthlyFee: parseInt(formData.monthlyFee),
      };

      const res = await roomApi.createRoom(payload);
      if (res.success) {
        showSuccess('Thêm phòng mới thành công!');
        setShowAddModal(false);
        setFormData({ 
          roomNumber: '', 
          buildingId: '', 
          floorId: '', 
          roomTypeId: '', 
          capacity: '', 
          monthlyFee: '' 
        });
        fetchRooms(currentPage);
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Lỗi khi tạo phòng");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedRoom && selectedRoom.currentResidents > 0) {
      showError('Không thể xóa phòng đang có sinh viên cư trú');
      setShowDeleteModal(false);
      return;
    }
    // TODO: Implement delete API when available
    showError('Chức năng xóa phòng chưa được hỗ trợ');
    setShowDeleteModal(false);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { text: 'Trống', color: 'bg-green-100 text-green-800' },
      occupied: { text: 'Đầy', color: 'bg-blue-100 text-blue-800' },
      maintenance: { text: 'Bảo trì', color: 'bg-yellow-100 text-yellow-800' },
      reserved: { text: 'Đã đặt', color: 'bg-purple-100 text-purple-800' }
    };
    const config = statusConfig[status] || statusConfig.available;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get all floors for filter (from all buildings)
  const [allFloors, setAllFloors] = useState([]);
  useEffect(() => {
    const fetchAllFloors = async () => {
      const floorsList = [];
      for (const building of buildings) {
        try {
          const res = await floorApi.getFloor({ buildingId: building.id });
          if (res.success) {
            res.data.forEach(floor => {
              floorsList.push({
                id: floor.id,
                number: floor.number,
                buildingId: floor.buildingId,
                buildingName: building.name,
              });
            });
          }
        } catch (err) {
          console.error(`Error fetching floors for building ${building.id}:`, err);
        }
      }
      setAllFloors(floorsList);
    };
    if (buildings.length > 0) {
      fetchAllFloors();
    }
  }, [buildings]);

  return (
    <PageLayout
      title="Quản lý phòng ở"
      subtitle="Quản lý thông tin các phòng trong ký túc xá"
      showClose={true}
      onClose={onCancel}
      headerActions={
        <Button
          onClick={handleAddRoom}
          variant="primary"
          size="small"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        >
          Thêm phòng mới
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Tổng số phòng</p>
              <p className="text-2xl font-bold text-blue-900">{totalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Phòng trống</p>
              <p className="text-2xl font-bold text-green-900">
                {rooms.filter(r => r.status === 'available').length}
              </p>
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
              <p className="text-sm font-medium text-blue-600">Phòng đầy</p>
              <p className="text-2xl font-bold text-blue-900">
                {rooms.filter(r => r.status === 'occupied').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-32">
            <Select
              name="filterStatus"
              value={filterStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="All">Tất cả</option>
              <option value="Available">Trống</option>
              <option value="Full">Đầy</option>
            </Select>
          </div>
          <div className="w-32">
            <Select
              name="filterBuildingId"
              value={filterBuildingId}
              onChange={(e) => handleFilterChange('building', e.target.value)}
            >
              <option value="All">Tất cả tòa</option>
              {buildings.map(building => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-32">
            <Select
              name="filterFloorId"
              value={filterFloorId}
              onChange={(e) => handleFilterChange('floor', e.target.value)}
              disabled={filterBuildingId === 'All'}
            >
              <option value="All">Tất cả tầng</option>
              {allFloors
                .filter(floor => filterBuildingId === 'All' || floor.buildingId === filterBuildingId)
                .map(floor => (
                  <option key={floor.id} value={floor.id}>
                    Tầng {floor.number}
                  </option>
                ))}
            </Select>
          </div>
        </div>
      </div>

      <LoadingState
        isLoading={loading}
        isEmpty={!loading && rooms.length === 0}
        emptyState={
          <div className="text-center text-gray-500 mt-8">
            Không có phòng nào.
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{room.roomNumber}</h3>
                  <p className="text-sm text-gray-500">{room.building}</p>
                </div>
                <div>
                  {getStatusBadge(room.status)}
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tầng:</span>
                  <span className="text-sm font-medium">{room.floor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Loại:</span>
                  <span className="text-sm font-medium">{room.roomType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sức chứa:</span>
                  <span className="text-sm font-medium">{room.currentResidents}/{room.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phí/tháng:</span>
                  <span className="text-sm font-medium text-green-600">{formatCurrency(room.monthlyFee)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleViewDetail(room)}
                    variant="outline"
                    size="small"
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    Chi tiết
                  </Button>
                  <Button
                    onClick={() => handleDeleteRoom(room)}
                    variant="outline"
                    size="small"
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
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
      </LoadingState>

      {/* Add Room Modal */}
      {showAddModal && (
        <BaseModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setFormData({ 
              roomNumber: '', 
              buildingId: '', 
              floorId: '', 
              roomTypeId: '', 
              capacity: '', 
              monthlyFee: '' 
            });
          }}
          title="Thêm phòng mới"
          size="large"
        >
          <ModalBody>
            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Số phòng"
                  name="roomNumber"
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                  placeholder="VD: A101"
                  required
                />
                <Select
                  label="Tòa nhà"
                  name="buildingId"
                  value={formData.buildingId}
                  onChange={(e) => {
                    setFormData({...formData, buildingId: e.target.value, floorId: '', roomTypeId: ''});
                  }}
                  required
                >
                  <option value="">Chọn tòa nhà</option>
                  {buildings.map(building => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </Select>
                <Select
                  label="Tầng"
                  name="floorId"
                  value={formData.floorId}
                  onChange={(e) => setFormData({...formData, floorId: e.target.value})}
                  disabled={!formData.buildingId}
                  required
                >
                  <option value="">Chọn tầng</option>
                  {floors.map(floor => (
                    <option key={floor.id} value={floor.id}>Tầng {floor.number}</option>
                  ))}
                </Select>
                <Select
                  label="Loại phòng"
                  name="roomTypeId"
                  value={formData.roomTypeId}
                  onChange={(e) => setFormData({...formData, roomTypeId: e.target.value})}
                  disabled={!formData.buildingId}
                  required
                >
                  <option value="">Chọn loại phòng</option>
                  {roomTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.type}</option>
                  ))}
                </Select>
                <Input
                  label="Sức chứa"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  min="1"
                  max="10"
                  required
                />
                <Input
                  label="Phí thuê/tháng"
                  name="monthlyFee"
                  type="number"
                  value={formData.monthlyFee}
                  onChange={(e) => setFormData({...formData, monthlyFee: e.target.value})}
                  min="0"
                  step="10000"
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ 
                      roomNumber: '', 
                      buildingId: '', 
                      floorId: '', 
                      roomTypeId: '', 
                      capacity: '', 
                      monthlyFee: '' 
                    });
                  }}
                  variant="outline"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={formLoading}
                  disabled={formLoading}
                >
                  Thêm phòng
                </Button>
              </div>
            </form>
          </ModalBody>
        </BaseModal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRoom && (
        <BaseModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Chi tiết phòng ${selectedRoom.roomNumber}`}
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
                    <label className="block text-sm font-medium text-gray-700">Số phòng</label>
                    <p className="text-gray-900">{selectedRoom.roomNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tầng</label>
                    <p className="text-gray-900">{selectedRoom.floor}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loại phòng</label>
                    <p className="text-gray-900">{selectedRoom.roomType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sức chứa</label>
                    <p className="text-gray-900">{selectedRoom.capacity} người</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phí/tháng</label>
                    <p className="text-gray-900 text-green-600">{formatCurrency(selectedRoom.monthlyFee)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                    <p className="text-gray-900">{getStatusBadge(selectedRoom.status)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Tiện nghi</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedRoom.amenities && selectedRoom.amenities.length > 0 ? (
                    selectedRoom.amenities.map((amenity, index) => (
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

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Thông tin sinh viên</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số sinh viên hiện tại</label>
                    <p className="text-gray-900">{selectedRoom.currentResidents}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sức chứa</label>
                    <p className="text-gray-900">{selectedRoom.capacity}</p>
                  </div>
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

      {/* Delete Modal */}
      {showDeleteModal && selectedRoom && (
        <BaseModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Xác nhận xóa phòng"
          size="small"
        >
          <ModalBody>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Bạn có chắc chắn muốn xóa phòng <strong>{selectedRoom.roomNumber}</strong> không?
              </p>
              {selectedRoom.currentResidents > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-red-800 font-medium">Không thể xóa phòng đang có sinh viên cư trú</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end space-x-4">
              <Button onClick={() => setShowDeleteModal(false)} variant="outline">
                Hủy
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={selectedRoom.currentResidents > 0}
                variant="danger"
              >
                Xóa phòng
              </Button>
            </div>
          </ModalBody>
        </BaseModal>
      )}
    </PageLayout>
  );
};

export default RoomManagementPage;
