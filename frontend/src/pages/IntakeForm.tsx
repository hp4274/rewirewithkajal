import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../components/AppointmentForm.css';
import {
    isDobNotFuture,
    isTodayOrFutureDate,
    isValidEmail,
    isValidMobile10,
    toDateInputString
} from '../utils/validation';

const q1Questions = [
    "Have you ever walked in your sleep during your adult life?",
    "As a teenager did you feel comfortable expressing your feelings to one or both of your parents or friends?",
    "Do you have a tendency to look directly into a person's eyes and /or move closely to them when discussing an interesting subject?",
    "Do you feel that most people, when you first meet them, are uncritical of your appearance?",
    "In a group situation, with people that you have just met, would you feel comfortable drawing attention to yourself by initiating a conversation?",
    "Do you feel comfortable holding hands or hugging someone you are in a relationship with in front of other people?",
    "When someone talks about feeling warm physically, do you begin to feel warm also?",
    "Do you tend to occasionally tune out when someone is talking to you because you are anxious to come up with your side, and at times not hear what the other person said?",
    "Do you feel that you learn and comprehend better by seeing and/or reading than by hearing?",
    "In a new class or lecture situation do you usually feel comfortable asking questions in front of the group?",
    "When expressing your ideas do you find it important to relate all the details leading up to the subject so the other person can understand it completely.",
    "Do you enjoy relating to children?",
    "Do you find it easy to be at ease and comfortable with your body movements, even when faced with unfamiliar people and circumstances?",
    "Do you prefer reading fiction rather than non-fiction?",
    "If you were to imagine sucking on a sour, bitter, juicy, yellow lemon, would your mouth water?",
    "If you feel that you deserve to be complimented for something well done, do you feel comfortable if the compliment is given to you in front of other people?",
    "Do you feel that you are a good conversationalist?",
    "Do you feel comfortable when complimentary attention is drawn to your physical body or appearance?"
];

const q2Questions = [
    "Have you ever awakened in the middle of the night and felt that you could not move your body and or talk?",
    "As a child did you feel that you were more affected by the tone of voice of your parents than by what they actually said?",
    "If someone you are associated with talks about a fear that you too have experienced, do you have a tendency to have an apprehensive or fearful feeling also?",
    "After having an argument with someone, do you have a tendency to dwell on what you could or should have said?",
    "Do you tend to occasionally tune out when someone is talking to you and do not hear what was said because your mind drifts to something totally unrelated?",
    "Do you sometimes desire to be complimented for a job done well done, but feel embarrassed or uncomfortable when complimented?",
    "Do you often have a fear or dread of not being able to carry on a conversation with someone you just met?",
    "Do you feel self conscious, when attention is drawn to your physical body or appearance?",
    "If you have a choice, would you rather avoid being around children most of the time?",
    "Do you feel that you are relaxed or loose in body movement, especially when faced with unfamiliar people or circumstances?",
    "Do you prefer reading non-fiction rather than fiction?",
    "If someone describes a very bitter taste, do you have difficulty experiencing the physical feeling of it?",
    "Do you generally feel that you see yourself less favorably than others see you?",
    "Do you tend to feel awkward or self- conscious initiating touch ( holding hands, kissing, etc.) with someone you are in relationship with in front of other people?",
    "In a new class or lecture situation do you usually feel comfortable asking questions in front of group even though you may desire further explanation?",
    "Do you feel uneasy if someone you have just met looks directly in the eyes when talking to you, especially if the conversation is all about you?",
    "In a group situation with people you have just met, would you feel uncomfortable drawing attention to yourself by initiating a conversation?",
    "If you are in a relationship, or are very close to someone, do you find it difficult or embarrassing to verbalize your love for them?"
];

const IntakeForm: React.FC = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const todayDateInput = toDateInputString(new Date());

    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        city: '',
        phone: '',
        occupation: '',
        primary_concern: '',
        dob: '',
        consultation_preference: '',
        days_preference: [] as string[],
        timings_preference: [] as string[],
        q1: Array(18).fill(''),
        q2: Array(18).fill('')
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            setFormData({ ...formData, phone: value.replace(/\D/g, '').slice(0, 10) });
            return;
        }

        if (name === 'email') {
            setFormData({ ...formData, email: value.replace(/\s+/g, '') });
            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleQChange = (qList: 'q1' | 'q2', index: number, value: string) => {
        setFormData((prev) => {
            const newQ = [...prev[qList]];
            newQ[index] = value;
            return { ...prev, [qList]: newQ };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isValidEmail(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (!isValidMobile10(formData.phone)) {
            setError('Phone number must contain exactly 10 digits.');
            return;
        }

        if (!isDobNotFuture(formData.dob)) {
            setError('DOB cannot be in the future and must follow DD-MM-YYYY rule.');
            return;
        }

        // Basic validation for questionnaires
        if (formData.q1.includes('')) {
            setError('Please answer all questions in Questionnaire 1.');
            return;
        }
        if (formData.q2.includes('')) {
            setError('Please answer all questions in Questionnaire 2.');
            return;
        }
        if (formData.days_preference.length === 0) {
            setError('Please select at least one day preference.');
            return;
        }
        if (formData.timings_preference.length === 0) {
            setError('Please select at least one timing preference.');
            return;
        }

        const invalidPreferredDate = formData.days_preference.some((dateValue) => !isTodayOrFutureDate(dateValue));
        if (invalidPreferredDate) {
            setError('Preferred appointment date cannot be in the past.');
            return;
        }

        setSubmitting(true);

        // Calculate score for admin view: 10 points for every 'Yes'
        let total_score = 0;
        formData.q1.forEach(ans => { if (ans === 'Yes') total_score += 10; });
        formData.q2.forEach(ans => { if (ans === 'Yes') total_score += 10; });

        try {
            await axios.post(`/api/customers`, {
                form_data: {
                    email: formData.email.trim().toLowerCase(),
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    city: formData.city,
                    phone: formData.phone.trim(),
                    occupation: formData.occupation,
                    primary_concern: formData.primary_concern,
                    dob: formData.dob,
                    consultation_preference: formData.consultation_preference,
                    days_preference: formData.days_preference,
                    timings_preference: formData.timings_preference,
                    q1: formData.q1.map((ans, i) => ({ question: q1Questions[i], answer: ans })),
                    q2: formData.q2.map((ans, i) => ({ question: q2Questions[i], answer: ans })),
                    total_score: total_score // Hidden from user, visible to admin
                }
            });
            setSuccess('Your sessions have been successfully requested! We will reach out shortly.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit form.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="appointment-section container fade-in" style={{ marginTop: '120px', minHeight: '60vh', marginBottom: '80px' }}>
            <div className="appointment-wrapper" style={{ flexDirection: 'column', maxWidth: '800px', margin: '0 auto' }}>
                <div className="appointment-info" style={{ width: '100%', marginBottom: '40px', padding: '30px', textAlign: 'center' }}>
                    <h2>Patient Intake Form</h2>
                    <p>
                        Please fill out the details and questionnaires below to request therapy sessions and officially register with us.
                    </p>
                </div>

                <div className="appointment-form-container" style={{ width: '100%' }}>
                    {success ? (
                        <div className="status-message success" style={{ textAlign: 'center', padding: '40px' }}>
                            <h3>Confirmed!</h3>
                            <p>{success}</p>
                            <button className="btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>Return Home</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="appointment-form">
                            <h3 style={{ marginBottom: '24px', color: 'var(--color-primary-dark)', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Personal Information</h3>

                            <div className="form-group">
                                <label>Email <span style={{ color: 'red' }}>*</span></label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Enter email" required />
                            </div>

                            <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>First Name <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} placeholder="Enter your first name" required />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Last Name <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Enter your last name" required />
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>City <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Enter your city" required />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Phone Number <span style={{ color: 'red' }}>*</span></label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter your phone" inputMode="numeric" minLength={10} maxLength={10} pattern="[0-9]{10}" title="Enter exactly 10 digits" required />
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Occupation <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" name="occupation" value={formData.occupation} onChange={handleInputChange} placeholder="Enter your occupation" required />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Date Of Birth <span style={{ color: 'red' }}>*</span></label>
                                    <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} max={todayDateInput} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Primary Concern <span style={{ color: 'red' }}>*</span></label>
                                <select name="primary_concern" value={formData.primary_concern} onChange={handleInputChange as any} required style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                    <option value="">Select a concern</option>
                                    <option value="Anxiety">Anxiety</option>
                                    <option value="Depression">Depression</option>
                                    <option value="Relationship">Relationship Guidance</option>
                                    <option value="Stress">Stress / Burnout</option>
                                    <option value="Trauma">Emotional Trauma</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <h3 style={{ marginTop: '40px', marginBottom: '24px', color: 'var(--color-primary-dark)', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Preferences</h3>

                            <div className="form-group">
                                <label>Would you prefer your consultation ? <span style={{ color: 'red' }}>*</span></label>
                                <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                                        <input type="radio" name="consultation_preference" value="Online" checked={formData.consultation_preference === 'Online'} onChange={handleInputChange} required /> Online
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                                        <input type="radio" name="consultation_preference" value="Onsite" checked={formData.consultation_preference === 'Onsite'} onChange={handleInputChange} required /> Onsite
                                    </label>
                                </div>
                            </div>

                            <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>What is your preferred date? <span style={{ color: 'red' }}>*</span></label>
                                    <input
                                        type="date"
                                        value={formData.days_preference[0] || ''}
                                        min={todayDateInput}
                                        style={{ marginTop: '10px', width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        onChange={(e) => {
                                            // Handle mapping single date string to string[] for backend compatibility
                                            setFormData(prev => ({ ...prev, days_preference: [e.target.value] }));
                                        }}
                                        required
                                    />
                                    <small style={{ color: '#888', marginTop: '6px', display: 'block' }}>Only today or future dates are allowed.</small>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>What is your preferred time? <span style={{ color: 'red' }}>*</span></label>
                                    <select
                                        style={{ marginTop: '10px', width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        onChange={(e) => {
                                            // Handle mapping single time string to string[] for backend compatibility
                                            setFormData(prev => ({ ...prev, timings_preference: [e.target.value] }));
                                        }}
                                        required
                                    >
                                        <option value="">Select a time slot...</option>
                                        <option value="10 am to 1 pm">10:00 AM - 1:00 PM</option>
                                        <option value="2 pm to 5 pm">2:00 PM - 5:00 PM</option>
                                        <option value="6 pm to 8 pm">6:00 PM - 8:00 PM</option>
                                    </select>
                                </div>
                            </div>

                            <h3 style={{ marginTop: '40px', marginBottom: '8px', color: 'var(--color-primary-dark)', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Questionnaire 1</h3>
                            <p style={{ marginBottom: '24px', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>Please answer all questions honestly.</p>

                            {q1Questions.map((q, index) => (
                                <div key={`q1-${index}`} className="form-group" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                                    <label style={{ marginBottom: '10px', display: 'block', lineHeight: '1.4' }}>{index + 1}. {q} <span style={{ color: 'red' }}>*</span></label>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                                            <input type="radio" name={`q1-${index}`} value="Yes" checked={formData.q1[index] === 'Yes'} onChange={() => handleQChange('q1', index, 'Yes')} /> Yes
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                                            <input type="radio" name={`q1-${index}`} value="No" checked={formData.q1[index] === 'No'} onChange={() => handleQChange('q1', index, 'No')} /> No
                                        </label>
                                    </div>
                                </div>
                            ))}

                            <h3 style={{ marginTop: '40px', marginBottom: '8px', color: 'var(--color-primary-dark)', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Questionnaire 2</h3>
                            <p style={{ marginBottom: '24px', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>Please answer all questions honestly.</p>

                            {q2Questions.map((q, index) => (
                                <div key={`q2-${index}`} className="form-group" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                                    <label style={{ marginBottom: '10px', display: 'block', lineHeight: '1.4' }}>{index + 1}. {q} <span style={{ color: 'red' }}>*</span></label>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                                            <input type="radio" name={`q2-${index}`} value="Yes" checked={formData.q2[index] === 'Yes'} onChange={() => handleQChange('q2', index, 'Yes')} /> Yes
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                                            <input type="radio" name={`q2-${index}`} value="No" checked={formData.q2[index] === 'No'} onChange={() => handleQChange('q2', index, 'No')} /> No
                                        </label>
                                    </div>
                                </div>
                            ))}

                            {error && <div className="status-message error">{error}</div>}

                            <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: '20px', width: '100%', padding: '15px', fontSize: '1.1rem' }}>
                                {submitting ? 'Submitting Form...' : 'Submit Questionnaires & Request Session'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
};

export default IntakeForm;
