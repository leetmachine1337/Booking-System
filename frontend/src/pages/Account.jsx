import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Account = () => {
    const { user, logout, loading } = useAuth();
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        } else if (user) {
            fetchProfile();
        }
    }, [user, loading, navigate]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                setProfile(data);
            } else {
                setError(data.error || 'Failed to fetch profile');
            }
        } catch {
            setError('Something went wrong');
        }
    };

    if (loading || !profile) {
        return <div className="page-container"><p>Loading profile...</p></div>;
    }

    const displayLogin = profile.phone || profile.username;

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">Your Account</h1>
                <p className="page-description">Welcome back, {displayLogin}</p>
            </header>
            <div className="account-grid">
                <aside className="profile-sidebar content-card">
                    <h3>Profile Info</h3>
                    <p><strong>Login:</strong> {displayLogin}</p>
                    <p><strong>Role:</strong> {profile.role}</p>
                    <p><strong>Member since:</strong> {new Date(profile.createdAt).toLocaleDateString()}</p>
                    <button onClick={logout} className="secondary-button logout-btn">Logout</button>
                </aside>
                <main className="appointments-section content-card">
                    <h3>Your Appointments</h3>
                    {error && <p className="error-message">{error}</p>}
                    {profile.appointments && profile.appointments.length > 0 ? (
                        <div className="appointments-list">
                            {profile.appointments.map(app => (
                                <div key={app.id} className="appointment-item">
                                    <div className="app-info">
                                        <h4>{app.store.name}</h4>
                                        <p>{new Date(app.date).toLocaleDateString()} at {app.time}</p>
                                    </div>
                                    <span className={`status-badge ${app.status}`}>{app.status}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>You have no appointments yet.</p>
                    )}
                    <Link to="/appointment" className="primary-button">Book New Appointment</Link>
                </main>
            </div>
        </div>
    );
};

export default Account;
