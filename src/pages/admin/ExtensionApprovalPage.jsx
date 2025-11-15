import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import RejectionModal from '../../components/modal/RejectionModal';

const ExtensionApprovalPage = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [extensionRequests, setExtensionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filterStatus, setFilterStatus] = useState('all');

  const mockExtensionRequests = [
    { id: 1, studentId: 'SV001', studentName: 'Nguyễn Văn An', studentEmail: 'an.nguyen@student.edu.vn', studentPhone: '0123456789', currentRoom: 'A101', currentBuilding: 'Tòa A', currentZone: 'Khu A', roomType: 'Phòng đôi', currentContractEndDate: '2024-07-15', currentContractId: 'CT2024001', extensionDuration: 6, extensionType: '1-semester', extensionLabel: '1 học kỳ', newEndDate: '2025-01-15', reason: 'Cần thêm thời gian để hoàn thành luận văn tốt nghiệp', requestDate: '2024-05-15T10:30:00Z', status: 'pending', documents: [{ name: 'Giấy xác nhận sinh viên', uploaded: true }, { name: 'CMND/CCCD', uploaded: true }, { name: 'Giấy tờ khác', uploaded: false }], monthlyFee: 1500000, estimatedFee: 9000000, priority: 'normal' },
    { id: 2, studentId: 'SV002', studentName: 'Trần Thị Bình', studentEmail: 'binh.tran@student.edu.vn', studentPhone: '0987654321', currentRoom: 'B205', currentBuilding: 'Tòa B', currentZone: 'Khu B', roomType: 'Phòng đơn', currentContractEndDate: '2024-07-15', currentContractId: 'CT2024002', extensionDuration: 12, extensionType: '1-year', extensionLabel: '1 năm', newEndDate: '2025-07-15', reason: 'Gia đình có hoàn cảnh khó khăn, cần thêm thời gian tìm việc làm', requestDate: '2024-05-20T14:15:00Z', status: 'pending', documents: [{ name: 'Giấy xác nhận sinh viên', uploaded: true }, { name: 'CMND/CCCD', uploaded: true }, { name: 'Giấy tờ khác', uploaded: true }], monthlyFee: 2000000, estimatedFee: 24000000, priority: 'high' },
    { id: 3, studentId: 'SV003', studentName: 'Lê Văn Cường', studentEmail: 'cuong.le@student.edu.vn', studentPhone: '0369852147', currentRoom: 'C301', currentBuilding: 'Tòa C', currentZone: 'Khu C', currentContractEndDate: '2024-08-20', extensionDuration: 12, newEndDate: '2025-08-20', reason: 'Đăng ký học thêm chứng chỉ ngoại ngữ, cần ở lại KTX', requestDate: '2024-05-25T09:45:00Z', status: 'pending', documents: [{ name: 'Giấy xác nhận sinh viên', uploaded: true }, { name: 'CMND/CCCD', uploaded: true }, { name: 'Giấy tờ khác', uploaded: true }], estimatedFee: 3600000, priority: 'normal' },
    { id: 4, studentId: 'SV004', studentName: 'Phạm Thị Dung', studentEmail: 'dung.pham@student.edu.vn', studentPhone: '0741258963', currentRoom: 'A205', currentBuilding: 'Tòa A', currentZone: 'Khu A', currentContractEndDate: '2024-09-10', extensionDuration: 4, newEndDate: '2025-01-10', reason: 'Tham gia dự án nghiên cứu khoa học, cần ở lại để hoàn thành', requestDate: '2024-05-28T16:20:00Z', status: 'pending', documents: [{ name: 'Giấy xác nhận sinh viên', uploaded: true }, { name: 'CMND/CCCD', uploaded: true }, { name: 'Giấy tờ khác', uploaded: true }], estimatedFee: 1200000, priority: 'urgent' },
    { id: 5, studentId: 'SV005', studentName: 'Hoàng Văn Em', studentEmail: 'em.hoang@student.edu.vn', studentPhone: '0852147369', currentRoom: 'B301', currentBuilding: 'Tòa B', currentZone: 'Khu B', roomType: 'Phòng đơn', currentContractEndDate: '2024-08-15', currentContractId: 'CT2024005', extensionDuration: 6, extensionType: '1-semester', extensionLabel: '1 học kỳ', newEndDate: '2025-02-15', reason: 'Cần thêm thời gian để hoàn thành đồ án tốt nghiệp', requestDate: '2024-05-30T11:30:00Z', status: 'pending', documents: [{ name: 'Giấy xác nhận sinh viên', uploaded: true }, { name: 'CMND/CCCD', uploaded: true }, { name: 'Giấy tờ khác', uploaded: false }], monthlyFee: 2000000, estimatedFee: 12000000, priority: 'normal' },
    { id: 6, studentId: 'SV006', studentName: 'Vũ Thị Phương', studentEmail: 'phuong.vu@student.edu.vn', studentPhone: '0963258741', currentRoom: 'C102', currentBuilding: 'Tòa C', currentZone: 'Khu C', roomType: 'Phòng đôi', currentContractEndDate: '2024-10-20', currentContractId: 'CT2024006', extensionDuration: 12, extensionType: '1-year', extensionLabel: '1 năm', newEndDate: '2025-10-20', reason: 'Đăng ký học thêm chứng chỉ tiếng Anh và tin học', requestDate: '2024-06-01T09:15:00Z', status: 'pending', documents: [{ name: 'Giấy xác nhận sinh viên', uploaded: true }, { name: 'CMND/CCCD', uploaded: true }, { name: 'Giấy tờ khác', uploaded: true }], monthlyFee: 1500000, estimatedFee: 18000000, priority: 'high' },
    { id: 7, studentId: 'SV007', studentName: 'Đặng Văn Giang', studentEmail: 'giang.dang@student.edu.vn', studentPhone: '0789456123', currentRoom: 'A308', currentBuilding: 'Tòa A', currentZone: 'Khu A', roomType: 'Phòng đơn', currentContractEndDate: '2024-11-30', currentContractId: 'CT2024007', extensionDuration: 3, extensionType: 'custom', extensionLabel: '3 tháng', newEndDate: '2025-02-28', reason: 'Gia đình có hoàn cảnh khó khăn, cần thêm thời gian tìm việc làm', requestDate: '2024-06-02T14:45:00Z', status: 'pending', documents: [{ name: 'Giấy xác nhận sinh viên', uploaded: true }, { name: 'CMND/CCCD', uploaded: true }, { name: 'Giấy tờ khác', uploaded: true }], monthlyFee: 2000000, estimatedFee: 6000000, priority: 'high' },
    { id: 8, studentId: 'SV008', studentName: 'Ngô Thị Hoa', studentEmail: 'hoa.ngo@student.edu.vn', studentPhone: '0912345678', currentRoom: 'B405', currentBuilding: 'Tòa B', currentZone: 'Khu B', roomType: 'Phòng đôi', currentContractEndDate: '2024-12-15', currentContractId: 'CT2024008', extensionDuration: 24, extensionType: '2-years', extensionLabel: '2 năm', newEndDate: '2026-12-15', reason: 'Tham gia chương trình học bổng nghiên cứu sinh, cần ở lại KTX', requestDate: '2024-06-03T16:20:00Z', status: 'pending', documents: [{ name: 'Giấy xác nhận sinh viên', uploaded: true }, { name: 'CMND/CCCD', uploaded: true }, { name: 'Giấy tờ khác', uploaded: true }], monthlyFee: 1500000, estimatedFee: 36000000, priority: 'urgent' },
    { id: 9, studentId: 'SV009', studentName: 'Lý Văn Khoa', studentEmail: 'khoa.ly@student.edu.vn', studentPhone: '0823456789', currentRoom: 'C203', currentBuilding: 'Tòa C', currentZone: 'Khu C', roomType: 'Phòng đơn', currentContractEndDate: '2025-01-10', currentContractId: 'CT2024009', extensionDuration: 6, extensionType: '1-semester', extensionLabel: '1 học kỳ', newEndDate: '2025-07-10', reason: 'Cần thêm thời gian để hoàn thành luận văn thạc sĩ', requestDate: '2024-06-04T10:30:00Z', status: 'pending', documents: [{ name: 'Giấy xác nhận sinh viên', uploaded: true }, { name: 'CMND/CCCD', uploaded: true }, { name: 'Giấy tờ khác', uploaded: false }], monthlyFee: 2000000, estimatedFee: 12000000, priority: 'normal' },
    { id: 10, studentId: 'SV010', studentName: 'Trịnh Thị Lan', studentEmail: 'lan.trinh@student.edu.vn', studentPhone: '0934567890', currentRoom: 'A501', currentBuilding: 'Tòa A', currentZone: 'Khu A', roomType: 'Phòng đôi', currentContractEndDate: '2025-02-28', currentContractId: 'CT2024010', extensionDuration: 12, extensionType: '1-year', extensionLabel: '1 năm', newEndDate: '2026-02-28', reason: 'Đăng ký học thêm chứng chỉ quốc tế và chuẩn bị du học', requestDate: '2024-06-05T13:15:00Z', status: 'pending', documents: [{ name: 'Giấy xác nhận sinh viên', uploaded: true }, { name: 'CMND/CCCD', uploaded: true }, { name: 'Giấy tờ khác', uploaded: true }], monthlyFee: 1500000, estimatedFee: 18000000, priority: 'high' },
    { id: 11, studentId: 'SV011', studentName: 'Bùi Văn Minh', studentEmail: 'minh.bui@student.edu.vn', studentPhone: '0845678901', currentRoom: 'B506', currentBuilding: 'Tòa B', currentZone: 'Khu B', roomType: 'Phòng đơn', currentContractEndDate: '2025-03-15', currentContractId: 'CT2024011', extensionDuration: 4, extensionType: 'custom', extensionLabel: '4 tháng', newEndDate: '2025-07-15', reason: 'Tham gia dự án khởi nghiệp, cần ở lại để phát triển sản phẩm', requestDate: '2024-06-06T15:45:00Z', status: 'pending', documents: [{ name: 'Giấy xác nhận sinh viên', uploaded: true }, { name: 'CMND/CCCD', uploaded: true }, { name: 'Giấy tờ khác', uploaded: true }], monthlyFee: 2000000, estimatedFee: 8000000, priority: 'urgent' },
    { id: 12, studentId: 'SV012', studentName: 'Đỗ Thị Nga', studentEmail: 'nga.do@student.edu.vn', studentPhone: '0956789012', currentRoom: 'C304', currentBuilding: 'Tòa C', currentZone: 'Khu C', roomType: 'Phòng đôi', currentContractEndDate: '2025-04-20', currentContractId: 'CT2024012', extensionDuration: 6, extensionType: '1-semester', extensionLabel: '1 học kỳ', newEndDate: '2025-10-20', reason: 'Cần thêm thời gian để hoàn thành đồ án tốt nghiệp và tìm việc làm', requestDate: '2024-06-07T11:20:00Z', status: 'pending', documents: [{ name: 'Giấy xác nhận sinh viên', uploaded: true }, { name: 'CMND/CCCD', uploaded: true }, { name: 'Giấy tờ khác', uploaded: false }], monthlyFee: 1500000, estimatedFee: 9000000, priority: 'normal' }
  ];

  useEffect(() => {
    const savedRequests = JSON.parse(localStorage.getItem('extensionRequests') || '[]');
    const allRequests = [...savedRequests, ...mockExtensionRequests];
    const uniqueRequests = allRequests.filter((request, index, self) =>
      index === self.findIndex(r => r.studentId === request.studentId && r.requestDate === request.requestDate)
    );
    setExtensionRequests(uniqueRequests);
    setLoading(false);
  }, []);

  const filteredRequests = extensionRequests.filter(request => {
    if (filterStatus === 'all') return true;
    return request.status === filterStatus;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedRequests([]);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
    setSelectedRequests([]);
  };

  const handleSelectRequest = (requestId) => {
    setSelectedRequests(prev => prev.includes(requestId) ? prev.filter(id => id !== requestId) : [...prev, requestId]);
  };

  const handleSelectAll = () => {
    if (selectedRequests.length === extensionRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(extensionRequests.map(req => req.id));
    }
  };

  const handleViewDetail = (request) => {
    setSelectedRequestDetail(request);
    setShowDetailModal(true);
  };

  const handleApproveRequests = async () => {
    if (selectedRequests.length === 0) {
      setError('Vui lòng chọn ít nhất một đơn để duyệt');
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const updatedRequests = extensionRequests.map(request => {
        if (selectedRequests.includes(request.id)) {
          return { ...request, status: 'approved', approvedBy: user.name, approvedAt: new Date().toISOString(), approvedByUserId: user.id };
        }
        return request;
      });
      const approvedRequests = updatedRequests.filter(req => selectedRequests.includes(req.id));
      const newBills = approvedRequests.map(request => ({
        id: `BILL_EXT_${request.id}_${Date.now()}`,
        userId: request.studentId,
        userName: request.studentName,
        userEmail: request.studentEmail,
        type: 'extension_fee',
        description: `Phí gia hạn KTX - ${request.extensionDuration} tháng`,
        amount: request.estimatedFee,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'unpaid',
        createdAt: new Date().toISOString(),
        extensionRequestId: request.id,
        extensionDuration: request.extensionDuration,
        newEndDate: request.newEndDate
      }));
      const existingBills = JSON.parse(localStorage.getItem('bills') || '[]');
      const updatedBills = [...existingBills, ...newBills];
      localStorage.setItem('bills', JSON.stringify(updatedBills));
      localStorage.setItem('extensionRequests', JSON.stringify(updatedRequests));
      setExtensionRequests(updatedRequests);
      setSelectedRequests([]);
      setSuccess(`Đã duyệt thành công ${selectedRequests.length} đơn gia hạn và tạo hóa đơn thanh toán!`);
    } catch (error) {
      setError('Có lỗi xảy ra khi duyệt đơn. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequests = async () => {
    if (selectedRequests.length === 0) {
      setError('Vui lòng chọn ít nhất một đơn để từ chối');
      return;
    }
    setRejectionTarget('selected');
    setShowRejectionModal(true);
  };

  const handleConfirmRejection = async (reason) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const updatedRequests = extensionRequests.map(request => {
        if (selectedRequests.includes(request.id)) {
          return { ...request, status: 'rejected', rejectedBy: user.name, rejectedAt: new Date().toISOString(), rejectedByUserId: user.id, rejectionReason: reason };
        }
        return request;
      });
      localStorage.setItem('extensionRequests', JSON.stringify(updatedRequests));
      setExtensionRequests(updatedRequests);
      setSelectedRequests([]);
      setSuccess(`Đã từ chối ${selectedRequests.length} đơn gia hạn!`);
    } catch (error) {
      setError('Có lỗi xảy ra khi từ chối đơn. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const getPriorityColor = (priority) => priority === 'urgent' ? 'text-red-600 bg-red-100' : priority === 'high' ? 'text-orange-600 bg-orange-100' : 'text-blue-600 bg-blue-100';
  const getPriorityText = (priority) => priority === 'urgent' ? 'Khẩn cấp' : priority === 'high' ? 'Cao' : 'Bình thường';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Duyệt đơn gia hạn KTX</h1>
              <p className="text-gray-600 mt-1">Quản lý và duyệt các đơn gia hạn ký túc xá của sinh viên</p>
            </div>
            <Button onClick={onCancel} variant="ghost" size="small" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} />
          </div>

          {error && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>)}
          {success && (<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">{success}</div>)}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg"><div className="flex items-center"><div className="p-2 bg-blue-100 rounded-lg"><svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div><div className="ml-4"><p className="text-sm font-medium text-blue-600">Tổng đơn</p><p className="text-2xl font-bold text-blue-900">{extensionRequests.length}</p></div></div></div>
            <div className="bg-yellow-50 p-4 rounded-lg"><div className="flex items-center"><div className="p-2 bg-yellow-100 rounded-lg"><svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><div className="ml-4"><p className="text-sm font-medium text-yellow-600">Chờ duyệt</p><p className="text-2xl font-bold text-yellow-900">{extensionRequests.filter(req => req.status === 'pending').length}</p></div></div></div>
            <div className="bg-green-50 p-4 rounded-lg"><div className="flex items-center"><div className="p-2 bg-green-100 rounded-lg"><svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div><div className="ml-4"><p className="text-sm font-medium text-green-600">Đã duyệt</p><p className="text-2xl font-bold text-green-900">{extensionRequests.filter(req => req.status === 'approved').length}</p></div></div></div>
            <div className="bg-red-50 p-4 rounded-lg"><div className="flex items-center"><div className="p-2 bg-red-100 rounded-lg"><svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></div><div className="ml-4"><p className="text-sm font-medium text-red-600">Từ chối</p><p className="text-2xl font-bold text-red-900">{extensionRequests.filter(req => req.status === 'rejected').length}</p></div></div></div>
          </div>

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

          {selectedRequests.length > 0 && (
            <div className="flex items-center space-x-4 mb-6 p-4 bg-blue-50 rounded-lg">
              <span className="text-blue-800 font-medium">Đã chọn {selectedRequests.length} đơn</span>
              <Button onClick={handleApproveRequests} variant="success" loading={actionLoading} loadingText="Đang duyệt...">Duyệt đã chọn</Button>
              <Button onClick={handleRejectRequests} variant="danger" loading={actionLoading} loadingText="Đang từ chối...">Từ chối đã chọn</Button>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr>
                  <th className="px-6 py-3 text-left"><input type="checkbox" checked={selectedRequests.length === currentRequests.length && currentRequests.length > 0} onChange={handleSelectAll} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sinh viên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phòng hiện tại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian gia hạn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phí dự kiến</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đăng ký</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap"><input type="checkbox" checked={selectedRequests.includes(request.id)} onChange={() => handleSelectRequest(request.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div><div className="text-sm font-medium text-gray-900">{request.studentName}</div><div className="text-sm text-gray-500">{request.studentId}</div><div className="text-sm text-gray-500">{request.studentEmail}</div></div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div><div className="text-sm font-medium text-gray-900">{request.currentRoom}</div><div className="text-sm text-gray-500">{request.currentBuilding}</div><div className="text-sm text-gray-500">Hết hạn: {formatDate(request.currentContractEndDate)}</div></div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div><div className="text-sm font-medium text-gray-900">{request.extensionDuration} tháng</div><div className="text-sm text-gray-500">Đến: {formatDate(request.newEndDate)}</div></div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{formatCurrency(request.estimatedFee)}</div><div className="text-sm text-gray-500">{request.extensionLabel}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{formatDate(request.requestDate)}</div><div className="text-sm text-gray-500"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>{getPriorityText(request.priority)}</span></div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 rounded-full text-xs font-medium ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : request.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{request.status === 'pending' ? 'Chờ duyệt' : request.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><button onClick={() => handleViewDetail(request)} className="text-blue-600 hover:text-blue-900 mr-3">Chi tiết</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} itemsPerPage={itemsPerPage} totalItems={filteredRequests.length} showInfo={true} />
          </div>
        </div>
      </div>

      {showDetailModal && selectedRequestDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Chi tiết đơn gia hạn</h2>
              <Button onClick={() => setShowDetailModal(false)} variant="ghost" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">Sinh viên</label><p className="text-gray-900">{selectedRequestDetail.studentName} ({selectedRequestDetail.studentId})</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Email</label><p className="text-gray-900">{selectedRequestDetail.studentEmail}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Số điện thoại</label><p className="text-gray-900">{selectedRequestDetail.studentPhone}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Phòng hiện tại</label><p className="text-gray-900">{selectedRequestDetail.currentRoom} - {selectedRequestDetail.currentBuilding} ({selectedRequestDetail.roomType})</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Mã hợp đồng</label><p className="text-gray-900">{selectedRequestDetail.currentContractId}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Hết hạn hiện tại</label><p className="text-gray-900">{formatDate(selectedRequestDetail.currentContractEndDate)}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Thời gian gia hạn</label><p className="text-gray-900">{selectedRequestDetail.extensionDuration} tháng ({selectedRequestDetail.extensionLabel})</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Phí hàng tháng</label><p className="text-gray-900">{formatCurrency(selectedRequestDetail.monthlyFee)}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Hết hạn mới</label><p className="text-gray-900">{formatDate(selectedRequestDetail.newEndDate)}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Phí dự kiến</label><p className="text-gray-900 font-semibold">{formatCurrency(selectedRequestDetail.estimatedFee)}</p></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lý do gia hạn</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequestDetail.reason}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tài liệu đính kèm</label>
                <div className="space-y-2">
                  {selectedRequestDetail.documents.map((doc, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${doc.uploaded ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-sm text-gray-700">{doc.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${doc.uploaded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{doc.uploaded ? 'Đã tải lên' : 'Chưa tải lên'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button onClick={() => setShowDetailModal(false)} variant="outline">Đóng</Button>
            </div>
          </div>
        </div>
      )}

      <RejectionModal isOpen={showRejectionModal} onClose={() => setShowRejectionModal(false)} onConfirm={handleConfirmRejection} title="Nhập lý do từ chối đơn gia hạn" />
    </div>
  );
};

export default ExtensionApprovalPage;
