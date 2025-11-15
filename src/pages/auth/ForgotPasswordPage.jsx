import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import authApi from '../../api/authApi';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import OTPVerification from '../../components/auth/OTPVerification';
import ResetPassword from '../../components/auth/ResetPassword';

const ForgotPassword = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    identification: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [flowId, setFlowId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const { showSuccess, showError } = useNotification();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.forgotPassword({
        identification: formData.identification,
        email: formData.email
      });

      // API luôn trả về flowId để bảo mật (kể cả khi user không tồn tại)
      const responseData = response.data?.data || response.data;
      const newFlowId = responseData?.flowId;

      if (newFlowId) {
        setFlowId(newFlowId);
        setUserEmail(formData.email);
        showSuccess('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.');
        setShowOTP(true);
      } else {
        setError('Không thể tạo yêu cầu khôi phục mật khẩu. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi gửi OTP. Vui lòng thử lại.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSuccess = () => {
    setShowOTP(false);
    setShowResetPassword(true);
  };

  const handleOTPCancel = () => {
    setShowOTP(false);
    setFlowId(null);
    setUserEmail('');
  };

  const handleOTPResend = () => {
    // OTPVerification sẽ tự gọi API resendOTP
  };

  const handleResetPasswordSuccess = () => {
    setShowResetPassword(false);
    setFlowId(null);
    setUserEmail('');
    showSuccess('Đặt lại mật khẩu thành công!');
    if (onSuccess) {
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  };

  const handleResetPasswordCancel = () => {
    setShowResetPassword(false);
    setFlowId(null);
    setUserEmail('');
  };

  // Show ResetPassword component if reset password step is active
  if (showResetPassword) {
    const handleApiCall = async (data) => {
      return await authApi.resetPassword({
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });
    };

    return (
      <ResetPassword 
        resetType="reset"
        apiFunction={handleApiCall}
        passwordFieldName="newPassword"
        confirmPasswordFieldName="confirmPassword"
        onSuccess={handleResetPasswordSuccess}
        onCancel={handleResetPasswordCancel}
      />
    );
  }

  // Show OTP component if OTP step is active
  if (showOTP && flowId) {
    return (
      <OTPVerification 
        flowId={flowId}
        email={userEmail}
        onSuccess={handleOTPSuccess}
        onCancel={handleOTPCancel}
        onResend={handleOTPResend}
        otpType="reset"
      />
    );
  }

  return (
    <AuthLayout
      icon="🔑"
      title="Quên mật khẩu"
      subtitle="Nhập thông tin tài khoản để nhận mã OTP khôi phục mật khẩu"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input
          label="Số CCCD/CMND"
          name="identification"
          type="text"
          value={formData.identification}
          onChange={handleChange}
          placeholder="Nhập số CCCD/CMND"
          required
          error={error && error.includes('CCCD') ? error : ''}
        />

        <Input
          label="Email khôi phục"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Nhập email đã đăng ký"
          required
          error={error && error.includes('email') ? error : ''}
        />

        {error && !error.includes('CCCD') && !error.includes('email') && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            loadingText="Đang gửi OTP..."
            fullWidth
          >
            Gửi mã OTP
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              fullWidth
            >
              Hủy
            </Button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
