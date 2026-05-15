import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Calendar from '../components/Calendar';

const getBookingMaxDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 2, 0).toLocaleDateString('en-CA');
};

const getBookingMinDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
};

const Appointment = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [slotsData, setSlotsData] = useState({ isDayOff: false, slots: [] });
    const [selectedTime, setSelectedTime] = useState('');
    const [status, setStatus] = useState('');
    const bookingMinDate = getBookingMinDate();
    const bookingMaxDate = getBookingMaxDate();

    const fetchStores = async () => {
        const res = await fetch('/api/stores');
        const data = await res.json();
        if (res.ok) setStores(data);
    };

    const fetchSlots = useCallback(async () => {
        setSelectedTime('');
        const res = await fetch(`/api/stores/${selectedStore}/slots?storeId=${selectedStore}&date=${selectedDate}`);
        const data = await res.json();
        if (res.ok) {
            setSlotsData(Array.isArray(data) ? { isDayOff: false, slots: data } : data);
        }
    }, [selectedStore, selectedDate]);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login', { state: { from: '/appointment' } });
        } else if (user) {
            fetchStores();
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        if (selectedStore && selectedDate) {
            fetchSlots();
        }
    }, [selectedStore, selectedDate, fetchSlots]);

    if (loading) {
        return <div className="page-container"><p>Loading...</p></div>;
    }

    const handleBooking = async () => {
        if (!selectedTime) return;
        setStatus('Booking...');

        const res = await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                storeId: parseInt(selectedStore),
                date: selectedDate,
                time: selectedTime
            })
        });

        if (res.ok) {
            setStatus('Success! Redirecting...');
            setTimeout(() => navigate('/account'), 1500);
        } else {
            const data = await res.json();
            setStatus(data.error || 'Booking failed');
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">Book an Appointment</h1>
                <p className="page-description">Select a store and time that works for you.</p>
            </header>
            <div className="booking-container">
                <div className="booking-card appointment-card content-card">
                    <div className="form-group store-section">
                        <label>Select Store</label>
                        <select
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                        >
                            <option value="">-- Choose a store --</option>
                            {stores.map(s => (
                                <option key={s.id} value={s.id}>{s.name} - {s.address}</option>
                            ))}
                        </select>
                    </div>

                    {selectedStore && (
                        <div className="form-group date-section">
                            <label>Select Date</label>
                            <Calendar 
                                selectedDate={selectedDate} 
                                onSelectDate={setSelectedDate} 
                                minDate={bookingMinDate}
                                maxDate={bookingMaxDate}
                            />
                        </div>
                    )}

                    {selectedStore && selectedDate && (
                        <div className="slots-section">
                            <label>Available Time Slots (15 min)</label>
                            {slotsData.isDayOff ? (
                                <p className="no-slots">Цей день є вихідним, ми не працюємо.</p>
                            ) : slotsData.slots.length > 0 ? (
                                <div className="slots-grid">
                                    {slotsData.slots.map(slot => (
                                        <button
                                            key={slot.time}
                                            className={`slot-btn ${selectedTime === slot.time ? 'selected' : ''} ${!slot.available ? 'disabled' : ''}`}
                                            onClick={() => slot.available && setSelectedTime(slot.time)}
                                            disabled={!slot.available}
                                        >
                                            {slot.time}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-slots">Немає доступних комірок на цей день.</p>
                            )}
                        </div>
                    )}

                    {selectedTime && (
                        <div className="booking-footer">
                            <p className="selection-summary">
                                <strong>Your selection:</strong> {selectedDate} at {selectedTime}
                            </p>
                            <button onClick={handleBooking} className="primary-button full-width">
                                Confirm Booking
                            </button>
                        </div>
                    )}
                    {status && <p className="status-message">{status}</p>}
                </div>
            </div>
        </div>
    );
};

export default Appointment;
