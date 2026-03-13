import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo3.png';

const Header: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!mobileMenuOpen) {
            document.body.style.overflow = '';
            return;
        }

        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    const closeMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <>
            <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
                <div className="header-container">
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                        <img src={logo} alt="Rewire With Kajal Logo" width={180} height={50} loading="eager" fetchPriority="high" decoding="async" style={{ height: '50px', maxHeight: '50px', width: 'auto', objectFit: 'contain' }} />
                    </Link>

                    <nav className="header-nav" aria-label="Main navigation">
                        <ul>
                            <li>
                                <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
                            </li>
                            <li>
                                <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>About</NavLink>
                            </li>
                            <li>
                                <NavLink to="/blogs" className={({ isActive }) => isActive ? 'active' : ''}>Blogs</NavLink>
                            </li>
                        </ul>
                    </nav>

                    <div className="header-cta">
                        <Link to="/appointment" className="btn-primary">
                            Book Appointment
                        </Link>
                    </div>

                    <button
                        type="button"
                        className={`mobile-menu-toggle ${mobileMenuOpen ? 'is-open' : ''}`}
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={mobileMenuOpen}
                        onClick={() => setMobileMenuOpen((open) => !open)}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </header>

            {mobileMenuOpen && (
                <>
                    <div
                        className="mobile-sidebar-overlay show"
                        onClick={closeMenu}
                    />

                    <aside className="mobile-sidebar open" role="dialog" aria-modal="true" aria-label="Mobile menu">
                        <div className="mobile-sidebar-top">
                            <p className="mobile-sidebar-brand">Rewirewithkajal</p>

                            <nav className="mobile-sidebar-nav" aria-label="Mobile navigation">
                                <NavLink to="/" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
                                <NavLink to="/about" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>About</NavLink>
                                <NavLink to="/blogs" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Blogs</NavLink>
                                <NavLink to="/appointment" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Book Appointment</NavLink>
                            </nav>
                        </div>

                        <div className="mobile-sidebar-contact">
                            <p>Contact</p>
                            <a href="tel:+15551234567">+1 (555) 123-4567</a>
                            <a href="mailto:hello@rewirewithkajal.com">hello@rewirewithkajal.com</a>
                        </div>
                    </aside>
                </>
            )}
        </>
    );
};

export default Header;
