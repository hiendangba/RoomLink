/**
 * Utility functions for payment types and status
 */

export const PAYMENT_TYPES = {
  ROOM: 'ROOM',
  REFUND: 'REFUND',
  ELECTRICITY: 'ELECTRICITY',
  WATER: 'WATER',
  HEALTHCHECK: 'HEALTHCHECK'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed'
};

/**
 * Get payment type display name in Vietnamese
 */
export const getPaymentTypeName = (type) => {
  switch (type) {
    case PAYMENT_TYPES.ROOM:
      return 'Thanh toán phòng';
    case PAYMENT_TYPES.REFUND:
      return 'Hoàn tiền';
    case PAYMENT_TYPES.ELECTRICITY:
      return 'Hóa đơn điện';
    case PAYMENT_TYPES.WATER:
      return 'Hóa đơn nước';
    case PAYMENT_TYPES.HEALTHCHECK:
      return 'Khám sức khỏe';
    default:
      return 'Hoàn trả';
  }
};

/**
 * Get payment type icon
 */
export const getPaymentTypeIcon = (type) => {
  switch (type) {
    case PAYMENT_TYPES.ROOM:
      return '🏠';
    case PAYMENT_TYPES.REFUND:
      return '💰';
    case PAYMENT_TYPES.ELECTRICITY:
      return '⚡';
    case PAYMENT_TYPES.WATER:
      return '💧';
    case PAYMENT_TYPES.HEALTHCHECK:
      return '🏥';
    default:
      return '📄';
  }
};

/**
 * Get payment status display name in Vietnamese
 */
export const getPaymentStatusName = (status) => {
  switch (status) {
    case PAYMENT_STATUS.PENDING:
      return 'Chờ xử lý';
    case PAYMENT_STATUS.SUCCESS:
      return 'Đã thanh toán';
    case PAYMENT_STATUS.FAILED:
      return 'Thất bại';
    default:
      return 'Không xác định';
  }
};

/**
 * Get payment status color class
 */
export const getPaymentStatusColor = (status) => {
  switch (status) {
    case PAYMENT_STATUS.SUCCESS:
      return 'bg-green-100 text-green-800';
    case PAYMENT_STATUS.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case PAYMENT_STATUS.FAILED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Check if payment is paid (success status)
 */
export const isPaymentPaid = (status) => {
  return status === PAYMENT_STATUS.SUCCESS;
};

/**
 * Check if payment is unpaid
 */
export const isPaymentUnpaid = (status) => {
  return status !== PAYMENT_STATUS.SUCCESS;
};

/**
 * Transform payment to bill format
 */
export const transformPaymentToBill = (payment, roomNumber, userName = '') => {
  // Parse content for period information (only for ELECTRICITY and WATER)
  const contentMatch = payment.content?.match(/Thanh toán tiền (điện|nước) - (\d{4}-\d{2})/);
  const periodStr = contentMatch ? contentMatch[2] : '';
  
  // Parse period YYYY-MM to "Tháng MM/YYYY" (only for bills with period)
  let period = '';
  if (periodStr) {
    const [year, month] = periodStr.split('-');
    period = `Tháng ${month}/${year}`;
  } else if (payment.type === PAYMENT_TYPES.ELECTRICITY || payment.type === PAYMENT_TYPES.WATER) {
    // Fallback: use createdAt date for electricity/water bills
    const date = new Date(payment.createdAt || Date.now());
    period = `Tháng ${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }

  const billType = payment.type?.toLowerCase() || 'other';
  const billTypeName = getPaymentTypeName(payment.type);
  const status = isPaymentPaid(payment.status) ? 'paid' : 'unpaid';
  
  // Calculate issueDate (first day of month for bills with period, or use createdAt)
  let issueDate = new Date(payment.createdAt || Date.now());
  if (periodStr) {
    const [year, month] = periodStr.split('-');
    issueDate = new Date(parseInt(year), parseInt(month) - 1, 1); // First day of the month
  }
  
  // Calculate dueDate (15 days after issueDate for electricity/water bills, same day for others)
  const dueDate = new Date(issueDate);
  if (payment.type === PAYMENT_TYPES.ELECTRICITY || payment.type === PAYMENT_TYPES.WATER) {
    dueDate.setDate(dueDate.getDate() + 15);
  }

  return {
    id: payment.id,
    studentId: payment.studentId,
    studentName: userName,
    roomNumber: roomNumber || 'N/A',
    billType,
    billTypeName,
    paymentType: payment.type,
    period,
    issueDate: issueDate.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    amount: parseFloat(payment.amount) || 0,
    status,
    paymentStatus: payment.status,
    paidDate: payment.paidAt ? new Date(payment.paidAt).toISOString().split('T')[0] : null,
    paymentMethod: isPaymentPaid(payment.status) ? 'Chuyển khoản' : null,
    details: {
      previousReading: 0,
      currentReading: 0,
      consumption: 0,
      unitPrice: 0,
      totalAmount: parseFloat(payment.amount) || 0
    },
    description: payment.content || getPaymentTypeName(payment.type)
  };
};

/**
 * Filter payments by type
 */
export const filterPaymentsByType = (payments, types = []) => {
  if (types.length === 0) {
    return payments;
  }
  return payments.filter(payment => types.includes(payment.type));
};

/**
 * Get payment type category (for grouping)
 */
export const getPaymentTypeCategory = (type) => {
  switch (type) {
    case PAYMENT_TYPES.ELECTRICITY:
    case PAYMENT_TYPES.WATER:
      return 'bills';
    case PAYMENT_TYPES.ROOM:
      return 'room';
    case PAYMENT_TYPES.HEALTHCHECK:
      return 'health';
    case PAYMENT_TYPES.REFUND:
      return 'refund';
    default:
      return 'other';
  }
};

