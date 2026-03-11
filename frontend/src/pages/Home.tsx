import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';

const HeroSlider = lazy(() => import('../components/HeroSlider'));
const ProblemSlider = lazy(() => import('../components/CombinedSlider'));
const OffersSection = lazy(() => import('../components/OffersSection'));
const FAQSection = lazy(() => import('../components/FAQSection'));
const HomeBlogs = lazy(() => import('../components/HomeBlogs'));
const AppointmentForm = lazy(() => import('../components/AppointmentForm'));

const SectionFallback = () => <div style={{ minHeight: '180px' }} aria-hidden="true" />;

type DeferredSectionProps = {
    children: React.ReactNode;
    eager?: boolean;
    sectionName: string;
};

const DeferredSection: React.FC<DeferredSectionProps> = ({ children, eager = false, sectionName }) => {
    const sectionRef = useRef<HTMLDivElement | null>(null);
    const [shouldMount, setShouldMount] = useState(eager);

    useEffect(() => {
        const sectionEl = sectionRef.current;
        if (!sectionEl) return;

        if (eager) {
            sectionEl.classList.add('active');
            setShouldMount(true);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('active');
                setShouldMount(true);
                observer.unobserve(entry.target);
            });
        }, {
            root: null,
            rootMargin: '300px 0px',
            threshold: 0.1,
        });

        observer.observe(sectionEl);

        return () => {
            observer.disconnect();
        };
    }, [eager]);

    useEffect(() => {
        const sectionEl = sectionRef.current;
        if (!sectionEl) return;

        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const applyStaticStyle = () => {
            sectionEl.style.setProperty('--roller-scale', '1');
            sectionEl.style.setProperty('--roller-opacity', '1');
            sectionEl.style.setProperty('--roller-tilt', '0deg');
            sectionEl.style.setProperty('--roller-blur', '0px');
        };

        if (reducedMotionQuery.matches) {
            applyStaticStyle();
            return;
        }

        let frameId = 0;

        const updateRollerStyle = () => {
            frameId = 0;

            const rect = sectionEl.getBoundingClientRect();
            const viewportCenter = window.innerHeight / 2;
            const sectionCenter = rect.top + rect.height / 2;
            const centerOffset = sectionCenter - viewportCenter;
            const distance = Math.abs(centerOffset);
            const maxDistance = Math.max(window.innerHeight * 0.72, 1);
            const normalized = Math.min(distance / maxDistance, 1);
            const focus = 1 - normalized;
            const scale = 0.86 + focus * 0.14;
            const opacity = 0.52 + focus * 0.48;
            const tilt = (centerOffset < 0 ? 1 : -1) * normalized * 8;
            const blur = normalized * 1.2;

            sectionEl.style.setProperty('--roller-scale', scale.toFixed(3));
            sectionEl.style.setProperty('--roller-opacity', opacity.toFixed(3));
            sectionEl.style.setProperty('--roller-tilt', `${tilt.toFixed(2)}deg`);
            sectionEl.style.setProperty('--roller-blur', `${blur.toFixed(2)}px`);
        };

        const queueUpdate = () => {
            if (frameId !== 0) return;
            frameId = window.requestAnimationFrame(updateRollerStyle);
        };

        const handleMotionChange = () => {
            if (reducedMotionQuery.matches) {
                applyStaticStyle();
                return;
            }
            queueUpdate();
        };

        // Always set initial state for the roller animation
        updateRollerStyle();

        window.addEventListener('scroll', queueUpdate, { passive: true });
        window.addEventListener('resize', queueUpdate);

        if (typeof reducedMotionQuery.addEventListener === 'function') {
            reducedMotionQuery.addEventListener('change', handleMotionChange);
        } else {
            reducedMotionQuery.addListener(handleMotionChange);
        }

        return () => {
            if (frameId !== 0) {
                window.cancelAnimationFrame(frameId);
            }

            window.removeEventListener('scroll', queueUpdate);
            window.removeEventListener('resize', queueUpdate);

            if (typeof reducedMotionQuery.removeEventListener === 'function') {
                reducedMotionQuery.removeEventListener('change', handleMotionChange);
            } else {
                reducedMotionQuery.removeListener(handleMotionChange);
            }
        };
    }, []);

    return (
        <div ref={sectionRef} className="reveal roller-section" data-section={sectionName}>
            {shouldMount ? (
                <Suspense fallback={<SectionFallback />}>
                    {children}
                </Suspense>
            ) : (
                <SectionFallback />
            )}
        </div>
    );
};

const Home: React.FC = () => {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });

        void import('../components/HomeBlogs')
            .then((module) => {
                module.primeHomeBlogsRequest?.();
            })
            .catch(() => {
                // Non-blocking prefetch; section will still load on demand.
            });
    }, []);

    return (
        <main className="home-roller" style={{ display: 'flex', flexDirection: 'column', gap: '120px', paddingBottom: '120px' }}>
            <DeferredSection eager sectionName="hero-slider">
                <HeroSlider />
            </DeferredSection>
            <DeferredSection sectionName="combined-slider">
                <ProblemSlider />
            </DeferredSection>
            <DeferredSection sectionName="offers-section">
                <OffersSection />
            </DeferredSection>
            <DeferredSection sectionName="mental-health-journey">
                <FAQSection />
            </DeferredSection>
            <DeferredSection sectionName="latest-insights">
                <HomeBlogs />
            </DeferredSection>
            <DeferredSection sectionName="appointment-form">
                <AppointmentForm />
            </DeferredSection>
        </main>
    );
};

export default Home;
