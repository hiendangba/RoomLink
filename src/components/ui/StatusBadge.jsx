import React from 'react';
import { getStatusBadgeProps, getApprovalStatusBadgeProps } from '../../utils/roomStatusUtils';

/**
 * StatusBadge component for displaying room registration status
 * @param {string} status - Room registration status (backend status or approval status)
 * @param {string} className - Additional CSS classes
 * @param {string} size - Badge size: 'small', 'medium', 'large'
 * @param {boolean} isApprovalStatus - If true, treats status as approval status (pending/approved/rejected)
 */
const StatusBadge = ({ status, className = '', size = 'medium', isApprovalStatus = false }) => {
  const badgeProps = isApprovalStatus 
    ? getApprovalStatusBadgeProps(status)
    : getStatusBadgeProps(status);
  
  const { text, color } = badgeProps;

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-1.5 text-base'
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${color} ${sizeClasses[size]} ${className}`}
    >
      {text}
    </span>
  );
};

export default StatusBadge;

