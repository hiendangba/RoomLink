import React, { useState } from 'react';
import FaceRecognition from '../../components/auth/FaceRecognition';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import authApi from '../../api/authApi';
import { jwtDecode } from "jwt-decode";


const LoginPage = () => {
  const [showFaceLogin, setShowFaceLogin] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  // Dữ liệu mẫu users
  const mockUsers = [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'Quản trị viên',
      email: 'admin@roomlink.com'
    },
    {
      id: 2,
      username: 'student001',
      password: 'student123',
      role: 'student',
      name: 'Nguyễn Văn A',
      email: 'student001@roomlink.com',
      studentId: '22110390'
    },
    {
      id: 3,
      username: 'student002',
      password: 'student123',
      role: 'student',
      name: 'Trần Thị B',
      email: 'student002@roomlink.com',
      studentId: '22110335'
    }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };


  // Huy code

  const decode = async (token) => {
    try {
      const user = jwtDecode(token);
      return user;
    }
    catch (err) {
      console.log(err);
      return null;
    }
  };

  // Huy code

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Huy call APi
    const identification = formData.username;
    const password = formData.password;

    try {
      const response = await authApi.login({ identification, password });
      if (response.success) {
        const access_token = response.data.access_token;
        const user = await decode(access_token);
        user.role = "admin";

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user', JSON.stringify(user));

        handleLogin(user);

      }
    }
    catch (err) {
      console.log(err.response.data.message);
    }
    finally {
      setIsLoading(false);
    }

    // End Huy call Api

    // // Simulate API call delay
    // setTimeout(() => {
    //   // Find user in mock data
    //   const user = mockUsers.find(u => 
    //     u.username === formData.username && 
    //     u.password === formData.password
    //   );

    //   if (user) {
    //     // Login successful
    //     const userData = {
    //       id: user.id,
    //       username: user.username,
    //       role: user.role,
    //       name: user.name,
    //       email: user.email,
    //       studentId: user.studentId
    //     };

    //     // Store in localStorage for persistence
    //     localStorage.setItem('user', JSON.stringify(userData));
    //     localStorage.setItem('isLoggedIn', 'true');

    //     handleLogin(userData);
    //   } else {
    //     setError('Tên đăng nhập hoặc mật khẩu không đúng!');
    //   }
    //   setIsLoading(false);
    // }, 1000);
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

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

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Tài khoản mẫu</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Quản trị viên:</h4>
                <p className="text-xs text-gray-600">Tên đăng nhập: <span className="font-mono bg-gray-200 px-1 rounded">admin</span></p>
                <p className="text-xs text-gray-600">Mật khẩu: <span className="font-mono bg-gray-200 px-1 rounded">admin123</span></p>
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Sinh viên:</h4>
                <p className="text-xs text-gray-600">Tên đăng nhập: <span className="font-mono bg-gray-200 px-1 rounded">student001</span></p>
                <p className="text-xs text-gray-600">Mật khẩu: <span className="font-mono bg-gray-200 px-1 rounded">student123</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
