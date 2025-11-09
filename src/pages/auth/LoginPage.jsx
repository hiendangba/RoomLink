import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { authAPI, userAPI } from '../../api';
import { setTokenGetter } from '../../api/axiosClient';
import FaceRecognition from '../../components/auth/FaceRecognition';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const LoginPage = () => {
  const { login: authLogin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [showFaceLogin, setShowFaceLogin] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!formData.username || !formData.password) {
      showError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
      return;
    }

    if (formData.username.length !== 12) {
      showError('CCCD phải đủ 12 số!');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Call API login
      const loginResponse = await authAPI.login({
        identification: formData.username,
        password: formData.password
      });
      
      // Extract access_token from response (axiosClient already returns response.data)
      const access_token = loginResponse.data.access_token;
      const userId = loginResponse.data.userId;
      
      if (!access_token) {
        throw new Error('Không nhận được token từ server');
      }
      
      // Step 2: Store token and setup token getter (needed for getUser API)
      localStorage.setItem('token', access_token);
      setTokenGetter(() => localStorage.getItem('token'));
      
      // Step 3: Call getUser API to get full user info (including role)
      try {
        const userResponse = await userAPI.getUser();
        const userData = userResponse.data;
        
        // Step 4: User data already includes role from BE
        const user = {
          ...userData,
          id: userId || userData.id
        };
        
        // Step 5: Store user data and token using AuthContext
        authLogin(user, access_token);
        
        // Show success notification
        showSuccess('Đăng nhập thành công!');
        
        // Redirect based on role after a short delay
        setTimeout(() => {
          if (user.role === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/student';
          }
        }, 1000);
      } catch (getUserError) {
        // If getUser fails, still clear token and show error
        const getUserErrorMessage = getUserError.response?.data?.message || getUserError.message || 'Không thể lấy thông tin người dùng!';
        showError(getUserErrorMessage);
        localStorage.removeItem('token');
        setTokenGetter(() => null);
      }
    } catch (err) {
      // Handle different types of errors
      let errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng!';
      
      if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data?.message || errorMessage;
      } else if (err.request) {
        // Request was made but no response received (network error)
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!';
      } else {
        // Something else happened
        errorMessage = err.message || errorMessage;
      }
      
      showError(errorMessage);
      // Clear token if login failed
      localStorage.removeItem('token');
      setTokenGetter(() => null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData) => {
    console.log('Login successful:', userData);
    
    // Redirect based on role
    if (userData.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/student';
    }
  };

  const handleFaceLogin = () => {
    setShowFaceLogin(true);
  };

  const handleFaceLoginSuccess = (userData) => {
    console.log('Face login successful:', userData);
    
    // Redirect based on role
    if (userData.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/student';
    }
  };

  const handleFaceLoginCancel = () => {
    setShowFaceLogin(false);
  };

  // Forgot Password handlers
  const handleForgotPassword = () => {
    window.location.href = '/forgot-password';
  };

  // Render different components based on state
  if (showFaceLogin) {
    return (
      <FaceRecognition 
        onSuccess={handleFaceLoginSuccess}
        onCancel={handleFaceLoginCancel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">RL</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Đăng nhập vào RoomLink
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Quản lý ký túc xá thông minh
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Tên đăng nhập"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nhập tên đăng nhập"
              required
            />

            <Input
              label="Mật khẩu"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              required
            />

            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isLoading}
                loadingText="Đang đăng nhập..."
                disabled={isLoading}
              >
                Đăng nhập
              </Button>
            </div>
          </form>

          {/* Forgot Password + Register Links */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-4">
              <Button
                variant="link"
                onClick={handleForgotPassword}
                className="text-sm"
              >
                Quên mật khẩu
              </Button>
              <span className="text-gray-300">|</span>
              <Button
                variant="link"
                onClick={() => { window.location.href = '/register-room'; }}
                className="text-sm"
              >
                Đăng ký KTX
              </Button>
            </div>
          </div>

          {/* Face Login Button */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                fullWidth
                onClick={handleFaceLogin}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
                iconPosition="left"
              >
                Đăng nhập bằng khuôn mặt
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
