import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import logo from '../assets/logo3.png';
import './Header.css';

const Header: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
            <div className="header-container">
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                    <img src={logo} alt="Rewire With Kajal Logo" style={{ height: '50px', maxHeight: '50px', width: 'auto', objectFit: 'contain' }} />
                </Link>

                <nav className="header-nav">
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
            </div>
        </header>
    );
};

export default Header;
