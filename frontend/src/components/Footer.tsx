import React from 'react';
import { NavLink } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Linkedin, Twitter } from 'lucide-react';
import logo from '../assets/logo3.png'; // Reusing the logo

const Footer: React.FC = () => {
    return (
        <footer className="site-footer">
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
                    <h3 className="footer-heading">Quick Links</h3>
                    <ul className="footer-links">
                        <li><NavLink to="/">Home</NavLink></li>
                        <li><NavLink to="/about">About Us</NavLink></li>
                        <li><NavLink to="/blogs">Blog Insights</NavLink></li>
                        <li><NavLink to="/appointment">Contact</NavLink></li>
                    </ul>
                </div>

                {/* Contact Column */}
                <div className="footer-col contact-col">
                    <h3 className="footer-heading">Get in Touch</h3>
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
