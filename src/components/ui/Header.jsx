import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLoginClick = () => {
    window.location.href = '/login';
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleDashboardClick = () => {
    if (user.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/student';
    }
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xl">RL</span>
            </div>
            <h1 className="text-2xl font-bold">RoomLink</h1>
          </div>
          
          {isAuthenticated() ? (
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-blue-200">Xin chào, </span>
                <span className="font-semibold">{user.name}</span>
                <span className="text-blue-200 ml-2">({user.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'})</span>
              </div>
              <button 
                onClick={handleDashboardClick}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                {user.role === 'admin' ? 'Trang quản trị' : 'Trang sinh viên'}
              </button>
              <button 
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLoginClick}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
