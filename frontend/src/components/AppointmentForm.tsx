import React, { useEffect, useState } from 'react';
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

const AppointmentForm: React.FC = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        dob: '',
        email: '',
        phone: '',
        concern: '',
        preferred_date: '',
        preferred_slot: '',
        message: ''
    });

    const [availableSlots, setAvailableSlots] = useState<SlotOption[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotError, setSlotError] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const todayDateInput = toDateInputString(new Date());

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'preferred_date') {
            setSlotError('');
            setFormData((prev) => ({ ...prev, preferred_date: value, preferred_slot: '' }));
            return;
        }

        if (name === 'phone') {
            setFormData((prev) => ({ ...prev, phone: value.replace(/\D/g, '').slice(0, 10) }));
            return;
        }

        if (name === 'email') {
            setFormData((prev) => ({ ...prev, email: value.replace(/\s+/g, '') }));
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        const selectedDate = formData.preferred_date;

        if (!selectedDate) {
            setAvailableSlots([]);
            setSlotsLoading(false);
            setSlotError('');
            setFormData((prev) => (prev.preferred_slot ? { ...prev, preferred_slot: '' } : prev));
            return;
        }

        let isCancelled = false;

        const fetchAvailability = async () => {
            setSlotsLoading(true);
            setSlotError('');

            try {
                const response = await requestWithApiFallback(() =>
                    axios.get<SlotAvailabilityResponse>(apiUrl('/api/leads/availability'), {
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
                setSlotError(err.response?.data?.message || 'Unable to load live slot availability right now.');
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
    }, [formData.preferred_date]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        if (!isDobNotFuture(formData.dob)) {
            setStatus('error');
            setErrorMessage('DOB cannot be in the future and must follow DD-MM-YYYY rule.');
            return;
        }

        if (formData.preferred_date && !isTodayOrFutureDate(formData.preferred_date)) {
            setStatus('error');
            setErrorMessage('Preferred appointment date cannot be in the past.');
            return;
        }

        if (!formData.preferred_date) {
            setStatus('error');
            setErrorMessage('Please select a preferred date.');
            return;
        }

        if (!formData.preferred_slot) {
            setStatus('error');
            setErrorMessage('Please select a preferred slot.');
            return;
        }

        if (!isValidMobile10(formData.phone)) {
            setStatus('error');
            setErrorMessage('Mobile number must contain exactly 10 digits.');
            return;
        }

        if (!isValidEmail(formData.email)) {
            setStatus('error');
            setErrorMessage('Please enter a valid email address.');
            return;
        }

        setStatus('loading');

        try {
            await requestWithApiFallback(() => axios.post(apiUrl('/api/leads'), {
                ...formData,
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim()
            }));
            setStatus('success');
            setErrorMessage('');
            setAvailableSlots([]);
            setSlotError('');
            setFormData({ first_name: '', last_name: '', dob: '', email: '', phone: '', concern: '', preferred_date: '', preferred_slot: '', message: '' });
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setErrorMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
        }
    };

    const slotHelperText = slotError
        ? slotError
        : !formData.preferred_date
            ? 'Choose a preferred date to see live slot availability.'
            : slotsLoading
                ? 'Checking available slots...'
                : availableSlots.length === 0
                    ? 'No slots are available on this date. Please choose another date.'
                    : 'Select your preferred slot.';

    return (
        <section className="appointment-section container" id="appointment">
            <div className="appointment-wrapper">
                <div className="appointment-info">
                    <h2>Take the First Step</h2>
                    <p>
                        Booking an appointment is the hardest, yet most rewarding step towards
                        regaining control of your mental sanctuary. Fill out your details, and we
                        will reach out to confirm your session.
                    </p>
                    <div className="appointment-illustration">
                        {/* Abstract soft shape or illustration here */}
                        <div className="soft-circle"></div>
                        <div className="soft-circle-small"></div>
                    </div>
                </div>

                <div className="appointment-form-container">
                    <form onSubmit={handleSubmit} className="appointment-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="first_name">First Name</label>
                                <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="last_name">Last Name</label>
                                <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="dob">Date of Birth</label>
                                <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} max={todayDateInput} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group" style={{ flex: '1 1 100%' }}>
                                <label htmlFor="phone">Phone Number</label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} inputMode="numeric" minLength={10} maxLength={10} pattern="[0-9]{10}" title="Enter exactly 10 digits" required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="concern">Primary Concern</label>
                                <select id="concern" name="concern" value={formData.concern} onChange={handleChange} required>
                                    <option value="">Select a concern</option>
                                    <option value="Anxiety">Anxiety</option>
                                    <option value="Depression">Depression</option>
                                    <option value="Relationship">Relationship Guidance</option>
                                    <option value="Stress">Stress / Burnout</option>
                                    <option value="Trauma">Emotional Trauma</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="preferred_date">What is your preferred date?</label>
                                <input type="date" id="preferred_date" name="preferred_date" value={formData.preferred_date} onChange={handleChange} min={todayDateInput} required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group" style={{ flex: '1 1 100%' }}>
                                <label htmlFor="preferred_slot">Preferred Slot</label>
                                <select
                                    id="preferred_slot"
                                    name="preferred_slot"
                                    value={formData.preferred_slot}
                                    onChange={handleChange}
                                    disabled={!formData.preferred_date || slotsLoading || availableSlots.length === 0}
                                    required
                                >
                                    <option value="">
                                        {!formData.preferred_date
                                            ? 'Select a date first'
                                            : slotsLoading
                                                ? 'Checking availability...'
                                                : availableSlots.length === 0
                                                    ? 'No slots available'
                                                    : 'Select an available slot'}
                                    </option>
                                    {availableSlots.map((slot) => (
                                        <option key={slot.value} value={slot.value}>{slot.label}</option>
                                    ))}
                                </select>
                                <small className={`slot-helper${slotError ? ' error' : ''}`}>{slotHelperText}</small>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Additional Message (Optional)</label>
                            <textarea id="message" name="message" rows={4} value={formData.message} onChange={handleChange}></textarea>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={status === 'loading' || slotsLoading || !formData.preferred_date || !formData.preferred_slot}
                        >
                            {status === 'loading' ? 'Submitting...' : 'Request Appointment'}
                        </button>

                        {status === 'success' && <div className="status-message success">Your request has been sent successfully. We will contact you soon to confirm your selected slot.</div>}
                        {status === 'error' && <div className="status-message error">{errorMessage || 'Something went wrong. Please try again.'}</div>}
                    </form>
                </div>
            </div>
        </section>
    );
};

export default AppointmentForm;
