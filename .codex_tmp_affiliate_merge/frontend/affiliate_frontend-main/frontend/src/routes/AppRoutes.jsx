import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout wrappers
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';

// Session route gates
import ProtectedRoutes from './ProtectedRoutes';
import PublicRoutes from './PublicRoutes';

// Pages - Auth
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import CustomerRegister from '../pages/auth/CustomerRegister';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Pages - Dashboard & Analytics
import DashboardHome from '../pages/dashboard/DashboardHome';

// Pages - Referrals
import ReferralsList from '../pages/referrals/ReferralsList';
import ReferralDetails from '../pages/referrals/ReferralDetails';

// Pages - Referral Links
import ReferralLinkPage from '../pages/referral-links/ReferralLinkPage';

// Pages - Earnings & Payouts
import EarningsOverview from '../pages/earnings/EarningsOverview';
import PaymentHistory from '../pages/payments/PaymentHistory';
import TransactionDetails from '../pages/payments/TransactionDetails';
import InvoicePage from '../pages/payments/InvoicePage';

// Pages - Profiles & Settings
import ProfilePage from '../pages/profile/ProfilePage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import AppearanceSettings from '../pages/settings/AppearanceSettings';

export const AppRoutes = () => {
  return (
    <Routes>
      
      <Route path="/register" element={<CustomerRegister />} />

      {/* Auth Public Gateway Routes */}
      <Route
        path="/auth/*"
        element={
          <PublicRoutes>
            <AuthLayout>
              <Routes>
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="*" element={<Navigate to="login" replace />} />
              </Routes>
            </AuthLayout>
          </PublicRoutes>
        }
      />

      {/* Internal Secured Dashboard Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoutes>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<DashboardHome />} />
                <Route path="referrals" element={<ReferralsList />} />
                <Route path="referrals/:id" element={<ReferralDetails />} />
                <Route path="referral-links" element={<ReferralLinkPage />} />
                <Route path="earnings" element={<EarningsOverview />} />
                <Route path="payments" element={<PaymentHistory />} />
                <Route path="payments/:id" element={<TransactionDetails />} />
                <Route path="payments/invoice/:id" element={<InvoicePage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<AppearanceSettings />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoutes>
        }
      />

    </Routes>
  );
};

export default AppRoutes;
