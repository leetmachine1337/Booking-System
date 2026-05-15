import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    const [message, setMessage] = useState('Connecting to API...');

    useEffect(() => {
        fetch('/api')
            .then(res => res.text())
            .then(data => setMessage(data))
            .catch(() => setMessage('Failed to connect to backend'));
    }, []);

    return (
        <div className="page-container">
            <header className="hero-section">
                <h1 className="hero-title">Welcome to Our Service</h1>
                <p className="hero-subtitle">{message}</p>
                <div className="cta-container">
                    <Link to="/appointment" className="primary-button">
                        Book Appointment
                    </Link>
                </div>
            </header>
        </div>
    );
};

export default Home;
