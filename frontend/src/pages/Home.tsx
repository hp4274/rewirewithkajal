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

    return (
        <div ref={sectionRef} className="reveal" data-section={sectionName}>
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
        <main className="home-sections">
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
