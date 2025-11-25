import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import { buildingApi, healthCheckApi } from "../../api";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import PageLayout from "../../components/layout/PageLayout";
import LoadingState from "../../components/ui/LoadingState";
import Pagination from "../../components/ui/Pagination";
import BaseModal, { ModalBody } from "../../components/modal/BaseModal";

// Parse backend date format (dd-mm-yyyy HH:mm:ss) to Date object
const parseBackendDate = (dateString) => {
    // Handle null, undefined, empty string, or "-"
    if (!dateString || dateString === "-" || dateString === "null" || dateString === "undefined") {
        return null;
    }
    
    // Ensure it's a string
    const str = String(dateString).trim();
    if (!str || str === "-") {
        return null;
    }
    
    try {
        // Backend format: "dd-mm-yyyy HH:mm:ss" (e.g., "01-11-2025 20:22:00")
        // Try parsing backend format first since that's what backend returns
        const backendFormatMatch = str.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
        if (backendFormatMatch) {
            const [, day, month, year, hours, minutes] = backendFormatMatch;
            // Validate date components
            const dayNum = parseInt(day, 10);
            const monthNum = parseInt(month, 10);
            const yearNum = parseInt(year, 10);
            const hoursNum = parseInt(hours, 10);
            const minutesNum = parseInt(minutes, 10);
            
            if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || 
                hoursNum > 23 || minutesNum > 59 || minutesNum < 0) {
                console.warn("Invalid date components:", { day, month, year, hours, minutes });
                return null;
            }
            
            // Create date in local timezone: YYYY-MM-DDTHH:mm:ss
            const dateStr = `${year}-${month}-${day}T${hours}:${minutes}:00`;
            const date = new Date(dateStr);
            
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        // Fallback: Try parsing as ISO string or any other format
        const date = new Date(str);
        if (!isNaN(date.getTime())) {
            return date;
        }
        
        return null;
    } catch (e) {
        console.error("Error parsing date:", dateString, e);
        return null;
    }
};

// Format date to Vietnamese format (dd/mm/yyyy HH:mm)
const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
        const date = parseBackendDate(dateString);
        if (!date || isNaN(date.getTime())) {
            return "-";
        }
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
        return "-";
    }
};

// Helper function to get status display
const getStatusDisplay = (status) => {
    switch (status) {
        case 'active':
            return { text: 'Hoạt động', className: 'bg-green-100 text-green-800 border-green-200' };
        case 'inactive':
            return { text: 'Tạm dừng', className: 'bg-gray-100 text-gray-800 border-gray-200' };
        default:
            return { text: status || 'Chưa xác định', className: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
};

// HealthCheckCard component
const HealthCheckCard = ({ healthCheck, onViewDetail, onEdit, onDelete }) => {
    const statusDisplay = getStatusDisplay(healthCheck.status);
    
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            {/* Header: tiêu đề và trạng thái */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{healthCheck.title}</h3>
                    <p className="text-sm text-gray-500">{healthCheck.buildingName || 'Chưa xác định'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                    {statusDisplay.text}
                </span>
            </div>

            {/* Nội dung */}
            <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Thời gian:</span>
                    <span className="text-sm font-medium">{formatDate(healthCheck.startDate)} → {formatDate(healthCheck.endDate)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sức chứa:</span>
                    <span className="text-sm font-medium">{healthCheck.registeredCount}/{healthCheck.capacity}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phí:</span>
                    <span className="text-sm font-medium text-green-600">
                        {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            minimumFractionDigits: 0,
                        }).format(healthCheck.price)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Đăng ký:</span>
                    <span className="text-sm font-medium">{formatDate(healthCheck.registrationStartDate)} → {formatDate(healthCheck.registrationEndDate)}</span>
                </div>
            </div>

            {/* Hàng nút hành động */}
            <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex space-x-2">
                    <Button
                        onClick={() => onViewDetail(healthCheck)}
                        variant="outline"
                        size="small"
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                        Chi tiết
                    </Button>
                    <Button
                        onClick={() => onEdit(healthCheck)}
                        variant="outline"
                        size="small"
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200"
                    >
                        Sửa
                    </Button>
                    <Button
                        onClick={() => onDelete(healthCheck)}
                        variant="outline"
                        size="small"
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200"
                    >
                        Xóa
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Main component
const HealthCheckUpManagementPage = ({ onSuccess, onCancel }) => {
    const navigate = useNavigate();
    const { showError, showSuccess } = useNotification();

    // View state: 'list' or 'form'
    const [currentView, setCurrentView] = useState('list');
    const [selectedHealthCheck, setSelectedHealthCheck] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedHealthCheckDetail, setSelectedHealthCheckDetail] = useState(null);

    // List view state
    const [healthChecks, setHealthChecks] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState(""); // "" = all, "active", "inactive"
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);
    const [totalItems, setTotalItems] = useState(0);

    // Form view state
    const [formLoading, setFormLoading] = useState(false);
    const [buildings, setBuildings] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [formData, setFormData] = useState({
        buildingId: "",
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        registrationStartDate: "",
        registrationEndDate: "",
        capacity: "",
        price: "",
        status: "active",
    });

    // Load danh sách tòa nhà
    useEffect(() => {
        const fetchBuildings = async () => {
            try {
                const res = await buildingApi.getBuilding();
                if (res.success) setBuildings(res.data);
            } catch (err) {
                showError(err?.response?.data?.message || "Không tải được danh sách tòa nhà");
            }
        };
        fetchBuildings();
    }, []);

    // Fetch health checks
    const fetchHealthChecks = async (status = null, page = 1) => {
        try {
            setListLoading(true);
            const params = {
                page: page,
                limit: itemsPerPage,
            };
            if (status) {
                params.status = status;
            }
            const response = await healthCheckApi.getHealthChecks(params);
            if (response.success && response.data) {
                setHealthChecks(response.data);
                // Get totalItems from response metadata
                if (response.metadata && response.metadata.totalItems !== undefined) {
                    setTotalItems(response.metadata.totalItems);
                }
            }
        } catch (err) {
            console.log(err.response?.data?.message || err.message);
            showError(err?.response?.data?.message || "Lỗi khi tải dữ liệu");
        } finally {
            setListLoading(false);
        }
    };

    // Load health checks when in list view, status filter, or page changes
    useEffect(() => {
        if (currentView === 'list') {
            fetchHealthChecks(statusFilter || null, currentPage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentView, statusFilter, currentPage]);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    // Convert backend date string (dd-mm-yyyy HH:mm:ss) to datetime-local format (YYYY-MM-DDTHH:mm)
    // Returns undefined (not empty string) for invalid values to avoid "value contains an invalid value" error
    const toDateTimeLocal = (dateString) => {
        // Handle null, undefined, empty, or "-"
        if (!dateString || dateString === "-" || dateString === "null" || dateString === "undefined") {
            return undefined; // Return undefined instead of "" for datetime-local inputs
        }
        
        try {
            const date = parseBackendDate(dateString);
            if (!date || isNaN(date.getTime())) {
                // Don't log warning for empty values, only for invalid formats
                if (dateString && dateString.trim() !== "" && dateString !== "-") {
                    console.warn("Invalid date string for datetime-local:", dateString);
                }
                return undefined; // Return undefined instead of ""
            }
            
            // Get local date components (not UTC)
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            
            const result = `${year}-${month}-${day}T${hours}:${minutes}`;
            
            // Validate the result format (YYYY-MM-DDTHH:mm)
            if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(result)) {
                console.warn("Invalid datetime-local format generated:", result, "from:", dateString);
                return undefined; // Return undefined instead of ""
            }
            
            return result;
        } catch (e) {
            console.error("Error converting date to datetime-local:", dateString, e);
            return undefined; // Return undefined instead of ""
        }
    };

    // Handle edit - switch to form view
    const handleEdit = (healthCheck) => {
        setSelectedHealthCheck(healthCheck);
        // Convert dates - toDateTimeLocal returns undefined for invalid values
        // Use undefined (not empty string) for datetime-local inputs to avoid "value contains an invalid value" error
        const startDateValue = toDateTimeLocal(healthCheck?.startDate);
        const endDateValue = toDateTimeLocal(healthCheck?.endDate);
        const regStartDateValue = toDateTimeLocal(healthCheck?.registrationStartDate);
        const regEndDateValue = toDateTimeLocal(healthCheck?.registrationEndDate);
        
        // Log for debugging
        console.log("Editing health check:", {
            rawData: healthCheck,
            startDate: healthCheck?.startDate,
            startDateValue,
            endDate: healthCheck?.endDate,
            endDateValue,
            registrationStartDate: healthCheck?.registrationStartDate,
            regStartDateValue,
            registrationEndDate: healthCheck?.registrationEndDate,
            regEndDateValue
        });
        
        setFormData({
            buildingId: healthCheck?.buildingId || "",
            title: healthCheck?.title || "",
            description: healthCheck?.description || "",
            // For datetime-local, use undefined (not empty string) to avoid "value contains an invalid value" error
            startDate: startDateValue || undefined,
            endDate: endDateValue || undefined,
            registrationStartDate: regStartDateValue || undefined,
            registrationEndDate: regEndDateValue || undefined,
            capacity: healthCheck?.capacity || "",
            price: healthCheck?.price ? String(Math.floor(healthCheck.price)) : "",
            status: healthCheck?.status || "active",
        });
        setCurrentView('form');
    };

    // Handle create - switch to form view
    const handleCreate = () => {
        setSelectedHealthCheck(null);
        setFormData({
            buildingId: "",
            title: "",
            description: "",
            startDate: "",
            endDate: "",
            registrationStartDate: "",
            registrationEndDate: "",
            capacity: "",
            price: "",
            status: "active",
        });
        setValidationErrors({});
        setCurrentView('form');
    };

    // Handle view detail
    const handleViewDetail = async (healthCheck) => {
        try {
            setListLoading(true);
            const response = await healthCheckApi.getHealthCheckById(healthCheck.id);
            if (response.success && response.data) {
                setSelectedHealthCheckDetail(response.data);
                setShowDetailModal(true);
            }
        } catch (err) {
            showError(err?.response?.data?.message || "Lỗi khi tải chi tiết đợt khám");
            console.error(err);
        } finally {
            setListLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async (healthCheck) => {
        try {
            setListLoading(true);
            const res = await healthCheckApi.deleteHealthCheck(healthCheck.id);
            if (res.success) {
                showSuccess("Xóa đợt khám thành công!");
                // After delete, if no status filter, default to showing only active items
                // If there's a status filter, keep it
                const filterToUse = statusFilter || null;
                // If we're on a page that might now be empty, go to page 1
                const pageToUse = currentPage;
                fetchHealthChecks(filterToUse, pageToUse);
            }
        } catch (err) {
            showError(err?.response?.data?.message || "Lỗi khi xóa đợt khám");
            console.error(err);
        } finally {
            setListLoading(false);
        }
    };

    // Handle back to list
    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedHealthCheck(null);
        setValidationErrors({});
    };

    // Handle cancel - go back to admin page
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            navigate("/admin");
        }
    };

    // Convert datetime-local -> ISO UTC
    const toISOStringWithOffset = (localString) => {
        if (!localString) return null;
        const date = new Date(localString);
        return new Date(date.getTime()).toISOString();
    };

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // For price field, ensure only integer values (remove decimals and commas)
        if (name === 'price') {
            // Remove commas, dots (except for decimal separator), and ensure integer
            const cleanedValue = value.replace(/[^\d]/g, '');
            setFormData((prev) => ({ ...prev, [name]: cleanedValue }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            buildingId: formData.buildingId,
            title: formData.title.trim(),
            description: formData.description.trim(),
            startDate: toISOStringWithOffset(formData.startDate),
            endDate: toISOStringWithOffset(formData.endDate),
            registrationStartDate: toISOStringWithOffset(formData.registrationStartDate),
            registrationEndDate: toISOStringWithOffset(formData.registrationEndDate),
            capacity: Number(formData.capacity),
            price: parseInt(formData.price, 10) || 0, // Ensure integer
            status: formData.status,
        };

        if (selectedHealthCheck?.id) payload.healthCheckId = selectedHealthCheck.id;

        try {
            setFormLoading(true);
            const res = selectedHealthCheck?.id
                ? await healthCheckApi.updateHealthCheck(payload)
                : await healthCheckApi.createHealthCheck(payload);

            if (res.success) {
                const successMessage = res.message || res.data?.message || `Đợt khám ${selectedHealthCheck?.id ? "cập nhật" : "tạo"} thành công!`;
                showSuccess(successMessage);
                setTimeout(() => {
                    handleBackToList();
                }, 1500);
            }
        } catch (err) {
            showError(err?.response?.data?.message || "Lỗi khi tạo hoặc sửa đợt khám");
            console.error(err);
        } finally {
            setFormLoading(false);
        }
    };

    // Format tiền VN
    const formatCurrency = (amount) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            minimumFractionDigits: 0,
        }).format(amount);

    // Pagination calculations using backend totalItems
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Detail Modal
    const renderDetailModal = () => {
        if (!selectedHealthCheckDetail) return null;

        const hc = selectedHealthCheckDetail;
        const statusDisplay = getStatusDisplay(hc.status);

        return (
            <BaseModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Chi tiết đợt khám sức khỏe"
                size="xlarge"
                closeOnOverlayClick={true}
                className="max-h-[105vh] overflow-y-auto"
                zIndex={60}
            >
                <ModalBody className="max-h-[calc(105vh-200px)] overflow-y-auto">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Thông tin cơ bản</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tên đợt khám</label>
                                    <p className="text-gray-900">{hc.title}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tòa nhà</label>
                                    <p className="text-gray-900">{hc.buildingName || 'Chưa xác định'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                                    <p className="text-gray-900">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                                            {statusDisplay.text}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sức chứa</label>
                                    <p className="text-gray-900">{hc.registeredCount}/{hc.capacity}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phí</label>
                                    <p className="text-gray-900 text-green-600">
                                        {new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                            minimumFractionDigits: 0,
                                        }).format(hc.price)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Thời gian</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Thời gian khám</label>
                                    <p className="text-gray-900">
                                        {formatDate(hc.startDate)} → {formatDate(hc.endDate)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Thời gian đăng ký</label>
                                    <p className="text-gray-900">
                                        {formatDate(hc.registrationStartDate)} → {formatDate(hc.registrationEndDate)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Mô tả</h3>
                            <p className="text-gray-900 whitespace-pre-wrap">
                                {hc.description || 'Không có mô tả'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        <Button onClick={() => setShowDetailModal(false)} variant="outline">
                            Đóng
                        </Button>
                    </div>
                </ModalBody>
            </BaseModal>
        );
    };

    // Render list view
    if (currentView === 'list') {
        return (
            <>
                {renderDetailModal()}
                <PageLayout
                title="Quản lý đợt khám sức khỏe"
                subtitle="Quản lý các đợt khám sức khỏe cho sinh viên"
                showClose={true}
                onClose={handleCancel}
                headerActions={
                    <Button
                        variant="primary"
                        size="small"
                        onClick={handleCreate}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        }
                    >
                        Thêm đợt khám mới
                    </Button>
                }
            >
                {/* Filter section */}
                <div className="mt-6 mb-4">
                    <div className="w-32">
                        <Select
                            name="statusFilter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Tất cả</option>
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Tạm dừng</option>
                        </Select>
                    </div>
                </div>

                <LoadingState
                    isLoading={listLoading}
                    isEmpty={!listLoading && healthChecks.length === 0}
                    emptyState={
                        <div className="text-center text-gray-500 mt-8">
                            {statusFilter 
                                ? `Không có đợt khám nào với trạng thái "${getStatusDisplay(statusFilter).text}".`
                                : "Không có đợt khám sức khỏe nào."
                            }
                        </div>
                    }
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {healthChecks.map((hc) => (
                            <HealthCheckCard
                                key={hc.id}
                                healthCheck={hc}
                                onViewDetail={handleViewDetail}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                itemsPerPage={itemsPerPage}
                                totalItems={totalItems}
                                showInfo={true}
                            />
                        </div>
                    )}
                </LoadingState>
            </PageLayout>
            </>
        );
    }

    // Render form view
    return (
        <>
            {renderDetailModal()}
            <PageLayout
                title={selectedHealthCheck ? "Chỉnh sửa đợt khám" : "Tạo đợt khám sức khỏe"}
                subtitle={selectedHealthCheck ? "Cập nhật thông tin đợt khám sức khỏe" : "Tạo mới đợt khám sức khỏe cho sinh viên"}
                showBack={true}
                backText="Quay lại"
                onBack={handleBackToList}
            >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tên đợt khám */}
                    <Input
                        label="Tên đợt khám"
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="VD: Khám sức khỏe học kỳ 1"
                        required
                        error={validationErrors.title}
                    />

                    {/* Tòa nhà */}
                    <Select
                        label="Tòa nhà"
                        name="buildingId"
                        value={formData.buildingId}
                        onChange={handleInputChange}
                        placeholder="Chọn tòa nhà"
                        required
                        error={validationErrors.buildingId}
                    >
                        <option value="">Chọn tòa nhà</option>
                        {buildings.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </Select>

                    {/* Mô tả */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mô tả <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-md placeholder-gray-400
                                focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors sm:text-sm
                                ${validationErrors.description 
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                } bg-white`}
                            placeholder="Mô tả chi tiết về đợt khám..."
                        />
                        {validationErrors.description && (
                            <p className="mt-1 text-sm text-red-600" role="alert">
                                {validationErrors.description}
                            </p>
                        )}
                    </div>

                    {/* Ngày bắt đầu */}
                    <Input
                        label="Ngày bắt đầu"
                        name="startDate"
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                        error={validationErrors.startDate}
                    />

                    {/* Ngày kết thúc */}
                    <Input
                        label="Ngày kết thúc"
                        name="endDate"
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                        error={validationErrors.endDate}
                    />

                    {/* Ngày bắt đầu đăng ký */}
                    <Input
                        label="Ngày bắt đầu đăng ký"
                        name="registrationStartDate"
                        type="datetime-local"
                        value={formData.registrationStartDate}
                        onChange={handleInputChange}
                        required
                        error={validationErrors.registrationStartDate}
                    />

                    {/* Ngày kết thúc đăng ký */}
                    <Input
                        label="Ngày kết thúc đăng ký"
                        name="registrationEndDate"
                        type="datetime-local"
                        value={formData.registrationEndDate}
                        onChange={handleInputChange}
                        required
                        error={validationErrors.registrationEndDate}
                    />

                    {/* Sức chứa */}
                    <Input
                        label="Sức chứa"
                        name="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        placeholder="VD: 100"
                        required
                        error={validationErrors.capacity}
                        min="1"
                    />

                    {/* Phí */}
                    <div>
                        <Input
                            label="Phí"
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="VD: 200000"
                            required
                            error={validationErrors.price}
                            min="0"
                            step="10000"
                        />
                        {formData.price && (
                            <p className="mt-1 text-sm text-gray-500">
                                {formatCurrency(formData.price)}
                            </p>
                        )}
                    </div>

                    {/* Trạng thái */}
                    <div className="md:col-span-2">
                        <Select
                            label="Trạng thái"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                        >
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Tạm dừng</option>
                        </Select>
                    </div>
                </div>

                {/* Nút submit */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                    <Button
                        type="button"
                        onClick={handleBackToList}
                        variant="outline"
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        disabled={formLoading}
                        loading={formLoading}
                        variant="primary"
                        loadingText={selectedHealthCheck ? "Đang cập nhật đợt khám..." : "Đang tạo đợt khám..."}
                    >
                        {selectedHealthCheck ? "Cập nhật đợt khám" : "Tạo đợt khám"}
                    </Button>
                </div>
            </form>
        </PageLayout>
        </>
    );
};

export default HealthCheckUpManagementPage;

