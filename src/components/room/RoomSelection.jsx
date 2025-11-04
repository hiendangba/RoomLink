import React, { useState, useEffect } from 'react';
import Pagination from '../ui/Pagination';
import Button from '../ui/Button';
import Select from '../ui/Select';

const RoomSelection = ({ onRoomSelected, onCancel }) => {
  const [filters, setFilters] = useState({
    floor: '',
    roomType: '',
    priceRange: '',
    status: 'available' // available, occupied, maintenance
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Dữ liệu mẫu phòng ở KTX
  const mockRooms = [
    {
      roomId: 'P101',
      roomType: 'Phòng đôi',
      capacity: 2,
      currentOccupancy: 0,
      price: 1500000,
      area: 25,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học'],
      description: 'Phòng đôi tiện nghi, có điều hòa và wifi miễn phí'
    },
    {
      roomId: 'P102',
      roomType: 'Phòng đôi',
      capacity: 2,
      currentOccupancy: 1,
      price: 1500000,
      area: 25,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học'],
      description: 'Phòng đôi tiện nghi, có điều hòa và wifi miễn phí'
    },
    {
      roomId: 'P201',
      roomType: 'Phòng đơn',
      capacity: 1,
      currentOccupancy: 0,
      price: 2000000,
      area: 20,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini'],
      description: 'Phòng đơn riêng tư, đầy đủ tiện nghi'
    },
    {
      roomId: 'P103',
      roomType: 'Phòng ba',
      capacity: 3,
      currentOccupancy: 2,
      price: 1200000,
      area: 30,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học'],
      description: 'Phòng ba tiết kiệm chi phí'
    },
    {
      roomId: 'P104',
      roomType: 'Phòng ba',
      capacity: 3,
      currentOccupancy: 0,
      price: 1200000,
      area: 30,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học'],
      description: 'Phòng ba tiết kiệm chi phí'
    },
    {
      roomId: 'P105',
      roomType: 'Phòng đôi',
      capacity: 2,
      currentOccupancy: 0,
      price: 1800000,
      area: 28,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Máy nước nóng'],
      description: 'Phòng đôi cao cấp với đầy đủ tiện nghi'
    },
    {
      roomId: 'P106',
      roomType: 'Phòng đôi',
      capacity: 2,
      currentOccupancy: 2,
      price: 1500000,
      area: 25,
      status: 'occupied',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học'],
      description: 'Phòng đôi tiện nghi, có điều hòa và wifi miễn phí'
    },
    {
      roomId: 'P107',
      roomType: 'Phòng đôi',
      capacity: 2,
      currentOccupancy: 0,
      price: 1500000,
      area: 25,
      status: 'maintenance',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học'],
      description: 'Phòng đang bảo trì'
    },
    // Thêm nhiều phòng hơn để test phân trang
    {
      roomId: 'P107',
      roomType: 'Phòng đơn',
      capacity: 1,
      currentOccupancy: 0,
      price: 2000000,
      area: 20,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini'],
      description: 'Phòng đơn riêng tư, đầy đủ tiện nghi'
    },
    {
      roomId: 'P108',
      roomType: 'Phòng đôi cao cấp',
      capacity: 2,
      currentOccupancy: 0,
      price: 2800000,
      area: 35,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Máy nước nóng'],
      description: 'Phòng đôi cao cấp với đầy đủ tiện nghi hiện đại'
    },
    {
      roomId: 'P202',
      roomType: 'Phòng đôi',
      capacity: 2,
      currentOccupancy: 1,
      price: 1500000,
      area: 25,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học'],
      description: 'Phòng đôi tiện nghi, có điều hòa và wifi miễn phí'
    },
    {
      roomId: 'P203',
      roomType: 'Phòng ba',
      capacity: 3,
      currentOccupancy: 0,
      price: 1200000,
      area: 30,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học'],
      description: 'Phòng ba người, thoáng mát và rộng rãi'
    },
    {
      roomId: 'P204',
      roomType: 'Phòng đôi',
      capacity: 2,
      currentOccupancy: 2,
      price: 1500000,
      area: 25,
      status: 'occupied',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học'],
      description: 'Phòng đôi đã có đủ người'
    },
    {
      roomId: 'P205',
      roomType: 'Phòng đơn cao cấp',
      capacity: 1,
      currentOccupancy: 0,
      price: 2500000,
      area: 22,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Máy nước nóng'],
      description: 'Phòng đơn cao cấp với view đẹp'
    },
    {
      roomId: 'P109',
      roomType: 'Phòng đôi',
      capacity: 2,
      currentOccupancy: 0,
      price: 1600000,
      area: 26,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Ban công'],
      description: 'Phòng đôi có ban công, view đẹp'
    },
    {
      roomId: 'P110',
      roomType: 'Phòng đơn',
      capacity: 1,
      currentOccupancy: 0,
      price: 2100000,
      area: 21,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Ban công'],
      description: 'Phòng đơn có ban công riêng'
    },
    {
      roomId: 'P111',
      roomType: 'Phòng ba',
      capacity: 3,
      currentOccupancy: 1,
      price: 1300000,
      area: 32,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Ban công'],
      description: 'Phòng ba người có ban công lớn'
    },
    {
      roomId: 'P206',
      roomType: 'Phòng đôi',
      capacity: 2,
      currentOccupancy: 1,
      price: 1600000,
      area: 26,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Ban công'],
      description: 'Phòng đôi có ban công, view đẹp'
    },
    {
      roomId: 'P207',
      roomType: 'Phòng ba',
      capacity: 3,
      currentOccupancy: 0,
      price: 1300000,
      area: 32,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Ban công'],
      description: 'Phòng ba người có ban công lớn'
    },
    {
      roomId: 'P208',
      roomType: 'Phòng đơn cao cấp',
      capacity: 1,
      currentOccupancy: 0,
      price: 2500000,
      area: 22,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Máy nước nóng', 'Ban công'],
      description: 'Phòng đơn cao cấp với ban công và view đẹp'
    },
    {
      roomId: 'P209',
      roomType: 'Phòng đôi',
      capacity: 2,
      currentOccupancy: 2,
      price: 1600000,
      area: 26,
      status: 'occupied',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Ban công'],
      description: 'Phòng đôi đã có đủ người'
    },
    {
      roomId: 'P210',
      roomType: 'Phòng đôi cao cấp',
      capacity: 2,
      currentOccupancy: 0,
      price: 2900000,
      area: 36,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Máy nước nóng', 'Ban công'],
      description: 'Phòng đôi cao cấp với ban công và view tuyệt đẹp'
    },
    {
      roomId: 'P112',
      roomType: 'Phòng đôi',
      capacity: 2,
      currentOccupancy: 1,
      price: 1700000,
      area: 28,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini'],
      description: 'Phòng đôi cao cấp với tủ lạnh mini'
    },
    {
      roomId: 'P113',
      roomType: 'Phòng ba',
      capacity: 3,
      currentOccupancy: 0,
      price: 1400000,
      area: 34,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini'],
      description: 'Phòng ba người với tủ lạnh mini'
    },
    {
      roomId: 'P114',
      roomType: 'Phòng đôi cao cấp',
      capacity: 2,
      currentOccupancy: 0,
      price: 3000000,
      area: 38,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Máy nước nóng', 'Ban công'],
      description: 'Phòng đôi cao cấp với đầy đủ tiện nghi hiện đại'
    },
    {
      roomId: 'P115',
      roomType: 'Phòng đơn',
      capacity: 1,
      currentOccupancy: 0,
      price: 2200000,
      area: 23,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Máy nước nóng'],
      description: 'Phòng đơn cao cấp với đầy đủ tiện nghi'
    },
    {
      roomId: 'P211',
      roomType: 'Phòng đôi',
      capacity: 2,
      currentOccupancy: 0,
      price: 1700000,
      area: 28,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini'],
      description: 'Phòng đôi cao cấp với tủ lạnh mini'
    },
    {
      roomId: 'P212',
      roomType: 'Phòng ba',
      capacity: 3,
      currentOccupancy: 2,
      price: 1400000,
      area: 34,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini'],
      description: 'Phòng ba người với tủ lạnh mini'
    },
    {
      roomId: 'P213',
      roomType: 'Phòng đơn cao cấp',
      capacity: 1,
      currentOccupancy: 0,
      price: 2600000,
      area: 24,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Máy nước nóng', 'Ban công'],
      description: 'Phòng đơn cao cấp với ban công và view đẹp'
    },
    {
      roomId: 'P214',
      roomType: 'Phòng đôi cao cấp',
      capacity: 2,
      currentOccupancy: 0,
      price: 3000000,
      area: 38,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Máy nước nóng', 'Ban công'],
      description: 'Phòng đôi cao cấp với đầy đủ tiện nghi hiện đại'
    },
    {
      roomId: 'P215',
      roomType: 'Phòng đôi',
      capacity: 2,
      currentOccupancy: 2,
      price: 1700000,
      area: 28,
      status: 'occupied',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini'],
      description: 'Phòng đôi đã có đủ người'
    },
    {
      roomId: 'P116',
      roomType: 'Phòng đơn',
      capacity: 1,
      currentOccupancy: 0,
      price: 2300000,
      area: 24,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Máy nước nóng', 'Ban công'],
      description: 'Phòng đơn cao cấp với ban công và view đẹp'
    },
    {
      roomId: 'P117',
      roomType: 'Phòng đôi',
      capacity: 2,
      currentOccupancy: 1,
      price: 1800000,
      area: 30,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Ban công'],
      description: 'Phòng đôi cao cấp với ban công và tủ lạnh mini'
    },
    {
      roomId: 'P118',
      roomType: 'Phòng ba',
      capacity: 3,
      currentOccupancy: 0,
      price: 1500000,
      area: 36,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Ban công'],
      description: 'Phòng ba người với ban công và tủ lạnh mini'
    },
    {
      roomId: 'P119',
      roomType: 'Phòng đôi cao cấp',
      capacity: 2,
      currentOccupancy: 0,
      price: 3100000,
      area: 40,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Máy nước nóng', 'Ban công'],
      description: 'Phòng đôi cao cấp với đầy đủ tiện nghi hiện đại và ban công'
    },
    {
      roomId: 'P120',
      roomType: 'Phòng đơn',
      capacity: 1,
      currentOccupancy: 0,
      price: 2300000,
      area: 24,
      status: 'available',
      facilities: ['Điều hòa', 'Wifi', 'Tủ quần áo', 'Bàn học', 'Tủ lạnh mini', 'Máy nước nóng', 'Ban công'],
      description: 'Phòng đơn cao cấp với ban công và view đẹp'
    }
  ];

  const roomTypes = [...new Set(mockRooms.map(room => room.roomType))];
  
  // Extract floor from roomId (P101 -> 1, P201 -> 2)
  const getFloorFromRoomId = (roomId) => {
    const match = roomId.match(/^P(\d)/);
    return match ? match[1] : '';
  };
  
  const floors = [...new Set(mockRooms.map(room => getFloorFromRoomId(room.roomId)))].sort((a, b) => parseInt(a) - parseInt(b));

  const [filteredRooms, setFilteredRooms] = useState(mockRooms);
  const [paginatedRooms, setPaginatedRooms] = useState([]);

  useEffect(() => {
    filterRooms();
  }, [filters]);

  useEffect(() => {
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedRooms(filteredRooms.slice(startIndex, endIndex));
  }, [filteredRooms, currentPage, itemsPerPage]);

  const filterRooms = () => {
    let filtered = mockRooms.filter(room => {
      const roomFloor = getFloorFromRoomId(room.roomId);
      return (
        (!filters.floor || roomFloor === filters.floor) &&
        (!filters.roomType || room.roomType === filters.roomType) &&
        (!filters.priceRange || checkPriceRange(room.price, filters.priceRange)) &&
        room.status === filters.status
      );
    });

    setFilteredRooms(filtered);
  };

  const checkPriceRange = (price, range) => {
    switch (range) {
      case 'under-1.5':
        return price < 1500000;
      case '1.5-2':
        return price >= 1500000 && price < 2000000;
      case '2-2.5':
        return price >= 2000000 && price < 2500000;
      case 'over-2.5':
        return price >= 2500000;
      default:
        return true;
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
  };

  const handleConfirmSelection = () => {
    if (selectedRoom) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        // Store selected room in localStorage
        localStorage.setItem('selectedRoom', JSON.stringify(selectedRoom));
        
        setIsLoading(false);
        onRoomSelected(selectedRoom);
      }, 1000);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'Còn trống';
      case 'occupied':
        return 'Đã thuê';
      case 'maintenance':
        return 'Bảo trì';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chọn phòng ở KTX</h1>
          <p className="mt-2 text-gray-600">Tìm và chọn phòng phù hợp với nhu cầu của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h3>
              
              <div className="space-y-4">
                {/* Floor Filter */}
                <Select
                  label="Tầng"
                  name="floor"
                  value={filters.floor}
                  onChange={(e) => handleFilterChange('floor', e.target.value)}
                >
                  <option value="">Tất cả tầng</option>
                  {floors.map(floor => (
                    <option key={floor} value={floor}>Tầng {floor}</option>
                  ))}
                </Select>

                {/* Room Type Filter */}
                <Select
                  label="Loại phòng"
                  name="roomType"
                  value={filters.roomType}
                  onChange={(e) => handleFilterChange('roomType', e.target.value)}
                >
                  <option value="">Tất cả loại</option>
                  {roomTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>

                {/* Price Range Filter */}
                <Select
                  label="Khoảng giá"
                  name="priceRange"
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                >
                  <option value="">Tất cả mức giá</option>
                  <option value="under-1.5">Dưới 1.5 triệu</option>
                  <option value="1.5-2">1.5 - 2 triệu</option>
                  <option value="2-2.5">2 - 2.5 triệu</option>
                  <option value="over-2.5">Trên 2.5 triệu</option>
                </Select>

                {/* Status Filter */}
                <Select
                  label="Trạng thái"
                  name="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="available">Còn trống</option>
                  <option value="occupied">Đã thuê</option>
                </Select>
              </div>

              {/* Clear Filters */}
              <Button
                onClick={() => setFilters({
                  floor: '',
                  roomType: '',
                  priceRange: '',
                  status: 'available'
                })}
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
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Danh sách phòng ({filteredRooms.length} phòng)
                  </h3>
                  {selectedRoom && (
                    <div className="text-sm text-blue-600 font-medium">
                      Đã chọn: {selectedRoom.roomId}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {filteredRooms.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🏠</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Không tìm thấy phòng phù hợp
                    </h3>
                    <p className="text-gray-500">
                      Hãy thử thay đổi bộ lọc để tìm phòng khác
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {paginatedRooms.map(room => (
                      <div
                        key={room.roomId}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedRoom?.roomId === room.roomId
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                        onClick={() => handleRoomSelect(room)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {room.roomId}
                            </h4>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                            {getStatusText(room.status)}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Loại phòng:</span>
                            <span className="font-medium">{room.roomType}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Sức chứa:</span>
                            <span className="font-medium">{room.currentOccupancy}/{room.capacity} người</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Diện tích:</span>
                            <span className="font-medium">{room.area}m²</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Giá thuê:</span>
                            <span className="font-medium text-green-600">{formatPrice(room.price)}/tháng</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Tiện nghi:</p>
                          <div className="flex flex-wrap gap-1">
                            {room.facilities.map((facility, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {facility}
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="text-sm text-gray-500">{room.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {filteredRooms.length > itemsPerPage && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredRooms.length / itemsPerPage)}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={filteredRooms.length}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={onCancel}
            size="medium"
          >
            Hủy
          </Button>

          <Button
            variant="primary"
            onClick={handleConfirmSelection}
            disabled={!selectedRoom || isLoading}
            loading={isLoading}
            loadingText="Đang xử lý..."
          >
            Xác nhận chọn phòng
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoomSelection;
