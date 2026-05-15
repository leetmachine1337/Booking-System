import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <h1>
                    <Link to="/" className="navbar-logo">ServiceApp</Link>
                </h1>
            </div>
            <div className="navbar-links">
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/appointment" className="nav-link">Appointment</Link>
                {user ? (
                    <>
                        {user.role === 'ADMIN' && <Link to="/admin" className="nav-link">Admin</Link>}
                        <Link to="/account" className="nav-link">Account</Link>
                        <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/register" className="nav-link register-btn">Register</Link>
                    </>
                )}
                <button onClick={toggleTheme} className="theme-toggle">
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
