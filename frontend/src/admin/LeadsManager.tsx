import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, X, LayoutGrid, List, Calendar, User, Phone, Mail, MapPin } from 'lucide-react';
import './LeadsManager.css';
import { isFutureOrCurrentSlot, isTodayOrFutureDate, toDateInputString } from '../utils/validation';

interface LeadOrCustomer {
    id: number;
    lead_id?: number;
    name: string;
    email: string;
    phone?: string;
    concern?: string;
    status: string;
    created_at: string;
    form_data?: any;
    appointment_date?: string;
    slot?: string;
}

const APPOINTMENT_SLOTS = [
    { label: '10:00 AM - 12:00 PM', value: '10:00' },
    { label: '12:00 PM - 02:00 PM', value: '12:00' },
    { label: '03:00 PM - 05:00 PM', value: '15:00' }
];

export const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    const s = String(dateString);
    const hasTz = /[zZ]$|[+-]\d{2}:\d{2}$/.test(s);
    if (!hasTz) {
        const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
        if (m) return m[1];
    }
    const d = new Date(s.replace(' ', 'T'));
    if (isNaN(d.getTime())) return '';
    const isoString = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
    return isoString.slice(0, 10);
};

export const formatTimeForInput = (dateString?: string) => {
    if (!dateString) return '';
    const s = String(dateString).replace(' ', 'T');
    const hasTz = /[zZ]$|[+-]\d{2}:\d{2}$/.test(s);
    if (hasTz) {
        const d = new Date(s);
        if (isNaN(d.getTime())) return '';
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
    }
    const m = s.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/);
    if (m) return `${m[1]}:${m[2]}`;
    return '';
};

export const AppointmentInput = ({ item, updateAppointment }: { item: LeadOrCustomer, updateAppointment: (id: number, date: string | null, slotValue: string | null) => Promise<void> }) => {
    const initialDate = formatDateForInput(item.appointment_date);
    const initialSlot = formatTimeForInput(item.appointment_date);
    const [date, setDate] = useState(initialDate);
    const [slot, setSlot] = useState(initialSlot);
    const [isSaving, setIsSaving] = useState(false);
    const todayDateInput = toDateInputString(new Date());

    useEffect(() => {
        setDate(formatDateForInput(item.appointment_date));
        setSlot(formatTimeForInput(item.appointment_date));
    }, [item.appointment_date]);

    const handleSave = async () => {
        if (!date || !slot) {
            alert('Please select both date and slot.');
            return;
        }
        if (!isTodayOrFutureDate(date)) {
            alert('Slot booking date cannot be in the past.');
            return;
        }
        if (!isFutureOrCurrentSlot(date, slot)) {
            alert('Cannot book a past time slot.');
            return;
        }

        setIsSaving(true);
        try {
            const payloadDate = `${date}T${slot}`;
            await updateAppointment(item.id, payloadDate, slot);
        } catch (e) {
            console.error("Failed to update date", e);
        }
        setIsSaving(false);
    };

    return (
        <div className="appointment-input-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
            <div style={{ position: 'relative' }}>
                <input
                    type="date"
                    value={date}
                    min={todayDateInput}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', width: '100%', outline: 'none' }}
                />
            </div>
            <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                disabled={!date}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', width: '100%', background: !date ? '#f8fafc' : '#fff', cursor: !date ? 'not-allowed' : 'pointer' }}
            >
                <option value="">Select slot</option>
                {APPOINTMENT_SLOTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                ))}
            </select>
            {(date !== initialDate || slot !== initialSlot) && (
                <button
                    onClick={handleSave}
                    disabled={isSaving || !date || !slot}
                    style={{ padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                >
                    {isSaving ? 'Saving...' : 'Save Slot'}
                </button>
            )}
        </div>
    );
};

const LeadsManager: React.FC = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<LeadOrCustomer[]>([]);
    const [customers, setCustomers] = useState<LeadOrCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState<'new' | 'accepted' | 'rejected' | 'active' | 'inactive'>('new');

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { Authorization: `Bearer ${token}` };

            const [leadsRes, customersRes] = await Promise.all([
                axios.get('http://localhost:5000/api/leads', { headers }),
                axios.get('http://localhost:5000/api/customers', { headers })
            ]);

            setLeads(leadsRes.data);
            // Filter customers to exclude lead placeholders
            const filteredCustomers = customersRes.data.filter((c: any) => {
                if (c.lead_id && (!c.form_data || Object.keys(c.form_data).length === 0)) {
                    return false;
                }
                return true;
            });
            setCustomers(filteredCustomers);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const refreshId = window.setInterval(() => {
            fetchData();
        }, 30000);

        return () => window.clearInterval(refreshId);
    }, []);

    const updateLeadStatus = async (id: number, action: 'accept' | 'reject') => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(`http://localhost:5000/api/leads/${id}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error(err);
            alert(`Error ${action}ing lead.`);
        }
    };

    const updateCustomerStatus = async (id: number, status: string) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(`http://localhost:5000/api/customers/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Error updating customer status');
        }
    };

    const updateAppointment = async (id: number, date: string | null, slotValue: string | null) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(`http://localhost:5000/api/customers/${id}/appointment`, {
                appointment_date: date,
                slot: slotValue
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.status === 409) {
                alert(err.response.data.message || 'Slot already booked');
            } else {
                alert('Error updating appointment');
            }
            throw err;
        }
    };

    const filteredItems = (() => {
        if (activeTab === 'new') return leads.filter(l => l.status === 'new');
        if (activeTab === 'accepted') return leads.filter(l => l.status === 'accepted');
        if (activeTab === 'rejected') return leads.filter(l => l.status === 'rejected');
        if (activeTab === 'active') return customers.filter(c => c.status === 'confirmed' || (c.status !== 'deactivated' && c.status !== 'declined'));
        if (activeTab === 'inactive') return customers.filter(c => c.status === 'deactivated' || c.status === 'declined');
        return [];
    })();

    if (loading) return <div className="loading-container">Loading management data...</div>;

    const isCustomerTab = activeTab === 'active' || activeTab === 'inactive';

    const renderCard = (item: LeadOrCustomer) => (
        <div key={item.id} className={`lead-grid-card ${item.status}`}>
            <div className="card-header">
                <h3 className="card-name">{item.name}</h3>
                <span className={`card-badge ${item.status}`}>{item.status.toUpperCase()}</span>
            </div>

            <div className="card-contact">
                <div className="contact-item"><Mail size={14} /> {item.email}</div>
                <div className="contact-item"><Phone size={14} /> {item.phone || item.form_data?.phone || 'N/A'}</div>
                {isCustomerTab && <div className="contact-item"><MapPin size={14} /> {item.form_data?.city || 'N/A'}</div>}
            </div>

            {!isCustomerTab ? (
                <div className="card-concern">
                    <strong>Concern:</strong> {item.concern}
                </div>
            ) : (
                <div className="card-appointment">
                    <div style={{ fontWeight: '700', fontSize: '0.75rem', marginBottom: '8px', color: '#64748b' }}>APPOINTMENT SLOT</div>
                    <AppointmentInput item={item} updateAppointment={updateAppointment} />
                </div>
            )}

            <div className="card-actions">
                {!isCustomerTab ? (
                    <>
                        {item.status !== 'accepted' && (
                            <button className="btn-action btn-accept" onClick={() => updateLeadStatus(item.id, 'accept')}>Accept</button>
                        )}
                        {item.status !== 'rejected' && (
                            <button className="btn-action btn-reject" onClick={() => updateLeadStatus(item.id, 'reject')}>Reject</button>
                        )}
                    </>
                ) : (
                    <>
                        <button className="btn-action btn-view" onClick={() => navigate(`/admin/customer/${item.id}`)}>View Profile</button>
                        {activeTab === 'active' ? (
                            <button className="btn-action btn-deactivate" onClick={() => updateCustomerStatus(item.id, 'deactivated')}>Deactivate</button>
                        ) : (
                            <button className="btn-action btn-activate" onClick={() => updateCustomerStatus(item.id, 'confirmed')}>Activate</button>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    const renderList = () => (
        <div className="admin-table-container">
            <table className="leads-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Contact</th>
                        {isCustomerTab ? <th>Appointment</th> : <th>Concern</th>}
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map(item => (
                        <tr key={item.id}>
                            <td>
                                <div className="item-name">{item.name}</div>
                                <div className="item-date">{new Date(item.created_at).toLocaleDateString()}</div>
                            </td>
                            <td>
                                <div className="item-email">{item.email}</div>
                                <div className="item-phone">{item.phone || item.form_data?.phone || 'N/A'}</div>
                            </td>
                            <td>
                                {isCustomerTab ? (
                                    <AppointmentInput item={item} updateAppointment={updateAppointment} />
                                ) : (
                                    <div className="item-concern">{item.concern}</div>
                                )}
                            </td>
                            <td>
                                <span className={`status-pill ${item.status}`}>{item.status}</span>
                            </td>
                            <td>
                                <div className="action-cell">
                                    {!isCustomerTab ? (
                                        <>
                                            {item.status !== 'accepted' && <button className="icon-btn accept" onClick={() => updateLeadStatus(item.id, 'accept')}><Check size={18} /></button>}
                                            {item.status !== 'rejected' && <button className="icon-btn reject" onClick={() => updateLeadStatus(item.id, 'reject')}><X size={18} /></button>}
                                        </>
                                    ) : (
                                        <>
                                            <button className="btn-small-view" onClick={() => navigate(`/admin/customer/${item.id}`)}>View Profile</button>
                                            {item.status === 'confirmed' ? (
                                                <button className="btn-small-status deactivate" onClick={() => updateCustomerStatus(item.id, 'deactivated')}>Deactivate</button>
                                            ) : (
                                                <button className="btn-small-status activate" onClick={() => updateCustomerStatus(item.id, 'confirmed')}>Activate</button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="leads-manager-container">
            <div className="leads-controls-bar">
                <div className="leads-tabs-scroll-container">
                    <div className="leads-tabs">
                        <button className={`lead-tab ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>New Leads</button>
                        <button className={`lead-tab ${activeTab === 'accepted' ? 'active' : ''}`} onClick={() => setActiveTab('accepted')}>Accepted</button>
                        <button className={`lead-tab ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>Rejected</button>
                        <div className="tab-divider" />
                        <button className={`lead-tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Customers</button>
                        <button className={`lead-tab ${activeTab === 'inactive' ? 'active' : ''}`} onClick={() => setActiveTab('inactive')}>Inactive</button>
                    </div>
                </div>
                <div className="view-toggle-container">
                    <div className="view-toggle-segment">
                        <button className={`view-segment-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={20} /></button>
                        <button className={`view-segment-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={20} /></button>
                    </div>
                </div>
            </div>

            <div className="results-area">
                {filteredItems.length === 0 ? (
                    <div className="no-data-message">No records found for this category.</div>
                ) : viewMode === 'grid' ? (
                    <div className="leads-grid-view">
                        {filteredItems.map(item => renderCard(item))}
                    </div>
                ) : (
                    renderList()
                )}
            </div>

            <div className="pagination-footer">
                <span>Showing {filteredItems.length} records</span>
            </div>
        </div>
    );
};

export default LeadsManager;
