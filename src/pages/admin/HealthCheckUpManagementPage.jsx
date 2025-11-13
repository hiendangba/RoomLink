import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import { buildingApi, healthCheckApi } from "../../api";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import PageLayout from "../../components/layout/PageLayout";
import LoadingState from "../../components/ui/LoadingState";

// Format date to Vietnamese format (dd/mm/yyyy HH:mm)
const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
        return dateString;
    }
};

// HealthCheckCard component
const HealthCheckCard = ({ healthCheck, onEdit, onDelete }) => {
    return (
        <div className="border rounded-xl shadow p-4 mb-4 hover:shadow-lg transition">
            {/* Header: tiêu đề */}
            <div className="mb-2">
                <h2 className="text-xl font-semibold">{healthCheck.title}</h2>
            </div>

            {/* Nội dung */}
            <p className="text-gray-700 mb-1">{healthCheck.description}</p>
            <p className="text-gray-600 mb-1">
                <strong>Tòa nhà:</strong> {healthCheck.buildingName}
            </p>
            <p className="text-gray-600 mb-1">
                <strong>Thời gian:</strong> {formatDate(healthCheck.startDate)} → {formatDate(healthCheck.endDate)}
            </p>
            <p className="text-gray-600 mb-1">
                <strong>Sức chứa:</strong> {healthCheck.capacity} |{" "}
                <strong>Đã đăng ký:</strong> {healthCheck.registeredCount}
            </p>
            <p className="text-gray-600 mb-1">
                <strong>Phí:</strong>{" "}
                {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    minimumFractionDigits: 0,
                }).format(healthCheck.price)}
            </p>
            <p className="text-gray-600 mb-3">
                <strong>Thời gian đăng ký:</strong> {formatDate(healthCheck.registrationStartDate)} →{" "}
                {formatDate(healthCheck.registrationEndDate)}
            </p>

            {/* Hàng nút hành động */}
            <div className="flex justify-end gap-3 pt-2 border-t mt-2">
                <Button
                    variant="primary"
                    size="small"
                    onClick={() => onEdit(healthCheck)}
                >
                    Chỉnh sửa
                </Button>
                <Button
                    variant="danger"
                    size="small"
                    onClick={() => onDelete(healthCheck)}
                >
                    Xóa
                </Button>
            </div>
        </div>
    );
};

// Main component
const HealthCheckUpManagementPage = () => {
    const navigate = useNavigate();
    const { showError, showSuccess } = useNotification();

    // View state: 'list' or 'form'
    const [currentView, setCurrentView] = useState('list');
    const [selectedHealthCheck, setSelectedHealthCheck] = useState(null);

    // List view state
    const [healthChecks, setHealthChecks] = useState([]);
    const [listLoading, setListLoading] = useState(true);

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
    const fetchHealthChecks = async () => {
        try {
            setListLoading(true);
            const response = await healthCheckApi.getHealthChecks();
            if (response.success && response.data) {
                setHealthChecks(response.data);
            }
        } catch (err) {
            console.log(err.response?.data?.message || err.message);
            showError(err?.response?.data?.message || "Lỗi khi tải dữ liệu");
        } finally {
            setListLoading(false);
        }
    };

    // Load health checks when in list view
    useEffect(() => {
        if (currentView === 'list') {
            fetchHealthChecks();
        }
    }, [currentView]);

    // Handle edit - switch to form view
    const handleEdit = (healthCheck) => {
        setSelectedHealthCheck(healthCheck);
        setFormData({
            buildingId: healthCheck.buildingId || "",
            title: healthCheck.title || "",
            description: healthCheck.description || "",
            startDate: healthCheck.startDate ? new Date(healthCheck.startDate).toISOString().slice(0, 16) : "",
            endDate: healthCheck.endDate ? new Date(healthCheck.endDate).toISOString().slice(0, 16) : "",
            registrationStartDate: healthCheck.registrationStartDate ? new Date(healthCheck.registrationStartDate).toISOString().slice(0, 16) : "",
            registrationEndDate: healthCheck.registrationEndDate ? new Date(healthCheck.registrationEndDate).toISOString().slice(0, 16) : "",
            capacity: healthCheck.capacity || "",
            price: healthCheck.price || "",
            status: healthCheck.status || "active",
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

    // Handle delete
    const handleDelete = (healthCheck) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa đợt khám "${healthCheck.title}"?`)) {
            console.log("Xóa đợt khám này", healthCheck.id);
            // TODO: Implement delete API call
            showError("Chức năng xóa chưa được triển khai");
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
        navigate("/admin");
    };

    // Convert datetime-local -> ISO UTC
    const toISOStringWithOffset = (localString) => {
        if (!localString) return null;
        const date = new Date(localString);
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
    };

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};

        if (!formData.title.trim()) errors.title = "Vui lòng nhập tên đợt khám";
        if (!formData.description.trim()) errors.description = "Vui lòng nhập mô tả";
        if (!formData.buildingId) errors.buildingId = "Vui lòng chọn tòa nhà";
        if (!formData.startDate) errors.startDate = "Chưa chọn ngày bắt đầu";
        if (!formData.endDate) errors.endDate = "Chưa chọn ngày kết thúc";
        if (!formData.registrationStartDate)
            errors.registrationStartDate = "Chưa chọn ngày bắt đầu đăng ký";
        if (!formData.registrationEndDate)
            errors.registrationEndDate = "Chưa chọn ngày kết thúc đăng ký";
        if (!formData.capacity || Number(formData.capacity) <= 0)
            errors.capacity = "Sức chứa phải lớn hơn 0";
        if (formData.price === "" || Number(formData.price) < 0)
            errors.price = "Phí phải là số hợp lệ";

        const sd = new Date(formData.startDate);
        const ed = new Date(formData.endDate);
        const rsd = new Date(formData.registrationStartDate);
        const red = new Date(formData.registrationEndDate);

        if (sd && ed && sd >= ed) errors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
        if (rsd && red && rsd >= red)
            errors.registrationEndDate = "Ngày kết thúc đăng ký phải sau ngày bắt đầu đăng ký";
        if (red && sd && red >= sd)
            errors.registrationEndDate = "Ngày kết thúc đăng ký phải trước ngày bắt đầu khám";

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const payload = {
            buildingId: formData.buildingId,
            title: formData.title.trim(),
            description: formData.description.trim(),
            startDate: toISOStringWithOffset(formData.startDate),
            endDate: toISOStringWithOffset(formData.endDate),
            registrationStartDate: toISOStringWithOffset(formData.registrationStartDate),
            registrationEndDate: toISOStringWithOffset(formData.registrationEndDate),
            capacity: Number(formData.capacity),
            price: Number(formData.price),
            status: formData.status,
        };

        if (selectedHealthCheck?.id) payload.healthCheckId = selectedHealthCheck.id;

        try {
            setFormLoading(true);
            const res = selectedHealthCheck?.id
                ? await healthCheckApi.updateHealthCheck(payload)
                : await healthCheckApi.createHealthCheck(payload);

            if (res.success) {
                showSuccess(`Đợt khám ${selectedHealthCheck?.id ? "cập nhật" : "tạo"} thành công!`);
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

    // Render list view
    if (currentView === 'list') {
        return (
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
                <LoadingState
                    isLoading={listLoading}
                    isEmpty={!listLoading && healthChecks.length === 0}
                    emptyState={
                        <div className="text-center text-gray-500 mt-8">
                            Không có đợt khám sức khỏe nào.
                        </div>
                    }
                >
                    <div className="mt-8">
                        {healthChecks.map((hc) => (
                            <HealthCheckCard
                                key={hc.id}
                                healthCheck={hc}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </LoadingState>
            </PageLayout>
        );
    }

    // Render form view
    return (
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
                        disabled={formLoading}
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
                        loadingText="Đang tạo đợt khám..."
                    >
                        {selectedHealthCheck ? "Cập nhật đợt khám" : "Tạo đợt khám"}
                    </Button>
                </div>
            </form>
        </PageLayout>
    );
};

export default HealthCheckUpManagementPage;

