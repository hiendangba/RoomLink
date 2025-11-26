import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { paymentApi, roomApi } from '../../api';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';

const BillsView = ({ onSuccess, onCancel }) => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [paginatedBills, setPaginatedBills] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [filter, setFilter] = useState('all'); // all, paid, unpaid
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { showError } = useNotification();

  // Transform payment data to bill format
  const transformPaymentToBill = (payment, roomNumber) => {
    // Parse content: "Thanh toán tiền điện/nước - YYYY-MM"
    const contentMatch = payment.content?.match(/Thanh toán tiền (điện|nước) - (\d{4}-\d{2})/);
    const typeString = contentMatch ? contentMatch[1] : (payment.type === 'ELECTRICITY' ? 'điện' : 'nước');
    const periodStr = contentMatch ? contentMatch[2] : '';
    
    // Parse period YYYY-MM to "Tháng MM/YYYY"
    let period = '';
    if (periodStr) {
      const [year, month] = periodStr.split('-');
      period = `Tháng ${month}/${year}`;
    } else {
      // Fallback: use createdAt date
      const date = new Date(payment.createdAt || Date.now());
      period = `Tháng ${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    }

    const billType = payment.type === 'ELECTRICITY' ? 'electricity' : 'water';
    const billTypeName = payment.type === 'ELECTRICITY' ? 'Hóa đơn điện' : 'Hóa đơn nước';
    const status = payment.status === 'SUCCESS' ? 'paid' : 'unpaid';
    
    // Calculate issueDate (first day of next month after period)
    let issueDate = new Date();
    if (periodStr) {
      const [year, month] = periodStr.split('-');
      issueDate = new Date(parseInt(year), parseInt(month), 1); // First day of the month
    }
    
    // Calculate dueDate (15 days after issueDate)
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 15);

    return {
      id: payment.id,
      studentId: payment.studentId,
      studentName: user?.name || '',
      roomNumber: roomNumber || 'N/A',
      billType,
      billTypeName,
      period,
      issueDate: issueDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      amount: parseFloat(payment.amount) || 0,
      status,
      paidDate: payment.paidAt ? new Date(payment.paidAt).toISOString().split('T')[0] : null,
      paymentMethod: payment.status === 'SUCCESS' ? 'Chuyển khoản' : null,
      details: {
        // These details are not available from Payment model, set defaults
        previousReading: 0,
        currentReading: 0,
        consumption: 0,
        unitPrice: 0,
        totalAmount: parseFloat(payment.amount) || 0
      },
      description: payment.content || `Tiêu thụ ${typeString} ${period}`
    };
  };

  useEffect(() => {
    const loadBills = async () => {
      try {
        setIsLoading(true);
        
        // Load room data to get roomNumber
        let roomNumber = 'N/A';
        try {
          const roomResponse = await roomApi.getRoomByUser();
          if (roomResponse.success && roomResponse.data) {
            roomNumber = roomResponse.data.roomNumber || 'N/A';
          }
        } catch (roomError) {
          console.error('Error loading room data:', roomError);
          // Continue without room number
        }

        // Load payments - get all payments for user
        // Payment types: "ROOM", "REFUND", "ELECTRICITY", "WATER", "HEALTHCHECK"
        // This page only displays electricity and water bills
        const paymentResponse = await paymentApi.getPaymentByUserId({
          userId: user?.id,
          page: 1,
          limit: 1000 // Get all payments
        });

        // Filter only electricity and water bills (exclude ROOM, REFUND, HEALTHCHECK)
        const allPayments = (paymentResponse.data || []).filter(
          payment => payment.type === 'ELECTRICITY' || payment.type === 'WATER'
        );

        // Transform payments to bills
        const transformedBills = allPayments.map(payment => 
          transformPaymentToBill(payment, roomNumber)
        );

        // Sort by issueDate descending (newest first)
        transformedBills.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

        setBills(transformedBills);
      } catch (error) {
        console.error('Error loading bills:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Không thể tải danh sách hóa đơn.';
        showError(errorMessage);
        setBills([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      loadBills();
    } else {
      setIsLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    // Filter bills based on selected filter
    let filtered = bills;
    if (filter === 'paid') {
      filtered = bills.filter(bill => bill.status === 'paid');
    } else if (filter === 'unpaid') {
      filtered = bills.filter(bill => bill.status === 'unpaid');
    }
    setFilteredBills(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [bills, filter]);

  useEffect(() => {
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedBills(filteredBills.slice(startIndex, endIndex));
  }, [filteredBills, currentPage, itemsPerPage]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Đã thanh toán';
      case 'unpaid':
        return 'Chưa thanh toán';
      default:
        return 'Không xác định';
    }
  };

  const getBillTypeIcon = (billType) => {
    switch (billType) {
      case 'electricity':
        return '⚡';
      case 'water':
        return '💧';
      default:
        return '📄';
    }
  };

  const getTotalAmount = () => {
    return bills.reduce((total, bill) => total + bill.amount, 0);
  };

  const getPaidAmount = () => {
    return bills.filter(bill => bill.status === 'paid').reduce((total, bill) => total + bill.amount, 0);
  };

  const getUnpaidAmount = () => {
    return bills.filter(bill => bill.status === 'unpaid').reduce((total, bill) => total + bill.amount, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải hóa đơn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hóa đơn điện nước</h1>
          <p className="mt-2 text-gray-600">Xem chi tiết các hóa đơn điện nước phát sinh</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng số hóa đơn</p>
                <p className="text-2xl font-semibold text-gray-900">{bills.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Đã thanh toán</p>
                <p className="text-2xl font-semibold text-green-600">{formatPrice(getPaidAmount())}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">⚠️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Chưa thanh toán</p>
                <p className="text-2xl font-semibold text-red-600">{formatPrice(getUnpaidAmount())}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả ({bills.length})
            </button>
            <button
              onClick={() => handleFilterChange('paid')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'paid'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã thanh toán ({bills.filter(bill => bill.status === 'paid').length})
            </button>
            <button
              onClick={() => handleFilterChange('unpaid')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'unpaid'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chưa thanh toán ({bills.filter(bill => bill.status === 'unpaid').length})
            </button>
          </div>
        </div>

        {/* Bills List */}
        {filteredBills.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Hiện tại chưa có hóa đơn nào
            </h3>
            <p className="text-gray-500">
              Hóa đơn điện nước sẽ được tạo hàng tháng và hiển thị tại đây
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedBills.map((bill) => (
                <div key={bill.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Bill Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{getBillTypeIcon(bill.billType)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{bill.billTypeName}</h3>
                          <p className="text-sm text-gray-600">{bill.period}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                        {getStatusText(bill.status)}
                      </span>
                    </div>

                    {/* Bill Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Mã hóa đơn:</span>
                        <span className="font-medium">{bill.id}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Phòng:</span>
                        <span className="font-medium">{bill.roomNumber}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Ngày phát hành:</span>
                        <span className="font-medium">{formatDate(bill.issueDate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Hạn thanh toán:</span>
                        <span className="font-medium">{formatDate(bill.dueDate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tiêu thụ:</span>
                        <span className="font-medium">{bill.details.consumption} {bill.billType === 'electricity' ? 'kWh' : 'm³'}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Tổng tiền:</span>
                        <span className="text-xl font-bold text-gray-900">{formatPrice(bill.amount)}</span>
                      </div>
                    </div>

                    {/* Payment Info (if paid) */}
                    {bill.status === 'paid' && (
                      <div className="mt-4 p-3 bg-green-50 rounded-md">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">Ngày thanh toán:</span>
                          <span className="font-medium text-green-800">{formatDate(bill.paidDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">Phương thức:</span>
                          <span className="font-medium text-green-800">{bill.paymentMethod}</span>
                        </div>
                      </div>
                    )}

                    {/* Overdue Warning (if unpaid and overdue) */}
                    {bill.status === 'unpaid' && new Date(bill.dueDate) < new Date() && (
                      <div className="mt-4 p-3 bg-red-50 rounded-md">
                        <div className="flex items-center">
                          <span className="text-red-600 text-sm font-medium">⚠️ Quá hạn thanh toán</span>
                        </div>
                      </div>
                    )}

                    {/* Payment Button (if unpaid) */}
                    {bill.status === 'unpaid' && (
                      <div className="mt-4">
                        <Button
                          variant="success"
                          size="small"
                          fullWidth
                          onClick={() => {
                            const url = `/payment?billId=${bill.id}&type=bills`;
                            window.location.href = url;
                          }}
                          icon="💳"
                        >
                          Thanh toán ngay
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {filteredBills.length > itemsPerPage && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredBills.length / itemsPerPage)}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredBills.length}
                />
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Quay lại
          </Button>
          <div className="flex space-x-4">
            <Button
              variant="primary"
              onClick={() => window.print()}
            >
              In hóa đơn
            </Button>
            <Button
              variant="success"
              onClick={() => {
                // Export to PDF functionality would go here
                alert('Tính năng xuất PDF sẽ được phát triển');
              }}
            >
              Xuất PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillsView;
