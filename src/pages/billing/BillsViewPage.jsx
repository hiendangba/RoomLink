import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { paymentApi, roomApi } from '../../api';
import {
  transformPaymentToBill,
  getPaymentTypeName,
  getPaymentTypeIcon,
  getPaymentStatusName,
  getPaymentStatusColor,
  isPaymentPaid,
  PAYMENT_TYPES
} from '../../utils/paymentUtils';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import LoadingState from '../../components/ui/LoadingState';
import PageHeader from '../../components/ui/PageHeader';
import BaseModal, { ModalBody, ModalFooter } from '../../components/modal/BaseModal';

const BillsView = ({ onSuccess, onCancel }) => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [paginatedBills, setPaginatedBills] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [filter, setFilter] = useState('all'); // all, paid, unpaid
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { showError, showSuccess } = useNotification();
  const [processingPaymentId, setProcessingPaymentId] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedBills, setSelectedBills] = useState(new Set());

  useEffect(() => {
    const loadBills = async () => {
      try {
        setIsLoading(true);

        // Load payments - get all payments for user
        // Backend will automatically get userId from token
        // Payment types: "ROOM", "REFUND", "ELECTRICITY", "WATER", "HEALTHCHECK"
        // Backend now returns roomNumber in payment response
        console.log('Calling paymentApi.getPaymentByUserId');
        const paymentResponse = await paymentApi.getPaymentByUserId({
          page: 1,
          limit: 1000 // Get all payments
        });

        console.log('Payment response:', paymentResponse);

        // Get all payments (no filter)
        // Response structure from ApiResponse: { data: [...payments], pagination: {...} }
        // axiosClient may unwrap response.data, so check both structures
        const allPayments = Array.isArray(paymentResponse.data) 
          ? paymentResponse.data 
          : (paymentResponse.data?.data || paymentResponse.data?.response || []);

        console.log('All payments:', allPayments);

        // Transform payments to bills
        // Use roomNumber from payment response if available, otherwise use fallback
        const transformedBills = allPayments.map(payment => {
          const roomNumber = payment.roomNumber || 'N/A';
          const studentName = payment.studentName || user?.name || '';
          return transformPaymentToBill(payment, roomNumber, studentName);
        });

        // Sort by issueDate descending (newest first)
        transformedBills.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

        console.log('Transformed bills:', transformedBills);
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

    // Wait for auth to finish loading and user to be available
    // Backend will automatically get userId from token, so we don't need user.id
    if (!authLoading && user) {
      loadBills();
    } else if (!authLoading) {
      // No user at all
      console.log('No user available, skipping loadBills');
      setIsLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    // Filter bills based on selected filter
    let filtered = bills;
    if (filter === 'paid') {
      filtered = bills.filter(bill => isPaymentPaid(bill.paymentStatus));
    } else if (filter === 'unpaid') {
      filtered = bills.filter(bill => !isPaymentPaid(bill.paymentStatus));
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

  const formatDateFull = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePrintClick = () => {
    setShowPrintModal(true);
    // Select all bills by default
    setSelectedBills(new Set(filteredBills.map(bill => bill.id)));
  };

  const handleToggleBill = (billId) => {
    const newSelected = new Set(selectedBills);
    if (newSelected.has(billId)) {
      newSelected.delete(billId);
    } else {
      newSelected.add(billId);
    }
    setSelectedBills(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedBills.size === filteredBills.length) {
      setSelectedBills(new Set());
    } else {
      setSelectedBills(new Set(filteredBills.map(bill => bill.id)));
    }
  };

  const handlePrint = () => {
    if (selectedBills.size === 0) {
      showError('Vui lòng chọn ít nhất một hóa đơn để in');
      return;
    }
    setShowPrintModal(false);
    // Trigger print after a short delay to allow modal to close
    setTimeout(() => {
      window.print();
    }, 100);
  };


  const getTotalAmount = () => {
    return bills.reduce((total, bill) => total + bill.amount, 0);
  };

  const getPaidAmount = () => {
    return bills.filter(bill => isPaymentPaid(bill.paymentStatus)).reduce((total, bill) => total + bill.amount, 0);
  };

  const getUnpaidAmount = () => {
    return bills.filter(bill => !isPaymentPaid(bill.paymentStatus)).reduce((total, bill) => total + bill.amount, 0);
  };

  const handlePayment = async (paymentId) => {
    try {
      setProcessingPaymentId(paymentId);
      
      // Call API to get payment URL
      const response = await paymentApi.getPaymentUrl({
        paymentId: paymentId
      });

      // Response structure: { data: { paymentUrl: "..." } }
      const paymentUrl = response.data?.paymentUrl || response.data?.data?.paymentUrl;

      if (paymentUrl && paymentUrl.trim() !== '') {
        // Redirect to payment URL (MoMo)
        window.location.href = paymentUrl;
      } else {
        showError('Không thể tạo liên kết thanh toán. Vui lòng thử lại.');
        setProcessingPaymentId(null);
      }
    } catch (error) {
      console.error('Error getting payment URL:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tạo liên kết thanh toán. Vui lòng thử lại.';
      showError(errorMessage);
      setProcessingPaymentId(null);
    }
  };

  const emptyState = (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">📄</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Hiện tại chưa có giao dịch nào
      </h3>
      <p className="text-gray-500">
        Các giao dịch thanh toán của bạn sẽ được hiển thị tại đây
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Hóa đơn thanh toán"
          subtitle="Xem chi tiết tất cả các giao dịch thanh toán của bạn"
          showCancel={true}
          onCancel={onCancel}
          cancelText="Quay lại"
          headerActions={
            <Button
              variant="primary"
              onClick={handlePrintClick}
              size="small"
            >
              In hóa đơn
            </Button>
          }
        />

        <LoadingState
          isLoading={isLoading}
          loadingText="Đang tải..."
        >
          <>
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
                    <p className="text-sm font-medium text-gray-500">Tổng số giao dịch</p>
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
                  Đã thanh toán ({bills.filter(bill => isPaymentPaid(bill.paymentStatus)).length})
                </button>
                <button
                  onClick={() => handleFilterChange('unpaid')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    filter === 'unpaid'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Chưa thanh toán ({bills.filter(bill => !isPaymentPaid(bill.paymentStatus)).length})
                </button>
              </div>
            </div>

            {/* Bills List */}
            {filteredBills.length === 0 ? (
              emptyState
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedBills.map((bill) => (
                <div key={bill.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Bill Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{getPaymentTypeIcon(bill.paymentType)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{bill.billTypeName}</h3>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(bill.paymentStatus)}`}>
                        {getPaymentStatusName(bill.paymentStatus)}
                      </span>
                    </div>

                    {/* Bill Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Mã hóa đơn:</span>
                        <span className="font-medium">{bill.id}</span>
                      </div>
                      {bill.studentName && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Sinh viên:</span>
                          <span className="font-medium">{bill.studentName}</span>
                        </div>
                      )}
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
                      {(bill.paymentType === PAYMENT_TYPES.ELECTRICITY || bill.paymentType === PAYMENT_TYPES.WATER) && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Tiêu thụ:</span>
                          <span className="font-medium">{bill.details.consumption} {bill.paymentType === PAYMENT_TYPES.ELECTRICITY ? 'kWh' : 'm³'}</span>
                        </div>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Tổng tiền:</span>
                        <span className="text-xl font-bold text-gray-900">{formatPrice(bill.amount)}</span>
                      </div>
                    </div>

                    {/* Payment Info (if paid) */}
                    {isPaymentPaid(bill.paymentStatus) && (
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
                    {!isPaymentPaid(bill.paymentStatus) && new Date(bill.dueDate) < new Date() && (
                      <div className="mt-4 p-3 bg-red-50 rounded-md">
                        <div className="flex items-center">
                          <span className="text-red-600 text-sm font-medium">⚠️ Quá hạn thanh toán</span>
                        </div>
                      </div>
                    )}

                    {/* Payment Button (if unpaid and not REFUND and not admin) */}
                    {!isPaymentPaid(bill.paymentStatus) && bill.paymentType !== PAYMENT_TYPES.REFUND && !isAdmin && (
                      <div className="mt-4">
                        <Button
                          variant="success"
                          size="small"
                          fullWidth
                          onClick={async () => {
                            await handlePayment(bill.id);
                          }}
                          disabled={processingPaymentId === bill.id}
                          loading={processingPaymentId === bill.id}
                          loadingText="Đang xử lý..."
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
          </>
        </LoadingState>
      </div>

      {/* Print Modal */}
      <BaseModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="Chọn hóa đơn cần in"
        size="large"
      >
        <ModalBody>
          <div className="mb-4">
            <Button
              variant="outline"
              size="small"
              onClick={handleSelectAll}
            >
              {selectedBills.size === filteredBills.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
            <span className="ml-4 text-sm text-gray-600">
              Đã chọn: {selectedBills.size} / {filteredBills.length}
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredBills.map((bill) => (
              <label
                key={bill.id}
                className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedBills.has(bill.id)}
                  onChange={() => handleToggleBill(bill.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg mr-2">{getPaymentTypeIcon(bill.paymentType)}</span>
                      <span className="font-medium text-gray-900">{bill.billTypeName}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatPrice(bill.amount)}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Mã: {bill.id.substring(0, 8)}... | Phòng: {bill.roomNumber} | 
                    Ngày: {formatDate(bill.issueDate)} | 
                    <span className={`ml-2 ${getPaymentStatusColor(bill.paymentStatus)} px-2 py-0.5 rounded-full text-xs`}>
                      {getPaymentStatusName(bill.paymentStatus)}
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowPrintModal(false)}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handlePrint}
          >
            In hóa đơn ({selectedBills.size})
          </Button>
        </ModalFooter>
      </BaseModal>

      {/* Print View */}
      <div className="hidden print:block print:p-8">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
            @page {
              margin: 1cm;
            }
          }
        `}</style>
        <div className="print-content">
          {filteredBills
            .filter(bill => selectedBills.has(bill.id))
            .map((bill, index) => (
              <div key={bill.id} className="mb-8 break-inside-avoid">
                <div className="border-2 border-gray-800 p-8">
                  {/* Header */}
                  <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
                    <h1 className="text-3xl font-bold mb-2">HÓA ĐƠN THANH TOÁN</h1>
                    <p className="text-lg text-gray-700">Ký túc xá - Trường Đại học</p>
                  </div>

                  {/* Bill Info */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Mã hóa đơn:</p>
                      <p className="font-semibold">{bill.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Loại hóa đơn:</p>
                      <p className="font-semibold">{bill.billTypeName}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-6 p-4 bg-gray-50 border border-gray-300">
                    <h3 className="font-semibold mb-3 text-lg">Thông tin khách hàng</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Họ và tên:</span>
                        <span className="ml-2 font-medium">{bill.studentName || user?.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Phòng:</span>
                        <span className="ml-2 font-medium">{bill.roomNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bill Details */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 text-lg">Chi tiết hóa đơn</h3>
                    <table className="w-full border-collapse border border-gray-400">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-400 px-4 py-2 text-left">Mô tả</th>
                          <th className="border border-gray-400 px-4 py-2 text-right">Số tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 px-4 py-3">
                            <div>
                              <p className="font-medium">{bill.billTypeName}</p>
                              {bill.period && <p className="text-sm text-gray-600">Kỳ: {bill.period}</p>}
                              {(bill.paymentType === PAYMENT_TYPES.ELECTRICITY || bill.paymentType === PAYMENT_TYPES.WATER) && (
                                <p className="text-sm text-gray-600">
                                  Tiêu thụ: {bill.details.consumption} {bill.paymentType === PAYMENT_TYPES.ELECTRICITY ? 'kWh' : 'm³'}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-400 px-4 py-3 text-right font-semibold">
                            {formatPrice(bill.amount)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Payment Info */}
                  <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Ngày phát hành:</p>
                      <p className="font-medium">{formatDateFull(bill.issueDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Hạn thanh toán:</p>
                      <p className="font-medium">{formatDateFull(bill.dueDate)}</p>
                    </div>
                    {isPaymentPaid(bill.paymentStatus) && bill.paidDate && (
                      <>
                        <div>
                          <p className="text-gray-600 mb-1">Ngày thanh toán:</p>
                          <p className="font-medium text-green-700">{formatDateFull(bill.paidDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Phương thức thanh toán:</p>
                          <p className="font-medium">{bill.paymentMethod || 'Chuyển khoản'}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Total */}
                  <div className="border-t-2 border-gray-800 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-semibold">TỔNG CỘNG:</span>
                      <span className="text-2xl font-bold">{formatPrice(bill.amount)}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-6 pt-4 border-t border-gray-300">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Trạng thái:</p>
                        <p className={`font-semibold ${isPaymentPaid(bill.paymentStatus) ? 'text-green-700' : 'text-red-700'}`}>
                          {getPaymentStatusName(bill.paymentStatus)}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>In ngày: {new Date().toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
                    <p>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
                    <p className="mt-2">Hóa đơn này có giá trị pháp lý và được lưu trữ trong hệ thống</p>
                  </div>
                </div>
                {index < filteredBills.filter(b => selectedBills.has(b.id)).length - 1 && (
                  <div className="page-break"></div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default BillsView;
