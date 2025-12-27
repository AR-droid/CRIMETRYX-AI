import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Eye, EyeOff, Shield, Fingerprint } from 'lucide-react';

const LoginPage = () => {
    const [investigatorId, setInvestigatorId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    investigator_id: investigatorId,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                login(data.user);
                navigate('/');
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            // For demo purposes, allow demo login
            if (investigatorId === 'demo' && password === 'demo123') {
                login({ investigator_id: 'demo', name: 'Demo Investigator', role: 'investigator' });
                navigate('/');
            } else {
                setError('Connection error. Try demo/demo123');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Shield size={40} style={{ color: 'var(--accent-primary)' }} />
                        <Fingerprint size={40} style={{ color: 'var(--accent-secondary)' }} />
                    </div>
                    <h1>CRIMETRYX AI</h1>
                    <p>Agentic Crime Scene Intelligence</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Investigator ID</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter your ID"
                            value={investigatorId}
                            onChange={(e) => setInvestigatorId(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                style={{ paddingRight: '48px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--accent-danger)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-lg)',
                            color: 'var(--accent-danger)',
                            fontSize: '0.875rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                                Authenticating...
                            </>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>

                <div style={{ marginTop: 'var(--spacing-xl)', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        FOR INTERNAL USE ONLY
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Demo credentials: demo / demo123
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
