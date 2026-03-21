import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './styles/global.css';

const Home = lazy(() => import('./pages/Home'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const Blogs = lazy(() => import('./pages/Blogs'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const Appointment = lazy(() => import('./pages/Appointment'));
const AdminLogin = lazy(() => import('./admin/AdminLogin'));
const Admin = lazy(() => import('./admin/Admin'));
const CustomerProfile = lazy(() => import('./admin/CustomerProfile'));
const CustomerFormDetails = lazy(() => import('./admin/CustomerFormDetails'));
const IntakeForm = lazy(() => import('./pages/IntakeForm'));
const AnimatedBackground = lazy(() => import('./components/AnimatedBackground'));
const Footer = lazy(() => import('./components/Footer'));
const Preloader = lazy(() => import('./components/Preloader'));

const PublicRouteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main id="main-content" tabIndex={-1}>
    {children}
  </main>
);

const RoutedAppShell = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const shouldShowAnimatedBackground = !isAdminRoute && location.pathname !== '/' && location.pathname !== '/appointment' && location.pathname !== '/intake-form';

  return (
    <>
      {!isAdminRoute && <Preloader />}
      <div className="app-container">
        {shouldShowAnimatedBackground && <AnimatedBackground />}
        <Routes>
          <Route path="/" element={<PublicRouteLayout><Home /></PublicRouteLayout>} />
          <Route path="/about" element={<PublicRouteLayout><AboutPage /></PublicRouteLayout>} />
          <Route path="/blogs" element={<PublicRouteLayout><Blogs /></PublicRouteLayout>} />
          <Route path="/blogs/:id" element={<PublicRouteLayout><BlogDetail /></PublicRouteLayout>} />
          <Route path="/appointment" element={<PublicRouteLayout><Appointment /></PublicRouteLayout>} />
          <Route path="/intake-form" element={<PublicRouteLayout><IntakeForm /></PublicRouteLayout>} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/customer/:id" element={<CustomerProfile />} />
          <Route path="/admin/customer/:id/form/:formId" element={<CustomerFormDetails />} />
          <Route path="/admin/*" element={<Admin />} />
        </Routes>
      </div>
      {!isAdminRoute && <Footer />}
    </>
  );
};

function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FFFAF0' }} />}>
        <RoutedAppShell />
      </Suspense>
    </Router>
  );
}

export default App;
