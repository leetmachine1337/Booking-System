import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from || '/account';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(phone, password);
        if (res.success) {
            navigate(from);
        } else {
            setError(res.error || 'Login failed');
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">Login</h1>
                <p className="page-description">Enter your details to access your account.</p>
            </header>
            <div className="content-card">
                {from === '/appointment' && (
                    <p style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontWeight: 600 }}>
                        Please login to book an appointment.
                    </p>
                )}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Phone Number or Admin Login</label>
                        <input
                            type="text"
                            placeholder="+380 XX XXX XX XX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="primary-button full-width">Sign In</button>
                </form>
                <p className="auth-switch">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
