import React, { useState, useEffect } from 'react';
import BaseModal, { ModalBody, ModalFooter } from './BaseModal';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Radio from '../ui/Radio';

const RejectionModal = ({ isOpen, onClose, onConfirm, title = "Nhập lý do từ chối", selectedItems = [], onViewDetail, onRemoveItem }) => {
  const [reason, setReason] = useState(''); // Lý do chung
  const [individualReasons, setIndividualReasons] = useState({}); // Lý do riêng cho từng đơn
  const [useCommonReason, setUseCommonReason] = useState(true); // Dùng lý do chung hay riêng
  const [loading, setLoading] = useState(false);

  // Reset khi modal mở/đóng hoặc khi selectedItems thay đổi
  useEffect(() => {
    if (isOpen) {
      // Chỉ reset hoàn toàn khi modal mới mở (selectedItems rỗng)
      if (selectedItems.length === 0) {
        setReason('');
        setIndividualReasons({});
        setUseCommonReason(true);
      } else {
        // Nếu có items bị xóa, xóa lý do của chúng
        const currentItemIds = selectedItems.map(item => item.id);
        setIndividualReasons(prev => {
          const newReasons = { ...prev };
          Object.keys(newReasons).forEach(id => {
            if (!currentItemIds.includes(id)) {
              delete newReasons[id];
            }
          });
          return newReasons;
        });
      }
    }
  }, [isOpen, selectedItems]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let reasonsData;
      
      if (useCommonReason) {
        // Dùng lý do chung cho tất cả
        const commonReason = reason.trim() || '';
        reasonsData = { type: 'common', reason: commonReason };
      } else {
        // Dùng lý do riêng cho từng đơn
        reasonsData = { type: 'individual', reasons: individualReasons };
      }
      
      await onConfirm(reasonsData);
      setReason('');
      setIndividualReasons({});
      // Modal sẽ được đóng trong handleConfirmRejection sau khi thành công
    } catch (error) {
      console.error('Error rejecting:', error);
      // Nếu có lỗi, không đóng modal để user có thể thử lại
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="medium"
      closeOnOverlayClick={true}
    >
      <ModalBody>
        <div className="mb-4">
          <div className="mb-4 space-y-2">
            <Radio
              label="Dùng lý do chung cho tất cả đơn"
              checked={useCommonReason}
              onChange={() => setUseCommonReason(true)}
              className="text-red-600 focus:ring-red-500"
            />
            <Radio
              label="Nhập lý do riêng cho từng đơn"
              checked={!useCommonReason}
              onChange={() => setUseCommonReason(false)}
              className="text-red-600 focus:ring-red-500"
            />
          </div>

          {useCommonReason ? (
            <Textarea
              label="Lý do từ chối (tùy chọn)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do từ chối chi tiết cho tất cả đơn..."
              rows={4}
              maxLength={500}
              className="focus:ring-red-500 focus:border-red-500"
            />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedItems.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {item.studentName || item.name || `Đơn ${item.id.substring(0, 8)}...`}
                      </label>
                      <p className="text-xs text-gray-500">
                        MSSV: {item.mssv || 'N/A'} | Phòng: {item.roomNumber || item.currentRoom?.roomNumber || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {onViewDetail && (
                        <Button
                          variant="link"
                          size="small"
                          onClick={() => onViewDetail(item)}
                        >
                          Chi tiết
                        </Button>
                      )}
                      {onRemoveItem && (
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => onRemoveItem(item.id)}
                          icon={
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          }
                          title="Bỏ chọn đơn này"
                        />
                      )}
                    </div>
                  </div>
                  <Textarea
                    value={individualReasons[item.id] || ''}
                    onChange={(e) => setIndividualReasons(prev => ({
                      ...prev,
                      [item.id]: e.target.value
                    }))}
                    placeholder="Nhập lý do từ chối cho đơn này..."
                    rows={2}
                    maxLength={500}
                    size="small"
                    className="focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          onClick={handleClose}
          variant="outline"
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="danger"
          loading={loading}
          loadingText="Đang từ chối..."
        >
          Xác nhận từ chối
        </Button>
      </ModalFooter>
    </BaseModal>
  );
};

export default RejectionModal;

