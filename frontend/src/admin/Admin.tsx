import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Admin.css';
import axios from 'axios';
import {
    LayoutDashboard, Users, UserPlus, FileText, LogOut,
    DollarSign, Calendar as CalendarIcon,
    ChevronLeft, ChevronRight, Clock, AlertCircle,
    Check, X, LayoutGrid, List, Phone, Mail, CalendarDays,
    ArrowLeft, ShieldAlert, User, CreditCard, ClipboardList, BarChart2,
    BookOpen, Sun, Moon
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { isFutureOrCurrentSlot, isTodayOrFutureDate, toDateInputString } from '../utils/validation';
import logo from '../assets/logo3.png';
const formatDateForInput = (dateString?: string) => {
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

const formatTimeForInput = (dateString?: string) => {
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

const formatSessionHistoryDate = (dateValue?: string) => {
    const normalized = formatDateForInput(dateValue);
    if (!normalized) return 'Date not set';

    const parts = normalized.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return normalized;

    const [year, month, day] = parts;
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    return utcDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
    });
};

// Extracted Component for Customer Appointment Inputs
const CustomerAppointmentInput = ({ customer, checkDoubleBooking, onSave, isLocked = false, lockMessage = '' }: any) => {
    const APPOINTMENT_SLOTS = [
        { label: '09:00 AM', value: '09:00' },
        { label: '10:00 AM', value: '10:00' },
        { label: '11:00 AM', value: '11:00' },
        { label: '12:00 PM', value: '12:00' },
        { label: '02:00 PM', value: '14:00' },
        { label: '03:00 PM', value: '15:00' },
        { label: '04:00 PM', value: '16:00' },
        { label: '05:00 PM', value: '17:00' }
    ];

    const initialDate = formatDateForInput(customer.appointment_date);
    const initialSlot = formatTimeForInput(customer.appointment_date);
    const [date, setDate] = useState(initialDate);
    const [slot, setSlot] = useState(initialSlot);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const todayDateInput = toDateInputString(new Date());

    useEffect(() => {
        setDate(formatDateForInput(customer.appointment_date));
        setSlot(formatTimeForInput(customer.appointment_date));
    }, [customer.appointment_date]);

    const handleSave = async () => {
        if (isLocked) {
            return alert(lockMessage || 'This session is locked and cannot be edited.');
        }
        if (!date || !slot) return alert("Please select both Date and Slot");
        if (!isTodayOrFutureDate(date)) {
            return alert('Slot booking date cannot be in the past.');
        }
        if (!isFutureOrCurrentSlot(date, slot)) {
            return alert('Cannot book a past time slot.');
        }
        if (checkDoubleBooking(date, slot, customer.id)) {
            return alert("This time slot is already booked. Please select another time.");
        }
        setIsSaving(true);
        try {
            await onSave(customer.id, `${date}T${slot}`);
            setIsEditing(false);
        } catch (e: any) {
            console.error("Save failed", e);
            alert(e?.message || 'Failed to save appointment.');
        }
        setIsSaving(false);
    };

    const handleCancel = () => {
        setDate(initialDate);
        setSlot(initialSlot);
        setIsEditing(false);
    };

    if (!isEditing) {
        const hasAppointment = !!customer.appointment_date;
        const displayDate = hasAppointment ? new Date(customer.appointment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
        const displaySlot = hasAppointment ? (APPOINTMENT_SLOTS.find(s => s.value === customer.slot)?.label || customer.slot || '') : '';

        return (
            <div className="a2-customer-appt-display">
                <div className="a2-appt-text">
                    {hasAppointment ? (
                        <>
                            <CalendarDays size={14} className="text-muted mr-1" /> {displayDate}
                            <Clock size={14} className="text-muted ml-2 mr-1" /> {displaySlot}
                        </>
                    ) : (
                        <span className="text-muted">No appointment scheduled</span>
                    )}
                </div>
                <button className="a2-btn-edit-mini" onClick={() => setIsEditing(true)} disabled={isLocked}>
                    {hasAppointment ? 'Edit' : 'Schedule'}
                </button>
                {isLocked && hasAppointment && <small className="a2-session-lock-text">{lockMessage || 'Locked session'}</small>}
            </div>
        );
    }

    return (
        <div className="a2-customer-appt-editor">
            <div className="a2-editor-inputs">
                <input
                    type="date"
                    value={date}
                    min={todayDateInput}
                    onChange={(e) => setDate(e.target.value)}
                    className="a2-appt-input"
                />
                <select
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    disabled={!date}
                    className="a2-appt-select"
                >
                    <option value="">Select slot</option>
                    {APPOINTMENT_SLOTS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
            </div>
            <div className="a2-editor-actions">
                <button onClick={handleSave} disabled={isSaving || !date || !slot} className="a2-btn-save-mini">
                    {isSaving ? '...' : <Check size={14} />}
                </button>
                <button onClick={handleCancel} disabled={isSaving} className="a2-btn-cancel-mini">
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

const Admin: React.FC = () => {
    const navigate = useNavigate();
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
        try {
            const storedTheme = localStorage.getItem('adminThemeMode');
            return storedTheme === 'dark' ? 'dark' : 'light';
        } catch {
            return 'light';
        }
    });

    // UI state
    const [activeMenu, setActiveMenu] = useState<'dashboard' | 'leads' | 'customers' | 'blogs'>('dashboard');
    const [stats, setStats] = useState({
        leads: 0,
        leadsGrowth: 12, // Mock growth value 
        customers: 0,
        customersGrowth: 5, // Mock growth value
        activeCustomers: 0,
        turnover: 0
    });

    // Data state
    const [appointments, setAppointments] = useState<any[]>([]);
    const [bookingCustomers, setBookingCustomers] = useState<any[]>([]);
    const [allLeads, setAllLeads] = useState<any[]>([]);
    const [allCustomers, setAllCustomers] = useState<any[]>([]);

    // Leads UI state
    const [activeLeadTab, setActiveLeadTab] = useState<'new' | 'accepted' | 'rejected'>('new');
    const [leadsViewMode, setLeadsViewMode] = useState<'grid' | 'list'>('grid');

    // Customers UI state
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [customerViewMode, setCustomerViewMode] = useState<'grid' | 'list'>('grid');
    const [activeCustomerTab, setActiveCustomerTab] = useState<'active' | 'inactive'>('active');

    // Customer Profile state
    const [profileData, setProfileData] = useState<any>(null);
    const [profileNotes, setProfileNotes] = useState<any[]>([]);
    const [profilePayments, setProfilePayments] = useState<any[]>([]);
    const [profileFormsData, setProfileFormsData] = useState<any>(null);
    const [profileSessions, setProfileSessions] = useState<any[]>([]);
    const [sessionPresenceDrafts, setSessionPresenceDrafts] = useState<Record<number, string>>({});
    const [updatingSessionId, setUpdatingSessionId] = useState<number | null>(null);
    const [newNote, setNewNote] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentType, setPaymentType] = useState('UPI');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [isSavingPayment, setIsSavingPayment] = useState(false);

    // Edit Settings State
    const [editPrice, setEditPrice] = useState<string | number>('');
    const [editSessions, setEditSessions] = useState<string | number>('');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Blog UI and Data State
    const [blogs, setBlogs] = useState<any[]>([]);
    const [formBlog, setFormBlog] = useState<{ id: number | null, title: string, content: string, image_url: string, is_active: boolean }>({
        id: null, title: '', content: '', image_url: '', is_active: true
    });
    const [selectedBlogImage, setSelectedBlogImage] = useState<File | null>(null);
    const [showBlogForm, setShowBlogForm] = useState(false);
    const [blogViewMode, setBlogViewMode] = useState<'grid' | 'list'>('grid');

    // Calendar & Booking state
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [activeStartDate, setActiveStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [bookingCustomerId, setBookingCustomerId] = useState<number | ''>('');
    const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [bookingSlot, setBookingSlot] = useState<string>('');
    const [bookingSaving, setBookingSaving] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);

    const APPOINTMENT_SLOTS: Array<{ label: string; value: string }> = [
        { label: '09:00 AM', value: '09:00' },
        { label: '10:00 AM', value: '10:00' },
        { label: '11:00 AM', value: '11:00' },
        { label: '12:00 PM', value: '12:00' },
        { label: '02:00 PM', value: '14:00' },
        { label: '03:00 PM', value: '15:00' },
        { label: '04:00 PM', value: '16:00' },
        { label: '05:00 PM', value: '17:00' }
    ];

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/admin/login');
            return;
        }
        fetchDashboardData();
    }, [navigate]);

    useEffect(() => {
        try {
            localStorage.setItem('adminThemeMode', themeMode);
        } catch {
            // Ignore storage failures and keep runtime theme state.
        }
    }, [themeMode]);

    useEffect(() => {
        if (activeMenu !== 'dashboard') return;

        fetchDashboardData();
        const refreshId = window.setInterval(() => {
            fetchDashboardData();
        }, 30000);

        return () => window.clearInterval(refreshId);
    }, [activeMenu]);

    const todayDateInput = toDateInputString(new Date());

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { Authorization: `Bearer ${token}` };

            const leadsRes = await axios.get('/api/leads', { headers });
            const customersRes = await axios.get('/api/customers', { headers });
            const turnoverRes = await axios.get('/api/admin/turnover', { headers });
            const blogsRes = await axios.get('/api/blogs', { headers });

            const turnover = turnoverRes.data.turnover || 0;
            const activeCustomersCount = customersRes.data.filter((c: any) => c.status === 'confirmed' || c.is_active === true).length;

            setStats({
                leads: leadsRes.data.length,
                leadsGrowth: 15,
                customers: customersRes.data.length,
                customersGrowth: 8,
                activeCustomers: activeCustomersCount,
                turnover: turnover
            });

            setAllLeads(leadsRes.data);
            setBlogs(blogsRes.data);

            const filteredCustomers = customersRes.data.filter((c: any) => {
                if (c.lead_id && (!c.form_data || Object.keys(c.form_data).length === 0)) {
                    return false;
                }
                return true;
            });
            setAllCustomers(filteredCustomers);

            // Show every booked slot on the calendar, even if status labels vary.
            const allAppointments = customersRes.data.filter((c: any) => !!c.appointment_date);
            setAppointments(allAppointments);

            const bookable = customersRes.data.filter((c: any) => c.is_active === true);
            setBookingCustomers(bookable);

        } catch (error) {
            console.error("Dashboard Fetch Error", error);
        }
    };

    const fetchBlogs = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get('/api/blogs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBlogs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const uploadBlogImage = async (file: File): Promise<string | null> => {
        try {
            const token = localStorage.getItem('adminToken');
            const formData = new FormData();
            formData.append('image', file);

            const res = await axios.post('/api/blogs/upload', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            return res.data.image_url;
        } catch (err: any) {
            console.error('Image upload failed', err);
            alert(`Image Upload Error: ${err.response?.data?.message || err.message}`);
            return null;
        }
    };

    const saveBlog = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            let finalImageUrl = formBlog.image_url;

            if (selectedBlogImage) {
                const uploadedUrl = await uploadBlogImage(selectedBlogImage);
                if (uploadedUrl) {
                    finalImageUrl = uploadedUrl;
                } else {
                    return; // Stop if image upload failed and error alert was shown
                }
            }

            const payload = {
                title: formBlog.title,
                content: formBlog.content,
                image_url: finalImageUrl,
                is_active: formBlog.is_active
            };

            if (formBlog.id) {
                await axios.put(`/api/blogs/${formBlog.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/blogs', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            // Reset and refresh
            cancelEditBlog();
            fetchBlogs();
        } catch (err) {
            console.error(err);
            alert('Failed to save blog');
        }
    };

    const editBlog = (blog: any) => {
        setFormBlog({
            id: blog.id,
            title: blog.title,
            content: blog.content,
            image_url: blog.image_url || '',
            is_active: blog.is_active
        });
        setSelectedBlogImage(null);
        setShowBlogForm(true);
    };

    const cancelEditBlog = () => {
        setFormBlog({ id: null, title: '', content: '', image_url: '', is_active: true });
        setSelectedBlogImage(null);
        setShowBlogForm(false);
    };

    const deleteBlog = async (id: number) => {
        if (!window.confirm('Delete this blog? This action cannot be undone.')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`/api/blogs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBlogs();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleBlogStatus = async (blog: any) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(`/api/blogs/${blog.id}`,
                { ...blog, is_active: !blog.is_active },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchBlogs();
        } catch (err) {
            console.error('Failed to update blog status', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    const toggleThemeMode = () => {
        setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const parseDateTimeSmart = (value: any, slotOverride?: string): Date => {
        let d = new Date(NaN);
        if (!value) return d;
        if (value instanceof Date) {
            d = new Date(value.getTime());
        } else {
            const s = String(value).replace(' ', 'T');
            const hasTz = /[zZ]$|[+-]\d{2}:\d{2}$/.test(s);
            if (hasTz) {
                d = new Date(s);
            } else {
                const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
                if (m) {
                    const y = parseInt(m[1], 10);
                    const mo = parseInt(m[2], 10) - 1;
                    const dateVal = parseInt(m[3], 10);
                    const hh = m[4] ? parseInt(m[4], 10) : 0;
                    const mm = m[5] ? parseInt(m[5], 10) : 0;
                    d = new Date(y, mo, dateVal, hh, mm);
                } else {
                    d = new Date(s);
                }
            }
        }

        if (!isNaN(d.getTime()) && slotOverride && slotOverride.includes(':')) {
            const parts = slotOverride.split(':');
            const targetH = parseInt(parts[0], 10);
            const targetM = parseInt(parts[1], 10);
            if (!isNaN(targetH) && !isNaN(targetM)) {
                d.setHours(targetH, targetM, 0, 0);
            }
        }

        return d;
    };

    const shiftMonth = (delta: number) => {
        setActiveStartDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const toDateKey = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const getAppointmentName = (app: any) => {
        const fullName = app.name || `${app.computed_first || ''} ${app.computed_last || ''}`.trim();
        return fullName || 'Customer';
    };

    const getAppointmentSlotLabel = (app: any, fallbackDate?: Date) => {
        const normalizedSlot = app?.slot ? String(app.slot).slice(0, 5) : '';
        if (normalizedSlot) {
            const slotObj = APPOINTMENT_SLOTS.find(s => s.value === normalizedSlot);
            if (slotObj) return slotObj.label;
            return normalizedSlot;
        }
        if (fallbackDate && !isNaN(fallbackDate.getTime())) {
            return fallbackDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        return 'Time not set';
    };

    const appointmentsByDate = appointments.reduce((acc: Record<string, any[]>, app) => {
        const appDate = parseDateTimeSmart(app.appointment_date, app.slot);
        if (isNaN(appDate.getTime())) return acc;
        const key = toDateKey(appDate);
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(app);
        return acc;
    }, {});

    const checkDoubleBooking = (selectedDateStr: string, slotTimeStr: string, currentCustomerId?: number): boolean => {
        const targetDateTime = new Date(`${selectedDateStr}T${slotTimeStr}`);
        return appointments.some(app => {
            if (currentCustomerId && app.id === currentCustomerId) return false; // Ignore current appointment when editing
            const appDate = parseDateTimeSmart(app.appointment_date, app.slot);
            if (isNaN(appDate.getTime())) return false;
            return appDate.getTime() === targetDateTime.getTime();
        });
    };

    const handleSaveNewSession = async () => {
        setBookingError(null);
        if (!bookingCustomerId) return setBookingError('Please select a customer.');
        if (!bookingDate) return setBookingError('Please choose a session date.');
        if (!bookingSlot) return setBookingError('Please select a slot.');
        if (!isTodayOrFutureDate(bookingDate)) {
            return setBookingError('Slot booking date cannot be in the past.');
        }
        if (!isFutureOrCurrentSlot(bookingDate, bookingSlot)) {
            return setBookingError('Cannot book a past time slot.');
        }

        if (checkDoubleBooking(bookingDate, bookingSlot, Number(bookingCustomerId) || undefined)) {
            return setBookingError('This time slot is already booked on the selected date. Please choose another slot.');
        }

        setBookingSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { Authorization: `Bearer ${token}` };
            const payloadDate = `${bookingDate}T${bookingSlot}`;

            await axios.put(`/api/customers/${bookingCustomerId}/appointment`, {
                appointment_date: payloadDate,
                slot: bookingSlot
            }, { headers });

            setBookingCustomerId('');
            setBookingSlot('');
            await fetchDashboardData();

            const booked = parseDateTimeSmart(payloadDate);
            if (!isNaN(booked.getTime())) {
                setSelectedDate(booked);
                setActiveStartDate(new Date(booked.getFullYear(), booked.getMonth(), 1));
            }
        } catch (error) {
            console.error('New session booking failed', error);
            setBookingError('Failed to save session. Please try again.');
        }
        setBookingSaving(false);
    };

    const tileContent = ({ date, view }: { date: Date, view: string }) => {
        if (view === 'month') {
            const dayAppts = appointmentsByDate[toDateKey(date)] || [];
            if (dayAppts.length > 0) {
                return (
                    <div className="a2-calendar-tile-content">
                        <div className="a2-calendar-dot" />
                        {dayAppts.length > 1 && <div className="a2-calendar-dot-count">{dayAppts.length}</div>}
                    </div>
                );
            }
        }
        return null;
    };

    const tileClassName = ({ date, view }: { date: Date, view: string }) => {
        if (view !== 'month') return '';
        return (appointmentsByDate[toDateKey(date)] || []).length > 0 ? 'a2-calendar-has-booking' : '';
    };

    const todayDateStart = new Date();
    todayDateStart.setHours(0, 0, 0, 0);

    const todayAppointments = appointments.filter(app => {
        const appDate = parseDateTimeSmart(app.appointment_date, app.slot);
        if (isNaN(appDate.getTime())) return false;

        // Match today's date exactly
        return appDate.getDate() === todayDateStart.getDate() &&
            appDate.getMonth() === todayDateStart.getMonth() &&
            appDate.getFullYear() === todayDateStart.getFullYear();
    }).sort((a, b) => parseDateTimeSmart(a.appointment_date, a.slot).getTime() - parseDateTimeSmart(b.appointment_date, b.slot).getTime());

    const upcomingAppointments = appointments.filter(app => {
        const appDate = parseDateTimeSmart(app.appointment_date, app.slot);
        if (isNaN(appDate.getTime())) return false;
        return appDate > todayDateStart && (
            appDate.getDate() !== todayDateStart.getDate() ||
            appDate.getMonth() !== todayDateStart.getMonth() ||
            appDate.getFullYear() !== todayDateStart.getFullYear());
    }).sort((a, b) => parseDateTimeSmart(a.appointment_date, a.slot).getTime() - parseDateTimeSmart(b.appointment_date, b.slot).getTime()).slice(0, 5);

    const appointmentsOnSelectedDate = (appointmentsByDate[toDateKey(selectedDate)] || [])
        .slice()
        .sort((a, b) => parseDateTimeSmart(a.appointment_date, a.slot).getTime() - parseDateTimeSmart(b.appointment_date, b.slot).getTime());
    const handleUpdateLeadStatus = async (id: number, action: 'accept' | 'reject') => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(`/api/leads/${id}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchDashboardData();
        } catch (err) {
            console.error(err);
            alert(`Error ${action}ing lead.`);
        }
    };

    const renderLeadsView = () => {
        const filteredLeads = allLeads.filter(l => l.status === activeLeadTab);

        return (
            <div className="a2-leads-container">
                <header className="a2-header a2-leads-header">
                    <div>
                        <h1>Leads Management</h1>
                        <p>Manage and track your incoming prospects.</p>
                    </div>
                    <div className="a2-leads-actions">
                        <div className="a2-pill-group">
                            <button className={`a2-pill ${activeLeadTab === 'new' ? 'active' : ''}`} onClick={() => setActiveLeadTab('new')}>New Leads</button>
                            <button className={`a2-pill ${activeLeadTab === 'accepted' ? 'active' : ''}`} onClick={() => setActiveLeadTab('accepted')}>Accepted</button>
                            <button className={`a2-pill ${activeLeadTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveLeadTab('rejected')}>Rejected</button>
                        </div>
                        <div className="a2-view-toggle">
                            <button className={`a2-icon-btn ${leadsViewMode === 'grid' ? 'active' : ''}`} onClick={() => setLeadsViewMode('grid')}><LayoutGrid size={20} /></button>
                            <button className={`a2-icon-btn ${leadsViewMode === 'list' ? 'active' : ''}`} onClick={() => setLeadsViewMode('list')}><List size={20} /></button>
                        </div>
                    </div>
                </header>

                <div className="a2-leads-content">
                    {filteredLeads.length === 0 ? (
                        <div className="a2-empty-state">
                            <Users size={48} opacity={0.2} />
                            <p>No {activeLeadTab} leads found.</p>
                        </div>
                    ) : leadsViewMode === 'grid' ? (
                        <div className="a2-leads-grid">
                            {filteredLeads.map(lead => (
                                <div key={lead.id} className="a2-lead-card">
                                    <div className="a2-lead-card-header">
                                        <h3>{lead.name}</h3>
                                        <span className={`a2-status-pill ${lead.status}`}>{lead.status}</span>
                                    </div>
                                    <div className="a2-lead-card-body">
                                        <div className="a2-info-row"><Mail size={16} /> <span>{lead.email}</span></div>
                                        <div className="a2-info-row"><Phone size={16} /> <span>{lead.phone || lead.form_data?.phone || 'N/A'}</span></div>
                                        <div className="a2-info-row"><CalendarDays size={16} /> <span>{new Date(lead.created_at).toLocaleDateString()}</span></div>
                                        <div className="a2-lead-concern">
                                            <strong>Concern:</strong> <p>{lead.concern}</p>
                                        </div>
                                    </div>
                                    {activeLeadTab === 'new' && (
                                        <div className="a2-lead-card-footer">
                                            <button className="a2-btn-accept" onClick={() => handleUpdateLeadStatus(lead.id, 'accept')}><Check size={18} /> Accept</button>
                                            <button className="a2-btn-reject" onClick={() => handleUpdateLeadStatus(lead.id, 'reject')}><X size={18} /> Reject</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="a2-leads-list-wrapper panel-shadow">
                            <table className="a2-leads-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Contact</th>
                                        <th>Date</th>
                                        <th>Concern</th>
                                        {activeLeadTab === 'new' && <th className="text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.map(lead => (
                                        <tr key={lead.id}>
                                            <td>
                                                <div className="fw-600 text-dark">{lead.name}</div>
                                                <div className="text-sm status-pill-mini">{lead.status}</div>
                                            </td>
                                            <td>
                                                <div>{lead.email}</div>
                                                <div className="text-sm text-muted">{lead.phone || lead.form_data?.phone || 'N/A'}</div>
                                            </td>
                                            <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                                            <td className="max-w-xs truncate">{lead.concern}</td>
                                            {activeLeadTab === 'new' && (
                                                <td className="text-right">
                                                    <div className="a2-action-group">
                                                        <button className="a2-icon-action accept" onClick={() => handleUpdateLeadStatus(lead.id, 'accept')} title="Accept"><Check size={18} /></button>
                                                        <button className="a2-icon-action reject" onClick={() => handleUpdateLeadStatus(lead.id, 'reject')} title="Reject"><X size={18} /></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const handleUpdateCustomerStatus = async (customer: any) => {
        try {
            const token = localStorage.getItem('adminToken');
            const nextActive = !customer.is_active;
            const nextStatus = nextActive ? 'confirmed' : 'deactivated';

            await axios.put(`/api/admin/customers/${customer.id}/settings`, {
                is_active: nextActive,
                status: nextStatus,
                per_session_price: customer.per_session_price || 0,
                total_sessions: customer.total_sessions || 0
            }, { headers: { Authorization: `Bearer ${token}` } });
            await fetchDashboardData();
        } catch (err) {
            console.error(err);
            alert("Error updating status");
        }
    };

    const handleSaveCustomerAppointment = async (id: number, dateSlotString: string) => {
        const token = localStorage.getItem('adminToken');

        let slotVal = '';
        let dateVal = '';
        if (dateSlotString.includes('T')) {
            dateVal = dateSlotString.split('T')[0];
            slotVal = dateSlotString.split('T')[1].substring(0, 5);
        }

        if (!dateVal || !slotVal) {
            throw new Error('Appointment date and slot are required.');
        }

        if (!isTodayOrFutureDate(dateVal)) {
            throw new Error('Slot booking date cannot be in the past.');
        }

        if (!isFutureOrCurrentSlot(dateVal, slotVal)) {
            throw new Error('Cannot book a past time slot.');
        }

        try {
            await axios.put(`/api/customers/${id}/appointment`, {
                appointment_date: dateSlotString,
                slot: slotVal
            }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to update appointment.';
            throw new Error(message);
        }

        await fetchDashboardData();
        await fetchCustomerSessions(id);
        await refreshCustomerRecord(id);
    };

    const fetchCustomerSessions = async (customerId: number) => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { Authorization: `Bearer ${token}` };
            const sessionsRes = await axios.get(`/api/admin/customers/${customerId}/sessions`, { headers });
            const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];

            setProfileSessions(sessions);
            const draftMap: Record<number, string> = {};
            sessions.forEach((session: any) => {
                draftMap[session.id] = session.presence_status || 'not_marked';
            });
            setSessionPresenceDrafts(draftMap);
        } catch (error) {
            console.error('Failed to load customer sessions', error);
            setProfileSessions([]);
            setSessionPresenceDrafts({});
        }
    };

    const refreshCustomerRecord = async (customerId: number) => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { Authorization: `Bearer ${token}` };
            const customersRes = await axios.get('/api/customers', { headers });
            const updatedCustomer = customersRes.data.find((c: any) => c.id === customerId);
            if (updatedCustomer) {
                setProfileData(updatedCustomer);
            }
        } catch (error) {
            console.error('Failed to refresh customer data', error);
        }
    };

    const handleSessionPresenceUpdate = async (customerId: number, sessionId: number) => {
        const nextStatus = sessionPresenceDrafts[sessionId] || 'not_marked';
        setUpdatingSessionId(sessionId);
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { Authorization: `Bearer ${token}` };

            const response = await axios.put(
                `/api/admin/customers/${customerId}/sessions/${sessionId}/presence`,
                { presence_status: nextStatus },
                { headers }
            );

            if (response.data?.message) {
                alert(response.data.message);
            }

            await fetchCustomerSessions(customerId);
            await fetchDashboardData();
            await refreshCustomerRecord(customerId);
        } catch (error: any) {
            console.error('Failed to update session presence', error);
            alert(error?.response?.data?.message || 'Failed to update session presence.');
        }
        setUpdatingSessionId(null);
    };

    const loadCustomerProfile = async (customer: any) => {
        setSelectedCustomerId(customer.id);
        setProfileData(customer);
        setEditPrice(customer.per_session_price || 0);
        setEditSessions(customer.total_sessions || 0);
        const token = localStorage.getItem('adminToken');
        try {
            const [notesRes, paymentsRes, formsRes, sessionsRes] = await Promise.all([
                axios.get(`/api/admin/customers/${customer.id}/notes`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`/api/admin/customers/${customer.id}/payments`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`/api/customers/${customer.id}/forms`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`/api/admin/customers/${customer.id}/sessions`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setProfileNotes(notesRes.data);
            setProfilePayments(paymentsRes.data);
            setProfileFormsData(formsRes.data);
            const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
            setProfileSessions(sessions);
            const draftMap: Record<number, string> = {};
            sessions.forEach((session: any) => {
                draftMap[session.id] = session.presence_status || 'not_marked';
            });
            setSessionPresenceDrafts(draftMap);
        } catch (e) {
            console.error("Failed to load profile data", e);
        }
    };

    useEffect(() => {
        if (!selectedCustomerId) return;

        const refreshId = window.setInterval(() => {
            fetchCustomerSessions(selectedCustomerId);
        }, 30000);

        return () => window.clearInterval(refreshId);
    }, [selectedCustomerId]);

    const handleAddNote = async () => {
        if (!newNote.trim() || !profileData) return;
        setIsSavingNote(true);
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post(`/api/admin/customers/${profileData.id}/notes`, { note_text: newNote }, { headers: { Authorization: `Bearer ${token}` } });
            setNewNote('');
            const notesRes = await axios.get(`/api/admin/customers/${profileData.id}/notes`, { headers: { Authorization: `Bearer ${token}` } });
            setProfileNotes(notesRes.data);
        } catch (err) {
            console.error(err);
            alert("Error adding note");
        }
        setIsSavingNote(false);
    };

    const handleAddPayment = async () => {
        if (!paymentAmount || !profileData) return;
        setIsSavingPayment(true);
        try {
            const token = localStorage.getItem('adminToken');
            const newSessionCount = profilePayments.length + 1;

            await axios.post(`/api/admin/customers/${profileData.id}/payments`, {
                session_number: newSessionCount,
                amount: Number(paymentAmount),
                payment_type: paymentType
            }, { headers: { Authorization: `Bearer ${token}` } });

            setPaymentAmount('');

            const paymentsRes = await axios.get(`/api/admin/customers/${profileData.id}/payments`, { headers: { Authorization: `Bearer ${token}` } });
            setProfilePayments(paymentsRes.data);
            await fetchDashboardData();
        } catch (err) {
            console.error(err);
            alert("Error adding payment / session");
        }
        setIsSavingPayment(false);
    };

    const handleSaveSettings = async () => {
        if (!profileData) return;
        setIsSavingSettings(true);
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(`/api/admin/customers/${profileData.id}/settings`, {
                total_sessions: Number(editSessions),
                per_session_price: Number(editPrice),
                is_active: profileData.is_active,
                status: profileData.status
            }, { headers: { Authorization: `Bearer ${token}` } });

            setProfileData({ ...profileData, total_sessions: Number(editSessions), per_session_price: Number(editPrice) });
            await fetchDashboardData();
        } catch (err) {
            console.error(err);
            alert("Error saving settings");
        }
        setIsSavingSettings(false);
    };

    const calculateIntakeScore = (formData: any) => {
        if (!formData) return 0;
        let score = 0;
        Object.values(formData).forEach((val: any) => {
            if (typeof val === 'string') {
                const processStr = val.toLowerCase().trim();
                // We assume anything stating 'yes' to risk-assessment adds score.
                if (processStr === 'yes' || processStr === 'true') score += 10;
            } else if (val === true) {
                score += 10;
            } else if (Array.isArray(val)) {
                val.forEach((item: any) => {
                    const answerText = typeof item === 'object' && item.answer ? String(item.answer) : String(item);
                    const processStr = answerText.toLowerCase().trim();
                    if (processStr === 'yes' || processStr === 'true') score += 10;
                });
            }
        });
        return score;
    };

    const renderCustomersView = () => {
        if (selectedCustomerId) {
            return renderCustomerProfile();
        }

        const filteredCustomers = allCustomers.filter(c =>
            activeCustomerTab === 'active'
                ? (c.is_active === true)
                : (c.is_active === false)
        );

        return (
            <div className="a2-leads-container">
                <header className="a2-header a2-leads-header">
                    <div>
                        <h1>Customers Directory</h1>
                        <p>Manage active and inactive customers, schedules, and profiles.</p>
                    </div>
                    <div className="a2-leads-actions">
                        <div className="a2-pill-group">
                            <button className={`a2-pill ${activeCustomerTab === 'active' ? 'active' : ''}`} onClick={() => setActiveCustomerTab('active')}>Active Customers</button>
                            <button className={`a2-pill ${activeCustomerTab === 'inactive' ? 'active' : ''}`} onClick={() => setActiveCustomerTab('inactive')}>Inactive Customers</button>
                        </div>
                        <div className="a2-view-toggle">
                            <button className={`a2-icon-btn ${customerViewMode === 'grid' ? 'active' : ''}`} onClick={() => setCustomerViewMode('grid')}><LayoutGrid size={20} /></button>
                            <button className={`a2-icon-btn ${customerViewMode === 'list' ? 'active' : ''}`} onClick={() => setCustomerViewMode('list')}><List size={20} /></button>
                        </div>
                    </div>
                </header>

                <div className="a2-leads-content">
                    {filteredCustomers.length === 0 ? (
                        <div className="a2-empty-state">
                            <Users size={48} opacity={0.2} />
                            <p>No {activeCustomerTab} customers found.</p>
                        </div>
                    ) : customerViewMode === 'grid' ? (
                        <div className="a2-leads-grid">
                            {filteredCustomers.map(customer => (
                                <div key={customer.id} className="a2-lead-card">
                                    <div className="a2-customer-card-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className={`a2-calendar-dot ${customer.is_active ? 'a2-dot-active' : 'a2-dot-inactive'}`} />
                                            <h3>{customer.name}</h3>
                                        </div>
                                        <div className="a2-card-subtitle">
                                            <Phone size={12} className="mr-1" /> {customer.phone || 'No phone'}
                                        </div>
                                        {customer.concern && (
                                            <div className="a2-card-concern" title={customer.concern}>
                                                {customer.concern.length > 60 ? customer.concern.substring(0, 57) + "..." : customer.concern}
                                            </div>
                                        )}
                                    </div>
                                    <div className="a2-lead-card-body">
                                        <CustomerAppointmentInput
                                            customer={customer}
                                            checkDoubleBooking={checkDoubleBooking}
                                            onSave={handleSaveCustomerAppointment}
                                        />
                                    </div>
                                    <div className="a2-lead-card-footer a2-split-footer">
                                        <button className="a2-btn-secondary" onClick={() => loadCustomerProfile(customer)}>View Profile</button>
                                        <button className={`a2-btn-toggle ${customer.is_active ? 'btn-red' : 'btn-green'}`} onClick={() => handleUpdateCustomerStatus(customer)}>
                                            {customer.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="a2-leads-list-wrapper panel-shadow">
                            <table className="a2-leads-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Appointment</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.map(customer => (
                                        <tr key={customer.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className={`a2-calendar-dot ${customer.is_active ? 'a2-dot-active' : 'a2-dot-inactive'}`} />
                                                    <div>
                                                        <div className="fw-600 text-dark">{customer.name}</div>
                                                        <div className="a2-card-subtitle" style={{ marginTop: '2px' }}>
                                                            {customer.phone}
                                                        </div>
                                                        {customer.concern && (
                                                            <div className="a2-card-concern" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                                                {customer.concern.length > 40 ? customer.concern.substring(0, 37) + "..." : customer.concern}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <CustomerAppointmentInput
                                                    customer={customer}
                                                    checkDoubleBooking={checkDoubleBooking}
                                                    onSave={handleSaveCustomerAppointment}
                                                />
                                            </td>
                                            <td className="text-right">
                                                <div className="a2-action-group">
                                                    <button className="a2-btn-secondary" onClick={() => loadCustomerProfile(customer)}>Profile</button>
                                                    <button className={`a2-btn-toggle ${customer.is_active ? 'btn-red' : 'btn-green'}`} onClick={() => handleUpdateCustomerStatus(customer)}>
                                                        {customer.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderCustomerProfile = () => {
        if (!profileData) return null;

        let fd: any = {};
        try {
            fd = typeof profileData.form_data === 'string' ? JSON.parse(profileData.form_data) : (profileData.form_data || {});
        } catch (e) {
            console.error("Failed to parse form_data", e);
        }

        const totalPaid = profilePayments.reduce((sum: any, p: any) => sum + Number(p.amount), 0);
        const price = Number(profileData.per_session_price) || 0;
        const totalSessions = profileData.total_sessions || 0;
        const dueAmount = (totalSessions * price) - totalPaid;

        const currentAppointmentDate = formatDateForInput(profileData.appointment_date);
        const currentAppointmentSlot = (profileData.slot ? String(profileData.slot).slice(0, 5) : formatTimeForInput(profileData.appointment_date));
        const currentSession = profileSessions.find((session: any) => {
            const sessionDate = formatDateForInput(session.session_date);
            const sessionSlot = String(session.slot || '').slice(0, 5);
            return sessionDate === currentAppointmentDate && sessionSlot === currentAppointmentSlot;
        });

        const isCurrentSessionLocked = !!currentSession && (
            currentSession.locked ||
            currentSession.presence_status === 'present' ||
            currentSession.is_past
        );

        const currentSessionLockMessage = currentSession?.presence_status === 'present'
            ? 'Locked after marking present.'
            : currentSession?.is_past
                ? 'Past sessions cannot be edited.'
                : isCurrentSessionLocked
                    ? 'This session is locked.'
                    : '';

        const sortedProfileSessions = [...profileSessions].sort((a: any, b: any) => {
            const aKey = `${formatDateForInput(a.session_date)} ${String(a.slot || '').slice(0, 5)}`;
            const bKey = `${formatDateForInput(b.session_date)} ${String(b.slot || '').slice(0, 5)}`;
            return aKey < bKey ? 1 : -1;
        });
        const totalSessionsLimit = Number(profileData.total_sessions || 0);
        const visibleProfileSessions = totalSessionsLimit > 0
            ? sortedProfileSessions.slice(0, totalSessionsLimit)
            : sortedProfileSessions;

        const getPresenceLabel = (value: string) => {
            if (value === 'present') return 'Present';
            if (value === 'absent') return 'Absent';
            return 'Not Marked';
        };

        const getSessionSlotLabel = (slotValue?: string) => {
            const normalizedSlot = String(slotValue || '').slice(0, 5);
            const matchingSlot = APPOINTMENT_SLOTS.find((slot) => slot.value === normalizedSlot);
            return matchingSlot?.label || normalizedSlot || 'Slot not set';
        };

        return (
            <div className="a2-profile-container">
                <header className="a2-profile-header">
                    <button className="a2-btn-back" onClick={() => setSelectedCustomerId(null)}><ArrowLeft size={16} /> Back to Directory</button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '16px 0' }}>
                        <div>
                            <h1>{profileData.name} <span className={`a2-badge ${profileData.is_active ? 'active' : 'inactive'}`}>{profileData.is_active ? 'Active' : 'Inactive'}</span></h1>
                            <p>Joined {new Date(profileData.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </header>

                <div className="a2-profile-grid">
                    {/* Left Column (Main Content) */}
                    <div className="a2-profile-col">
                        <div className="a2-profile-top-row">
                            <div className="a2-info-session-stack a2-fixed-history-panel">
                                {/* 1 - Customer Info */}
                                <div className="a2-panel a2-info-panel a2-info-stack-panel">
                                    <h3><User size={18} /> Customer Info</h3>
                                    <div className="a2-info-grid">
                                        <div><small>Email</small><p>{profileData.email || 'N/A'}</p></div>
                                        <div><small>Phone</small><p>{fd.phone || profileData.phone || 'N/A'}</p></div>
                                        <div><small>DOB</small><p>{fd.dob || profileData.dob || 'N/A'}</p></div>
                                        <div><small>Occupation</small><p>{fd.work || fd.occupation || 'N/A'}</p></div>
                                        <div><small>Address</small><p>{fd.city || 'N/A'}</p></div>
                                    </div>
                                </div>

                                {/* 2 - Session Details */}
                                <div className="a2-panel a2-appointment-panel a2-info-stack-panel">
                                    <h3><CalendarDays size={18} /> Session Details</h3>
                                    <div style={{ marginTop: '16px' }}>
                                        <CustomerAppointmentInput
                                            customer={profileData}
                                            checkDoubleBooking={checkDoubleBooking}
                                            onSave={handleSaveCustomerAppointment}
                                            isLocked={isCurrentSessionLocked}
                                            lockMessage={currentSessionLockMessage}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 3 - Notes Section */}
                            <div className="a2-panel a2-notes-panel a2-fixed-history-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                                <h3><FileText size={18} /> Session Notes</h3>
                                <div className="a2-note-input-area">
                                    <textarea
                                        className="a2-textarea"
                                        placeholder="Type a new session note here..."
                                        value={newNote}
                                        onChange={e => setNewNote(e.target.value)}
                                        rows={2}
                                    />
                                    <button className="a2-btn-primary" onClick={handleAddNote} disabled={isSavingNote || !newNote.trim()}>
                                        {isSavingNote ? 'Saving...' : 'Save Note'}
                                    </button>
                                </div>
                                <div className="a2-notes-list a2-notes-single-window" style={{ flex: 1 }}>
                                    {profileNotes.length === 0 ? <p className="a2-empty-text">No notes yet.</p> : profileNotes.map((note: any) => (
                                        <div key={note.id} className="a2-note-item">
                                            <small>{new Date(note.created_at).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                                            <p>{note.note_text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 4 - Finance / Payment */}
                        <div className="a2-panel a2-finance-panel a2-matched-height-panel">
                            <h3><CreditCard size={18} /> Payment & Sessions</h3>

                            {/* Section 1: Settings */}
                            <div className="a2-finance-section">
                                <h4>Program Settings</h4>
                                <div className="a2-finance-settings-row">
                                    <div className="a2-fin-input-group">
                                        <label>Price / Session</label>
                                        <input type="number"
                                            value={editPrice}
                                            onChange={e => setEditPrice(e.target.value)} />
                                    </div>
                                    <div className="a2-fin-input-group">
                                        <label>Total Sessions</label>
                                        <input type="number"
                                            value={editSessions}
                                            onChange={e => setEditSessions(e.target.value)} />
                                    </div>
                                    <button className="a2-btn-secondary a2-btn-save-settings" onClick={handleSaveSettings} disabled={isSavingSettings}>
                                        {isSavingSettings ? '...' : 'Save Settings'}
                                    </button>
                                </div>
                            </div>

                            {/* Section 2: Summary Stats */}
                            <div className="a2-finance-section">
                                <h4>Financial Summary</h4>
                                <div className="a2-finance-stats-row">
                                    <div className="a2-fin-stat-card">
                                        <small>Total Paid</small>
                                        <strong className="text-green">₹{totalPaid}</strong>
                                    </div>
                                    <div className="a2-fin-stat-card">
                                        <small>Due Amount</small>
                                        <strong className={dueAmount > 0 ? 'text-red' : ''}>₹{dueAmount}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Add Payment */}
                            <div className="a2-finance-section">
                                <div className="a2-add-payment-box" style={{ marginBottom: 0 }}>
                                    <h4>Add New Session / Payment</h4>
                                    <div className="a2-form-row">
                                        <div className="a2-form-group">
                                            <label>Amount (₹)</label>
                                            <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="e.g. 500" />
                                        </div>
                                        <div className="a2-form-group">
                                            <label>Method</label>
                                            <select value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                                                <option value="UPI">UPI</option>
                                                <option value="Cash">Cash</option>
                                                <option value="Bank Transfer">Bank Transfer</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button className="a2-btn-primary" onClick={handleAddPayment} disabled={isSavingPayment || !paymentAmount}>
                                        {isSavingPayment ? 'Processing...' : `Add Session & Payment`}
                                    </button>
                                </div>
                            </div>

                            <div className="a2-finance-section">
                                <div className="a2-payment-history">
                                    <h4>Payment History</h4>
                                    {profilePayments.length === 0 ? <p className="a2-empty-text">No payments recorded.</p> : (
                                        <div className="a2-table-mini-wrap">
                                            <table className="a2-table-mini">
                                                <thead>
                                                    <tr>
                                                        <th>Session #</th>
                                                        <th>Amount</th>
                                                        <th>Method</th>
                                                        <th>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {profilePayments.map((p: any) => (
                                                        <tr key={p.id}>
                                                            <td>#{p.session_number}</td>
                                                            <td className="fw-600">₹{p.amount}</td>
                                                            <td>{p.payment_type}</td>
                                                            <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Sidebar/Forms) */}
                    <div className="a2-profile-col">
                        <div className="a2-panel a2-attendance-panel a2-fixed-history-panel">
                            <h3><ClipboardList size={18} /> Session Attendance History</h3>
                            <div className="a2-attendance-list">
                                {visibleProfileSessions.length === 0 ? (
                                    <p className="a2-empty-text">No sessions created yet.</p>
                                ) : visibleProfileSessions.map((session: any) => {
                                    const sessionDate = formatDateForInput(session.session_date);
                                    const sessionSlot = String(session.slot || '').slice(0, 5);
                                    const isLocked = session.locked || session.presence_status === 'present';
                                    const draftValue = sessionPresenceDrafts[session.id] || session.presence_status || 'not_marked';
                                    const hasChanges = draftValue !== session.presence_status;

                                    return (
                                        <div key={session.id} className="a2-attendance-item">
                                            <div className="a2-attendance-head">
                                                <strong>
                                                    {formatSessionHistoryDate(sessionDate)}
                                                </strong>
                                                <span>{getSessionSlotLabel(sessionSlot)}</span>
                                            </div>

                                            <div className={`a2-attendance-controls ${isLocked ? 'single' : ''}`}>
                                                <select
                                                    value={draftValue}
                                                    disabled={isLocked || updatingSessionId === session.id}
                                                    onChange={(e) => setSessionPresenceDrafts((prev) => ({ ...prev, [session.id]: e.target.value }))}
                                                >
                                                    <option value="not_marked">Not Marked</option>
                                                    <option value="present">Present</option>
                                                    <option value="absent">Absent</option>
                                                </select>

                                                {!isLocked && (
                                                    <button
                                                        className="a2-btn-secondary"
                                                        disabled={updatingSessionId === session.id || !hasChanges}
                                                        onClick={() => handleSessionPresenceUpdate(profileData.id, session.id)}
                                                    >
                                                        {updatingSessionId === session.id ? 'Saving...' : 'Save'}
                                                    </button>
                                                )}
                                            </div>

                                            <div className="a2-attendance-meta">
                                                <span className={`a2-presence-pill a2-presence-${session.presence_status || 'not_marked'}`}>
                                                    {getPresenceLabel(session.presence_status || 'not_marked')}
                                                </span>
                                                {session.is_past && <span className="a2-presence-note">Past session</span>}
                                                {isLocked && <span className="a2-presence-note">Locked</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 5 - Intake Evaluation / Form Marks */}
                        <div className="a2-panel a2-eval-panel a2-matched-height-panel" style={{ borderTop: `4px solid #7c3aed` }}>
                            <h3><ShieldAlert size={18} color="#7c3aed" /> Historical Form Results</h3>

                            {profileFormsData?.matchParams && (
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
                                    Auto-matched via associated Phone Number & Email: {profileFormsData.matchParams.phone || 'N/A'} / {profileFormsData.matchParams.email || 'N/A'}
                                </p>
                            )}

                            <div className="a2-eval-forms-list">
                                {profileFormsData?.forms?.length > 0 ? profileFormsData.forms.map((formEntry: any, index: number) => {
                                    let fData: any = {};
                                    try {
                                        fData = typeof formEntry.form_data === 'string' ? JSON.parse(formEntry.form_data) : (formEntry.form_data || {});
                                    } catch (e) { }

                                    const scoreValue = calculateIntakeScore(fData);

                                    return (
                                        <details key={formEntry.id || index} style={{ border: '1px solid #f97316', borderRadius: '8px', background: '#fff', overflow: 'hidden' }}>
                                            <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontWeight: 600, color: '#ea580c', listStyle: 'none' }}>
                                                <span>Form Submitted on: {new Date(formEntry.created_at).toLocaleDateString()}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>Score: {scoreValue}</span>
                                                    <span style={{ fontSize: '0.8rem' }}>▶</span>
                                                </div>
                                            </summary>

                                            <div className="a2-eval-details-body">
                                                <h4 style={{ color: '#ea580c', margin: '16px 0 12px 0' }}>Intake Form Submission {profileFormsData.forms.length - index}</h4>

                                                <div className="a2-eval-qa-list">
                                                    {Object.entries(fData).map(([key, val]) => {
                                                        if (['phone', 'email', 'name', 'first_name', 'last_name', 'age', 'work', 'occupation', 'dob', 'city', 'hobby'].includes(key.toLowerCase())) return null;

                                                        if (Array.isArray(val) && (key === 'q1' || key === 'q2')) {
                                                            return (
                                                                <div key={key} style={{ marginTop: '8px' }}>
                                                                    <h5 style={{ color: '#ea580c', marginBottom: '8px', fontSize: '1rem', borderBottom: '1px solid #fed7aa', paddingBottom: '4px' }}>
                                                                        Questionnaire {key.toUpperCase().replace('Q', '')}
                                                                    </h5>
                                                                    <div style={{ display: 'grid', gap: '12px' }}>
                                                                        {val.map((item: any, i: number) => {
                                                                            const questionText = typeof item === 'object' && item.question ? item.question : `Question ${i + 1}`;
                                                                            const answerText = typeof item === 'object' && item.answer ? item.answer : String(item);
                                                                            const isYes = answerText.toLowerCase().trim() === 'yes';
                                                                            return (
                                                                                <div key={`${key}-${i}`}>
                                                                                    <strong style={{ display: 'block', color: '#334155', marginBottom: '4px', lineHeight: 1.4 }}>
                                                                                        {i + 1}. {questionText}
                                                                                    </strong>
                                                                                    <div style={{ color: isYes ? '#dc2626' : '#2f855a', backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', fontWeight: 500, fontSize: '0.85rem' }}>
                                                                                        Answer: {answerText}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        const isYes = (typeof val === 'string' && (val.toLowerCase().trim() === 'yes' || val.toLowerCase().trim() === 'true')) || val === true;

                                                        return (
                                                            <div key={key}>
                                                                <strong style={{ display: 'block', color: '#334155', marginBottom: '4px' }}>
                                                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_/g, ' ')}?
                                                                </strong>
                                                                <div style={{ color: isYes ? '#dc2626' : '#64748b' }}>
                                                                    Answer: {String(val)}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </details>
                                    );
                                }) : <p className="a2-empty-text">No form data available.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderBlogsView = () => {
        return (
            <div className="a2-leads-container">
                <header className="a2-header a2-leads-header">
                    <div>
                        <h1>Blogs Management</h1>
                        <p>Create and manage your website articles.</p>
                    </div>
                    <div className="a2-leads-actions">
                        <button className="a2-btn-primary" onClick={() => { setFormBlog({ id: null, title: '', content: '', image_url: '', is_active: true }); setSelectedBlogImage(null); setShowBlogForm(true); }}>+ Add New Blog</button>
                        <div className="a2-view-toggle">
                            <button className={`a2-icon-btn ${blogViewMode === 'grid' ? 'active' : ''}`} onClick={() => setBlogViewMode('grid')}><LayoutGrid size={20} /></button>
                            <button className={`a2-icon-btn ${blogViewMode === 'list' ? 'active' : ''}`} onClick={() => setBlogViewMode('list')}><List size={20} /></button>
                        </div>
                    </div>
                </header>

                <div className="a2-leads-content">
                    {blogs.length === 0 ? (
                        <div className="a2-empty-state">
                            <BookOpen size={48} opacity={0.2} />
                            <p>No blogs created yet.</p>
                        </div>
                    ) : blogViewMode === 'grid' ? (
                        <div className="a2-leads-grid">
                            {blogs.map((blog: any) => (
                                <div key={blog.id} className="a2-lead-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                    {blog.image_url && (
                                        <div style={{ height: '140px', width: '100%', overflow: 'hidden', borderRadius: '8px 8px 0 0', margin: '-20px -20px 16px -20px', backgroundColor: '#f1f5f9' }}>
                                            <img src={`${blog.image_url}`} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                    <div className="a2-lead-card-header">
                                        <h3 style={{ fontSize: '1.1rem', margin: 0, lineHeight: 1.3 }}>{blog.title}</h3>
                                        <span className={`a2-status-pill ${blog.is_active ? 'accepted' : 'rejected'}`}>{blog.is_active ? 'Active' : 'Inactive'}</span>
                                    </div>
                                    <div className="a2-lead-card-body" style={{ flexGrow: 1 }}>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {blog.content.replace(/<[^>]+>/g, '')}
                                        </p>
                                        <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#94a3b8' }}>
                                            <CalendarDays size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                                            {new Date(blog.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="a2-lead-card-footer" style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '8px' }}>
                                        <button className="a2-btn-secondary" style={{ flex: 1, padding: '8px' }} onClick={() => toggleBlogStatus(blog)}>
                                            {blog.is_active ? 'Deactivate' : 'Publish'}
                                        </button>
                                        <button className="a2-btn-secondary a2-blog-edit-btn" style={{ flex: 1, padding: '8px', background: '#e2e8f0' }} onClick={() => editBlog(blog)}>Edit</button>
                                        <button className="a2-btn-reject a2-blog-delete-btn" style={{ padding: '8px 12px' }} onClick={() => deleteBlog(blog.id)}><X size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="a2-leads-list-wrapper panel-shadow">
                            <table className="a2-leads-table">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Title</th>
                                        <th>Published On</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blogs.map((blog: any) => (
                                        <tr key={blog.id}>
                                            <td>
                                                <div className="text-sm status-pill-mini">{blog.is_active ? 'Active' : 'Inactive'}</div>
                                            </td>
                                            <td>
                                                <div className="fw-600 text-dark">{blog.title}</div>
                                            </td>
                                            <td>{new Date(blog.created_at).toLocaleDateString()}</td>
                                            <td className="text-right">
                                                <div className="a2-action-group">
                                                    <button className="a2-btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => toggleBlogStatus(blog)}>
                                                        {blog.is_active ? 'Deactivate' : 'Publish'}
                                                    </button>
                                                    <button className="a2-btn-secondary a2-blog-edit-btn" style={{ padding: '4px 12px', fontSize: '0.8rem', background: '#e2e8f0' }} onClick={() => editBlog(blog)}>Edit</button>
                                                    <button className="a2-icon-action reject a2-blog-delete-btn" style={{ width: '28px', height: '28px' }} onClick={() => deleteBlog(blog.id)}><X size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Add/Edit Blog Popup Modal */}
                {showBlogForm && (
                    <div className="a2-blog-modal-overlay" onClick={cancelEditBlog}>
                        <div className="a2-blog-modal" onClick={e => e.stopPropagation()}>
                            <div className="a2-blog-modal-header">
                                <h2>{formBlog.id ? 'Edit Blog Article' : 'Compose New Blog'}</h2>
                                <button className="a2-close-btn" onClick={cancelEditBlog}><X size={24} /></button>
                            </div>
                            <div className="a2-blog-modal-content">
                                <div className="a2-form-group">
                                    <label>Article Title</label>
                                    <input
                                        type="text"
                                        placeholder="Enter an engaging title..."
                                        value={formBlog.title}
                                        onChange={e => setFormBlog({ ...formBlog, title: e.target.value })}
                                    />
                                </div>

                                <div className="a2-form-group">
                                    <label>Cover Image</label>
                                    <div className="a2-image-upload-area">
                                        {(selectedBlogImage || formBlog.image_url) ? (
                                            <div className="a2-image-preview">
                                                <img
                                                    src={selectedBlogImage ? URL.createObjectURL(selectedBlogImage) : `${formBlog.image_url}`}
                                                    alt="Cover Preview"
                                                    style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }}
                                                />
                                                <button className="a2-btn-secondary" style={{ marginTop: '8px' }} onClick={() => { setSelectedBlogImage(null); setFormBlog({ ...formBlog, image_url: '' }); }}>Remove Image</button>
                                            </div>
                                        ) : (
                                            <label className="a2-image-upload-label" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '32px', cursor: 'pointer', background: '#f8fafc' }}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={e => setSelectedBlogImage(e.target.files ? e.target.files[0] : null)}
                                                    style={{ display: 'none' }}
                                                />
                                                <span style={{ fontSize: '2rem', color: '#94a3b8' }}>+</span>
                                                <p style={{ margin: '8px 0 0 0', color: '#64748b' }}>Click to upload cover image</p>
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className="a2-form-group" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <label>Content</label>
                                    <div className="a2-quill-wrapper" style={{ flexGrow: 1, minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                                        <ReactQuill
                                            theme="snow"
                                            value={formBlog.content}
                                            onChange={content => setFormBlog({ ...formBlog, content })}
                                            style={{ height: '250px', display: 'flex', flexDirection: 'column' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="a2-blog-modal-footer">
                                <label className="a2-switch-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formBlog.is_active}
                                        onChange={e => setFormBlog({ ...formBlog, is_active: e.target.checked })}
                                    />
                                    Publish immediately
                                </label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button className="a2-btn-secondary" onClick={cancelEditBlog}>Cancel</button>
                                    <button className="a2-btn-primary" onClick={saveBlog} disabled={!formBlog.title || !formBlog.content || (!formBlog.image_url && !selectedBlogImage)}>
                                        {formBlog.id ? 'Save Changes' : 'Publish Article'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`a2-layout ${themeMode === 'dark' ? 'a2-theme-dark' : 'a2-theme-light'}`}>
            {/* Left fixed vertical Sidebar (9) */}
            <aside className="a2-sidebar">
                <div className="a2-sidebar-header">
                    <img src={logo} alt="Rewire With Kajal" className="a2-admin-logo" />
                </div>
                <nav className="a2-sidebar-nav">
                    <button className={`a2-nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveMenu('dashboard')}>
                        <LayoutDashboard size={20} /> Dashboard
                    </button>
                    <button className={`a2-nav-item ${activeMenu === 'leads' ? 'active' : ''}`} onClick={() => setActiveMenu('leads')}>
                        <UserPlus size={20} /> Leads
                    </button>
                    <button className={`a2-nav-item ${activeMenu === 'customers' ? 'active' : ''}`} onClick={() => setActiveMenu('customers')}>
                        <Users size={20} /> Customers
                    </button>
                    <button className={`a2-nav-item ${activeMenu === 'blogs' ? 'active' : ''}`} onClick={() => setActiveMenu('blogs')}>
                        <FileText size={20} /> Blogs
                    </button>
                </nav>
                <div className="a2-sidebar-footer">
                    <button className="a2-theme-toggle" onClick={toggleThemeMode}>
                        {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <button className="a2-nav-item logout" onClick={handleLogout}>
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="a2-main">
                {activeMenu === 'dashboard' ? (
                    <div className="a2-dashboard">
                        <header className="a2-header">
                            <h1>Dashboard Overview</h1>
                            <p>Welcome back, here's what's happening today.</p>
                        </header>

                        {/* Top Statistics Cards (1-4) */}
                        <div className="admin-summary-cards">
                            <div className="summary-card">
                                <div className="summary-card-inner">
                                    <div className="summary-card-text">
                                        <h4>Total Leads</h4>
                                        <h2>{stats.leads}</h2>
                                    </div>
                                    <div className="summary-card-visuals">
                                        <div className="icon-wrapper blue-bg">
                                            <ClipboardList className="summary-icon blue-icon" size={16} />
                                        </div>
                                        <div className="mini-chart blue-chart">
                                            <div className="bar h-40"></div>
                                            <div className="bar h-60"></div>
                                            <div className="bar h-80"></div>
                                            <div className="bar h-50"></div>
                                            <div className="bar h-100"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-card-inner">
                                    <div className="summary-card-text">
                                        <h4>Total Customers</h4>
                                        <h2>{stats.customers}</h2>
                                    </div>
                                    <div className="summary-card-visuals">
                                        <div className="icon-wrapper teal-bg">
                                            <Users className="summary-icon teal-icon" size={16} />
                                        </div>
                                        <div className="mini-chart teal-chart">
                                            <div className="bar h-30"></div>
                                            <div className="bar h-50"></div>
                                            <div className="bar h-70"></div>
                                            <div className="bar h-90"></div>
                                            <div className="bar h-60"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-card-inner">
                                    <div className="summary-card-text">
                                        <h4>Active Customers</h4>
                                        <h2>{stats.activeCustomers}</h2>
                                    </div>
                                    <div className="summary-card-visuals">
                                        <div className="icon-wrapper light-blue-bg">
                                            <BarChart2 className="summary-icon light-blue-icon" size={16} />
                                        </div>
                                        <div className="mini-chart circle-chart">
                                            <svg viewBox="0 0 36 36" className="circular-chart blue">
                                                <path className="circle-bg"
                                                    d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                <path className="circle"
                                                    strokeDasharray="81, 100"
                                                    d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-card-inner">
                                    <div className="summary-card-text">
                                        <h4>Revenue</h4>
                                        <h2>₹{stats.turnover.toLocaleString()}</h2>
                                    </div>
                                    <div className="summary-card-visuals">
                                        <div className="icon-wrapper green-bg">
                                            <DollarSign className="summary-icon green-icon" size={16} />
                                        </div>
                                        <div className="mini-chart line-chart">
                                            <svg viewBox="0 0 100 30" className="sparkline green">
                                                <path d="M0,25 L20,15 L40,20 L60,5 L80,10 L100,0" fill="none" stroke="currentColor" strokeWidth="3" />
                                                <path d="M0,25 L20,15 L40,20 L60,5 L80,10 L100,0 L100,30 L0,30 Z" fill="currentColor" opacity="0.2" stroke="none" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Calendar & Scheduling Row */}
                        <div className="a2-calendar-row">
                            {/* Monthly Calendar View */}
                            <div className="a2-panel a2-calendar-panel">
                                <h3>Appointment Calendar</h3>
                                <div className="a2-calendar-custom-header">
                                    <button onClick={() => shiftMonth(-1)}><ChevronLeft size={20} /></button>
                                    <span>{activeStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                    <button onClick={() => shiftMonth(1)}><ChevronRight size={20} /></button>
                                </div>
                                <Calendar
                                    onChange={(val) => {
                                        const pickedDate = val as Date;
                                        setSelectedDate(pickedDate);
                                        setBookingDate(toDateKey(pickedDate));
                                    }}
                                    value={selectedDate}
                                    tileContent={tileContent}
                                    tileClassName={tileClassName}
                                    className="a2-modern-calendar"
                                    activeStartDate={activeStartDate}
                                    onActiveStartDateChange={({ activeStartDate }) => activeStartDate && setActiveStartDate(activeStartDate)}
                                    onClickDay={(value) => {
                                        setSelectedDate(value);
                                        setBookingDate(toDateKey(value));
                                    }}
                                    showNavigation={false}
                                    next2Label={null} prev2Label={null}
                                />

                                {appointmentsOnSelectedDate.length > 0 ? (
                                    <div className="a2-selected-date-appts">
                                        <h4>
                                            Appointments on {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            {' '}({appointmentsOnSelectedDate.length})
                                        </h4>
                                        <div className="a2-selected-list">
                                            {appointmentsOnSelectedDate.map(app => {
                                                const d = parseDateTimeSmart(app.appointment_date, app.slot);
                                                return (
                                                    <div key={app.id} className="a2-selected-item">
                                                        <strong>{getAppointmentName(app)}</strong>
                                                        <span className="a2-selected-meta">
                                                            <Clock size={14} /> {getAppointmentSlotLabel(app, d)}
                                                        </span>
                                                        <span className="a2-selected-meta">
                                                            <Phone size={14} /> {app.phone || app.form_data?.phone || 'No phone'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="a2-no-appts-text">No appointments on selected date.</p>
                                )}
                            </div>

                            {/* Right side: Quick Book / Today / Upcoming */}
                            <div className="a2-appointments-col">
                                {/* Quick Book Widget */}
                                <div className="a2-panel a2-booking-widget">
                                    <h3>Quick Book Session</h3>
                                    {bookingError && <div className="a2-alert-error"><AlertCircle size={16} /> {bookingError}</div>}
                                    <div className="a2-form-group">
                                        <label>Select Customer</label>
                                        <select value={bookingCustomerId} onChange={e => setBookingCustomerId(e.target.value ? Number(e.target.value) : '')}>
                                            <option value="">-- Choose --</option>
                                            {bookingCustomers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} - {c.phone || c.form_data?.phone || 'No phone'}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="a2-form-row">
                                        <div className="a2-form-group">
                                            <label>Date</label>
                                            <input type="date" value={bookingDate} min={todayDateInput} onChange={e => setBookingDate(e.target.value)} />
                                        </div>
                                        <div className="a2-form-group">
                                            <label>Slot</label>
                                            <select value={bookingSlot} onChange={e => setBookingSlot(e.target.value)}>
                                                <option value="">-- Time --</option>
                                                {APPOINTMENT_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <button className="a2-btn-primary" onClick={handleSaveNewSession} disabled={bookingSaving}>
                                        {bookingSaving ? 'Saving...' : 'Save Appointment'}
                                    </button>
                                </div>

                                {/* Today's Appointments */}
                                <div className="a2-panel">
                                    <h3>Today's Appointments</h3>
                                    {todayAppointments.length > 0 ? (
                                        <div className="a2-appt-list">
                                            {todayAppointments.map(app => {
                                                const d = parseDateTimeSmart(app.appointment_date, app.slot);
                                                return (
                                                    <div key={app.id} className="a2-appt-card today-card">
                                                        <div className="a2-appt-info">
                                                            <strong>{getAppointmentName(app)}</strong>
                                                            <span>{getAppointmentSlotLabel(app, d)}</span>
                                                            <span className="a2-badge">{app.status || 'Pending'}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="a2-empty-state">
                                            <CalendarIcon size={32} opacity={0.3} />
                                            <p>No appointments today.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Upcoming Appointments */}
                                <div className="a2-panel">
                                    <h3>Upcoming Appointments</h3>
                                    {upcomingAppointments.length > 0 ? (
                                        <div className="a2-appt-list">
                                            {upcomingAppointments.map(app => {
                                                const d = parseDateTimeSmart(app.appointment_date, app.slot);
                                                return (
                                                    <div key={app.id} className="a2-appt-card upcoming-card">
                                                        <div className="a2-appt-date-box">
                                                            <span className="month">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                            <span className="day">{d.getDate()}</span>
                                                        </div>
                                                        <div className="a2-appt-info">
                                                            <strong>{getAppointmentName(app)}</strong>
                                                            <span>{getAppointmentSlotLabel(app, d)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="a2-empty-text">No upcoming appointments.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeMenu === 'leads' ? (
                    renderLeadsView()
                ) : activeMenu === 'customers' ? (
                    renderCustomersView()
                ) : activeMenu === 'blogs' ? (
                    renderBlogsView()
                ) : (
                    <div className="a2-placeholder-view">
                        <h2>{String(activeMenu).charAt(0).toUpperCase() + String(activeMenu).slice(1)}</h2>
                        <p>This section is available in the original admin dashboard or to be built in the future.</p>
                        <button onClick={() => setActiveMenu('dashboard')} className="a2-btn-secondary">Return to Dashboard</button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Admin;
