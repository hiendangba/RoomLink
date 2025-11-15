import React, { useState, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import authApi from '../../api/authApi';
import AuthLayout from '../layout/AuthLayout';
import Button from '../ui/Button';
import Input from '../ui/Input';

const OTPVerification = ({ flowId, email, onSuccess, onCancel, onResend, otpType = 'reset' }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const { showSuccess, showError } = useNotification();

  const RESEND_COOLDOWN_TIME = 60; // 60 seconds

  useEffect(() => {
    // Start resend cooldown timer
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError('Mã OTP phải có 6 chữ số');
      return;
    }

    if (!flowId) {
      setError('Thiếu thông tin xác thực. Vui lòng thử lại từ đầu.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.verifyOTP({
        flowId: flowId,
        otp: otp
      });

      const responseData = response.data?.data || response.data;
      const message = responseData?.message || 'Xác thực OTP thành công.';

      showSuccess(message);
      onSuccess();
    } catch (err) {
      console.error('Verify OTP error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Mã OTP không chính xác. Vui lòng thử lại.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || !flowId) return;

    setIsResending(true);
    setError('');

    try {
      const response = await authApi.resendOTP({
        flowId: flowId
      });

      const responseData = response.data?.data || response.data;
      const message = responseData?.message || 'Mã OTP mới đã được gửi đến email của bạn.';

      showSuccess(message);
      setResendCooldown(RESEND_COOLDOWN_TIME);
      setOtp('');
    } catch (err) {
      console.error('Resend OTP error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AuthLayout
      icon="📧"
      title="Xác thực OTP"
      subtitle={`Nhập mã OTP đã được gửi đến email của bạn`}
    >
      {email && (
        <p className="text-center text-sm text-blue-600 font-medium mb-4">
          {email}
        </p>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input
          label="Mã OTP (6 chữ số)"
          name="otp"
          type="text"
          value={otp}
          onChange={handleChange}
          placeholder="000000"
          required
          maxLength="6"
          error={error}
          helperText="Nhập mã OTP 6 chữ số đã được gửi đến email của bạn"
          className="text-center text-2xl font-mono tracking-widest"
        />

        <div className="space-y-3">
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            loadingText="Đang xác thực..."
            disabled={otp.length !== 6}
            fullWidth
          >
            Xác thực OTP
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleResendOTP}
            disabled={resendCooldown > 0 || isResending}
            loading={isResending}
            loadingText="Đang gửi lại..."
            fullWidth
          >
            {resendCooldown > 0 ? `Gửi lại sau ${formatTime(resendCooldown)}` : 'Gửi lại mã OTP'}
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || isResending}
              fullWidth
            >
              Hủy
            </Button>
          )}
        </div>
      </form>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Hướng dẫn:</h4>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• Kiểm tra email và spam folder</li>
          <li>• Mã OTP có hiệu lực trong 10 phút</li>
          <li>• Bạn có tối đa 3 lần thử</li>
          <li>• Có thể yêu cầu gửi lại mã sau 1 phút</li>
        </ul>
      </div>
    </AuthLayout>
  );
};

export default OTPVerification;
