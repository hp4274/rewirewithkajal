import React from 'react';
import { NavLink } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Linkedin, Twitter } from 'lucide-react';
import logo from '../assets/logo3.png'; // Reusing the logo

const Footer: React.FC = () => {
    return (
        <footer className="site-footer">
            {/* Wavy Top SVG */}
            <div className="footer-wave">
                <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C79.86,125.75,198.43,80.7,321.39,56.44Z" className="shape-fill"></path>
                </svg>
            </div>

            <div className="container footer-container">
                {/* Brand Column */}
                <div className="footer-col brand-col">
                    <img src={logo} alt="Rewire With Kajal" className="footer-logo" loading="lazy" decoding="async" />
                    <p className="footer-description">
                        Dedicated to helping you navigate life's complexities with compassion and professional guidance.
                    </p>
                </div>

                {/* Quick Links Column */}
                <div className="footer-col links-col">
                    <h4 className="footer-heading">Quick Links</h4>
                    <ul className="footer-links">
                        <li><NavLink to="/">Home</NavLink></li>
                        <li><NavLink to="/about">About Us</NavLink></li>
                        <li><NavLink to="/blogs">Blog Insights</NavLink></li>
                        <li><NavLink to="/appointment">Contact</NavLink></li>
                    </ul>
                </div>

                {/* Contact Column */}
                <div className="footer-col contact-col">
                    <h4 className="footer-heading">Get in Touch</h4>
                    <ul className="footer-contact-info">
                        <li>
                            <MapPin size={16} className="contact-icon" />
                            <span>123 Therapy Lane, Wellness City, ST 12345</span>
                        </li>
                        <li>
                            <Phone size={16} className="contact-icon" />
                            <span>(555) 123-4567</span>
                        </li>
                        <li>
                            <Mail size={16} className="contact-icon" />
                            <span>hello@rewirewithkajal.com</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="footer-bottom">
                <div className="container footer-bottom-inner">
                    <p>&copy; {new Date().getFullYear()} Rewire With Kajal. All rights reserved.</p>
                    <div className="social-links">
                        <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><Instagram size={18} /></a>
                        <a href="https://linkedin.com" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><Linkedin size={18} /></a>
                        <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noopener noreferrer"><Twitter size={18} /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
