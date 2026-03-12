import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCollectionItems } from '../utils/collections';

interface CustomerData {
    id: number;
    name: string;
    email: string;
    phone?: string;
    dob?: string;
    occupation?: string;
    city?: string;
    form_data: any;
    status: string;
    is_active: boolean;
    per_session_price: number;
    total_sessions: number;
}

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

const computeTotalScore = (rawFormData: any): number | null => {
    if (!rawFormData) return null;

    const formData = typeof rawFormData === 'string'
        ? (() => {
            try { return JSON.parse(rawFormData); } catch { return null; }
        })()
        : rawFormData;

    if (!formData || typeof formData !== 'object') return null;

    const explicit = Number(formData.total_score);
    if (Number.isFinite(explicit)) return explicit;

    const scoreFromList = (list: any[]) => list.reduce((sum, item) => {
        const answer = typeof item === 'object' && item !== null ? item.answer : item;
        return String(answer || '').trim().toLowerCase() === 'yes' ? sum + 10 : sum;
    }, 0);

    const q1Score = Array.isArray(formData.q1) ? scoreFromList(formData.q1) : 0;
    const q2Score = Array.isArray(formData.q2) ? scoreFromList(formData.q2) : 0;
    return q1Score + q2Score;
};

const CustomerProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<CustomerData | null>(null);
    const [loading, setLoading] = useState(true);

    // Q2 states
    const [payments, setPayments] = useState<any[]>([]);
    const [addingPayment, setAddingPayment] = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [payType, setPayType] = useState('online');
    const [paySession, setPaySession] = useState('');

    // Controlled inputs for settings
    const [editPrice, setEditPrice] = useState<number | ''>('');
    const [editSessions, setEditSessions] = useState<number | ''>('');

    // Q3 states
    const [historicalForms, setHistoricalForms] = useState<any[]>([]);
    const [expandedFormId, setExpandedFormId] = useState<number | null>(null);

    // Q4 states
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');

    const fetchCustomerData = useCallback(async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch basic info (needs an endpoint or we filter from all for now)
            const allRes = await axios.get('/api/customers?limit=100&page=1', { headers });
            const cst = getCollectionItems<any>(allRes.data).find((c: any) => c.id === parseInt(id || '0'));

            if (cst) {
                setCustomer(cst);
                setEditPrice(cst.per_session_price || 1500);
                setEditSessions(cst.total_sessions || 4);

                // Fetch Payments
                const payRes = await axios.get(`/api/admin/customers/${id}/payments?limit=100&page=1`, { headers });
                setPayments(getCollectionItems<any>(payRes.data));

                // Fetch Notes
                const notesRes = await axios.get(`/api/admin/customers/${id}/notes?limit=100&page=1`, { headers });
                setNotes(getCollectionItems<any>(notesRes.data));

                // Fetch Historical Forms matching phone number AND dob! Fallback to form_data if root isn't present
                const fetchPhone = cst.phone || cst.form_data?.phone;
                const fetchDob = cst.dob || cst.form_data?.dob;

                if (fetchPhone && fetchDob) {
                    const histRes = await axios.get(`/api/admin/historical-forms?phone=${fetchPhone}&dob=${fetchDob}&limit=100&page=1`, { headers });
                    setHistoricalForms(getCollectionItems<any>(histRes.data));
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCustomerData();
    }, [id, fetchCustomerData]);

    const toggleActive = async () => {
        if (!customer) return;
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { Authorization: `Bearer ${token}` };
            const nextActive = !customer.is_active;
            const nextStatus = nextActive ? 'confirmed' : 'deactivated';

            await axios.put(`/api/admin/customers/${id}/settings`, {
                is_active: nextActive,
                status: nextStatus,
                per_session_price: customer.per_session_price,
                total_sessions: customer.total_sessions
            }, { headers });

            setCustomer({
                ...customer,
                is_active: nextActive,
                status: nextStatus
            });
        } catch (error) {
            console.error(error);
        }
    };

    const saveSettings = async () => {
        if (!customer) return;

        const priceNum = typeof editPrice === 'number' ? editPrice : parseInt(editPrice || '0', 10);
        const sessionsNum = typeof editSessions === 'number' ? editSessions : parseInt(editSessions || '0', 10);

        try {
            const token = localStorage.getItem('adminToken');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.put(`/api/admin/customers/${id}/settings`, {
                is_active: customer.is_active,
                per_session_price: priceNum,
                total_sessions: sessionsNum,
                status: customer.status // required to prevent constraint/null errors
            }, { headers });

            setCustomer({ ...customer, per_session_price: priceNum, total_sessions: sessionsNum });
            alert("Settings Saved");
        } catch (error) {
            console.error(error);
            alert("Error saving settings");
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();

        const amountNum = parseInt(payAmount, 10);
        const sessionNum = parseInt(paySession, 10);

        if (isNaN(amountNum) || isNaN(sessionNum)) {
            alert("Please enter valid numbers for session and amount.");
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post(`/api/admin/customers/${id}/payments`, {
                amount: amountNum,
                payment_type: payType,
                session_number: sessionNum
            }, { headers });

            setAddingPayment(false);
            setPayAmount('');
            setPaySession('');
            fetchCustomerData(); // refresh list
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveNote = async () => {
        if (!newNote.trim()) return;
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post(`/api/admin/customers/${id}/notes`, {
                note_text: newNote
            }, { headers });
            setNewNote('');
            fetchCustomerData(); // refresh
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div style={{ padding: '40px' }}>Loading profile...</div>;
    if (!customer) return <div style={{ padding: '40px' }}>Customer not found.</div>;

    const totalDueObj = (customer.per_session_price || 1500) * (customer.total_sessions || 4);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = totalDueObj - totalPaid;
    const profileName = customer.name || customer.form_data?.name || 'Customer';
    const detailEmail = customer.email || customer.form_data?.email || 'N/A';
    const detailPhone = customer.phone || customer.form_data?.phone || 'N/A';
    const detailAgeDob = customer.dob || customer.form_data?.dob || 'N/A';
    const detailCity = customer.city || customer.form_data?.city || 'N/A';
    const detailOccupation = customer.occupation || customer.form_data?.occupation || customer.form_data?.work || 'N/A';
    const detailScoreValue = computeTotalScore(customer.form_data);
    const detailScore = detailScoreValue ?? 'N/A';
    const detailStatus = (customer.status || 'pending').toUpperCase();

    return (
        <div className="profile-wrapper">
            <button className="back-btn" onClick={() => navigate('/admin?section=leads')}>← Back to Management</button>
            <h2 className="profile-header">{profileName}'s Profile</h2>

            <div className="profile-quadrants">

                {/* Q1: Details */}
                <div className="quadrant q1-details">
                    <h3>1. Customer Details</h3>
                    <div className="detail-stack">
                        <div className="detail-row">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{detailEmail}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Phone</span>
                            <span className="detail-value">{detailPhone}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Age / DOB</span>
                            <span className="detail-value">{detailAgeDob}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">City</span>
                            <span className="detail-value">{detailCity}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Occupation</span>
                            <span className="detail-value">{detailOccupation}</span>
                        </div>

                        <div className="detail-divider"></div>

                        <div className="detail-row detail-row-highlight">
                            <span className="detail-label">Score</span>
                            <span className="detail-value score-pill">{detailScore}</span>
                        </div>
                        <div className="detail-row detail-row-highlight">
                            <span className="detail-label">Status</span>
                            <span className="detail-value status-badge">{detailStatus}</span>
                        </div>
                    </div>
                </div>

                {/* Q2: Payments */}
                <div className="quadrant q2-payments">
                    <h3>2. Payments & Active Status</h3>

                    <div className="toggle-row">
                        <span>Account Status: <strong>{customer.is_active ? 'ACTIVE' : 'DEACTIVATED'}</strong></span>
                        <label className="profile-switch">
                            <input
                                type="checkbox"
                                checked={customer.is_active}
                                onChange={toggleActive}
                            />
                            <span className="switch-slider"></span>
                        </label>
                    </div>

                    {customer.is_active && (
                        <>
                            <div className="settings-form">
                                <div className="input-group">
                                    <label>Per Session Price (₹)</label>
                                    <input
                                        type="number"
                                        value={editPrice}
                                        onChange={(e) => setEditPrice(e.target.value ? parseInt(e.target.value, 10) : '')}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Total Sessions</label>
                                    <input
                                        type="number"
                                        value={editSessions}
                                        onChange={(e) => setEditSessions(e.target.value ? parseInt(e.target.value, 10) : '')}
                                    />
                                </div>
                                <button onClick={saveSettings} className="save-settings-btn">Save Pricing</button>
                            </div>

                            <hr />

                            <div className="payment-ledger">
                                <h4>Payment Ledger</h4>
                                {payments.length === 0 ? <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.85rem' }}>No payments recorded.</p> : (
                                    <ul className="ledger-list">
                                        {payments.map(p => (
                                            <li key={p.id}>
                                                <span>Session {p.session_number} ({p.payment_type.toUpperCase()})<br /><small style={{ color: '#888' }}>{new Date(p.created_at).toLocaleString()}</small></span>
                                                <strong>₹ {p.amount}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <div className="ledger-summary">
                                    <div>Total Program Cost: ₹{totalDueObj}</div>
                                    <div style={{ color: 'green' }}>Total Paid: ₹{totalPaid}</div>
                                    <div style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Remaining: ₹{remaining}</div>
                                </div>

                                {!addingPayment ? (
                                    <button className="add-pay-btn" onClick={() => setAddingPayment(true)}>+ Add Payment</button>
                                ) : (
                                    <form className="add-pay-form" onSubmit={handleAddPayment}>
                                        <input type="number" placeholder="Session #" required value={paySession} onChange={e => setPaySession(e.target.value)} />
                                        <input type="number" placeholder="Amount" required value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                                        <select value={payType} onChange={e => setPayType(e.target.value)}>
                                            <option value="online">Online</option>
                                            <option value="cash">Cash</option>
                                        </select>
                                        <div>
                                            <button type="submit" className="save-btn">Save</button>
                                            <button type="button" className="cancel-btn" onClick={() => setAddingPayment(false)}>Cancel</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Q3: Form History */}
                <div className="quadrant q3-history">
                    <h3>3. Historical Form Results</h3>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>Auto-matched via associated Phone Number & DOB: {customer.phone || customer.form_data?.phone} / {customer.dob || customer.form_data?.dob}</p>

                    {historicalForms.length === 0 ? (
                        <p style={{ fontStyle: 'italic', color: '#999' }}>No additional historical forms found.</p>
                    ) : (
                        <div className="historical-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {historicalForms.map(form => {
                                const historicalScore = computeTotalScore(form.form_data);
                                return (
                                <div key={form.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                    <button
                                        className="btn-secondary"
                                        style={{ textAlign: 'left', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderRadius: '8px', cursor: 'pointer', border: expandedFormId === form.id ? '1px solid var(--color-primary)' : '' }}
                                        onClick={() => setExpandedFormId(expandedFormId === form.id ? null : form.id)}
                                    >
                                        <span><strong>Form Submitted on:</strong> {new Date(form.created_at).toLocaleDateString()}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <span style={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>Score: {historicalScore ?? 'N/A'}</span>
                                            <span style={{ fontSize: '1.2rem', color: '#718096' }}>{expandedFormId === form.id ? '▼' : '▶'}</span>
                                        </div>
                                    </button>

                                    {expandedFormId === form.id && (
                                        <div style={{ marginTop: '6px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                                            <h4 style={{ marginBottom: '8px', color: '#2d3748', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>Intake Form Submission Responses</h4>
                                            {form.form_data ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {/* Standard Questions */}
                                                    {Object.entries({
                                                        primary_concern: "Primary Concern",
                                                        consultation_preference: "Consultation Preference",
                                                        days_preference: "Preferred Date(s)",
                                                        timings_preference: "Preferred Time(s)",
                                                        occupation: "Occupation"
                                                    }).map(([key, label]) => {
                                                        const val = form.form_data[key];
                                                        if (!val) return null;
                                                        const displayVal = Array.isArray(val) ? val.join(', ') : String(val);
                                                        return (
                                                            <div key={key}>
                                                                <div style={{ fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>{label}:</div>
                                                                <div style={{ color: '#1a202c', backgroundColor: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #edf2f7' }}>{displayVal}</div>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Questionnaire 1 */}
                                                    {form.form_data.q1 && Array.isArray(form.form_data.q1) && form.form_data.q1.length > 0 && (
                                                        <div style={{ marginTop: '6px' }}>
                                                            <h5 style={{ color: 'var(--color-primary-dark)', marginBottom: '6px', fontSize: '1rem' }}>Questionnaire 1</h5>
                                                            <div style={{ display: 'grid', gap: '8px' }}>
                                                                {form.form_data.q1.map((item: any, i: number) => {
                                                                    const questionText = typeof item === 'object' && item.question ? item.question : (q1Questions[i] || `Question ${i + 1}`);
                                                                    const answerText = typeof item === 'object' && item.answer ? item.answer : String(item);
                                                                    return (
                                                                        <div key={`q1-${i}`}>
                                                                            <div style={{ fontWeight: 600, color: '#4a5568', marginBottom: '4px', lineHeight: 1.4 }}>{i + 1}. {questionText}</div>
                                                                            <div style={{ color: answerText === 'Yes' ? '#c53030' : '#2f855a', backgroundColor: 'white', padding: '6px 10px', borderRadius: '4px', border: '1px solid #edf2f7', fontWeight: 500, fontSize: '0.85rem' }}>
                                                                                Answer: {answerText || 'N/A'}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Questionnaire 2 */}
                                                    {form.form_data.q2 && Array.isArray(form.form_data.q2) && form.form_data.q2.length > 0 && (
                                                        <div style={{ marginTop: '6px' }}>
                                                            <h5 style={{ color: 'var(--color-primary-dark)', marginBottom: '6px', fontSize: '1rem' }}>Questionnaire 2</h5>
                                                            <div style={{ display: 'grid', gap: '8px' }}>
                                                                {form.form_data.q2.map((item: any, i: number) => {
                                                                    const questionText = typeof item === 'object' && item.question ? item.question : (q2Questions[i] || `Question ${i + 1}`);
                                                                    const answerText = typeof item === 'object' && item.answer ? item.answer : String(item);
                                                                    return (
                                                                        <div key={`q2-${i}`}>
                                                                            <div style={{ fontWeight: 600, color: '#4a5568', marginBottom: '4px', lineHeight: 1.4 }}>{i + 1}. {questionText}</div>
                                                                            <div style={{ color: answerText === 'Yes' ? '#c53030' : '#2f855a', backgroundColor: 'white', padding: '6px 10px', borderRadius: '4px', border: '1px solid #edf2f7', fontWeight: 500, fontSize: '0.85rem' }}>
                                                                                Answer: {answerText || 'N/A'}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p style={{ fontStyle: 'italic', color: '#a0aec0' }}>No specific responses recorded.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Q4: Session Notes */}
                <div className="quadrant q4-notes">
                    <h3>4. Per Session Notes</h3>

                    <div className="notes-entry">
                        <textarea
                            placeholder="What happened this session? Quick notes for next time..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            rows={4}
                        ></textarea>
                        <button className="save-note-btn" onClick={handleSaveNote}>Save Note to Record</button>
                    </div>

                    <div className="notes-history">
                        {notes.length === 0 ? (
                            <p style={{ fontStyle: 'italic', color: '#999', fontSize: '0.85rem' }}>No session notes recorded yet.</p>
                        ) : (
                            notes.map(note => (
                                <div key={note.id} className="note-card">
                                    <div className="note-date">{new Date(note.created_at).toLocaleString()}</div>
                                    <div className="note-text">{note.note_text}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CustomerProfile;
