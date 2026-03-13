import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo3.png';

const Header: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuToggleRef = useRef<HTMLButtonElement | null>(null);
    const mobileDrawerRef = useRef<HTMLElement | null>(null);
    const location = useLocation();

    const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
        const selectors = [
            'a[href]',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ];
        return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(',')))
            .filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
    };

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

    useEffect(() => {
        if (!mobileMenuOpen) return;

        const drawer = mobileDrawerRef.current;
        if (!drawer) return;

        const focusables = getFocusableElements(drawer);
        if (focusables.length > 0) {
            focusables[0].focus();
        } else {
            drawer.focus();
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (!mobileMenuOpen) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                closeMenu(true);
                return;
            }

            if (event.key !== 'Tab') return;

            const currentDrawer = mobileDrawerRef.current;
            if (!currentDrawer) return;

            const drawerFocusables = getFocusableElements(currentDrawer);
            if (drawerFocusables.length === 0) {
                event.preventDefault();
                currentDrawer.focus();
                return;
            }

            const firstElement = drawerFocusables[0];
            const lastElement = drawerFocusables[drawerFocusables.length - 1];
            const activeElement = document.activeElement as HTMLElement | null;

            if (event.shiftKey) {
                if (activeElement === firstElement || !currentDrawer.contains(activeElement)) {
                    event.preventDefault();
                    lastElement.focus();
                }
                return;
            }

            if (activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [mobileMenuOpen]);

    const closeMenu = (restoreFocus = false) => {
        setMobileMenuOpen(false);
        if (restoreFocus) {
            requestAnimationFrame(() => {
                menuToggleRef.current?.focus();
            });
        }
    };

    return (
        <>
            <a href="#main-content" className="skip-link">Skip to main content</a>
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
                        ref={menuToggleRef}
                        className={`mobile-menu-toggle ${mobileMenuOpen ? 'is-open' : ''}`}
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-nav-drawer"
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
                        onClick={() => closeMenu(true)}
                    />

                    <aside
                        id="mobile-nav-drawer"
                        ref={mobileDrawerRef}
                        className="mobile-sidebar open"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobile menu"
                        tabIndex={-1}
                    >
                        <div className="mobile-sidebar-top">
                            <p className="mobile-sidebar-brand">Rewirewithkajal</p>

                            <nav className="mobile-sidebar-nav" aria-label="Mobile navigation">
                                <NavLink to="/" onClick={() => closeMenu()} className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
                                <NavLink to="/about" onClick={() => closeMenu()} className={({ isActive }) => isActive ? 'active' : ''}>About</NavLink>
                                <NavLink to="/blogs" onClick={() => closeMenu()} className={({ isActive }) => isActive ? 'active' : ''}>Blogs</NavLink>
                                <NavLink to="/appointment" onClick={() => closeMenu()} className={({ isActive }) => isActive ? 'active' : ''}>Book Appointment</NavLink>
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
