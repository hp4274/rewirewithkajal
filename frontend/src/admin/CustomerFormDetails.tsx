import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CustomerProfile.css'; // reusing some styles

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

const CustomerFormDetails: React.FC = () => {
    const { id, formId } = useParams<{ id: string, formId: string }>();
    const navigate = useNavigate();
    const [formData, setFormData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchForm = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const headers = { Authorization: `Bearer ${token}` };
                const res = await axios.get(`http://localhost:5000/api/admin/historical-forms/${formId}`, { headers });
                setFormData(res.data.form_data);
            } catch (err: any) {
                console.error(err);
                setError('Failed to load form details. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchForm();
    }, [formId]);

    if (loading) return <div style={{ padding: '40px' }}>Loading form details...</div>;
    if (error) return <div style={{ padding: '40px', color: 'red' }}>{error}</div>;
    if (!formData) return <div style={{ padding: '40px' }}>No form data found.</div>;

    return (
        <div className="profile-wrapper" style={{ maxWidth: '900px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: 'var(--shadow-soft)' }}>
            <button className="back-btn" onClick={() => navigate(`/admin/customer/${id}`)}>← Back to Profile</button>
            <h2 className="profile-header" style={{ marginTop: '20px' }}>Intake Form Results</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div><strong>Name:</strong> {formData.first_name} {formData.last_name}</div>
                <div><strong>Email:</strong> {formData.email}</div>
                <div><strong>Phone:</strong> {formData.phone}</div>
                <div><strong>DOB:</strong> {formData.dob}</div>
                <div><strong>City:</strong> {formData.city}</div>
                <div><strong>Occupation:</strong> {formData.occupation}</div>
                <div><strong>Primary Concern:</strong> {formData.primary_concern}</div>
                <div><strong>Total Score:</strong> <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{formData.total_score}</span></div>

                {formData.days_preference && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <strong>Preferred Days:</strong> {formData.days_preference.join(', ')}
                    </div>
                )}
                {formData.timings_preference && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <strong>Preferred Times:</strong> {formData.timings_preference.join(', ')}
                    </div>
                )}
            </div>

            <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #eee' }}>Questionnaire 1 Answers</h3>
            {formData.q1 ? (
                <div style={{ marginBottom: '40px' }}>
                    {q1Questions.map((q, index) => {
                        const answer = formData.q1[index];
                        return (
                            <div key={index} style={{ marginBottom: '15px', padding: '15px', background: answer === 'Yes' ? '#fff4ed' : '#ffffff', border: '1px solid #eaeaea', borderRadius: '8px' }}>
                                <p style={{ fontWeight: 500, marginBottom: '8px' }}>{index + 1}. {q}</p>
                                <p style={{ fontWeight: 'bold', color: answer === 'Yes' ? 'var(--color-primary-dark)' : '#666' }}>Answer: {answer || 'Not Answered'}</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p style={{ color: '#888', fontStyle: 'italic', marginBottom: '40px' }}>Questionnaire 1 data not available for this legacy form.</p>
            )}

            <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #eee' }}>Questionnaire 2 Answers</h3>
            {formData.q2 ? (
                <div>
                    {q2Questions.map((q, index) => {
                        const answer = formData.q2[index];
                        return (
                            <div key={index} style={{ marginBottom: '15px', padding: '15px', background: answer === 'Yes' ? '#fff4ed' : '#ffffff', border: '1px solid #eaeaea', borderRadius: '8px' }}>
                                <p style={{ fontWeight: 500, marginBottom: '8px' }}>{index + 1}. {q}</p>
                                <p style={{ fontWeight: 'bold', color: answer === 'Yes' ? 'var(--color-primary-dark)' : '#666' }}>Answer: {answer || 'Not Answered'}</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p style={{ color: '#888', fontStyle: 'italic' }}>Questionnaire 2 data not available for this legacy form.</p>
            )}

        </div>
    );
};

export default CustomerFormDetails;
