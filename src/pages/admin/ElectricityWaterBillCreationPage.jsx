import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import FileUploadButton from '../../components/ui/FileUploadButton';
import Pagination from '../../components/ui/Pagination';
import Select from '../../components/ui/Select';
import PageLayout from '../../components/layout/PageLayout';

const ElectricityWaterBillCreationPage = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processedData, setProcessedData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterType, setFilterType] = useState('all'); // 'all', 'electricity', 'water'
  const [filterFloor, setFilterFloor] = useState('all'); // 'all', '1', '2', '3', '4', '5'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Parse CSV file
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('File CSV không hợp lệ hoặc trống');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());
    const expectedHeaders = ['roomNumber', 'period', 'type', 'oldValue', 'newValue', 'unitPrice', 'totalAmount'];
    
    // Validate headers
    const isValidFormat = expectedHeaders.every(h => headers.includes(h));
    if (!isValidFormat) {
      throw new Error('Định dạng CSV không đúng. Cần các cột: roomNumber, period, type, oldValue, newValue, unitPrice, totalAmount');
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

  // Convert CSV rows directly to bill items
  const convertCSVToBillItems = (csvRows) => {
    return csvRows.map(row => {
      const { roomNumber, period, type, oldValue, newValue, unitPrice, totalAmount } = row;
      return {
        roomId: roomNumber,
        period: period,
        type: type,
        usage: newValue - oldValue,
        previousValue: oldValue,
        currentValue: newValue,
        unitPrice: unitPrice,
        amount: totalAmount,
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

  // Extract floor from roomId (P101 -> 1, P201 -> 2)
  const getFloorFromRoomId = (roomId) => {
    if (!roomId || !roomId.startsWith('P')) return null;
    const floor = parseInt(roomId.charAt(1));
    return isNaN(floor) ? null : floor.toString();
  };

  // Get unique floors from processed data
  const getFloorOptions = () => {
    const floors = new Set();
    processedData.forEach(item => {
      const floor = getFloorFromRoomId(item.roomId);
      if (floor) floors.add(floor);
    });
    return Array.from(floors).sort((a, b) => parseInt(a) - parseInt(b));
  };

  const filteredData = processedData.filter(item => {
    const typeMatch = filterType === 'all' || item.type === filterType;
    const floorMatch = filterFloor === 'all' || getFloorFromRoomId(item.roomId) === filterFloor;
    return typeMatch && floorMatch;
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

  const handleFloorFilterChange = (floor) => {
    setFilterFloor(floor);
    setCurrentPage(1);
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      setError('Vui lòng chọn file Excel hoặc CSV hợp lệ');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 10MB');
      return;
    }
    
    setUploadedFile(file);
    setError('');
    setSuccess('');
  };

  const handleProcessFile = async () => {
    if (!uploadedFile) {
      setError('Vui lòng chọn file để xử lý');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Read file content
      const fileContent = await readFileAsText(uploadedFile);
      
      // Parse CSV
      const csvRows = parseCSV(fileContent);
      
      if (csvRows.length === 0) {
        throw new Error('File CSV không có dữ liệu');
      }

      // Convert CSV rows directly to bill items
      const billItems = convertCSVToBillItems(csvRows);
      
      setProcessedData(billItems);
      setShowPreview(true);
      const electricityCount = billItems.filter(b => b.type === 'electricity').length;
      const waterCount = billItems.filter(b => b.type === 'water').length;
      setSuccess(`Xử lý file thành công! Đã tìm thấy ${electricityCount} hóa đơn điện và ${waterCount} hóa đơn nước.`);
    } catch (err) {
      console.error('Error processing file:', err);
      setError(err.message || 'Có lỗi xảy ra khi xử lý file. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBills = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const timestamp = Date.now();
      
      const bills = processedData.map(item => ({
        id: `BILL_${item.roomId}_${item.type.toUpperCase()}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        roomId: item.roomId,
        type: item.type,
        amount: item.amount,
        usage: item.usage,
        previousValue: item.previousValue,
        currentValue: item.currentValue,
        unitPrice: item.unitPrice,
        billingPeriod: item.period || new Date().toISOString().slice(0, 7),
        status: 'pending',
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: user?.id || 'Admin001'
      }));

      const existingBills = JSON.parse(localStorage.getItem('bills') || '[]');
      existingBills.push(...bills);
      localStorage.setItem('bills', JSON.stringify(existingBills));
      
      const electricityCount = bills.filter(b => b.type === 'electricity').length;
      const waterCount = bills.filter(b => b.type === 'water').length;
      setSuccess(`Đã tạo thành công ${electricityCount} hóa đơn điện và ${waterCount} hóa đơn nước (tổng ${bills.length} hóa đơn)!`);
      setShowPreview(false);
      setUploadedFile(null);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error creating bills:', err);
      setError('Có lỗi xảy ra khi tạo hóa đơn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
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
                      Format CSV: roomNumber,period,type,oldValue,newValue,unitPrice,totalAmount
                    </p>
                  </div>

                  {uploadedFile && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-800 font-medium">
                          Đã chọn: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleProcessFile}
                    disabled={!uploadedFile || loading}
                    loading={loading}
                    loadingText="Đang xử lý..."
                    variant="primary"
                  >
                    Xử lý tài liệu
                  </Button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-800">{success}</span>
              </div>
            </div>
          )}

          {showPreview && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Xem trước dữ liệu đã xử lý</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Sẽ tạo {processedData.filter(r => r.type === 'electricity').length} hóa đơn điện và {processedData.filter(r => r.type === 'water').length} hóa đơn nước
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Button variant="outline" onClick={() => setShowPreview(false)}>
                    Quay lại
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleCreateBills}
                    loading={loading}
                    loadingText="Đang tạo hóa đơn..."
                  >
                    Tạo hóa đơn
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-48">
                    <Select
                      value={filterType}
                      onChange={(e) => handleTypeFilterChange(e.target.value)}
                      className="w-full"
                    >
                      <option value="all">Tất cả loại</option>
                      <option value="electricity">Hóa đơn điện</option>
                      <option value="water">Hóa đơn nước</option>
                    </Select>
                  </div>
                  <div className="w-48">
                    <Select
                      value={filterFloor}
                      onChange={(e) => handleFloorFilterChange(e.target.value)}
                      className="w-full"
                    >
                      <option value="all">Tất cả tầng</option>
                      {getFloorOptions().map(floor => (
                        <option key={floor} value={floor}>Tầng {floor}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Tổng cộng {filteredData.length} hóa đơn</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentData.map((item, index) => (
                        <tr key={`${item.roomId}_${item.type}_${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.roomId}</div>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

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
            </div>
          )}
    </PageLayout>
  );
};

export default ElectricityWaterBillCreationPage;
