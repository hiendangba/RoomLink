/**
 * Utility functions for handling room registration statuses
 */

/**
 * Get Vietnamese text for room registration status
 * @param {string} status - Room registration status
 * @returns {string} Vietnamese text for the status
 */
export const getStatusText = (status) => {
  const statusMap = {
    'BOOKED': 'Đã đặt phòng',
    'CONFIRMED': 'Đã xác nhận',
    'CANCELED': 'Đã hủy',
    'MOVE_PENDING': 'Chờ duyệt chuyển phòng',
    'PENDING': 'Chờ duyệt',
    'MOVED': 'Đã chuyển phòng',
    'EXTENDING': 'Đang gia hạn',
    'PENDING_EXTENDED': 'Chờ duyệt gia hạn',
    'EXTENDED': 'Đã gia hạn',
    'active': 'Đang hoạt động',
    'inactive': 'Đã dừng'
  };

  return statusMap[status] || status || 'Không xác định';
};

/**
 * Get color classes for room registration status badge
 * @param {string} status - Room registration status
 * @returns {string} Tailwind CSS classes for badge color
 */
export const getStatusColor = (status) => {
  const colorMap = {
    'BOOKED': 'bg-blue-100 text-blue-800',
    'CONFIRMED': 'bg-green-100 text-green-800',
    'CANCELED': 'bg-red-100 text-red-800',
    'MOVE_PENDING': 'bg-yellow-100 text-yellow-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'MOVED': 'bg-purple-100 text-purple-800',
    'EXTENDING': 'bg-orange-100 text-orange-800',
    'PENDING_EXTENDED': 'bg-yellow-100 text-yellow-800',
    'EXTENDED': 'bg-teal-100 text-teal-800',
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800'
  };

  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get status badge component props
 * @param {string} status - Room registration status
 * @returns {object} Object with text and color properties
 */
export const getStatusBadgeProps = (status) => {
  return {
    text: getStatusText(status),
    color: getStatusColor(status)
  };
};

/**
 * Check if status is active (user is currently staying)
 * @param {string} status - Room registration status
 * @returns {boolean} True if status is active
 */
export const isActiveStatus = (status) => {
  const activeStatuses = ['CONFIRMED', 'MOVED', 'EXTENDED'];
  return activeStatuses.includes(status);
};

/**
 * Check if status is pending (waiting for approval)
 * @param {string} status - Room registration status
 * @returns {boolean} True if status is pending
 */
export const isPendingStatus = (status) => {
  const pendingStatuses = ['BOOKED', 'PENDING', 'MOVE_PENDING', 'PENDING_EXTENDED', 'EXTENDING'];
  return pendingStatuses.includes(status);
};

/**
 * Check if status is cancelled
 * @param {string} status - Room registration status
 * @returns {boolean} True if status is cancelled
 */
export const isCancelledStatus = (status) => {
  return status === 'CANCELED';
};

/**
 * Get status category for filtering/grouping
 * @param {string} status - Room registration status
 * @returns {string} Category: 'active', 'pending', 'cancelled', 'other'
 */
export const getStatusCategory = (status) => {
  if (isActiveStatus(status)) return 'active';
  if (isPendingStatus(status)) return 'pending';
  if (isCancelledStatus(status)) return 'cancelled';
  return 'other';
};

/**
 * Get Vietnamese text for approval status (used in admin pages)
 * @param {string} status - Approval status: 'pending', 'approved', 'rejected'
 * @returns {string} Vietnamese text for the status
 */
export const getApprovalStatusText = (status) => {
  const statusMap = {
    'pending': 'Chờ duyệt',
    'approved': 'Đã duyệt',
    'rejected': 'Từ chối'
  };
  return statusMap[status] || status || 'Không xác định';
};

/**
 * Get color classes for approval status badge (used in admin pages)
 * @param {string} status - Approval status: 'pending', 'approved', 'rejected'
 * @returns {string} Tailwind CSS classes for badge color
 */
export const getApprovalStatusColor = (status) => {
  const colorMap = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get approval status badge props
 * @param {string} status - Approval status: 'pending', 'approved', 'rejected'
 * @returns {object} Object with text and color properties
 */
export const getApprovalStatusBadgeProps = (status) => {
  return {
    text: getApprovalStatusText(status),
    color: getApprovalStatusColor(status)
  };
};

