import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import AuthLayout from '../layout/AuthLayout';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ResetPassword = ({ 
  onSuccess, 
  onCancel, 
  resetType = 'reset',
  apiFunction,
  passwordFieldName = 'newPassword',
  confirmPasswordFieldName = 'confirmPassword',
  title,
  subtitle,
  icon = '🔒'
}) => {
  const [formData, setFormData] = useState({
    [passwordFieldName]: '',
    [confirmPasswordFieldName]: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { showSuccess, showError } = useNotification();

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

    if (!apiFunction) {
      showError('API function không được cung cấp');
      setIsLoading(false);
      return;
    }

    try {
      // Prepare data for API call - pass all form data and let apiFunction decide what to use
      const apiData = {
        [passwordFieldName]: formData[passwordFieldName],
        [confirmPasswordFieldName]: formData[confirmPasswordFieldName]
      };

      const response = await apiFunction(apiData);

      const responseData = response.data?.data || response.data;
      const message = responseData?.message || (resetType === 'change' ? 'Đổi mật khẩu thành công!' : 'Đặt lại mật khẩu thành công!');

      showSuccess(message);
      setFormData({ 
        [passwordFieldName]: '', 
        [confirmPasswordFieldName]: '' 
      });
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error('Password change/reset error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi cập nhật mật khẩu. Vui lòng thử lại.';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ 
      [passwordFieldName]: '', 
      [confirmPasswordFieldName]: '' 
    });
    if (onCancel) {
      onCancel();
    }
  };

  const displayTitle = title || (resetType === 'change' ? 'Đổi mật khẩu' : 'Đặt lại mật khẩu');
  const displaySubtitle = subtitle || 'Tạo mật khẩu mới cho tài khoản của bạn';

  return (
    <AuthLayout
      icon={icon}
      title={displayTitle}
      subtitle={displaySubtitle}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu mới <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              name={passwordFieldName}
              type={showPassword ? 'text' : 'password'}
              value={formData[passwordFieldName]}
              onChange={handleChange}
              placeholder="Nhập mật khẩu mới"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
            >
              {showPassword ? (
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Xác nhận mật khẩu mới <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              name={confirmPasswordFieldName}
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData[confirmPasswordFieldName]}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu mới"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
            >
              {showConfirmPassword ? (
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            loadingText="Đang xử lý..."
            disabled={isLoading}
          >
            {resetType === 'change' ? 'Đổi mật khẩu' : 'Cập nhật mật khẩu'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
