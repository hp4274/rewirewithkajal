import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppointmentForm from '../components/AppointmentForm';

const Appointment: React.FC = () => {
    const navigate = useNavigate();

    const handleAccessForm = () => {
        navigate(`/intake-form`);
    };

    return (
        <main style={{ paddingTop: '100px', paddingBottom: '80px' }}>
            <div className="container text-center section-header">
                <h2>Book Your Session</h2>
                <p className="subtitle" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    Begin your journey of emotional rewiring by sharing a little bit about yourself and what you're looking for.
                </p>
            </div>

            <AppointmentForm />

            {/* Direct access to hidden form */}
            <div className="container" style={{ marginTop: '80px', maxWidth: '600px' }}>
                <div style={{ padding: '40px', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-soft)', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '16px', color: 'var(--color-primary-dark)' }}>Ready to become a patient?</h3>
                    <p style={{ color: 'var(--color-text-light)', marginBottom: '24px', fontSize: '0.95rem' }}>If you are ready to book a consultation, please answer our highly detailed Intake Questionnaires to help us prepare.</p>
                    <button onClick={handleAccessForm} className="btn-primary" style={{ whiteSpace: 'nowrap', padding: '15px 30px' }}>Access Intake Form</button>
                </div>
            </div>
        </main>
    );
};

export default Appointment;
