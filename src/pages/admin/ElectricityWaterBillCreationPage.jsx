import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Button from '../../components/ui/Button';
import FileUploadButton from '../../components/ui/FileUploadButton';
import Pagination from '../../components/ui/Pagination';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import InfoBox from '../../components/ui/InfoBox';
import LoadingState from '../../components/ui/LoadingState';
import PageLayout from '../../components/layout/PageLayout';
import BaseModal, { ModalBody } from '../../components/modal/BaseModal';
import meterReadingApi from '../../api/meterReadingApi';
import roomApi from '../../api/roomApi';

const ElectricityWaterBillCreationPage = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processedData, setProcessedData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filterType, setFilterType] = useState('all'); // 'all', 'electricity', 'water'
  const [filterBuilding, setFilterBuilding] = useState('all'); // 'all', 'A', 'B', 'P', etc.
  const [filterFloor, setFilterFloor] = useState('all'); // 'all', '1', '2', '3', '4', '5'
  const [roomMapping, setRoomMapping] = useState({}); // Map roomNumber -> roomId (UUID)
  const [roomList, setRoomList] = useState([]); // List of rooms for dropdown
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null for add, number for edit
  const [editFormData, setEditFormData] = useState({
    roomNumber: '',
    period: '',
    type: 'electricity',
    oldValue: '',
    newValue: '',
    unitPrice: ''
  });
  const [selectedItems, setSelectedItems] = useState(new Set()); // Set of indices in processedData

  // Fetch all rooms to map roomNumber to roomId
  useEffect(() => {
    const fetchAllRooms = async () => {
      try {
        setLoadingRooms(true);
        // Fetch all rooms without pagination to get complete mapping
        // Use same params format as RoomManagementPage.jsx
        const params = {
          page: 1,
          limit: 1000,
          status: 'All',
          floorId: 'All',
        };
        const response = await roomApi.getRoomForAdmin(params);
        if (response.success && response.data) {
          const mapping = {};
          const rooms = [];
          response.data.forEach(room => {
            mapping[room.roomNumber] = room.id;
            rooms.push({ roomNumber: room.roomNumber, id: room.id });
          });
          setRoomMapping(mapping);
          setRoomList(rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)));
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
        // Don't show error here, will show when processing file if needed
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchAllRooms();
  }, []);

  // Parse CSV file
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('File CSV không hợp lệ hoặc trống');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());
    const expectedHeaders = ['roomNumber', 'building', 'floor', 'period', 'type', 'oldValue', 'newValue', 'unitPrice', 'totalAmount'];
    
    // Validate headers
    const isValidFormat = expectedHeaders.every(h => headers.includes(h));
    if (!isValidFormat) {
      throw new Error('Định dạng CSV không đúng. Cần các cột: roomNumber, building, floor, period, type, oldValue, newValue, unitPrice, totalAmount');
    }

    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      if (values.length !== headers.length) {
        console.warn(`Dòng ${i + 1} có số cột không khớp, bỏ qua`);
        continue;
      }

      const row = {};
      headers.forEach((header, index) => {
        const value = values[index];
        if (header === 'oldValue' || header === 'newValue' || header === 'unitPrice' || header === 'totalAmount') {
          row[header] = parseFloat(value) || 0;
        } else {
          row[header] = value;
        }
      });
      rows.push(row);
    }

    return rows;
  };

  // Convert CSV rows to API format
  const convertCSVToBillItems = (csvRows) => {
    return csvRows.map(row => {
      const { roomNumber, building, floor, period, type, oldValue, newValue, unitPrice } = row;
      const roomId = roomMapping[roomNumber];
      
      // Validate data
      let isValid = true;
      let errorMessage = '';
      
      if (!roomId) {
        isValid = false;
        errorMessage = `Không tìm thấy phòng: ${roomNumber}`;
      } else if (!period || !period.match(/^\d{4}-\d{2}$/)) {
        isValid = false;
        errorMessage = `Kỳ thanh toán không hợp lệ: ${period}`;
      } else if (type !== 'electricity' && type !== 'water') {
        isValid = false;
        errorMessage = `Loại không hợp lệ: ${type}`;
      } else if (isNaN(oldValue) || isNaN(newValue) || isNaN(unitPrice)) {
        isValid = false;
        errorMessage = 'Chỉ số hoặc đơn giá không hợp lệ';
      } else if (newValue < oldValue) {
        isValid = false;
        errorMessage = 'Chỉ số mới phải lớn hơn chỉ số cũ';
      } else if (oldValue < 0 || newValue < 0 || unitPrice < 0) {
        isValid = false;
        errorMessage = 'Giá trị không được âm';
      }

      return {
        roomId: roomId || null,
        roomNumber: roomNumber, // Keep for display
        building: building ? building.trim().toUpperCase() : null, // Building from CSV
        floor: floor ? floor.toString().trim() : null, // Floor from CSV
        period: period,
        type: type,
        oldValue: oldValue,
        newValue: newValue,
        unitPrice: unitPrice,
        usage: newValue - oldValue,
        previousValue: oldValue,
        currentValue: newValue,
        amount: (newValue - oldValue) * unitPrice,
        isValid: isValid,
        errorMessage: errorMessage,
      };
    });
  };

  // Read file as text
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Không thể đọc file'));
      reader.readAsText(file);
    });
  };

  // Extract building from roomNumber (A102 -> A, B202 -> B) - for manual entries
  const extractBuildingFromRoomNumber = (roomNumber) => {
    if (!roomNumber) return null;
    const match = roomNumber.match(/^([A-Za-z]+)/);
    return match ? match[1].toUpperCase() : null;
  };

  // Extract floor from roomNumber (A102 -> 1, B202 -> 2) - for manual entries
  const extractFloorFromRoomNumber = (roomNumber) => {
    if (!roomNumber) return null;
    const match = roomNumber.match(/^[A-Za-z]+(\d+)/);
    if (match) {
      const floor = parseInt(match[1].charAt(0));
      return isNaN(floor) ? null : floor.toString();
    }
    return null;
  };

  // Get unique buildings from processed data (from CSV)
  const getBuildingOptions = () => {
    const buildings = new Set();
    processedData.forEach(item => {
      if (item.building) buildings.add(item.building);
    });
    return Array.from(buildings).sort();
  };

  // Get unique floors from processed data (from CSV)
  const getFloorOptions = () => {
    const floors = new Set();
    processedData.forEach(item => {
      if (item.floor) floors.add(item.floor);
    });
    return Array.from(floors).sort((a, b) => parseInt(a) - parseInt(b));
  };

  const filteredData = processedData.filter(item => {
    const typeMatch = filterType === 'all' || item.type === filterType;
    const buildingMatch = filterBuilding === 'all' || item.building === filterBuilding;
    const floorMatch = filterFloor === 'all' || item.floor === filterFloor;
    return typeMatch && buildingMatch && floorMatch;
  }).sort((a, b) => {
    // Sort: invalid items first, then valid items
    if (a.isValid === b.isValid) return 0;
    return a.isValid ? 1 : -1;
  });
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page) => setCurrentPage(page);
  
  const handleTypeFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleBuildingFilterChange = (building) => {
    setFilterBuilding(building);
    setCurrentPage(1);
  };

  const handleFloorFilterChange = (floor) => {
    setFilterFloor(floor);
    setCurrentPage(1);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      showError('Vui lòng chọn file Excel hoặc CSV hợp lệ');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      showError('Kích thước file không được vượt quá 10MB');
      return;
    }
    
    setUploadedFile(file);
    setLoading(true);

    try {
      // Wait for room mapping to be ready (retry up to 10 times, 500ms each)
      let retries = 0;
      const maxRetries = 10;
      while (Object.keys(roomMapping).length === 0 && retries < maxRetries) {
        if (loadingRooms) {
          await new Promise(resolve => setTimeout(resolve, 500));
          retries++;
        } else {
          // If not loading but still no mapping, wait a bit more
          await new Promise(resolve => setTimeout(resolve, 500));
          retries++;
        }
      }

      if (Object.keys(roomMapping).length === 0) {
        throw new Error('Không thể tải danh sách phòng. Vui lòng tải lại trang và thử lại.');
      }

      // Read file content
      const fileContent = await readFileAsText(file);
      
      // Parse CSV
      const csvRows = parseCSV(fileContent);
      
      if (csvRows.length === 0) {
        throw new Error('File CSV không có dữ liệu');
      }

      // Convert CSV rows to bill items with roomId mapping
      const billItems = convertCSVToBillItems(csvRows);
      
      setProcessedData(billItems);
      setShowPreview(true);
      const validCount = billItems.filter(b => b.isValid).length;
      const invalidCount = billItems.filter(b => !b.isValid).length;
      const electricityCount = billItems.filter(b => b.type === 'electricity' && b.isValid).length;
      const waterCount = billItems.filter(b => b.type === 'water' && b.isValid).length;
      
      if (invalidCount > 0) {
        showError(`Xử lý file hoàn tất! Có ${validCount} hóa đơn hợp lệ và ${invalidCount} hóa đơn không hợp lệ. Vui lòng kiểm tra và sửa các hóa đơn không hợp lệ.`);
      } else {
        showSuccess(`Xử lý file thành công! Đã tìm thấy ${electricityCount} hóa đơn điện và ${waterCount} hóa đơn nước.`);
      }
    } catch (err) {
      console.error('Error processing file:', err);
      showError(err.message || 'Có lỗi xảy ra khi xử lý file. Vui lòng thử lại.');
      setUploadedFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    const newSelected = new Set(selectedItems);
    
    // Get current page data
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = filteredData.slice(startIndex, endIndex);
    
    currentPageData.forEach((item) => {
      const originalIndex = processedData.findIndex(d =>
        d.roomNumber === item.roomNumber &&
        d.period === item.period &&
        d.type === item.type &&
        d.oldValue === item.oldValue &&
        d.newValue === item.newValue &&
        d.unitPrice === item.unitPrice
      );
      if (originalIndex !== -1) {
        if (checked) {
          newSelected.add(originalIndex);
        } else {
          newSelected.delete(originalIndex);
        }
      }
    });
    
    setSelectedItems(newSelected);
  };

  const handleSelectItem = (index, checked) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedItems(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) {
      showError('Vui lòng chọn ít nhất một hóa đơn để xóa');
      return;
    }
    const newData = processedData.filter((_, index) => !selectedItems.has(index));
    setProcessedData(newData);
    setSelectedItems(new Set());
    showSuccess(`Đã xóa ${selectedItems.size} hóa đơn`);
  };

  const handleCreateBills = async (itemsToCreate = null) => {
    // If itemsToCreate is provided, use it; otherwise use all valid items
    const items = itemsToCreate || processedData;
    
    if (items.length === 0) {
      showError('Không có dữ liệu để tạo hóa đơn');
      return;
    }

    // Check for invalid items
    const invalidItems = items.filter(item => !item.isValid);
    if (invalidItems.length > 0) {
      showError(`Có ${invalidItems.length} hóa đơn không hợp lệ. Vui lòng sửa hoặc xóa các hóa đơn không hợp lệ trước khi tạo.`);
      return;
    }

    setLoading(true);

    try {
      // Get only valid items for period validation
      const validItems = items.filter(item => item.isValid);
      
      if (validItems.length === 0) {
        throw new Error('Không có hóa đơn hợp lệ để tạo');
      }

      // Group by period (assuming all items have same period, or group them)
      const periods = [...new Set(validItems.map(item => item.period))];
      
      if (periods.length === 0) {
        throw new Error('Không tìm thấy kỳ thanh toán trong dữ liệu hợp lệ');
      }

      if (periods.length > 1) {
        throw new Error('File CSV chứa nhiều kỳ thanh toán khác nhau. Vui lòng tách thành các file riêng.');
      }

      const period = periods[0];
      
      // Backend yêu cầu period phải là tháng/năm hiện tại
      const currentPeriod = new Date().toISOString().slice(0, 7); // Format: "YYYY-MM"
      if (period !== currentPeriod) {
        throw new Error(`Kỳ thanh toán phải là tháng/năm hiện tại (${currentPeriod}). Kỳ trong file CSV là ${period}.`);
      }

      // Convert to API format (only valid items)
      const listMeterReading = validItems.map(item => ({
        roomId: item.roomId,
        type: item.type,
        oldValue: item.oldValue,
        newValue: item.newValue,
        unitPrice: item.unitPrice
      }));

      // Call API
      const response = await meterReadingApi.createMeterReading({
        period: period,
        listMeterReading: listMeterReading
      });

      if (response.success) {
        const successMessage = response.message || response.data?.message || 'Đã tạo hóa đơn thành công!';
        showSuccess(successMessage);
        
        // If creating selected items, remove them from processedData
        if (itemsToCreate) {
          const newData = processedData.filter((_, index) => !selectedItems.has(index));
          setProcessedData(newData);
          setSelectedItems(new Set());
        } else {
          setShowPreview(false);
          setUploadedFile(null);
          setProcessedData([]);
        }
        
        setTimeout(() => {
          if (onSuccess && !itemsToCreate) {
            onSuccess();
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Error creating bills:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo hóa đơn. Vui lòng thử lại.';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSelectedBills = async () => {
    if (selectedItems.size === 0) {
      showError('Vui lòng chọn ít nhất một hóa đơn để tạo');
      return;
    }
    const selectedItemsData = Array.from(selectedItems).map(index => processedData[index]);
    await handleCreateBills(selectedItemsData);
  };

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  
  const formatPeriod = (period) => {
    if (!period) return '-';
    // Format: 2025-10 -> 10/2025
    const [year, month] = period.split('-');
    return `${month}/${year}`;
  };

  return (
    <PageLayout
      title="Tạo hóa đơn điện nước"
      subtitle="Nhập tài liệu điện nước và tự động tạo hóa đơn cho các phòng"
      showClose={true}
      onClose={onCancel}
      showBack={showPreview}
      backText="Quay lại"
      onBack={() => setShowPreview(false)}
    >
      {!showPreview && (
        <div className="mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">Nhập tài liệu điện nước</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn file tài liệu điện nước
                </label>
                <FileUploadButton
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  }
                >
                  Chọn file Excel/CSV
                </FileUploadButton>
                <p className="text-xs text-gray-500 mt-1">
                  Hỗ trợ định dạng: Excel (.xlsx, .xls), CSV (.csv). Kích thước tối đa: 10MB
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Format CSV: roomNumber,building,floor,period,type,oldValue,newValue,unitPrice,totalAmount
                </p>
              </div>

              {uploadedFile && showPreview && (
                <InfoBox
                  type="success"
                  messages={[
                    `Đã xử lý file: ${uploadedFile.name} (${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)`
                  ]}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Tổng số hóa đơn</p>
                  <p className="text-2xl font-bold text-blue-900">{processedData.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-600">Không hợp lệ</p>
                  <p className="text-2xl font-bold text-red-900">
                    {processedData.filter(r => !r.isValid).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-600">Hóa đơn điện</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {processedData.filter(r => r.type === 'electricity' && r.isValid).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Hóa đơn nước</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {processedData.filter(r => r.type === 'water' && r.isValid).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-32">
                <Select
                  value={filterType}
                  onChange={(e) => handleTypeFilterChange(e.target.value)}
                >
                  <option value="all">Tất cả loại</option>
                  <option value="electricity">Điện</option>
                  <option value="water">Nước</option>
                </Select>
              </div>
              <div className="w-32">
                <Select
                  value={filterBuilding}
                  onChange={(e) => handleBuildingFilterChange(e.target.value)}
                >
                  <option value="all">Tất cả tòa</option>
                  {getBuildingOptions().map(building => (
                    <option key={building} value={building}>Tòa {building}</option>
                  ))}
                </Select>
              </div>
              <div className="w-32">
                <Select
                  value={filterFloor}
                  onChange={(e) => handleFloorFilterChange(e.target.value)}
                >
                  <option value="all">Tất cả tầng</option>
                  {getFloorOptions().map(floor => (
                    <option key={floor} value={floor}>Tầng {floor}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {processedData.filter(r => !r.isValid).length > 0 && (
                <Button
                  onClick={() => {
                    const newData = processedData.filter(item => item.isValid);
                    setProcessedData(newData);
                    showSuccess(`Đã xóa ${processedData.length - newData.length} hóa đơn không hợp lệ`);
                  }}
                  variant="danger"
                  size="small"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  }
                >
                  Xóa tất cả không hợp lệ
                </Button>
              )}
              <Button
                onClick={() => {
                  const currentPeriod = new Date().toISOString().slice(0, 7);
                  setEditFormData({
                    roomNumber: '',
                    period: currentPeriod,
                    type: 'electricity',
                    oldValue: '',
                    newValue: '',
                    unitPrice: ''
                  });
                  setEditingIndex(null);
                  setShowEditModal(true);
                }}
                variant="primary"
                size="small"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Thêm dòng
              </Button>
              <Button
                onClick={() => handleCreateBills()}
                variant="success"
                size="small"
                loading={loading}
                loadingText="Đang tạo..."
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Tạo tất cả hóa đơn
              </Button>
            </div>
          </div>

          {selectedItems.size > 0 && (
            <div className="flex items-center space-x-4 mb-6 p-4 bg-blue-50 rounded-lg">
              <span className="text-blue-800 font-medium">Đã chọn {selectedItems.size} hóa đơn</span>
              <Button
                onClick={handleDeleteSelected}
                variant="danger"
                size="small"
              >
                Xóa đã chọn
              </Button>
              <Button
                onClick={handleCreateSelectedBills}
                variant="success"
                size="small"
                loading={loading}
                loadingText="Đang tạo..."
              >
                Tạo đã chọn
              </Button>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={currentData.length > 0 && currentData.every((item) => {
                          const originalIndex = processedData.findIndex(d =>
                            d.roomNumber === item.roomNumber &&
                            d.period === item.period &&
                            d.type === item.type &&
                            d.oldValue === item.oldValue &&
                            d.newValue === item.newValue &&
                            d.unitPrice === item.unitPrice
                          );
                          return originalIndex !== -1 && selectedItems.has(originalIndex);
                        })}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phòng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kỳ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chỉ số
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sử dụng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đơn giá
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thành tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.map((item, index) => {
                    // Find original index in processedData
                    const originalIndex = processedData.findIndex(d =>
                      d.roomNumber === item.roomNumber &&
                      d.period === item.period &&
                      d.type === item.type &&
                      d.oldValue === item.oldValue &&
                      d.newValue === item.newValue &&
                      d.unitPrice === item.unitPrice
                    );
                    const isSelected = originalIndex !== -1 && selectedItems.has(originalIndex);
                    
                    return (
                    <tr 
                      key={`${item.roomId || 'invalid'}_${item.type}_${index}`} 
                      className={`hover:bg-gray-50 ${!item.isValid ? 'bg-red-50' : ''} ${isSelected ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectItem(originalIndex, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.roomNumber}</div>
                        {!item.isValid && (
                          <div className="text-xs text-red-600 mt-1">{item.errorMessage}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatPeriod(item.period)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.type === 'electricity' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.type === 'electricity' ? 'Điện' : 'Nước'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.previousValue} → {item.currentValue}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.type === 'electricity' ? 'kWh' : 'm³'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.usage} {item.type === 'electricity' ? 'kWh' : 'm³'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(item.unitPrice)}
                        </div>
                        <div className="text-xs text-gray-500">
                          /{item.type === 'electricity' ? 'kWh' : 'm³'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(item.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => {
                              // Find index by matching all fields (including invalid items)
                              const foundIndex = processedData.findIndex(d =>
                                d.roomNumber === item.roomNumber &&
                                d.period === item.period &&
                                d.type === item.type &&
                                d.oldValue === item.oldValue &&
                                d.newValue === item.newValue &&
                                d.unitPrice === item.unitPrice
                              );
                              setEditFormData({
                                roomNumber: item.roomNumber,
                                period: item.period,
                                type: item.type,
                                oldValue: item.oldValue.toString(),
                                newValue: item.newValue.toString(),
                                unitPrice: item.unitPrice.toString()
                              });
                              setEditingIndex(foundIndex !== -1 ? foundIndex : null);
                              setShowEditModal(true);
                            }}
                            variant="outline"
                            size="small"
                            className="px-2 py-1 text-xs"
                          >
                            Sửa
                          </Button>
                          <Button
                            onClick={() => {
                              // Find index by matching all fields
                              const foundIndex = processedData.findIndex(d =>
                                d.roomNumber === item.roomNumber &&
                                d.period === item.period &&
                                d.type === item.type &&
                                d.oldValue === item.oldValue &&
                                d.newValue === item.newValue &&
                                d.unitPrice === item.unitPrice
                              );
                              if (foundIndex !== -1) {
                                const newData = [...processedData];
                                newData.splice(foundIndex, 1);
                                setProcessedData(newData);
                                showSuccess('Đã xóa dòng thành công');
                              }
                            }}
                            variant="outline"
                            size="small"
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                totalItems={filteredData.length}
                showInfo={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Edit/Add Modal */}
      {showEditModal && (
        <BaseModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingIndex(null);
            setEditFormData({
              roomNumber: '',
              period: '',
              type: 'electricity',
              oldValue: '',
              newValue: '',
              unitPrice: ''
            });
          }}
          title={editingIndex !== null ? 'Sửa dòng hóa đơn' : 'Thêm dòng hóa đơn'}
          size="large"
        >
          <ModalBody>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                const roomId = roomMapping[editFormData.roomNumber];
                if (!roomId) {
                  showError('Phòng không tồn tại');
                  return;
                }

                const oldValue = parseFloat(editFormData.oldValue);
                const newValue = parseFloat(editFormData.newValue);
                const unitPrice = parseFloat(editFormData.unitPrice);

                if (isNaN(oldValue) || isNaN(newValue) || isNaN(unitPrice)) {
                  showError('Vui lòng nhập đúng định dạng số');
                  return;
                }

                if (newValue < oldValue) {
                  showError('Chỉ số mới phải lớn hơn chỉ số cũ');
                  return;
                }

                // Validate the new item
                let isValid = true;
                let errorMessage = '';
                
                if (!roomId) {
                  isValid = false;
                  errorMessage = `Không tìm thấy phòng: ${editFormData.roomNumber}`;
                } else if (!editFormData.period || !editFormData.period.match(/^\d{4}-\d{2}$/)) {
                  isValid = false;
                  errorMessage = `Kỳ thanh toán không hợp lệ: ${editFormData.period}`;
                } else if (editFormData.type !== 'electricity' && editFormData.type !== 'water') {
                  isValid = false;
                  errorMessage = `Loại không hợp lệ: ${editFormData.type}`;
                } else if (newValue < oldValue) {
                  isValid = false;
                  errorMessage = 'Chỉ số mới phải lớn hơn chỉ số cũ';
                } else if (oldValue < 0 || newValue < 0 || unitPrice < 0) {
                  isValid = false;
                  errorMessage = 'Giá trị không được âm';
                }

                // Extract building and floor from roomNumber for manual entries
                const building = extractBuildingFromRoomNumber(editFormData.roomNumber);
                const floor = extractFloorFromRoomNumber(editFormData.roomNumber);

                const newItem = {
                  roomId: roomId,
                  roomNumber: editFormData.roomNumber,
                  building: building, // Extracted from roomNumber for manual entries
                  floor: floor, // Extracted from roomNumber for manual entries
                  period: editFormData.period,
                  type: editFormData.type,
                  oldValue: oldValue,
                  newValue: newValue,
                  unitPrice: unitPrice,
                  usage: newValue - oldValue,
                  previousValue: oldValue,
                  currentValue: newValue,
                  amount: (newValue - oldValue) * unitPrice,
                  isValid: isValid,
                  errorMessage: errorMessage,
                };

                if (editingIndex !== null) {
                  // Edit existing item
                  const newData = [...processedData];
                  newData[editingIndex] = newItem;
                  setProcessedData(newData);
                  showSuccess('Đã cập nhật dòng thành công');
                } else {
                  // Add new item
                  setProcessedData([...processedData, newItem]);
                  showSuccess('Đã thêm dòng thành công');
                }

                setShowEditModal(false);
                setEditingIndex(null);
                setEditFormData({
                  roomNumber: '',
                  period: '',
                  type: 'electricity',
                  oldValue: '',
                  newValue: '',
                  unitPrice: ''
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Phòng"
                  name="roomNumber"
                  value={editFormData.roomNumber}
                  onChange={(e) => setEditFormData({...editFormData, roomNumber: e.target.value})}
                  required
                >
                  <option value="">Chọn phòng</option>
                  {roomList.map(room => (
                    <option key={room.id} value={room.roomNumber}>{room.roomNumber}</option>
                  ))}
                </Select>
                <Input
                  label="Kỳ thanh toán"
                  name="period"
                  type="text"
                  value={editFormData.period}
                  onChange={(e) => setEditFormData({...editFormData, period: e.target.value})}
                  placeholder="YYYY-MM"
                  required
                />
                <Select
                  label="Loại"
                  name="type"
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({...editFormData, type: e.target.value})}
                  required
                >
                  <option value="electricity">Điện</option>
                  <option value="water">Nước</option>
                </Select>
                <Input
                  label="Chỉ số cũ"
                  name="oldValue"
                  type="number"
                  value={editFormData.oldValue}
                  onChange={(e) => setEditFormData({...editFormData, oldValue: e.target.value})}
                  min="0"
                  step="1"
                  required
                />
                <Input
                  label="Chỉ số mới"
                  name="newValue"
                  type="number"
                  value={editFormData.newValue}
                  onChange={(e) => setEditFormData({...editFormData, newValue: e.target.value})}
                  min="0"
                  step="1"
                  required
                />
                <Input
                  label="Đơn giá"
                  name="unitPrice"
                  type="number"
                  value={editFormData.unitPrice}
                  onChange={(e) => setEditFormData({...editFormData, unitPrice: e.target.value})}
                  min="0"
                  step="10000"
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingIndex(null);
                    setEditFormData({
                      roomNumber: '',
                      period: '',
                      type: 'electricity',
                      oldValue: '',
                      newValue: '',
                      unitPrice: ''
                    });
                  }}
                  variant="outline"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  {editingIndex !== null ? 'Cập nhật' : 'Thêm'}
                </Button>
              </div>
            </form>
          </ModalBody>
        </BaseModal>
      )}
    </PageLayout>
  );
};

export default ElectricityWaterBillCreationPage;
