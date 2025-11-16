import React, { useState, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import userApi from '../../api/userApi';
import defaultAvatar3x4 from '../../assets/default_avatar_3x4.jpg';
import defaultIdCard from '../../assets/default_id_card.jpg';

const EditProfile = ({ onSuccess, onCancel }) => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    studentId: '',
    fullName: '',
    gender: '',
    dateOfBirth: '',
    university: '',
    religion: '',
    phone: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await userApi.getUser();
        if (response.success && response.data) {
          const data = response.data;
          setProfileData(data);
          setFormData({
            studentId: data.mssv || '',
            fullName: data.name || '',
            gender: data.gender || '',
            dateOfBirth: data.dob ? data.dob.split('T')[0] : '',
            university: data.school || '',
            religion: data.region || '',
            phone: data.phone || '',
            email: data.email || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        showError(error?.response?.data?.message || 'Không thể tải thông tin cá nhân. Vui lòng thử lại.');
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    try {
      const updateData = {
        email: formData.email,
        phone: formData.phone,
        region: formData.religion,
        mssv: formData.studentId,
        school: formData.university
      };

      const response = await userApi.updateProfile(updateData);
      if (response.success) {
        showSuccess('Cập nhật thông tin thành công.');
        setIsLoading(false);
        setIsEditing(false);
        if (onSuccess) {
          onSuccess(formData);
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showError(error?.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    
    // Reload original data from profileData
    if (profileData) {
      setFormData({
        studentId: profileData.mssv || '',
        fullName: profileData.name || '',
        gender: profileData.gender || '',
        dateOfBirth: profileData.dob ? profileData.dob.split('T')[0] : '',
        university: profileData.school || '',
        religion: profileData.region || '',
        phone: profileData.phone || '',
        email: profileData.email || ''
      });
    }
  };

  const getStatusDisplay = (status) => {
    if (!status) return { text: 'N/A', className: 'bg-gray-100 text-gray-800' };
    
    const statusMap = {
      'approved': { text: 'Đã duyệt', className: 'bg-green-100 text-green-800' },
      'pending': { text: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800' },
      'rejected': { text: 'Từ chối', className: 'bg-red-100 text-red-800' },
      'approved_not_changed': { text: 'Đã duyệt', className: 'bg-green-100 text-green-800' },
      'approved_changed': { text: 'Đã duyệt', className: 'bg-green-100 text-green-800' },
    };
    
    return statusMap[status.toLowerCase()] || { text: status, className: 'bg-gray-100 text-gray-800' };
  };

  const formatPhoneNumber = (phone) => {
    return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingState isLoading={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Thông tin cá nhân</h1>
          <p className="mt-2 text-gray-600">Xem và chỉnh sửa thông tin cá nhân của bạn</p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <img
                  src={profileData?.avatar || defaultAvatar3x4}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    const imageUrl = profileData?.avatar || defaultAvatar3x4;
                    window.open(imageUrl, '_blank');
                  }}
                  onError={(e) => {
                    e.target.src = defaultAvatar3x4;
                  }}
                />
              </div>
              
              <div className="text-center md:text-left text-white">
                <h2 className="text-2xl font-bold">{formData.fullName || 'Chưa có tên'}</h2>
                <div className="mt-2">
                  {profileData && (() => {
                    const statusDisplay = getStatusDisplay(profileData.status);
                    return (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.className}`}>
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {statusDisplay.text}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student ID - Có thể chỉnh sửa (mssv) */}
                <Input
                  label="Mã số sinh viên"
                  name="studentId"
                  type="text"
                  value={formData.studentId}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Nhập mã số sinh viên"
                  required
                />

                {/* Full Name - Chỉ đọc (không thể chỉnh sửa) */}
                <Input
                  label="Họ và tên"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  disabled={true}
                  placeholder="Họ và tên"
                />

                {/* Identification - Chỉ đọc */}
                {profileData?.identification && (
                  <Input
                    label="CCCD/CMND"
                    name="identification"
                    type="text"
                    value={profileData.identification}
                    disabled={true}
                  />
                )}

                {/* Gender - Chỉ đọc (không thể chỉnh sửa) */}
                <Select
                  label="Giới tính"
                  name="gender"
                  value={formData.gender}
                  disabled={true}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </Select>

                {/* Date of Birth - Chỉ đọc (không thể chỉnh sửa) */}
                <Input
                  label="Ngày sinh"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  disabled={true}
                />

                {/* Nation - Chỉ đọc */}
                {profileData?.nation && (
                  <Input
                    label="Quốc gia"
                    name="nation"
                    type="text"
                    value={profileData.nation}
                    disabled={true}
                  />
                )}

                {/* University - Có thể chỉnh sửa (school) */}
                <Input
                  label="Trường đại học"
                  name="university"
                  type="text"
                  value={formData.university}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Nhập tên trường đại học"
                  required
                />

                {/* Religion - Có thể chỉnh sửa (region) */}
                <Input
                  label="Tôn giáo"
                  name="religion"
                  type="text"
                  value={formData.religion}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Nhập tôn giáo"
                  required
                />

                {/* Phone - Có thể chỉnh sửa */}
                <Input
                  label="Số điện thoại"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Nhập số điện thoại"
                  required
                />

                {/* Email - Có thể chỉnh sửa */}
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Nhập email"
                  required
                />

                {/* Address - Chỉ đọc */}
                {profileData?.address && (
                  <div className="md:col-span-2">
                    <Input
                      label="Địa chỉ"
                      name="address"
                      type="text"
                      value={profileData.address}
                      disabled={true}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={onCancel}
                  >
                    Quay lại
                  </Button>
                </div>

                <div className="flex space-x-4">
                  {!isEditing ? (
                    <Button
                      variant="primary"
                      onClick={handleEdit}
                    >
                      Chỉnh sửa thông tin
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                      >
                        Hủy
                      </Button>
                      <Button
                        variant="success"
                        onClick={handleSubmit}
                        loading={isLoading}
                        loadingText="Đang lưu..."
                      >
                        Lưu thay đổi
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Ảnh đính kèm */}
        {profileData && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Ảnh đính kèm</h3>
              <div className="flex justify-center">
                <div className="max-w-md w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Ảnh CCCD mặt trước
                  </label>
                  <div className="border border-gray-300 rounded-lg p-2 bg-gray-50">
                    <img
                      src={profileData?.frontIdentificationImage || defaultIdCard}
                      alt="CCCD mặt trước"
                      className="w-full h-64 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        const imageUrl = profileData?.frontIdentificationImage || defaultIdCard;
                        window.open(imageUrl, '_blank');
                      }}
                      onError={(e) => {
                        console.error('Error loading CCCD image:', profileData?.frontIdentificationImage);
                        e.target.src = defaultIdCard;
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default EditProfile;
