import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';
import Button from '../components/ui/Button';
import InfoBox from '../components/ui/InfoBox';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated()) {
      if (user?.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/student';
      }
    } else {
      window.location.href = '/login';
    }
  };

  const features = [
    {
      icon: '🏠',
      title: 'Quản lý phòng ở',
      description: 'Đăng ký, phân bổ và theo dõi tình trạng phòng ở KTX một cách hiệu quả',
      bgColor: 'bg-blue-100'
    },
    {
      icon: '👥',
      title: 'Quản lý sinh viên',
      description: 'Theo dõi thông tin sinh viên và lịch sử ở KTX đầy đủ và chi tiết',
      bgColor: 'bg-green-100'
    },
    {
      icon: '💰',
      title: 'Quản lý hóa đơn',
      description: 'Tạo và theo dõi hóa đơn điện nước, phí dịch vụ tự động và chính xác',
      bgColor: 'bg-purple-100'
    },
    {
      icon: '🚗',
      title: 'Đăng ký xe',
      description: 'Quản lý đăng ký phương tiện giao thông cho sinh viên',
      bgColor: 'bg-orange-100'
    },
    {
      icon: '🏥',
      title: 'Khám sức khỏe',
      description: 'Đăng ký và quản lý lịch khám sức khỏe định kỳ',
      bgColor: 'bg-red-100'
    },
    {
      icon: '📊',
      title: 'Báo cáo thống kê',
      description: 'Theo dõi và phân tích dữ liệu quản lý KTX một cách trực quan',
      bgColor: 'bg-indigo-100'
    }
  ];

  const stats = [
    { number: '500+', label: 'Sinh viên', icon: '👨‍🎓' },
    { number: '200+', label: 'Phòng ở', icon: '🏠' },
    { number: '24/7', label: 'Hỗ trợ', icon: '💬' },
    { number: '100%', label: 'Tự động hóa', icon: '⚡' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20 md:py-32 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Hệ thống quản lý Ký túc xá
                <span className="block text-blue-200 mt-2">RoomLink</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                Quản lý phòng ở, sinh viên và dịch vụ KTX một cách hiệu quả và chuyên nghiệp
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  variant="primary"
                  size="large"
                  onClick={handleGetStarted}
                  className="!bg-white !text-blue-600 hover:!bg-blue-50 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  {isAuthenticated() ? 'Vào hệ thống' : 'Bắt đầu ngay'}
                </Button>
                {!isAuthenticated() && (
                  <Button
                    variant="primary"
                    size="large"
                    onClick={handleGetStarted}
                    className="!bg-white !text-blue-600 hover:!bg-blue-50 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    Đăng nhập
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg className="w-full h-12 text-gray-50" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0 C150,80 350,80 600,40 C850,0 1050,0 1200,40 L1200,120 L0,120 Z"></path>
            </svg>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="text-4xl mb-3">{stat.icon}</div>
                  <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Tính năng chính của hệ thống
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Hệ thống quản lý KTX với đầy đủ tính năng hiện đại, giúp quản lý hiệu quả và tiện lợi
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                >
                  <div className={`w-16 h-16 rounded-full ${feature.bgColor} flex items-center justify-center mb-6 mx-auto`}>
                    <span className="text-3xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <InfoBox
                type="info"
                title="Thông tin quan trọng"
                messages={[
                  'Hệ thống hỗ trợ đăng ký phòng ở, quản lý hóa đơn và các dịch vụ KTX',
                  'Sinh viên có thể đăng ký phòng, xem thông tin phòng và thanh toán hóa đơn trực tuyến',
                  'Quản trị viên có thể quản lý toàn bộ hệ thống từ một giao diện duy nhất',
                  'Hệ thống được thiết kế với giao diện thân thiện, dễ sử dụng trên mọi thiết bị'
                ]}
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!isAuthenticated() && (
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-12 border border-blue-100">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  Sẵn sàng bắt đầu?
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Đăng nhập ngay để trải nghiệm hệ thống quản lý KTX hiện đại và tiện lợi
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="primary"
                    size="large"
                    onClick={() => window.location.href = '/login'}
                    className="!bg-blue-600 !text-white hover:!bg-blue-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    Đăng nhập ngay
                  </Button>
                  <Button
                    variant="outline"
                    size="large"
                    onClick={() => window.location.href = '/register-room'}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    Đăng ký phòng
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
