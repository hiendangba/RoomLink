import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../api';
import ResetPassword from '../../components/auth/ResetPassword';

const ChangePassword = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();

  const handleApiCall = async (data) => {
    return await userApi.changePassword({
      password: data.password,
      confirmPassword: data.confirmPassword
    });
  };

  return (
    <ResetPassword
      resetType="change"
      apiFunction={handleApiCall}
      passwordFieldName="password"
      confirmPasswordFieldName="confirmPassword"
      title="Đổi mật khẩu"
      subtitle={user ? `Tài khoản: ${user.name || user.username}` : 'Tạo mật khẩu mới cho tài khoản của bạn'}
      icon="🔒"
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
};

export default ChangePassword;
