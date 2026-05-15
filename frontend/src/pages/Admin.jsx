import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Calendar from '../components/Calendar';

const formatDate = (date) => new Date(date).toLocaleDateString('en-CA');

const formatClientName = (appointment) => {
    const user = appointment?.user;
    return user?.phone || user?.username || `Client #${appointment?.userId}`;
};

const getStatusLabel = (status) => {
    const labels = {
        active: 'Active',
        cancelled: 'Cancelled',
        canceled: 'Cancelled',
        completed: 'Completed',
        no_show: 'No show',
    };

    return labels[status] || status;
};

const isAppointmentNow = (appointment) => {
    if (!appointment || appointment.status !== 'active') return false;

    const start = new Date(`${formatDate(appointment.date)}T${appointment.time}:00`);
    const end = new Date(start.getTime() + 15 * 60 * 1000);
    const now = new Date();

    return now >= start && now < end;
};

const Admin = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [rescheduleDate, setRescheduleDate] = useState(selectedDate);
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [status, setStatus] = useState('');

    const token = localStorage.getItem('token');

    const selectedAppointment = useMemo(
        () => appointments.find(app => app.id === selectedAppointmentId),
        [appointments, selectedAppointmentId]
    );

    const happeningNow = isAppointmentNow(selectedAppointment);

    const authHeaders = useMemo(() => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }), [token]);

    const fetchStores = useCallback(async () => {
        const res = await fetch('/api/stores');
        const data = await res.json();
        if (res.ok) {
            setStores(data);
            if (!selectedStore && data.length > 0) {
                setSelectedStore(String(data[0].id));
            }
        }
    }, [selectedStore]);

    const fetchAppointments = useCallback(async () => {
        if (!selectedStore || !selectedDate) return;

        const params = new URLSearchParams({
            storeId: selectedStore,
            date: selectedDate,
        });
        const res = await fetch(`/api/admin/appointments?${params.toString()}`, {
            headers: authHeaders,
        });
        const data = await res.json();

        if (res.ok) {
            setAppointments(data);
            setSelectedAppointmentId(currentId => (
                data.some(app => app.id === currentId) ? currentId : data[0]?.id || null
            ));
        } else if (res.status === 401 || res.status === 403) {
            navigate('/account');
        } else {
            setStatus(data.error || 'Failed to load appointments');
        }
    }, [authHeaders, navigate, selectedDate, selectedStore]);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login', { state: { from: '/admin' } });
        } else if (!loading && user?.role !== 'ADMIN') {
            navigate('/account');
        } else if (user?.role === 'ADMIN') {
            fetchStores();
        }
    }, [fetchStores, loading, navigate, user]);

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            fetchAppointments();
        }
    }, [fetchAppointments, user]);

    useEffect(() => {
        if (selectedAppointment) {
            setAdminNote(selectedAppointment.adminNote || '');
            setRescheduleDate(formatDate(selectedAppointment.date));
            setRescheduleTime(selectedAppointment.time);
        } else {
            setAdminNote('');
            setRescheduleDate(selectedDate);
            setRescheduleTime('');
        }
    }, [selectedAppointment, selectedDate]);

    if (loading || !user) {
        return <div className="page-container"><p>Loading...</p></div>;
    }

    if (user.role !== 'ADMIN') {
        return null;
    }

    const runAppointmentAction = async (path, body = {}) => {
        if (!selectedAppointment) return;

        setStatus('Saving...');
        const res = await fetch(`/api/admin/appointments/${selectedAppointment.id}/${path}`, {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({ adminNote, ...body }),
        });
        const data = await res.json();

        if (res.ok) {
            setStatus('Saved');
            await fetchAppointments();
        } else {
            setStatus(data.error || 'Action failed');
        }
    };

    const handleReschedule = () => {
        runAppointmentAction('reschedule', {
            date: rescheduleDate,
            time: rescheduleTime,
        });
    };

    return (
        <div className="page-container admin-page">
            <header className="page-header">
                <h1 className="page-title">Admin Panel</h1>
                <p className="page-description">Manage store appointments and client visit outcomes.</p>
            </header>

            <div className="admin-workspace">
                <section className="admin-main content-card">
                    <div className="admin-toolbar">
                        <div className="form-group">
                            <label>Select Store</label>
                            <select
                                value={selectedStore}
                                onChange={(e) => {
                                    setSelectedStore(e.target.value);
                                    setSelectedAppointmentId(null);
                                }}
                            >
                                {stores.map(store => (
                                    <option key={store.id} value={store.id}>
                                        {store.name} - {store.address}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="admin-schedule-grid">
                        <div className="form-group">
                            <label>Select Date</label>
                            <Calendar
                                selectedDate={selectedDate}
                                onSelectDate={(date) => {
                                    setSelectedDate(date);
                                    setSelectedAppointmentId(null);
                                }}
                            />
                        </div>

                        <div className="admin-appointments-panel">
                            <div className="admin-panel-heading">
                                <h3>Booked Slots</h3>
                                <span>{appointments.length} total</span>
                            </div>

                            {appointments.length > 0 ? (
                                <div className="admin-appointments-list">
                                    {appointments.map(appointment => (
                                        <button
                                            key={appointment.id}
                                            type="button"
                                            className={`admin-appointment-item ${selectedAppointmentId === appointment.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedAppointmentId(appointment.id)}
                                        >
                                            <span className="appointment-time">{appointment.time}</span>
                                            <span className="appointment-client">{formatClientName(appointment)}</span>
                                            <span className={`status-badge ${appointment.status.replace('_', '-')}`}>
                                                {getStatusLabel(appointment.status)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-state">No booked clients for this date.</p>
                            )}
                        </div>
                    </div>
                </section>

                <aside className="admin-side-panel content-card">
                    <h3>Appointment Details</h3>
                    {selectedAppointment ? (
                        <>
                            <div className="admin-detail-list">
                                <p><strong>Client:</strong> {formatClientName(selectedAppointment)}</p>
                                <p><strong>Date:</strong> {formatDate(selectedAppointment.date)}</p>
                                <p><strong>Time:</strong> {selectedAppointment.time}</p>
                                <p><strong>Status:</strong> {getStatusLabel(selectedAppointment.status)}</p>
                                {selectedAppointment.previousTime && (
                                    <p>
                                        <strong>Previous:</strong> {formatDate(selectedAppointment.previousDate)} at {selectedAppointment.previousTime}
                                    </p>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Admin Note</label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    rows="3"
                                    placeholder="Optional note"
                                />
                            </div>

                            <div className="admin-actions">
                                <button
                                    type="button"
                                    className="secondary-action danger"
                                    onClick={() => runAppointmentAction('cancel')}
                                    disabled={selectedAppointment.status !== 'active'}
                                >
                                    Cancel
                                </button>

                                <div className="reschedule-box">
                                    <label>Reschedule</label>
                                    <input
                                        type="date"
                                        value={rescheduleDate}
                                        onChange={(e) => setRescheduleDate(e.target.value)}
                                    />
                                    <input
                                        type="time"
                                        step="900"
                                        value={rescheduleTime}
                                        onChange={(e) => setRescheduleTime(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="secondary-action"
                                        onClick={handleReschedule}
                                        disabled={selectedAppointment.status !== 'active' || !rescheduleDate || !rescheduleTime}
                                    >
                                        Move Appointment
                                    </button>
                                </div>

                                {happeningNow && (
                                    <div className="current-visit-actions">
                                        <button
                                            type="button"
                                            className="secondary-action"
                                            onClick={() => runAppointmentAction('complete')}
                                        >
                                            Served Successfully
                                        </button>
                                        <button
                                            type="button"
                                            className="secondary-action warning"
                                            onClick={() => runAppointmentAction('no-show')}
                                        >
                                            Client Did Not Arrive
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="empty-state">Select a booked slot to manage it.</p>
                    )}
                    {status && <p className="status-message">{status}</p>}
                </aside>
            </div>
        </div>
    );
};

export default Admin;
