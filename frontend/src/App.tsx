import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './styles/global.css';
import './styles/animations.css';

const Header = lazy(() => import('./components/Header'));
const Home = lazy(() => import('./pages/Home'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const Blogs = lazy(() => import('./pages/Blogs'));
const Appointment = lazy(() => import('./pages/Appointment'));
const AdminLogin = lazy(() => import('./admin/AdminLogin'));
const Admin = lazy(() => import('./admin/Admin'));
const CustomerProfile = lazy(() => import('./admin/CustomerProfile'));
const CustomerFormDetails = lazy(() => import('./admin/CustomerFormDetails'));
const IntakeForm = lazy(() => import('./pages/IntakeForm'));
const AnimatedBackground = lazy(() => import('./components/AnimatedBackground'));
const Footer = lazy(() => import('./components/Footer'));
const Preloader = lazy(() => import('./components/Preloader'));

const RoutedAppShell = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Preloader />}
      <div className="app-container">
        {!isAdminRoute && <AnimatedBackground />}
        <Routes>
          <Route path="/" element={<><Header /><Home /></>} />
          <Route path="/about" element={<><Header /><AboutPage /></>} />
          <Route path="/blogs" element={<><Header /><Blogs /></>} />
          <Route path="/appointment" element={<><Header /><Appointment /></>} />
          <Route path="/intake-form" element={<><Header /><IntakeForm /></>} />

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
