import React, { useState, useEffect } from "react";
import Pagination from "../ui/Pagination";
import Button from "../ui/Button";
import Select from "../ui/Select";
import LoadingState from "../ui/LoadingState";
import { roomApi, buildingApi } from "../../api";
import { useNotification } from '../../contexts/NotificationContext';
import two_bed from "../../assets/2bed.png";
import four_bed from "../../assets/4bed.png";
import six_bed from "../../assets/6bed.png";
import eight_bed from "../../assets/8bed.png";

const RoomSelection = ({ onRoomSelected, onCancel }) => {
  const [filters, setFilters] = useState({
    gender: "",
    building: "",
    roomType: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const [paginatedRooms, setPaginatedRooms] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [floors, setFloors] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [duration, setDuration] = useState("");
  const { showError } = useNotification();

  useEffect(() => {
    if (!selectedFloor) {
      setPaginatedRooms([])
      return;
    }
    const roomsByFloor = rooms.filter(r => r.floor_number === selectedFloor);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedRooms(roomsByFloor.slice(startIndex, endIndex));
  }, [rooms, selectedFloor, currentPage, itemsPerPage]);
  useEffect(() => {
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    if (filters.gender && filters.roomType) {
      fetchBuildings(filters.gender, filters.roomType);
    }
  }, [filters.gender, filters.roomType]);

  useEffect(() => {
    if (filters.roomType && filters.building) {
      fetchRooms(filters.roomType, filters.building);
    }
  }, [filters.roomType, filters.building]);

  const fetchRoomTypes = async () => {
    try {
      const res = await roomApi.getRoomType();
      if (res.success) setRoomTypes(res.data);
    } catch (error) {
      showError(error.message || "Đã xảy ra lỗi!");
    }
  };

  const fetchBuildings = async (genderRestriction, roomTypeId) => {
    try {
      setIsLoading(true);
      
      const res = await buildingApi.getBuildings({ genderRestriction, roomTypeId });

      if (res.success) setBuildings(res.data);
    } catch (error) {
      showError(error.message || "Đã xảy ra lỗi!");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async (roomTypeId, buildingId) => {
    try {
      setIsLoading(true);
      const res = await roomApi.getRoom({ roomTypeId, buildingId });
      if (res.success) {
        setRooms(res.data);
        const uniqueFloors = [...new Set(res.data.map(r => r.floor_number))].sort((a, b) => a - b);
        setFloors(uniqueFloors);

        if (uniqueFloors.length > 0) {
          setSelectedFloor(uniqueFloors[0]);
        } else {
          setSelectedFloor(null);
        }
        setCurrentPage(1);
      }
    } catch (error) {
      showError(error.message || "Đã xảy ra lỗi!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    if (name === "gender") {
      setFilters({ gender: value, building: "", roomType: "" });
      setBuildings([]);
      setRooms([]);
      setFloors([]);
    } else if (name === "roomType") {
      setFilters(prev => ({ ...prev, building: "" }));
      setRooms([]);
      setFloors([]);
    }
  };

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setSelectedSlot(null);
    setDuration("");
  };

  const handleSelectSlot = (slotId) => {
    setSelectedSlot(selectedSlot === slotId ? null : slotId);
  };

  const handleConfirmSelection = () => {
    if (!selectedRoom) {
      showError("Vui lòng chọn phòng trước!");
      return;
    }
    if (!selectedSlot) {
      showError("Vui lòng chọn vị trí trong phòng trước!");
      return;
    }
    if (!duration) {
      showError("Vui lòng chọn thời gian thuê phòng!");
      return;
    }

    onRoomSelected({
      room: selectedRoom,
      slotId: selectedSlot,
      duration: duration,
    });
  };

  const handleBackToRoomList = () => {
    setSelectedRoom(null);
    setSelectedSlot(null);
    setDuration("");
  };

  const getRoomImage = (capacity) => {
    if (capacity === 2) return two_bed;
    if (capacity === 4) return four_bed;
    if (capacity === 6) return six_bed;
    if (capacity === 8) return eight_bed;
    return null;
  };

  const roomsByFloor = rooms.filter(r => r.floor_number === selectedFloor);
  const totalPages = Math.ceil(roomsByFloor.length / itemsPerPage);

  // Helper functions for room display
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getAvailableSlotsCount = (room) => {
    return room.roomSlots.filter(slot => !slot.isOccupied).length;
  };

  const getRoomStatusColor = (room) => {
    const availableSlots = getAvailableSlotsCount(room);
    if (availableSlots === 0) {
      return 'bg-red-100 text-red-800';
    } else if (availableSlots < room.capacity) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  };

  const getRoomStatusText = (room) => {
    const availableSlots = getAvailableSlotsCount(room);
    if (availableSlots === 0) {
      return 'Đã đủ người';
    } else if (availableSlots < room.capacity) {
      return `Còn ${availableSlots} chỗ`;
    } else {
      return 'Còn trống';
    }
  };

  // Nếu đã chọn phòng, hiển thị form chọn giường và thời gian thuê
  if (selectedRoom) {
    const roomImage = getRoomImage(selectedRoom.capacity);
    
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="small"
                onClick={handleBackToRoomList}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                }
                className="mr-4"
              >
                Quay lại
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">Thông tin phòng</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Số phòng:</span> {selectedRoom.roomNumber}
              </div>
              <div>
                <span className="font-medium">Tầng:</span> {selectedRoom.floor_number}
              </div>
              <div>
                <span className="font-medium">Loại phòng:</span> {selectedRoom.roomType_type}
              </div>
              <div>
                <span className="font-medium">Sức chứa:</span> {selectedRoom.capacity} người
              </div>
              <div>
                <span className="font-medium">Giá phòng:</span> {parseInt(selectedRoom.monthlyFee).toLocaleString()} VND/tháng
              </div>
              <div>
                <span className="font-medium">Tiện ích:</span> {selectedRoom.roomType_amenities.join(', ')}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Chọn vị trí & thời gian thuê</h2>
            
            {roomImage && (
              <div className="w-full flex justify-center mb-6">
                <img
                  src={roomImage}
                  alt={`Bố cục phòng ${selectedRoom.capacity} giường`}
                  className="max-w-[500px] h-auto rounded-lg border shadow-md"
                />
              </div>
            )}

            {/* Chọn giường */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Chọn vị trí trong phòng <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3 flex-wrap justify-center">
                {selectedRoom.roomSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    disabled={slot.isOccupied}
                    onClick={() => handleSelectSlot(slot.id)}
                    variant={slot.isOccupied ? "secondary" : selectedSlot === slot.id ? "primary" : "outline"}
                    className={slot.isOccupied ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    Giường {slot.slotNumber}
                    {slot.isOccupied && " (Đã có người)"}
                  </Button>
                ))}
              </div>
            </div>

            {/* Chọn thời gian thuê */}
            <div className="mb-6">
              <Select
                label="Thời gian thuê phòng"
                name="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Chọn thời gian thuê"
                required
              >
                <option value="">-- Chọn thời gian --</option>
                <option value="8">8 tháng</option>
                <option value="10">10 tháng</option>
              </Select>
            </div>

            {/* Nút xác nhận */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={handleBackToRoomList}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmSelection}
                disabled={!selectedSlot || !duration}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chọn phòng ở KTX</h1>
          <p className="mt-2 text-gray-600">Chọn giới tính, loại phòng và tòa bạn muốn ở</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h3>
              
              <div className="space-y-4">
                {/* Giới tính */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới tính
                  </label>
                  <Select
                    name="gender"
                    value={filters.gender}
                    onChange={(e) => handleFilterChange("gender", e.target.value)}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </Select>
                </div>

                {/* Loại phòng */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại phòng
                  </label>
                  <Select
                    name="roomType"
                    value={filters.roomType}
                    onChange={(e) => handleFilterChange("roomType", e.target.value)}
                    disabled={!filters.gender}
                  >
                    <option value="">Chọn loại phòng</option>
                    {roomTypes.map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.type}</option>
                    ))}
                  </Select>
                </div>

                {/* Tòa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tòa
                  </label>
                  <Select
                    name="building"
                    value={filters.building}
                    onChange={(e) => handleFilterChange("building", e.target.value)}
                    disabled={!filters.roomType}
                  >
                    <option value="">Chọn tòa</option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Select>
                </div>

                {/* Chọn tầng */}
                {floors.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tầng
                    </label>
                    <Select
                      name="floor"
                      value={selectedFloor || ""}
                      onChange={(e) => {
                        setSelectedFloor(e.target.value ? Number(e.target.value) : null);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Chọn tầng</option>
                      {floors.map(floor => (
                        <option key={floor} value={floor}>
                          Tầng {floor}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              <Button
                onClick={() => {
                  setFilters({ gender: "", building: "", roomType: "" });
                  setBuildings([]);
                  setRooms([]);
                  setFloors([]);
                  setSelectedFloor(null);
                }}
                variant="outline"
                fullWidth
                className="mt-4"
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>

          {/* Room List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Danh sách phòng
                  </h3>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={onCancel}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    }
                  />
                </div>
              </div>

              <div className="p-6">
                <LoadingState
                  isLoading={isLoading}
                  isEmpty={!isLoading && paginatedRooms.length === 0}
                  emptyState={
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">🏠</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Không tìm thấy phòng phù hợp
                      </h3>
                      <p className="text-gray-500">
                        Hãy thử thay đổi bộ lọc để tìm phòng khác
                      </p>
                    </div>
                  }
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {paginatedRooms.map((room) => {
                      const availableSlots = getAvailableSlotsCount(room);
                      const isFullyOccupied = availableSlots === 0;
                      
                      return (
                        <div
                          key={room.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedRoom?.id === room.id
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          } ${
                            isFullyOccupied
                              ? 'opacity-60 cursor-not-allowed'
                              : ''
                          }`}
                          onClick={() => !isFullyOccupied && handleRoomClick(room)}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                {room.roomNumber}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Tầng {room.floor_number}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoomStatusColor(room)}`}>
                              {getRoomStatusText(room)}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Loại phòng:</span>
                              <span className="font-medium">{room.roomType_type}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Sức chứa:</span>
                              <span className="font-medium">{availableSlots}/{room.capacity} chỗ trống</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Giá thuê:</span>
                              <span className="font-medium text-green-600">{formatPrice(room.monthlyFee)}/tháng</span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Tiện nghi:</p>
                            <div className="flex flex-wrap gap-1">
                              {room.roomType_amenities && room.roomType_amenities.map((amenity, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                >
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mb-2">
                            <p className="text-sm text-gray-600 mb-2">Vị trí trong phòng:</p>
                            <div className="flex flex-wrap gap-1">
                              {room.roomSlots.map((slot) => (
                                <span
                                  key={slot.id}
                                  className={`px-2 py-1 text-xs rounded-full border font-medium ${
                                    slot.isOccupied
                                      ? "bg-red-100 text-red-700 border-red-200"
                                      : "bg-green-100 text-green-700 border-green-200"
                                  }`}
                                >
                                  Vị trí {slot.slotNumber}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </LoadingState>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={roomsByFloor.length}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomSelection;
