import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { userApi } from '../../api';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ChangePassword = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user } = useAuth();
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
    
    // Basic check - only check if fields are filled
    if (!formData.password || !formData.confirmPassword) {
      showError('Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu!');
      return;
    }

    setIsLoading(true);

    try {
      const response = await userApi.changePassword({
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      // Handle response - API returns response.data directly from axiosClient
      const responseData = response.data || response;
      const message = responseData?.data?.message || responseData?.message || 'Đổi mật khẩu thành công';
      
      showSuccess(message);
      setFormData({ password: '', confirmPassword: '' });
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      console.error('Change password error:', error);
      
      // Handle different types of errors
      let errorMessage = 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại!';
      
      if (error.response) {
        // Server responded with error status
        const errorData = error.response.data;
        
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map(err => err.message || err).join(', ');
          errorMessage = errorMessages;
        }
      } else if (error.request) {
        // Request was made but no response received (network error)
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!';
      } else if (error.message) {
        // Something else happened
        errorMessage = error.message;
      }
      
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ password: '', confirmPassword: '' });
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <AuthLayout
      icon="🔒"
      title="Đổi mật khẩu"
      subtitle={user ? `Tài khoản: ${user.name || user.username}` : 'Tạo mật khẩu mới cho tài khoản của bạn'}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
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
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
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
                Đổi mật khẩu
              </Button>
            </div>
          </form>
        </AuthLayout>
  );
};

export default ChangePassword;
