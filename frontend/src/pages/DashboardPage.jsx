import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import {
    Plus,
    FolderOpen,
    LogOut,
    Search,
    MapPin,
    Calendar,
    User,
    MoreVertical,
    Activity,
    CheckCircle2,
    Clock,
    XCircle,
    FileText
} from 'lucide-react';

const NavBar = ({ onNewCase }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="nav-bar">
            <div className="nav-logo">
                <span className="nav-logo-text">CRIMETRYX AI</span>
            </div>
            <div className="nav-actions">
                {/* FIR Analysis Links */}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginRight: '16px',
                    padding: '4px',
                    background: 'rgba(139, 90, 43, 0.2)',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate('/predictions')}
                        style={{ fontSize: '0.8rem' }}
                    >
                        📈 Predictions
                    </button>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate('/network')}
                        style={{ fontSize: '0.8rem' }}
                    >
                        🔗 Network
                    </button>
                </div>

                <button className="btn btn-primary" onClick={onNewCase}>
                    <Plus size={18} />
                    New Case
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {user?.name || 'Investigator'}
                    </span>
                    <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

const CaseModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        location: '',
        date: new Date().toISOString().split('T')[0],
        investigator: ''
    });
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen && user) {
            setFormData(prev => ({ ...prev, investigator: user.name || '' }));
        }
    }, [isOpen, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit(formData);
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Create New Case</h3>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <XCircle size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Case ID</label>
                            <input
                                type="text"
                                className="form-input"
                                value="Auto-generated"
                                disabled
                                style={{ color: 'var(--text-muted)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., 123 Main St, Arkham"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Lead Investigator</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Investigator name"
                                value={formData.investigator}
                                onChange={e => setFormData({ ...formData, investigator: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Case'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const statusConfig = {
        active: { icon: Clock, className: 'badge-active', label: 'Active' },
        processing: { icon: Activity, className: 'badge-running', label: 'Processing' },
        ready: { icon: CheckCircle2, className: 'badge-completed', label: 'Ready' },
        analyzed: { icon: FileText, className: 'badge-completed', label: 'Analyzed' },
        closed: { icon: XCircle, className: 'badge-closed', label: 'Closed' }
    };

    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;

    return (
        <span className={`badge ${config.className}`}>
            <Icon size={12} />
            {config.label}
        </span>
    );
};

const DashboardPage = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const response = await fetch('/api/cases');
            if (response.ok) {
                const data = await response.json();
                setCases(data);
            }
        } catch (err) {
            console.error('Failed to fetch cases:', err);
            // Demo data
            setCases([
                {
                    id: 1,
                    case_id: 'CRX-2024-0001',
                    location: 'Arkham City, 1st Floor Master Bedroom',
                    date: '2024-12-08',
                    investigator: 'Demo Investigator',
                    status: 'analyzed',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    case_id: 'CRX-2024-0002',
                    location: 'Gotham Heights, Warehouse District',
                    date: '2024-12-15',
                    investigator: 'Demo Investigator',
                    status: 'active',
                    created_at: new Date().toISOString()
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCase = async (formData) => {
        try {
            const response = await fetch('/api/cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const newCase = await response.json();
                setCases([newCase, ...cases]);
                navigate(`/case/${newCase.id}/setup`);
            }
        } catch (err) {
            // Demo: add locally
            const newCase = {
                id: cases.length + 1,
                case_id: `CRX-2024-${String(cases.length + 1).padStart(4, '0')}`,
                ...formData,
                status: 'active',
                created_at: new Date().toISOString()
            };
            setCases([newCase, ...cases]);
            navigate(`/case/${newCase.id}/setup`);
        }
    };

    const filteredCases = cases.filter(c =>
        c.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.investigator.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="app-container">
            <NavBar onNewCase={() => setShowModal(true)} />

            <div className="main-content">
                <div className="page-container">
                    {/* Header */}
                    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Case Dashboard</h1>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Manage and analyze crime scene investigations
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div style={{ marginBottom: 'var(--spacing-lg)', position: 'relative', maxWidth: '400px' }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)'
                            }}
                        />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search cases..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>

                    {/* Cases Table */}
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Case ID</th>
                                    <th>Location</th>
                                    <th>Date</th>
                                    <th>Investigator</th>
                                    <th>Status</th>
                                    <th style={{ width: '100px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '48px' }}>
                                            <div className="animate-spin" style={{
                                                width: 24,
                                                height: 24,
                                                border: '2px solid var(--accent-primary)',
                                                borderTopColor: 'transparent',
                                                borderRadius: '50%',
                                                margin: '0 auto'
                                            }} />
                                        </td>
                                    </tr>
                                ) : filteredCases.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                            <FolderOpen size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                            <p>No cases found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCases.map(caseItem => (
                                        <tr key={caseItem.id}>
                                            <td>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                                    {caseItem.case_id}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                                                    {caseItem.location}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                                                    {new Date(caseItem.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <User size={14} style={{ color: 'var(--text-muted)' }} />
                                                    {caseItem.investigator}
                                                </div>
                                            </td>
                                            <td>
                                                <StatusBadge status={caseItem.status} />
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => navigate(`/case/${caseItem.id}/scene`)}
                                                >
                                                    Open
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <CaseModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleCreateCase}
            />
        </div>
    );
};

export default DashboardPage;
