import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const Preloader: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            setLoading(false);
        }, 800); // Adjust time as needed

        return () => clearTimeout(timer);
    }, [location.pathname]);

    if (!loading) return null;

    return (
        <div className="preloader-overlay">
            <div className="spinner">
                <div className="double-bounce1"></div>
                <div className="double-bounce2"></div>
            </div>
        </div>
    );
};

export default Preloader;
