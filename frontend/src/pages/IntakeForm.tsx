import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import axios from 'axios';
import {
    isDobNotFuture,
    isTodayOrFutureDate,
    isValidEmail,
    isValidMobile10,
    toDateInputString
} from '../utils/validation';
import { apiUrl, requestWithApiFallback } from '../utils/api';

type SlotOption = {
    label: string;
    value: string;
};

type SlotAvailabilityResponse = {
    available_slots?: SlotOption[];
};

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
    const [availableSlots, setAvailableSlots] = useState<SlotOption[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotError, setSlotError] = useState('');
    const todayDateInput = toDateInputString(new Date());

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, []);

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

    useEffect(() => {
        const selectedDate = formData.days_preference[0] || '';

        if (!selectedDate) {
            setAvailableSlots([]);
            setSlotsLoading(false);
            setSlotError('');
            setFormData((prev) => (prev.timings_preference.length > 0 ? { ...prev, timings_preference: [] } : prev));
            return;
        }

        let isCancelled = false;

        const fetchAvailability = async () => {
            setSlotsLoading(true);
            setSlotError('');

            try {
                const response = await requestWithApiFallback(() =>
                    axios.get<SlotAvailabilityResponse>(apiUrl('/api/customers/availability'), {
                        params: { date: selectedDate }
                    })
                );

                if (isCancelled) return;

                const slots = Array.isArray(response.data?.available_slots)
                    ? response.data.available_slots
                    : [];

                setAvailableSlots(slots);
            } catch (err: any) {
                if (isCancelled) return;
                setAvailableSlots([]);
                setSlotError(err.response?.data?.message || 'Unable to load available slots right now.');
            } finally {
                if (!isCancelled) {
                    setSlotsLoading(false);
                }
            }
        };

        void fetchAvailability();

        return () => {
            isCancelled = true;
        };
    }, [formData.days_preference]);

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
            setError('Please select your preferred time.');
            return;
        }

        const selectedTime = String(formData.timings_preference[0] || '').trim();
        const isSelectedSlotAvailable = availableSlots.some((slot) => slot.value === selectedTime);
        if (!isSelectedSlotAvailable) {
            setError('This time slot is already selected by another customer. Please choose a different time.');
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
            await requestWithApiFallback(() => axios.post(apiUrl('/api/customers'), {
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
            }));
            setSuccess('Your sessions have been successfully requested! We will reach out shortly.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit form.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="ra-page-wrapper ra-intake-page">
            

            {/* Hero Section */}
            <section className="ra-appt-hero" style={{ minHeight: '40vh', paddingBottom: '3rem', justifyContent: 'flex-start' }}>
                <div className="ra-hero-bg" style={{ background: 'linear-gradient(160deg, #f7f6f4 0%, #f3e8d8 72%, #f9e6d0 100%)' }}>
                    <div style={{ position: 'relative', zIndex: 8, paddingTop: '12px', paddingLeft: '18px' }}>
                        <Link to="/" className="ra-home-link" aria-label="Back to home page">
                            <span className="ra-home-link-arrow" aria-hidden="true"><ChevronLeft size={16} strokeWidth={2.4} /></span>
                            <span>Back to Home</span>
                        </Link>
                    </div>
                    <div className="ra-hero-blob"></div>
                    <div className="ra-hero-blob"></div>
                    <div className="ra-hero-blob"></div>
                </div>
                <div className="ra-hero-content" style={{ padding: '0 2rem 0' }}>
                    <div className="ra-hero-eyebrow" style={{ color: 'rgba(0, 55, 62, 0.72)' }}>
                        <span className="ra-eyebrow-line" style={{ background: 'rgba(199, 129, 82, 0.55)' }}></span> Next Steps <span className="ra-eyebrow-line" style={{ background: 'rgba(199, 129, 82, 0.55)' }}></span>
                    </div>
                    <h1 className="ra-hero-title" style={{ color: 'var(--ra-brown)' }}>Patient <em style={{ color: 'var(--ra-amber-deep)' }}>Intake</em></h1>
                </div>
                <div className="ra-hero-wave">
                    <svg viewBox="0 0 1440 110" fill="none" preserveAspectRatio="none">
                        <path d="M0,55 C400,110 1000,0 1440,55 L1440,110 L0,110 Z" />
                    </svg>
                </div>
            </section>

            <section className="ra-booking-main" style={{ paddingTop: '2rem' }}>
                <div className="ra-booking-inner" style={{ maxWidth: '900px' }}>
                    <div className="ra-form-card" style={{ animation: 'raRevealUp 0.8s 0.6s ease both' }}>
                        {success ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌿</div>
                                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--ra-brown)', marginBottom: '1rem' }}>Confirmed!</h3>
                                <p style={{ fontSize: '1rem', color: 'var(--ra-text-muted)', marginBottom: '2rem' }}>{success}</p>
                                <button className="ra-btn-submit" onClick={() => navigate('/')} style={{ maxWidth: '250px', margin: '0 auto' }}>
                                    Return Home
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="ra-form-section-hdr">Personal Information <span>Section 1</span></div>

                                <div className="ra-form-row">
                                    <div className="ra-form-group">
                                        <label className="ra-form-label">First Name *</label>
                                        <input className="ra-form-input" type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} placeholder="First Name" required />
                                    </div>
                                    <div className="ra-form-group">
                                        <label className="ra-form-label">Last Name *</label>
                                        <input className="ra-form-input" type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Last Name" required />
                                    </div>
                                </div>

                                <div className="ra-form-row">
                                    <div className="ra-form-group">
                                        <label className="ra-form-label">Email *</label>
                                        <input className="ra-form-input" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="you@email.com" required />
                                    </div>
                                    <div className="ra-form-group">
                                        <label className="ra-form-label">Phone Number *</label>
                                        <input className="ra-form-input" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="10-digit number" inputMode="numeric" minLength={10} maxLength={10} pattern="[0-9]{10}" title="Enter exactly 10 digits" required />
                                    </div>
                                </div>

                                <div className="ra-form-row">
                                    <div className="ra-form-group">
                                        <label className="ra-form-label">City *</label>
                                        <input className="ra-form-input" type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Your City" required />
                                    </div>
                                    <div className="ra-form-group">
                                        <label className="ra-form-label">Occupation *</label>
                                        <input className="ra-form-input" type="text" name="occupation" value={formData.occupation} onChange={handleInputChange} placeholder="Your Occupation" required />
                                    </div>
                                </div>

                                <div className="ra-form-row">
                                    <div className="ra-form-group">
                                        <label className="ra-form-label">Date Of Birth *</label>
                                        <input className="ra-form-input" type="date" name="dob" value={formData.dob} onChange={handleInputChange} max={todayDateInput} required />
                                    </div>
                                    <div className="ra-form-group">
                                        <label className="ra-form-label">Primary Concern *</label>
                                        <select className="ra-form-select" name="primary_concern" value={formData.primary_concern} onChange={handleInputChange as any} required>
                                            <option value="">Select a concern</option>
                                            <option value="Anxiety">Anxiety / Stress</option>
                                            <option value="Depression">Depression / Low Mood</option>
                                            <option value="Relationship">Relationship Guidance</option>
                                            <option value="Stress">Stress / Burnout</option>
                                            <option value="Trauma">Emotional Trauma</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="ra-form-section-hdr gap">Preferences <span>Section 2</span></div>

                                <div className="ra-form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="ra-form-label">Would you prefer your consultation? *</label>
                                    <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.95rem' }}>
                                            <input type="radio" name="consultation_preference" value="Online" checked={formData.consultation_preference === 'Online'} onChange={handleInputChange} required /> Online
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.95rem' }}>
                                            <input type="radio" name="consultation_preference" value="Onsite" checked={formData.consultation_preference === 'Onsite'} onChange={handleInputChange} required /> Onsite
                                        </label>
                                    </div>
                                </div>

                                <div className="ra-form-row">
                                    <div className="ra-form-group">
                                        <label className="ra-form-label" htmlFor="days_preference">What is your preferred date? *</label>
                                        <input
                                            className="ra-form-input"
                                            id="days_preference"
                                            type="date"
                                            value={formData.days_preference[0] || ''}
                                            min={todayDateInput}
                                            onChange={(e) => {
                                                const selectedDate = e.target.value;
                                                setSlotError('');
                                                setFormData(prev => ({ ...prev, days_preference: selectedDate ? [selectedDate] : [], timings_preference: [] }));
                                            }}
                                            required
                                        />
                                        <small style={{ color: 'var(--ra-text-muted)', fontSize: '0.75rem', marginTop: '6px', display: 'block' }}>Only today or future dates are allowed.</small>
                                    </div>
                                    <div className="ra-form-group">
                                        <label className="ra-form-label" htmlFor="timings_preference">What is your preferred time? *</label>
                                        <select
                                            className="ra-form-select"
                                            id="timings_preference"
                                            value={formData.timings_preference[0] || ''}
                                            disabled={!formData.days_preference[0] || slotsLoading || availableSlots.length === 0}
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, timings_preference: e.target.value ? [e.target.value] : [] }));
                                            }}
                                            required
                                        >
                                            <option value="">
                                                {!formData.days_preference[0]
                                                    ? 'Select a date first'
                                                    : slotsLoading
                                                        ? 'Checking availability...'
                                                        : availableSlots.length === 0
                                                            ? 'No slots available'
                                                            : 'Select a time slot...'}
                                            </option>
                                            {availableSlots.map((slot) => (
                                                <option key={slot.value} value={slot.value}>{slot.label}</option>
                                            ))}
                                        </select>
                                        <small style={{ color: slotError ? '#b91c1c' : 'var(--ra-text-muted)', fontSize: '0.75rem', marginTop: '6px', display: 'block' }}>
                                            {slotError
                                                ? slotError
                                                : !formData.days_preference[0]
                                                    ? 'Choose a preferred date to load time slots.'
                                                    : slotsLoading
                                                        ? 'Checking available slots...'
                                                        : availableSlots.length === 0
                                                            ? 'No time slots are available on this date.'
                                                    : 'Select a 1-hour preferred time slot.'}
                                        </small>
                                    </div>
                                </div>

                                <div className="ra-form-section-hdr gap">Questionnaire 1 <span>Section 3</span></div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--ra-text-muted)', marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>Please answer all questions honestly.</p>

                                {q1Questions.map((q, index) => (
                                    <div key={`q1-${index}`} className="ra-form-group" style={{ marginBottom: '1.2rem', padding: '1rem 1.2rem', background: 'var(--ra-cream)', borderRadius: '12px', border: '1px solid rgba(59,46,36,0.05)' }}>
                                        <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 500, fontFamily: 'var(--font-body)', lineHeight: '1.5', color: 'var(--ra-brown)' }}>
                                            {index + 1}. {q} <span style={{ color: '#b91c1c' }}>*</span>
                                        </label>
                                        <div style={{ display: 'flex', gap: '24px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
                                                <input type="radio" name={`q1-${index}`} value="Yes" checked={formData.q1[index] === 'Yes'} onChange={() => handleQChange('q1', index, 'Yes')} /> Yes
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
                                                <input type="radio" name={`q1-${index}`} value="No" checked={formData.q1[index] === 'No'} onChange={() => handleQChange('q1', index, 'No')} /> No
                                            </label>
                                        </div>
                                    </div>
                                ))}

                                <div className="ra-form-section-hdr gap">Questionnaire 2 <span>Section 4</span></div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--ra-text-muted)', marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>Please answer all questions honestly.</p>

                                {q2Questions.map((q, index) => (
                                    <div key={`q2-${index}`} className="ra-form-group" style={{ marginBottom: '1.2rem', padding: '1rem 1.2rem', background: 'var(--ra-cream)', borderRadius: '12px', border: '1px solid rgba(59,46,36,0.05)' }}>
                                        <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 500, fontFamily: 'var(--font-body)', lineHeight: '1.5', color: 'var(--ra-brown)' }}>
                                            {index + 1}. {q} <span style={{ color: '#b91c1c' }}>*</span>
                                        </label>
                                        <div style={{ display: 'flex', gap: '24px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
                                                <input type="radio" name={`q2-${index}`} value="Yes" checked={formData.q2[index] === 'Yes'} onChange={() => handleQChange('q2', index, 'Yes')} /> Yes
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
                                                <input type="radio" name={`q2-${index}`} value="No" checked={formData.q2[index] === 'No'} onChange={() => handleQChange('q2', index, 'No')} /> No
                                            </label>
                                        </div>
                                    </div>
                                ))}

                                {error && <div className="ra-form-alert error" style={{ marginTop: '2rem' }}>{error}</div>}

                                <button
                                    type="submit"
                                    className="ra-btn-submit"
                                    disabled={submitting || slotsLoading || !formData.days_preference[0] || !formData.timings_preference[0]}
                                    style={{ marginTop: '2.5rem' }}
                                >
                                    {submitting ? 'Submitting Form...' : 'Submit Questionnaires & Request Session'}
                                    {!submitting && <span className="ra-btn-arrow">→</span>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default IntakeForm;
