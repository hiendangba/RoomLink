import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RoomRegistrationPage from './pages/room/RoomRegistrationPage';
import EditProfilePage from './pages/profile/EditProfilePage';
import FaceRegistrationPage from './pages/auth/FaceRegistrationPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import RoomExtensionPage from './pages/room/RoomExtensionPage';
import RoomTransferPage from './pages/room/RoomTransferPage';
import RoomCancellationPage from './pages/room/RoomCancellationPage';
import BillsViewPage from './pages/billing/BillsViewPage';
import FeesViewPage from './pages/billing/FeesViewPage';
import PaymentPage from './pages/billing/PaymentPage';
import StudentPage from './pages/StudentPage';
import AdminPage from './pages/AdminPage';
import HealthCheckupRegistrationPage from './pages/health/HealthCheckupRegistrationPage';
import VehicleRegistrationPage from './pages/vehicle/VehicleRegistrationPage';
import ExtensionApprovalPage from './pages/admin/ExtensionApprovalPage';
import RoomRegistrationApprovalPage from './pages/admin/RoomRegistrationApprovalPage';
import RoomCancellationApprovalPage from './pages/admin/RoomCancellationApprovalPage';
import VehicleRegistrationApprovalPage from './pages/admin/VehicleRegistrationApprovalPage';
import RoomTypeManagementPage from './pages/admin/RoomTypeManagementPage';
import CreateAdminAccountPage from './pages/admin/CreateAdminAccountPage';
import RoomManagementPage from './pages/admin/RoomManagementPage';
import RoomTransferApprovalPage from './pages/admin/RoomTransferApprovalPage';
import ElectricityWaterBillCreationPage from './pages/admin/ElectricityWaterBillCreationPage';
import HealthCheckupCreationPage from './pages/admin/HealthCheckupCreationPage';
import UIComponentsDemo from './components/demo/UIComponentsDemo';
import HealthCheckListPage from './pages/admin/HealthCheckupAdminPage';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';


function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register-room" element={<RoomRegistrationPageWrapper />} />
            <Route path="/edit-profile" element={<EditProfilePageWrapper />} />
            <Route path="/register-face" element={<FaceRegistrationPageWrapper />} />
            <Route path="/change-password" element={<ChangePasswordPageWrapper />} />
            <Route path="/forgot-password" element={<ForgotPasswordPageWrapper />} />
            <Route path="/room-extension" element={<RoomExtensionPageWrapper />} />
            <Route path="/room-transfer" element={<RoomTransferPageWrapper />} />
            <Route path="/room-cancellation" element={<RoomCancellationPageWrapper />} />
            <Route path="/bills" element={<BillsViewPageWrapper />} />
            <Route path="/fees" element={<FeesViewPageWrapper />} />
            <Route path="/payment" element={<PaymentPageWrapper />} />
            <Route path="/student" element={<StudentPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/health-checkup" element={<HealthCheckupRegistrationPageWrapper />} />
            <Route path="/vehicle-registration" element={<VehicleRegistrationPageWrapper />} />
            <Route path="/extension-approval" element={<ExtensionApprovalPageWrapper />} />
            <Route path="/room-registration-approval" element={<RoomRegistrationApprovalPageWrapper />} />
            <Route path="/room-cancellation-approval" element={<RoomCancellationApprovalPageWrapper />} />
            <Route path="/vehicle-registration-approval" element={<VehicleRegistrationApprovalPageWrapper />} />
            <Route path="/room-type-management" element={<RoomTypeManagementPageWrapper />} />
            <Route path="/create-admin-account" element={<CreateAdminAccountPageWrapper />} />
            <Route path="/room-management" element={<RoomManagementPageWrapper />} />
            <Route path="/room-transfer-approval" element={<RoomTransferApprovalPageWrapper />} />
            <Route path="/electricity-water-bill-creation" element={<ElectricityWaterBillCreationPageWrapper />} />
            <Route path="/health-checkup-admin" element={<HealthCheckupAdminPageWrapper />} />
            <Route path="/health-checkup-creation" element={<HealthCheckupCreationPageWrapper />} />
            <Route path="/ui-demo" element={<UIComponentsDemoWrapper />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}

// Room Registration Page Wrapper
const RoomRegistrationPageWrapper = () => {
  return <RoomRegistrationPage />;
};

// Edit Profile Page Wrapper
const EditProfilePageWrapper = () => {
  const handleSuccess = (updatedProfile) => {
    console.log('Profile updated successfully:', updatedProfile);
    window.location.href = '/student';
  };

  const handleCancel = () => {
    window.location.href = '/student';
  };

  return (
    <EditProfilePage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Face Registration Page Wrapper
const FaceRegistrationPageWrapper = () => {
  const handleSuccess = () => {
    console.log('Face registration successful');
    window.location.href = '/student';
  };

  const handleCancel = () => {
    window.location.href = '/student';
  };

  return (
    <FaceRegistrationPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Change Password Page Wrapper
const ChangePasswordPageWrapper = () => {
  const handleSuccess = () => {
    console.log('Password changed successfully');
    alert('Mật khẩu đã được thay đổi thành công!');
    window.location.href = '/student';
  };

  const handleCancel = () => {
    window.location.href = '/student';
  };

  return (
    <ChangePasswordPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Forgot Password Page Wrapper
const ForgotPasswordPageWrapper = () => {
  const handleSuccess = (user) => {
    console.log('Forgot password process completed:', user);
    alert('Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập lại.');
    window.location.href = '/login';
  };

  const handleCancel = () => {
    window.location.href = '/login';
  };

  return (
    <ForgotPasswordPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Room Extension Page Wrapper
const RoomExtensionPageWrapper = () => {
  const handleSuccess = (updatedContract) => {
    console.log('Room extension successful:', updatedContract);
    window.location.href = '/student';
  };

  const handleCancel = () => {
    window.location.href = '/student';
  };

  return (
    <RoomExtensionPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Room Transfer Page Wrapper
const RoomTransferPageWrapper = () => {
  const handleSuccess = (transferData) => {
    console.log('Room transfer successful:', transferData);
    window.location.href = '/student';
  };

  const handleCancel = () => {
    window.location.href = '/student';
  };

  return (
    <RoomTransferPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Room Cancellation Page Wrapper
const RoomCancellationPageWrapper = () => {
  const handleSuccess = (cancellationData) => {
    console.log('Room cancellation successful:', cancellationData);
    window.location.href = '/student';
  };

  const handleCancel = () => {
    window.location.href = '/student';
  };

  return (
    <RoomCancellationPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Bills View Page Wrapper
const BillsViewPageWrapper = () => {
  const handleCancel = () => {
    window.location.href = '/student';
  };

  return (
    <BillsViewPage
      onCancel={handleCancel}
    />
  );
};

// Fees View Page Wrapper
const FeesViewPageWrapper = () => {
  const handleCancel = () => {
    window.location.href = '/student';
  };

  return (
    <FeesViewPage
      onCancel={handleCancel}
    />
  );
};

// Payment Page Wrapper
const PaymentPageWrapper = () => {
  const { showSuccess } = useNotification();

  const handleSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    showSuccess('Thanh toán thành công!');
    setTimeout(() => {
      window.location.href = '/student';
    }, 1500);
  };

  const handleCancel = () => {
    window.location.href = '/student';
  };

  return (
    <PaymentPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Health Checkup Registration Page Wrapper
const HealthCheckupRegistrationPageWrapper = () => {
  const { showSuccess } = useNotification();

  const handleSuccess = (registrationData) => {
    console.log('Health checkup registration successful:', registrationData);
    showSuccess('Đăng ký khám sức khỏe thành công!');
    setTimeout(() => {
      window.location.href = '/student';
    }, 1500);
  };

  const handleCancel = () => {
    window.location.href = '/student';
  };

  return (
    <HealthCheckupRegistrationPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Vehicle Registration Page Wrapper
const VehicleRegistrationPageWrapper = () => {
  const { showSuccess } = useNotification();

  const handleSuccess = (vehicleData) => {
    console.log('Vehicle registration successful:', vehicleData);
    showSuccess('Đăng ký biển số xe thành công!');
    setTimeout(() => {
      window.location.href = '/student';
    }, 1500);
  };

  const handleCancel = () => {
    window.location.href = '/student';
  };

  return (
    <VehicleRegistrationPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Extension Approval Page Wrapper
const ExtensionApprovalPageWrapper = () => {
  const { showSuccess } = useNotification();

  const handleSuccess = (approvalData) => {
    console.log('Extension approval successful:', approvalData);
    showSuccess('Duyệt đơn gia hạn thành công!');
    setTimeout(() => {
      window.location.href = '/admin';
    }, 1500);
  };

  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <ExtensionApprovalPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Room Registration Approval Page Wrapper
const RoomRegistrationApprovalPageWrapper = () => {
  const { showSuccess } = useNotification();

  const handleSuccess = (approvalData) => {
    console.log('Room registration approval successful:', approvalData);
    showSuccess('Duyệt đơn đăng ký KTX thành công!');
    setTimeout(() => {
      window.location.href = '/admin';
    }, 1500);
  };

  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <RoomRegistrationApprovalPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Room Cancellation Approval Page Wrapper
const RoomCancellationApprovalPageWrapper = () => {
  const { showSuccess } = useNotification();

  const handleSuccess = (approvalData) => {
    console.log('Room cancellation approval successful:', approvalData);
    showSuccess('Duyệt đơn hủy phòng KTX thành công!');
    setTimeout(() => {
      window.location.href = '/admin';
    }, 1500);
  };

  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <RoomCancellationApprovalPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Vehicle Registration Approval Page Wrapper
const VehicleRegistrationApprovalPageWrapper = () => {
  const { showSuccess } = useNotification();

  const handleSuccess = (approvalData) => {
    console.log('Vehicle registration approval successful:', approvalData);
    showSuccess('Duyệt đơn đăng ký xe thành công!');
    setTimeout(() => {
      window.location.href = '/admin';
    }, 1500);
  };

  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <VehicleRegistrationApprovalPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Room Type Management Page Wrapper
const RoomTypeManagementPageWrapper = () => {
  const { showSuccess } = useNotification();

  const handleSuccess = (managementData) => {
    console.log('Room type management successful:', managementData);
    showSuccess('Quản lý loại phòng thành công!');
    setTimeout(() => {
      window.location.href = '/admin';
    }, 1500);
  };

  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <RoomTypeManagementPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Create Admin Account Page Wrapper
const CreateAdminAccountPageWrapper = () => {
  const { showSuccess } = useNotification();

  const handleSuccess = (adminData) => {
    console.log('Admin account created successfully:', adminData);
    showSuccess('Tạo tài khoản Admin thành công!');
    setTimeout(() => {
      window.location.href = '/admin';
    }, 1500);
  };

  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <CreateAdminAccountPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Room Transfer Approval Page Wrapper
const RoomTransferApprovalPageWrapper = () => {
  const { showSuccess } = useNotification();

  const handleSuccess = (approvalData) => {
    console.log('Room transfer approval successful:', approvalData);
    showSuccess('Duyệt đơn chuyển phòng KTX thành công!');
    setTimeout(() => {
      window.location.href = '/admin';
    }, 1500);
  };

  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <RoomTransferApprovalPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Electricity Water Bill Creation Page Wrapper
const ElectricityWaterBillCreationPageWrapper = () => {
  const { showSuccess } = useNotification();

  const handleSuccess = (billData) => {
    console.log('Electricity water bill creation successful:', billData);
    showSuccess('Tạo hóa đơn điện nước thành công!');
    setTimeout(() => {
      window.location.href = '/admin';
    }, 1500);
  };

  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <ElectricityWaterBillCreationPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// Health Checkup Creation Page Wrapper
const HealthCheckupAdminPageWrapper = () => {

  // hủy thì quay lại trang admin 
  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <HealthCheckListPage
      onCancel={handleCancel}
    />
  );
};


const HealthCheckupCreationPageWrapper = () => {
  const { showSuccess } = useNotification();
  const handleSuccess = (healthCheckData) => {
    console.log('Success:', healthCheckData);
    showSuccess('Thêm đợt khám thành công!');
    setTimeout(() => {
      window.location.href = '/health-checkup-admin';
    }, 1500);
  }
  const handleCancel = () => {
    window.location.href = '/health-checkup-admin';
  };
  return (
    < HealthCheckupCreationPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}

// Room Management Page Wrapper
const RoomManagementPageWrapper = () => {
  const { showSuccess } = useNotification();

  const handleSuccess = (roomData) => {
    console.log('Room management successful:', roomData);
    showSuccess('Quản lý phòng thành công!');
    setTimeout(() => {
      window.location.href = '/admin';
    }, 1500);
  };

  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <RoomManagementPage
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

// UI Components Demo Wrapper
const UIComponentsDemoWrapper = () => {
  const { showSuccess } = useNotification();

  const handleSuccess = () => {
    showSuccess('Demo hoàn thành!');
    setTimeout(() => {
      window.location.href = '/admin';
    }, 1500);
  };

  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <UIComponentsDemo
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

export default App;