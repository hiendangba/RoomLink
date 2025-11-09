import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import buildingApi from "../../api/buildingApi";
import healthCheckApi from "../../api/healthCheckApi";
import Button from "../../components/ui/Button";

const HealthCheckupCreationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { healthCheck } = location.state || {}; // Nếu edit
  const { showError, showSuccess } = useNotification();

  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    buildingId: healthCheck?.buildingId || "",
    title: healthCheck?.title || "",
    description: healthCheck?.description || "",
    startDate: healthCheck?.startDate || "",
    endDate: healthCheck?.endDate || "",
    registrationStartDate: healthCheck?.registrationStartDate || "",
    registrationEndDate: healthCheck?.registrationEndDate || "",
    capacity: healthCheck?.capacity || "",
    price: healthCheck?.price || "",
    status: healthCheck?.status || "active",
  });

  // Convert datetime-local -> ISO UTC
  const toISOStringWithOffset = (localString) => {
    if (!localString) return null;
    const date = new Date(localString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
  };

  // Load danh sách tòa nhà
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        const res = await buildingApi.getBuilding();
        if (res.success) setBuildings(res.data);
      } catch (err) {
        showError(err?.response?.data?.message || "Không tải được danh sách tòa nhà");
      } finally {
        setLoading(false);
      }
    };
    fetchBuildings();
  }, []);

  // Handle input
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

    if (healthCheck?.id) payload.healthCheckId = healthCheck.id;

    try {
      setLoading(true);
      const res = healthCheck?.id
        ? await healthCheckApi.updateHealthCheck(payload)
        : await healthCheckApi.createHealthCheck(payload);

      if (res.success) {
        showSuccess(`Đợt khám ${healthCheck?.id ? "cập nhật" : "tạo"} thành công!`);
        setTimeout(() => navigate("/health-checkup-admin"), 1500);
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Lỗi khi tạo hoặc sửa đợt khám");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format tiền VN
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              {healthCheck ? "Chỉnh sửa đợt khám" : "Tạo đợt khám sức khỏe"}
            </h1>
            <Button onClick={() => navigate("/health-checkup-admin")} variant="ghost" size="small">
              Đóng
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tên đợt khám */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên đợt khám <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    validationErrors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="VD: Khám sức khỏe học kỳ 1"
                />
                {validationErrors.title && <p className="text-sm text-red-600 mt-1">{validationErrors.title}</p>}
              </div>

              {/* Tòa nhà */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tòa nhà <span className="text-red-500">*</span>
                </label>
                <select
                  name="buildingId"
                  value={formData.buildingId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    validationErrors.buildingId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Chọn tòa nhà</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {validationErrors.buildingId && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.buildingId}</p>
                )}
              </div>

              {/* Mô tả */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    validationErrors.description ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Mô tả chi tiết về đợt khám..."
                />
                {validationErrors.description && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.description}</p>
                )}
              </div>

              {/* Ngày & đăng ký, Sức chứa, Phí */}
              {["startDate", "endDate", "registrationStartDate", "registrationEndDate"].map((field, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field === "startDate" && "Ngày bắt đầu *"}
                    {field === "endDate" && "Ngày kết thúc *"}
                    {field === "registrationStartDate" && "Ngày bắt đầu đăng ký *"}
                    {field === "registrationEndDate" && "Ngày kết thúc đăng ký *"}
                  </label>
                  <input
                    type="datetime-local"
                    name={field}
                    value={formData[field] || ""}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      validationErrors[field] ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {validationErrors[field] && <p className="text-sm text-red-600 mt-1">{validationErrors[field]}</p>}
                </div>
              ))}

              {/* Sức chứa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sức chứa <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    validationErrors.capacity ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="VD: 100"
                />
                {validationErrors.capacity && <p className="text-sm text-red-600 mt-1">{validationErrors.capacity}</p>}
              </div>

              {/* Phí */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phí <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    validationErrors.price ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="VD: 200000"
                />
                {formData.price && <p className="text-sm text-gray-600 mt-1">{formatCurrency(formData.price)}</p>}
                {validationErrors.price && <p className="text-sm text-red-600 mt-1">{validationErrors.price}</p>}
              </div>
            </div>

            {/* Trạng thái */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>

            {/* Nút submit */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" onClick={() => navigate("/health-checkup-admin")} variant="outline">
                Hủy
              </Button>
              <Button type="submit" disabled={loading} loading={loading} variant="primary">
                {healthCheck ? "Cập nhật đợt khám" : "Tạo đợt khám"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HealthCheckupCreationPage;
