import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { userApi } from './api';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RoomRegistrationPage from './pages/room/RoomRegistrationPage';
import EditProfilePage from './pages/profile/EditProfilePage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import RoomExtensionPage from './pages/room/RoomExtensionPage';
import RoomTransferPage from './pages/room/RoomTransferPage';
import RoomCancellationPage from './pages/room/RoomCancellationPage';
import RoomInfoPage from './pages/room/RoomInfoPage';
import RenewalManagementPage from './pages/admin/RenewalManagementPage';
import BillsViewPage from './pages/billing/BillsViewPage';
import PaymentPage from './pages/billing/PaymentPage';
import StudentPage from './pages/StudentPage';
import AdminPage from './pages/AdminPage';
import HealthCheckupRegistrationPage from './pages/health/HealthCheckupRegistrationPage';
import VehicleRegistrationPage from './pages/vehicle/VehicleRegistrationPage';
import PlateDetectionPage from './pages/vehicle/PlateDetectionPage';
import ExtensionApprovalPage from './pages/admin/ExtensionApprovalPage';
import RoomRegistrationApprovalPage from './pages/admin/RoomRegistrationApprovalPage';
import RoomCancellationApprovalPage from './pages/admin/RoomCancellationApprovalPage';
import VehicleRegistrationApprovalPage from './pages/admin/VehicleRegistrationApprovalPage';
import RoomTypeManagementPage from './pages/admin/RoomTypeManagementPage';
import CreateAdminAccountPage from './pages/admin/CreateAdminAccountPage';
import RoomManagementPage from './pages/admin/RoomManagementPage';
import BuildingManagementPage from './pages/admin/BuildingManagementPage';
import RoomTransferApprovalPage from './pages/admin/RoomTransferApprovalPage';
import ElectricityWaterBillCreationPage from './pages/admin/ElectricityWaterBillCreationPage';
import HealthCheckUpManagementPage from './pages/admin/HealthCheckUpManagementPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';


function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <ProtectedRoute>
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register-room" element={<RoomRegistrationPageWrapper />} />
            <Route path="/edit-profile" element={<EditProfilePageWrapper />} />
            <Route path="/change-password" element={<ChangePasswordPageWrapper />} />
            <Route path="/forgot-password" element={<ForgotPasswordPageWrapper />} />
            <Route path="/my-room-info" element={<RoomInfoPageWrapper />} />
            <Route path="/room-extension" element={<RoomExtensionPageWrapper />} />
            <Route path="/room-transfer" element={<RoomTransferPageWrapper />} />
            <Route path="/room-cancellation" element={<RoomCancellationPageWrapper />} />
            <Route path="/renewal" element={<RenewalManagementPageWrapper />} />
            <Route path="/bills" element={<BillsViewPageWrapper />} />
            <Route path="/payment" element={<PaymentPageWrapper />} />
            <Route path="/student" element={<StudentPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/health-checkup" element={<HealthCheckupRegistrationPageWrapper />} />
            <Route path="/vehicle-registration" element={<VehicleRegistrationPageWrapper />} />
            <Route path="/plate-detection" element={<PlateDetectionPageWrapper />} />
            <Route path="/extension-approval" element={<ExtensionApprovalPageWrapper />} />
            <Route path="/room-registration-approval" element={<RoomRegistrationApprovalPageWrapper />} />
            <Route path="/room-cancellation-approval" element={<RoomCancellationApprovalPageWrapper />} />
            <Route path="/vehicle-registration-approval" element={<VehicleRegistrationApprovalPageWrapper />} />
            <Route path="/room-type-management" element={<RoomTypeManagementPageWrapper />} />
            <Route path="/create-admin-account" element={<CreateAdminAccountPageWrapper />} />
            <Route path="/room-management" element={<RoomManagementPageWrapper />} />
            <Route path="/building-management" element={<BuildingManagementPageWrapper />} />
            <Route path="/room-transfer-approval" element={<RoomTransferApprovalPageWrapper />} />
            <Route path="/electricity-water-bill-creation" element={<ElectricityWaterBillCreationPageWrapper />} />
            <Route path="/health-checkup-management" element={<HealthCheckUpManagementPageWrapper />} />
            <Route path="*" element={<HomePage />} />
            </Routes>
          </ProtectedRoute>
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
  const handleCancel = () => {
    window.location.href = '/student';
  };
  return (
    <EditProfilePage
      onCancel={handleCancel}
    />
  );
};


// Change Password Page Wrapper
const ChangePasswordPageWrapper = () => {
  const { user, logout, login } = useAuth();

  const handleSuccess = async () => {
    console.log('Password changed successfully');
    
    const token = localStorage.getItem('token');
    
    if (token && user) {
      const updatedUser = {
        ...user,
        status: 'APPROVED_CHANGED'
      };
      
      login(updatedUser, token);
      
      const wasFirstTimeChange = user.status === 'APPROVED_NOT_CHANGED';
      
      if (wasFirstTimeChange) {
        window.location.href = '/';
      } else {
        // Otherwise, redirect based on user role
        if (updatedUser.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/student';
        }
      }
    } else {
      // Fallback: redirect based on current user data
      if (user && user.status === 'APPROVED_NOT_CHANGED') {
        window.location.href = '/';
      } else {
        if (user && user.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/student';
        }
      }
    }
  };

  const handleCancel = async () => {
    // If user hasn't changed password for the first time, logout and redirect to login
    if (user && user.status === 'APPROVED_NOT_CHANGED') {
      await logout();
      window.location.href = '/login';
    } else {
      // Otherwise, redirect based on user role
      if (user && user.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/student';
      }
    }
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
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
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

// Room Info Page Wrapper
const RoomInfoPageWrapper = () => {
  const handleCancel = () => {
    window.location.href = '/student';
  };

  return (
    <RoomInfoPage
      onCancel={handleCancel}
    />
  );
};

// Room Extension Page Wrapper
const RoomExtensionPageWrapper = () => {
  const handleSuccess = (updatedContract) => {
    console.log('Room extension successful:', updatedContract);
    setTimeout(() => {
      window.location.href = '/student';
    }, 1500);
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
    setTimeout(() => {
      window.location.href = '/student';
    }, 1500);
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
    setTimeout(() => {
      window.location.href = '/student';
    }, 1500);
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

// Renewal Management Page Wrapper
const RenewalManagementPageWrapper = () => {
  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <RenewalManagementPage
      onCancel={handleCancel}
    />
  );
};

// Bills View Page Wrapper
const BillsViewPageWrapper = () => {
  const { user } = useAuth();
  const handleCancel = () => {
    if (user?.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/student';
    }
  };

  return (
    <BillsViewPage
      onCancel={handleCancel}
    />
  );
};


// Payment Page Wrapper
const PaymentPageWrapper = () => {
  const handleSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
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
  const handleSuccess = (registrationData) => {
    console.log('Health checkup registration successful:', registrationData);
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
  const handleSuccess = (registrationData) => {
    console.log('Vehicle registration successful:', registrationData);
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

// Plate Detection Page Wrapper
const PlateDetectionPageWrapper = () => {
  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <PlateDetectionPage
      onCancel={handleCancel}
    />
  );
};

// Extension Approval Page Wrapper
const ExtensionApprovalPageWrapper = () => {
  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <ExtensionApprovalPage
      onCancel={handleCancel}
    />
  );
};

// Room Registration Approval Page Wrapper
const RoomRegistrationApprovalPageWrapper = () => {
  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <RoomRegistrationApprovalPage
      onCancel={handleCancel}
    />
  );
};

// Room Cancellation Approval Page Wrapper
const RoomCancellationApprovalPageWrapper = () => {
  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <RoomCancellationApprovalPage
      onCancel={handleCancel}
    />
  );
};

// Vehicle Registration Approval Page Wrapper
const VehicleRegistrationApprovalPageWrapper = () => {
  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <VehicleRegistrationApprovalPage
      onCancel={handleCancel}
    />
  );
};

// Room Type Management Page Wrapper
const RoomTypeManagementPageWrapper = () => {
  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <RoomTypeManagementPage
      onCancel={handleCancel}
    />
  );
};

// Create Admin Account Page Wrapper
const CreateAdminAccountPageWrapper = () => {
  const handleSuccess = (adminData) => {
    console.log('Admin account created successfully:', adminData);
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

  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <RoomTransferApprovalPage
      onCancel={handleCancel}
    />
  );
};

// Electricity Water Bill Creation Page Wrapper
const ElectricityWaterBillCreationPageWrapper = () => {
  const handleSuccess = (billData) => {
    console.log('Electricity water bill creation successful:', billData);
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

// Health Checkup Management Page Wrapper
const HealthCheckUpManagementPageWrapper = () => {
  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <HealthCheckUpManagementPage
      onCancel={handleCancel}
    />
  );
};

// Room Management Page Wrapper
const RoomManagementPageWrapper = () => {
  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <RoomManagementPage
      onCancel={handleCancel}
    />
  );
};

// Building Management Page Wrapper
const BuildingManagementPageWrapper = () => {
  const handleCancel = () => {
    window.location.href = '/admin';
  };

  return (
    <BuildingManagementPage
      onCancel={handleCancel}
    />
  );
};

export default App;