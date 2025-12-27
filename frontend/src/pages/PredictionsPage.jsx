import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    User,
    MapPin,
    AlertTriangle,
    Shield,
    Target,
    ChevronRight,
    Filter,
    Eye,
    FileText,
    Crosshair,
    TrendingUp,
    Users,
    Loader2
} from 'lucide-react';

// Demo suspect data based on FIR MO patterns
const DEMO_SUSPECTS = [
    {
        id: 'S0001',
        location: 'T. Nagar',
        crimeType: 'Fraud',
        likelyWeapon: 'Unknown',
        riskScore: 0.40,
        severity: 1.8,
        gangAffiliated: false,
        matchedMO: ['Standard operation', 'Identity theft pattern'],
        firHistory: 3,
        lastActive: '2024-11-15'
    },
    {
        id: 'S0002',
        location: 'Singanallur',
        crimeType: 'Fraud',
        likelyWeapon: 'Unknown',
        riskScore: 0.30,
        severity: 1.8,
        gangAffiliated: false,
        matchedMO: ['Standard operation', 'Document forgery'],
        firHistory: 2,
        lastActive: '2024-10-22'
    },
    {
        id: 'S0003',
        location: 'Anna Nagar',
        crimeType: 'Robbery',
        likelyWeapon: 'Knife',
        riskScore: 0.75,
        severity: 4.2,
        gangAffiliated: true,
        matchedMO: ['Forced entry through window', 'Night-time operation', 'Quick exit pattern'],
        firHistory: 7,
        lastActive: '2024-12-01'
    },
    {
        id: 'S0004',
        location: 'Velachery',
        crimeType: 'Robbery',
        likelyWeapon: 'Screwdriver',
        riskScore: 1.00,
        severity: 4.7,
        gangAffiliated: false,
        matchedMO: ['Temple hundi theft during festival', 'Tool-based entry'],
        firHistory: 5,
        lastActive: '2024-12-10'
    },
    {
        id: 'S0005',
        location: 'Fairlands',
        crimeType: 'Robbery',
        likelyWeapon: 'Screwdriver',
        riskScore: 0.50,
        severity: 2.5,
        gangAffiliated: false,
        matchedMO: ['Temple hundi theft during festival', 'Daylight operation'],
        firHistory: 2,
        lastActive: '2024-09-18'
    },
    {
        id: 'S0006',
        location: 'Adyar',
        crimeType: 'Murder',
        likelyWeapon: 'Blunt Object',
        riskScore: 0.85,
        severity: 5.0,
        gangAffiliated: true,
        matchedMO: ['Domestic incident', 'Blunt force trauma', 'Single victim'],
        firHistory: 1,
        lastActive: '2024-12-05'
    },
    {
        id: 'S0007',
        location: 'Tambaram',
        crimeType: 'Assault',
        likelyWeapon: 'Knife',
        riskScore: 0.65,
        severity: 3.8,
        gangAffiliated: true,
        matchedMO: ['Gang-related violence', 'Public place', 'Multiple assailants'],
        firHistory: 4,
        lastActive: '2024-11-28'
    }
];

const CRIME_TYPES = ['All Crime Types', 'Robbery', 'Fraud', 'Murder', 'Assault', 'Burglary', 'Theft'];
const RISK_LEVELS = ['All Risk Levels', 'Low', 'Medium', 'High'];

const getRiskLevel = (score) => {
    if (score >= 0.7) return 'High';
    if (score >= 0.4) return 'Medium';
    return 'Low';
};

const getRiskColor = (score) => {
    if (score >= 0.7) return '#ef4444';
    if (score >= 0.4) return '#f59e0b';
    return '#10b981';
};

// Suspect Card Component
const SuspectCard = ({ suspect, onViewDetails, onLinkToScene }) => {
    const riskLevel = getRiskLevel(suspect.riskScore);
    const riskColor = getRiskColor(suspect.riskScore);

    return (
        <div style={{
            background: 'var(--paper)',
            border: '2px solid var(--manila-dark)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
            {/* Risk Badge */}
            <div style={{
                position: 'absolute',
                top: '-8px',
                right: '12px',
                background: riskColor,
                color: 'white',
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                fontFamily: 'var(--font-typewriter)',
                transform: 'rotate(3deg)',
                boxShadow: '2px 2px 4px rgba(0,0,0,0.2)'
            }}>
                {riskLevel} RISK
            </div>

            {/* Tape decoration */}
            <div style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: suspect.gangAffiliated ? '#ef4444' : '#10b981'
            }} />

            <h3 style={{
                fontFamily: 'var(--font-typewriter)',
                fontSize: '1.1rem',
                marginBottom: '16px',
                color: 'var(--ink-black)'
            }}>
                Suspect {suspect.id}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ink-faded)', fontFamily: 'var(--font-typewriter)' }}>
                        Location:
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{suspect.location}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ink-faded)', fontFamily: 'var(--font-typewriter)' }}>
                        Risk Score:
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: riskColor }}>
                        {suspect.riskScore.toFixed(2)}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ink-faded)', fontFamily: 'var(--font-typewriter)' }}>
                        Crime Type:
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{suspect.crimeType}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ink-faded)', fontFamily: 'var(--font-typewriter)' }}>
                        Severity:
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{suspect.severity}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ink-faded)', fontFamily: 'var(--font-typewriter)' }}>
                        Likely Weapon:
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{suspect.likelyWeapon}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ink-faded)', fontFamily: 'var(--font-typewriter)' }}>
                        Gang Affiliated:
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: suspect.gangAffiliated ? '#ef4444' : 'inherit' }}>
                        {suspect.gangAffiliated ? 'Yes' : 'No'}
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--ink-faded)', fontFamily: 'var(--font-typewriter)', marginBottom: '4px' }}>
                    Matched MO Examples:
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-black)' }}>
                    {suspect.matchedMO.join(', ')}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onViewDetails(suspect)}
                    style={{ flex: 1 }}
                >
                    <Eye size={14} /> View Details
                </button>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onLinkToScene(suspect)}
                    style={{ flex: 1 }}
                >
                    <Target size={14} /> Link to Scene
                </button>
            </div>
        </div>
    );
};

// Suspect Detail Modal
const SuspectDetailModal = ({ suspect, onClose, onLinkToScene }) => {
    if (!suspect) return null;

    const riskLevel = getRiskLevel(suspect.riskScore);
    const riskColor = getRiskColor(suspect.riskScore);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            padding: '10px',
                            borderRadius: 'var(--radius-md)',
                            background: `${riskColor}20`
                        }}>
                            <User size={24} style={{ color: riskColor }} />
                        </div>
                        <div>
                            <h3 className="modal-title">Suspect {suspect.id} Profile</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                FIR-Based Modus Operandi Analysis
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {/* Risk Summary */}
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        marginBottom: '24px',
                        padding: '16px',
                        background: `${riskColor}10`,
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${riskColor}40`
                    }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: riskColor }}>
                                {(suspect.riskScore * 100).toFixed(0)}%
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk Score</div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--ink-black)' }}>
                                {suspect.severity}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Severity</div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--ink-black)' }}>
                                {suspect.firHistory}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FIR Records</div>
                        </div>
                    </div>

                    {/* MO Pattern Breakdown */}
                    <h4 style={{ marginBottom: '12px', fontFamily: 'var(--font-typewriter)' }}>
                        MODUS OPERANDI PATTERNS
                    </h4>
                    <div style={{ marginBottom: '24px' }}>
                        {suspect.matchedMO.map((mo, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                background: 'var(--paper-aged)',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: '8px',
                                border: '1px solid var(--manila-dark)'
                            }}>
                                <Crosshair size={14} style={{ color: riskColor }} />
                                <span style={{ fontSize: '0.85rem' }}>{mo}</span>
                            </div>
                        ))}
                    </div>

                    {/* Location & Crime Info */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <MapPin size={16} style={{ color: 'var(--accent-primary)' }} />
                                <span style={{ fontWeight: 600 }}>Primary Location</span>
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>{suspect.location}</div>
                        </div>
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                                <span style={{ fontWeight: 600 }}>Crime Type</span>
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>{suspect.crimeType}</div>
                        </div>
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <Shield size={16} style={{ color: '#8b5cf6' }} />
                                <span style={{ fontWeight: 600 }}>Weapon Preference</span>
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>{suspect.likelyWeapon}</div>
                        </div>
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <Users size={16} style={{ color: suspect.gangAffiliated ? '#ef4444' : '#10b981' }} />
                                <span style={{ fontWeight: 600 }}>Gang Affiliation</span>
                            </div>
                            <div style={{
                                fontSize: '0.9rem',
                                color: suspect.gangAffiliated ? '#ef4444' : '#10b981'
                            }}>
                                {suspect.gangAffiliated ? 'Confirmed Association' : 'No Known Affiliation'}
                            </div>
                        </div>
                    </div>

                    {/* Link to 3D Analysis */}
                    <div style={{
                        padding: '16px',
                        background: 'linear-gradient(135deg, var(--accent-primary)10, var(--accent-secondary)10)',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--accent-primary)40'
                    }}>
                        <h4 style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
                            🔗 Link to Crimetryx AI (3D Analysis)
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                            Cross-reference this suspect's MO patterns against the 3D crime scene spatial analysis.
                            The AI agents will validate if the current scene matches this suspect's behavioral signature.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => onLinkToScene(suspect)}
                        >
                            <Target size={16} /> Analyze Against Crime Scene
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PredictionsPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [crimeTypeFilter, setCrimeTypeFilter] = useState('All Crime Types');
    const [riskLevelFilter, setRiskLevelFilter] = useState('All Risk Levels');
    const [filteredSuspects, setFilteredSuspects] = useState(DEMO_SUSPECTS);
    const [selectedSuspect, setSelectedSuspect] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        filterSuspects();
    }, [searchQuery, crimeTypeFilter, riskLevelFilter]);

    const filterSuspects = () => {
        let filtered = [...DEMO_SUSPECTS];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.id.toLowerCase().includes(query) ||
                s.location.toLowerCase().includes(query)
            );
        }

        if (crimeTypeFilter !== 'All Crime Types') {
            filtered = filtered.filter(s => s.crimeType === crimeTypeFilter);
        }

        if (riskLevelFilter !== 'All Risk Levels') {
            filtered = filtered.filter(s => getRiskLevel(s.riskScore) === riskLevelFilter);
        }

        setFilteredSuspects(filtered);
    };

    const handleSearch = () => {
        setLoading(true);
        setTimeout(() => {
            filterSuspects();
            setLoading(false);
        }, 500);
    };

    const handleLinkToScene = (suspect) => {
        // Navigate to scene viewer with suspect MO data
        navigate('/case/1/scene', { state: { suspectMO: suspect } });
    };

    return (
        <div className="app-container">
            <nav className="nav-bar">
                <div className="nav-logo">
                    <span className="nav-logo-text">💎 Crime Analysis</span>
                </div>
                <div className="nav-actions">
                    <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
                        📊 Dashboard
                    </button>
                    <button className="btn btn-ghost" style={{ background: 'var(--accent-primary)20' }}>
                        📈 Predictions
                    </button>
                    <button className="btn btn-ghost" onClick={() => navigate('/network')}>
                        🔗 Network
                    </button>
                    <button className="btn btn-ghost" onClick={() => navigate('/osint')}>
                        🌐 OSINT
                    </button>
                </div>
            </nav>

            <div className="main-content">
                <div className="page-container">
                    {/* Page Title */}
                    <div style={{ marginBottom: '32px' }}>
                        <h1 style={{
                            fontFamily: 'var(--font-serif)',
                            color: 'var(--paper)',
                            marginBottom: '8px'
                        }}>
                            Crime Predictions
                        </h1>
                        <p style={{ color: 'var(--paper-aged)', fontSize: '0.9rem' }}>
                            Map FIR-based Crime IDs to potential suspects using modus operandi patterns and AI-driven risk analysis
                        </p>
                    </div>

                    {/* Search & Filter Panel */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                            <div style={{ flex: 2, minWidth: '250px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 16px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--manila-dark)'
                                }}>
                                    <Search size={18} style={{ color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search by Suspect ID or Location"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            flex: 1,
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '0.9rem',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                            <select
                                value={crimeTypeFilter}
                                onChange={(e) => setCrimeTypeFilter(e.target.value)}
                                className="form-select"
                                style={{ minWidth: '160px' }}
                            >
                                {CRIME_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <select
                                value={riskLevelFilter}
                                onChange={(e) => setRiskLevelFilter(e.target.value)}
                                className="form-select"
                                style={{ minWidth: '140px' }}
                            >
                                {RISK_LEVELS.map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            Search
                        </button>
                    </div>

                    {/* FIR Integration Info */}
                    <div style={{
                        padding: '16px',
                        background: 'var(--paper)',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--manila-dark)',
                        marginBottom: '24px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                            <span style={{ fontWeight: 600, fontFamily: 'var(--font-typewriter)' }}>
                                FIR-BASED MODUS OPERANDI MATCHING
                            </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                            This system extracts behavioral patterns from historical FIR data using NLP, including entry methods,
                            weapon usage, and crime sequences. These MO vectors are matched against current scene hypotheses
                            generated by Crimetryx AI agents.
                        </p>
                    </div>

                    {/* Suspect Cards Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '20px'
                    }}>
                        {filteredSuspects.map(suspect => (
                            <SuspectCard
                                key={suspect.id}
                                suspect={suspect}
                                onViewDetails={setSelectedSuspect}
                                onLinkToScene={handleLinkToScene}
                            />
                        ))}
                    </div>

                    {filteredSuspects.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '48px',
                            color: 'var(--paper-aged)'
                        }}>
                            <Search size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <p>No suspects match your search criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Suspect Detail Modal */}
            {selectedSuspect && (
                <SuspectDetailModal
                    suspect={selectedSuspect}
                    onClose={() => setSelectedSuspect(null)}
                    onLinkToScene={handleLinkToScene}
                />
            )}
        </div>
    );
};

export default PredictionsPage;
