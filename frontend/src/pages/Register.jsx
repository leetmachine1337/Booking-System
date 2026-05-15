import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        const res = await register(phone, password);
        if (res.success) {
            navigate('/account');
        } else {
            setError(res.error || 'Registration failed');
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">Create an Account</h1>
                <p className="page-description">Join us today to manage your appointments easily.</p>
            </header>
            <div className="content-card">
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            autoComplete="tel"
                            placeholder="+380 XX XXX XX XX"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="primary-button full-width">Join Now</button>
                </form>
                <p className="auth-switch">
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
                <Link to="/" className="secondary-button">Back to Home</Link>
            </div>
        </div>
    );
};

export default Register;
