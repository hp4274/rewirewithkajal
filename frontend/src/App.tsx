import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import AboutPage from './pages/AboutPage';
import Blogs from './pages/Blogs';
import Appointment from './pages/Appointment';
import AdminLogin from './admin/AdminLogin';
import Admin from './admin/Admin';
import CustomerProfile from './admin/CustomerProfile';
import CustomerFormDetails from './admin/CustomerFormDetails';
import IntakeForm from './pages/IntakeForm';
import AnimatedBackground from './components/AnimatedBackground';
import Footer from './components/Footer';
import Preloader from './components/Preloader';
import './styles/global.css';
import './styles/animations.css';

const ConditionalFooter = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) {
    return null;
  }
  return <Footer />;
};

function App() {
  return (
    <Router>
      <Preloader />
      <div className="app-container">
        <AnimatedBackground />
        {/* Header will appear on all non-admin pages for now */}
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
      <ConditionalFooter />
    </Router>
  );
}

export default App;
