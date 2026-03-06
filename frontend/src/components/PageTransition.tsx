import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

interface PageTransitionProps {
    children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
    const location = useLocation();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [displayChildren, setDisplayChildren] = useState(children);
    const [transitionPhase, setTransitionPhase] = useState<'idle' | 'cover' | 'reveal'>('idle');
    const prevPathRef = useRef(location.pathname);

    useEffect(() => {
        if (prevPathRef.current !== location.pathname) {
            prevPathRef.current = location.pathname;
            setIsTransitioning(true);
            setTransitionPhase('cover');

            // Phase 1: Cover screen with overlay (700ms — slow, smooth)
            const coverTimer = setTimeout(() => {
                setDisplayChildren(children);
                setTransitionPhase('reveal');
                window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
            }, 700);

            // Phase 2: Reveal new page (700ms after reveal starts = 1400ms total)
            const revealTimer = setTimeout(() => {
                setTransitionPhase('idle');
                setIsTransitioning(false);
            }, 1400);

            return () => {
                clearTimeout(coverTimer);
                clearTimeout(revealTimer);
            };
        } else {
            setDisplayChildren(children);
        }
    }, [location.pathname, children]);

    return (
        <>
            {/* Transition Overlay */}
            {isTransitioning && (
                <div className={`page-transition-overlay ${transitionPhase}`}>
                    <div className="transition-slice slice-1" />
                    <div className="transition-slice slice-2" />
                    <div className="transition-slice slice-3" />
                    <div className="transition-loader">
                        <div className="loader-dot" />
                        <div className="loader-dot" />
                        <div className="loader-dot" />
                    </div>
                </div>
            )}

            {/* Page Content */}
            <div className={`page-content ${transitionPhase === 'reveal' ? 'page-entering' : ''}`}>
                {displayChildren}
            </div>
        </>
    );
};

export default PageTransition;
