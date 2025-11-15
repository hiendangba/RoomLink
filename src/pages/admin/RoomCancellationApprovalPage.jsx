import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import BaseModal, { ModalBody, ModalFooter } from '../../components/modal/BaseModal';
import Pagination from '../../components/ui/Pagination';
import RejectionModal from '../../components/modal/RejectionModal';

const RoomCancellationApprovalPage = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState(null);

  const mockCancellationRequests = [
    { id: 'CANCEL001', studentId: 'SV001', studentName: 'Nguyễn Văn An', studentEmail: 'an.nguyen@student.hust.edu.vn', studentPhone: '0123456789', studentIdNumber: '20190001', currentRoom: { roomNumber: 'A101', building: 'Tòa A', zone: 'Khu A', roomType: 'Phòng đôi', monthlyFee: 800000 }, contract: { contractId: 'CT001', startDate: '2024-01-01', endDate: '2024-12-31', deposit: 1600000, monthlyFee: 800000, totalPaid: 8000000, remainingAmount: 0 }, cancellation: { requestDate: '2024-06-15', reason: 'Tốt nghiệp sớm', expectedMoveOutDate: '2024-07-01', refundAmount: 800000, penaltyFee: 0, finalRefundAmount: 800000 }, status: 'pending', createdAt: '2024-06-15T10:30:00Z', documents: { graduationCertificate: true, moveOutRequest: true, roomConditionReport: false } },
    { id: 'CANCEL002', studentId: 'SV002', studentName: 'Trần Thị Bình', studentEmail: 'binh.tran@student.hust.edu.vn', studentPhone: '0987654321', studentIdNumber: '20190002', currentRoom: { roomNumber: 'B205', building: 'Tòa B', zone: 'Khu B', roomType: 'Phòng đơn', monthlyFee: 1200000 }, contract: { contractId: 'CT002', startDate: '2024-02-01', endDate: '2025-01-31', deposit: 2400000, monthlyFee: 1200000, totalPaid: 6000000, remainingAmount: 6000000 }, cancellation: { requestDate: '2024-06-20', reason: 'Chuyển trường', expectedMoveOutDate: '2024-07-15', refundAmount: 6000000, penaltyFee: 1200000, finalRefundAmount: 4800000 }, status: 'pending', createdAt: '2024-06-20T14:15:00Z', documents: { transferDocument: true, moveOutRequest: true, roomConditionReport: true } },
    { id: 'CANCEL003', studentId: 'SV003', studentName: 'Lê Minh Cường', studentEmail: 'cuong.le@student.hust.edu.vn', studentPhone: '0369258147', studentIdNumber: '20190003', currentRoom: { roomNumber: 'C301', building: 'Tòa C', zone: 'Khu C', roomType: 'Phòng đôi', monthlyFee: 800000 }, contract: { contractId: 'CT003', startDate: '2024-03-01', endDate: '2025-02-28', deposit: 1600000, monthlyFee: 800000, totalPaid: 3200000, remainingAmount: 8000000 }, cancellation: { requestDate: '2024-06-25', reason: 'Lý do cá nhân', expectedMoveOutDate: '2024-07-30', refundAmount: 8000000, penaltyFee: 800000, finalRefundAmount: 7200000 }, status: 'pending', createdAt: '2024-06-25T09:45:00Z', documents: { personalReason: true, moveOutRequest: true, roomConditionReport: false } },
    { id: 'CANCEL004', studentId: 'SV004', studentName: 'Phạm Thị Dung', studentEmail: 'dung.pham@student.hust.edu.vn', studentPhone: '0741852963', studentIdNumber: '20190004', currentRoom: { roomNumber: 'A102', building: 'Tòa A', zone: 'Khu A', roomType: 'Phòng đơn', monthlyFee: 1200000 }, contract: { contractId: 'CT004', startDate: '2024-01-15', endDate: '2024-12-15', deposit: 2400000, monthlyFee: 1200000, totalPaid: 6000000, remainingAmount: 1200000 }, cancellation: { requestDate: '2024-06-28', reason: 'Tốt nghiệp', expectedMoveOutDate: '2024-07-10', refundAmount: 1200000, penaltyFee: 0, finalRefundAmount: 1200000 }, status: 'approved', createdAt: '2024-06-28T16:20:00Z', approvedAt: '2024-06-29T10:00:00Z', approvedBy: 'Admin001', documents: { graduationCertificate: true, moveOutRequest: true, roomConditionReport: true } },
    { id: 'CANCEL005', studentId: 'SV005', studentName: 'Hoàng Văn Em', studentEmail: 'em.hoang@student.hust.edu.vn', studentPhone: '0852741963', studentIdNumber: '20190005', currentRoom: { roomNumber: 'B206', building: 'Tòa B', zone: 'Khu B', roomType: 'Phòng đôi', monthlyFee: 800000 }, contract: { contractId: 'CT005', startDate: '2024-02-15', endDate: '2025-02-15', deposit: 1600000, monthlyFee: 800000, totalPaid: 3200000, remainingAmount: 8000000 }, cancellation: { requestDate: '2024-07-01', reason: 'Chuyển về quê', expectedMoveOutDate: '2024-07-20', refundAmount: 8000000, penaltyFee: 1600000, finalRefundAmount: 6400000 }, status: 'rejected', createdAt: '2024-07-01T11:30:00Z', rejectedAt: '2024-07-02T09:15:00Z', rejectedBy: 'Admin002', rejectionReason: 'Thiếu giấy tờ chứng minh', documents: { hometownDocument: false, moveOutRequest: true, roomConditionReport: false } },
    { id: 'CANCEL006', studentId: 'SV006', studentName: 'Vũ Thị Phương', studentEmail: 'phuong.vu@student.hust.edu.vn', studentPhone: '0963852741', studentIdNumber: '20190006', currentRoom: { roomNumber: 'C302', building: 'Tòa C', zone: 'Khu C', roomType: 'Phòng đơn', monthlyFee: 1200000 }, contract: { contractId: 'CT006', startDate: '2024-03-15', endDate: '2025-03-15', deposit: 2400000, monthlyFee: 1200000, totalPaid: 3600000, remainingAmount: 12000000 }, cancellation: { requestDate: '2024-07-05', reason: 'Tốt nghiệp sớm', expectedMoveOutDate: '2024-07-25', refundAmount: 12000000, penaltyFee: 0, finalRefundAmount: 12000000 }, status: 'pending', createdAt: '2024-07-05T13:45:00Z', documents: { graduationCertificate: true, moveOutRequest: true, roomConditionReport: true } },
    { id: 'CANCEL007', studentId: 'SV007', studentName: 'Đặng Minh Giang', studentEmail: 'giang.dang@student.hust.edu.vn', studentPhone: '0741963852', studentIdNumber: '20190007', currentRoom: { roomNumber: 'A103', building: 'Tòa A', zone: 'Khu A', roomType: 'Phòng đôi', monthlyFee: 800000 }, contract: { contractId: 'CT007', startDate: '2024-04-01', endDate: '2025-03-31', deposit: 1600000, monthlyFee: 800000, totalPaid: 2400000, remainingAmount: 8000000 }, cancellation: { requestDate: '2024-07-08', reason: 'Chuyển trường', expectedMoveOutDate: '2024-08-01', refundAmount: 8000000, penaltyFee: 800000, finalRefundAmount: 7200000 }, status: 'pending', createdAt: '2024-07-08T15:20:00Z', documents: { transferDocument: true, moveOutRequest: true, roomConditionReport: false } },
    { id: 'CANCEL008', studentId: 'SV008', studentName: 'Bùi Thị Hoa', studentEmail: 'hoa.bui@student.hust.edu.vn', studentPhone: '0852741963', studentIdNumber: '20190008', currentRoom: { roomNumber: 'B207', building: 'Tòa B', zone: 'Khu B', roomType: 'Phòng đơn', monthlyFee: 1200000 }, contract: { contractId: 'CT008', startDate: '2024-04-15', endDate: '2025-04-15', deposit: 2400000, monthlyFee: 1200000, totalPaid: 3600000, remainingAmount: 12000000 }, cancellation: { requestDate: '2024-07-10', reason: 'Lý do sức khỏe', expectedMoveOutDate: '2024-08-05', refundAmount: 12000000, penaltyFee: 0, finalRefundAmount: 12000000 }, status: 'pending', createdAt: '2024-07-10T10:15:00Z', documents: { healthCertificate: true, moveOutRequest: true, roomConditionReport: true } }
  ];

  useEffect(() => {
    const loadCancellationRequests = () => {
      try {
        const savedRequests = JSON.parse(localStorage.getItem('cancellationRequests') || '[]');
        const allRequests = [...mockCancellationRequests];
        savedRequests.forEach(savedRequest => { if (!allRequests.find(req => req.id === savedRequest.id)) { allRequests.push(savedRequest); } });
        setCancellationRequests(allRequests);
        setLoading(false);
      } catch (error) {
        console.error('Error loading cancellation requests:', error);
        setCancellationRequests(mockCancellationRequests);
        setLoading(false);
      }
    };
    loadCancellationRequests();
  }, []);

  const filteredRequests = cancellationRequests.filter(request => filterStatus === 'all' ? true : request.status === filterStatus);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleFilterChange = (status) => { setFilterStatus(status); setCurrentPage(1); };
  const handleSelectRequest = (requestId) => { setSelectedRequests(prev => prev.includes(requestId) ? prev.filter(id => id !== requestId) : [...prev, requestId]); };
  const handleSelectAll = () => { if (selectedRequests.length === currentRequests.length) setSelectedRequests([]); else setSelectedRequests(currentRequests.map(req => req.id)); };
  const handleViewDetail = (request) => { setSelectedRequest(request); setShowDetailModal(true); };

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN');
  const getStatusBadge = (status) => {
    const statusConfig = { pending: { text: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' }, approved: { text: 'Đã duyệt', color: 'bg-green-100 text-green-800' }, rejected: { text: 'Từ chối', color: 'bg-red-100 text-red-800' } };
    const config = statusConfig[status] || statusConfig.pending;
    return (<span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.text}</span>);
  };

  const handleApproveSelected = () => {
    if (selectedRequests.length === 0) { alert('Vui lòng chọn ít nhất một đơn để duyệt'); return; }
    const approvedRequests = selectedRequests.map(requestId => {
      const request = cancellationRequests.find(req => req.id === requestId);
      return { ...request, status: 'approved', approvedAt: new Date().toISOString(), approvedBy: user?.id || 'Admin001' };
    });
    const updatedRequests = cancellationRequests.map(request => selectedRequests.includes(request.id) ? { ...request, status: 'approved', approvedAt: new Date().toISOString(), approvedBy: user?.id || 'Admin001' } : request);
    setCancellationRequests(updatedRequests);
    localStorage.setItem('cancellationRequests', JSON.stringify(updatedRequests));
    approvedRequests.forEach(request => {
      const refundBill = { id: `REFUND_${request.id}`, studentId: request.studentId, studentName: request.studentName, studentEmail: request.studentEmail, type: 'refund', amount: request.cancellation.finalRefundAmount, description: `Hoàn tiền hủy phòng - ${request.currentRoom.roomNumber}`, status: 'pending', createdAt: new Date().toISOString(), dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), cancellationRequestId: request.id };
      const existingBills = JSON.parse(localStorage.getItem('bills') || '[]');
      existingBills.push(refundBill);
      localStorage.setItem('bills', JSON.stringify(existingBills));
    });
    alert(`Đã duyệt thành công ${selectedRequests.length} đơn hủy phòng!`);
    setSelectedRequests([]);
  };

  const handleRejectSelected = () => {
    if (selectedRequests.length === 0) { alert('Vui lòng chọn ít nhất một đơn để từ chối'); return; }
    setRejectionTarget('selected');
    setShowRejectionModal(true);
  };

  const handleConfirmRejection = async (reason) => {
    const updatedRequests = cancellationRequests.map(request => selectedRequests.includes(request.id) ? { ...request, status: 'rejected', rejectedAt: new Date().toISOString(), rejectedBy: user?.id || 'Admin001', rejectionReason: reason } : request);
    setCancellationRequests(updatedRequests);
    localStorage.setItem('cancellationRequests', JSON.stringify(updatedRequests));
    alert(`Đã từ chối ${selectedRequests.length} đơn hủy phòng!`);
    setSelectedRequests([]);
  };

  if (loading) {
    return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <PageHeader title="Duyệt đơn hủy phòng KTX" subtitle="Quản lý và duyệt các đơn hủy phòng ký túc xá" showClose={true} onClose={onCancel} />

          {selectedRequests.length > 0 && (
            <div className="flex items-center space-x-4 mb-6 p-4 bg-blue-50 rounded-lg">
              <span className="text-blue-800 font-medium">Đã chọn {selectedRequests.length} đơn</span>
              <Button onClick={handleApproveSelected} variant="success" loading={loading}>Duyệt đã chọn</Button>
              <Button onClick={handleRejectSelected} variant="danger" loading={loading}>Từ chối đã chọn</Button>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <select value={filterStatus} onChange={(e) => handleFilterChange(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="all">Tất cả</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>
            <div className="flex items-center space-x-2"><span className="text-sm text-gray-600">Tổng cộng {filteredRequests.length} đơn</span></div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có đơn hủy phòng</h3>
              <p className="mt-1 text-sm text-gray-500">Hiện tại chưa có đơn hủy phòng nào.</p>
            </div>
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr>
                      <th className="px-6 py-3 text-left"><input type="checkbox" checked={selectedRequests.length === currentRequests.length && currentRequests.length > 0} onChange={handleSelectAll} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sinh viên</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phòng hiện tại</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lý do hủy</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền hoàn</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap"><input type="checkbox" checked={selectedRequests.includes(request.id)} onChange={() => handleSelectRequest(request.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></td>
                          <td className="px-6 py-4 whitespace-nowrap"><div><div className="text-sm font-medium text-gray-900">{request.studentName}</div><div className="text-sm text-gray-500">{request.studentId}</div><div className="text-sm text-gray-500">{request.studentEmail}</div></div></td>
                          <td className="px-6 py-4 whitespace-nowrap"><div><div className="text-sm font-medium text-gray-900">{request.currentRoom.roomNumber}</div><div className="text-sm text-gray-500">{request.currentRoom.building}</div><div className="text-sm text-gray-500">{request.currentRoom.roomType}</div></div></td>
                          <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{request.cancellation.reason}</div><div className="text-sm text-gray-500">Dự kiến: {formatDate(request.cancellation.expectedMoveOutDate)}</div></td>
                          <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{formatCurrency(request.cancellation.finalRefundAmount)}</div>{request.cancellation.penaltyFee > 0 && (<div className="text-sm text-red-500">Phí phạt: {formatCurrency(request.cancellation.penaltyFee)}</div>)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><Button onClick={() => handleViewDetail(request)} variant="link" size="small">Chi tiết</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-6"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} itemsPerPage={itemsPerPage} totalItems={filteredRequests.length} showInfo={true} /></div>
            </>
          )}
        </div>
      </div>

      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-gray-800">Chi tiết đơn hủy phòng</h2><Button onClick={() => setShowDetailModal(false)} variant="ghost" size="small" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg"><h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin sinh viên</h3><div className="space-y-2"><div><span className="font-medium">Họ tên:</span> {selectedRequest.studentName}</div><div><span className="font-medium">Mã SV:</span> {selectedRequest.studentId}</div><div><span className="font-medium">Email:</span> {selectedRequest.studentEmail}</div><div><span className="font-medium">SĐT:</span> {selectedRequest.studentPhone}</div><div><span className="font-medium">MSSV:</span> {selectedRequest.studentIdNumber}</div></div></div>
              <div className="bg-gray-50 p-4 rounded-lg"><h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin phòng</h3><div className="space-y-2"><div><span className="font-medium">Phòng:</span> {selectedRequest.currentRoom.roomNumber}</div><div><span className="font-medium">Tòa:</span> {selectedRequest.currentRoom.building}</div><div><span className="font-medium">Khu:</span> {selectedRequest.currentRoom.zone}</div><div><span className="font-medium">Loại:</span> {selectedRequest.currentRoom.roomType}</div><div><span className="font-medium">Phí/tháng:</span> {formatCurrency(selectedRequest.currentRoom.monthlyFee)}</div></div></div>
              <div className="bg-gray-50 p-4 rounded-lg"><h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin hợp đồng</h3><div className="space-y-2"><div><span className="font-medium">Mã HĐ:</span> {selectedRequest.contract.contractId}</div><div><span className="font-medium">Ngày bắt đầu:</span> {formatDate(selectedRequest.contract.startDate)}</div><div><span className="font-medium">Ngày kết thúc:</span> {formatDate(selectedRequest.contract.endDate)}</div><div><span className="font-medium">Tiền cọc:</span> {formatCurrency(selectedRequest.contract.deposit)}</div><div><span className="font-medium">Đã thanh toán:</span> {formatCurrency(selectedRequest.contract.totalPaid)}</div><div><span className="font-medium">Còn lại:</span> {formatCurrency(selectedRequest.contract.remainingAmount)}</div></div></div>
              <div className="bg-gray-50 p-4 rounded-lg"><h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin hủy phòng</h3><div className="space-y-2"><div><span className="font-medium">Ngày yêu cầu:</span> {formatDate(selectedRequest.cancellation.requestDate)}</div><div><span className="font-medium">Lý do:</span> {selectedRequest.cancellation.reason}</div><div><span className="font-medium">Dự kiến trả phòng:</span> {formatDate(selectedRequest.cancellation.expectedMoveOutDate)}</div><div><span className="font-medium">Số tiền hoàn:</span> {formatCurrency(selectedRequest.cancellation.refundAmount)}</div>{selectedRequest.cancellation.penaltyFee > 0 && (<div><span className="font-medium">Phí phạt:</span> {formatCurrency(selectedRequest.cancellation.penaltyFee)}</div>)}<div><span className="font-medium">Hoàn thực tế:</span> {formatCurrency(selectedRequest.cancellation.finalRefundAmount)}</div></div></div>
              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2"><h3 className="text-lg font-semibold text-gray-800 mb-4">Trạng thái tài liệu</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Object.entries(selectedRequest.documents).map(([doc, status]) => (<div key={doc} className="flex items-center space-x-2"><div className={`w-3 h-3 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`}></div><span className="text-sm">{doc}</span></div>))}</div></div>
              {selectedRequest.status !== 'pending' && (<div className="bg-gray-50 p-4 rounded-lg md:col-span-2"><h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin xử lý</h3><div className="space-y-2">{selectedRequest.status === 'approved' && (<><div><span className="font-medium">Ngày duyệt:</span> {formatDate(selectedRequest.approvedAt)}</div><div><span className="font-medium">Người duyệt:</span> {selectedRequest.approvedBy}</div></>)}{selectedRequest.status === 'rejected' && (<><div><span className="font-medium">Ngày từ chối:</span> {formatDate(selectedRequest.rejectedAt)}</div><div><span className="font-medium">Người từ chối:</span> {selectedRequest.rejectedBy}</div><div><span className="font-medium">Lý do từ chối:</span> {selectedRequest.rejectionReason}</div></>)}</div></div>)}
            </div>
            {selectedRequest.status === 'pending' && (<div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t"><Button onClick={() => { const rejectionReason = prompt('Nhập lý do từ chối:'); if (rejectionReason) { const updatedRequests = cancellationRequests.map(req => req.id === selectedRequest.id ? { ...req, status: 'rejected', rejectedAt: new Date().toISOString(), rejectedBy: user?.id || 'Admin001', rejectionReason } : req); setCancellationRequests(updatedRequests); localStorage.setItem('cancellationRequests', JSON.stringify(updatedRequests)); setShowDetailModal(false); alert('Đã từ chối đơn hủy phòng!'); } }} variant="danger">Từ chối</Button><Button onClick={() => { const updatedRequests = cancellationRequests.map(req => req.id === selectedRequest.id ? { ...req, status: 'approved', approvedAt: new Date().toISOString(), approvedBy: user?.id || 'Admin001' } : req); setCancellationRequests(updatedRequests); localStorage.setItem('cancellationRequests', JSON.stringify(updatedRequests)); const refundBill = { id: `REFUND_${selectedRequest.id}`, studentId: selectedRequest.studentId, studentName: selectedRequest.studentName, studentEmail: selectedRequest.studentEmail, type: 'refund', amount: selectedRequest.cancellation.finalRefundAmount, description: `Hoàn tiền hủy phòng - ${selectedRequest.currentRoom.roomNumber}`, status: 'pending', createdAt: new Date().toISOString(), dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), cancellationRequestId: selectedRequest.id }; const existingBills = JSON.parse(localStorage.getItem('bills') || '[]'); existingBills.push(refundBill); localStorage.setItem('bills', JSON.stringify(existingBills)); setShowDetailModal(false); alert('Đã duyệt đơn hủy phòng thành công!'); }} variant="success">Duyệt</Button></div>)}
          </div>
        </div>
      )}

      <RejectionModal isOpen={showRejectionModal} onClose={() => setShowRejectionModal(false)} onConfirm={handleConfirmRejection} title="Nhập lý do từ chối đơn hủy phòng" />
    </div>
  );
};

export default RoomCancellationApprovalPage;
