import React, { useEffect, useState } from "react";
import healthCheckApi from "../../api/healthCheckApi";
import Button from '../../components/ui/Button';
import { X } from "lucide-react";
import { useNotification } from "../../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";

const HealthCheckCard = ({ healthCheck, onEdit, onDelete }) => {
    return (
        <div className="border rounded-xl shadow p-4 mb-4 hover:shadow-lg transition">
            {/* Header: tiêu đề + trạng thái */}
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">{healthCheck.title}</h2>
                <span
                    className={`font-semibold ${healthCheck.status === "active"
                        ? "text-green-600"
                        : "text-red-600"
                        }`}
                >
                    {healthCheck.status}
                </span>
            </div>

            {/* Nội dung */}
            <p className="text-gray-700 mb-1">{healthCheck.description}</p>
            <p className="text-gray-600 mb-1">
                <strong>Tòa nhà:</strong> {healthCheck.buildingName}
            </p>
            <p className="text-gray-600 mb-1">
                <strong>Thời gian:</strong> {healthCheck.startDate} → {healthCheck.endDate}
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
                <strong>Thời gian đăng ký:</strong> {healthCheck.registrationStartDate} →{" "}
                {healthCheck.registrationEndDate}
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

const HealthCheckListPage = ({ onCancel }) => {
    const navigate = useNavigate();
    const [healthChecks, setHealthChecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showError } = useNotification();

    const fetchHealthChecks = async () => {
        try {
            setLoading(true);
            const response = await healthCheckApi.getHealthChecks();
            if (response.success && response.data) {
                setHealthChecks(response.data);
            }
        } catch (err) {
            console.log(err.response?.data?.message || err.message);
            showError(err.response?.data?.message || "Lỗi khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const goToEditHealthCheck = (hc) => {
        navigate("/health-checkup-creation", { state: { healthCheck: hc } });
    };

    const goToCreateHealthChecks = () => {
        window.location.href = '/health-checkup-creation';
    }

    const deleteHealthCheck = () => {
        console.log("Xóa đợt khám này");
    }

    useEffect(() => {
        fetchHealthChecks();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-600">
                <Button variant="secondary" size="medium" loading>
                    Đang tải danh sách...
                </Button>
            </div>
        );
    }

    return (
        <div className="relative p-6 max-w-4xl mx-auto">
            {/* Tiêu đề nằm trên, căn giữa */}
            <h1 className="text-2xl font-semibold text-gray-800 text-center mb-6">
                Quản lý đợt khám sức khỏe
            </h1>

            {/* Các nút nằm dưới tiêu đề, căn giữa theo hàng ngang */}
            <div className="flex justify-center items-center gap-3">
                <Button
                    variant="secondary"
                    size="small"
                    onClick={onCancel}
                    icon={<X className="w-4 h-4" />}
                >
                    Đóng
                </Button>
                <Button
                    variant="primary"
                    size="small"
                    onClick={fetchHealthChecks}
                >
                    Làm mới
                </Button>
                <Button
                    variant="primary"
                    size="small"
                    onClick={goToCreateHealthChecks}
                >
                    Tạo đợt khám
                </Button>
            </div>

            {healthChecks.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                    Không có đợt khám sức khỏe nào.
                </div>
            ) : (
                <div className="mt-8"> {/* Thêm mt-8 để cách nút phía trên */}
                    {healthChecks.map((hc) => (
                        <HealthCheckCard key={hc.id} healthCheck={hc} onEdit={ goToEditHealthCheck} onDelete={ deleteHealthCheck } />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HealthCheckListPage;
