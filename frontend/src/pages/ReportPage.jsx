import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    FileText,
    Camera,
    Brain,
    Hash,
    CheckSquare,
    Square,
    Loader2,
    CheckCircle
} from 'lucide-react';

const ReportPage = () => {
    const { caseId } = useParams();
    const navigate = useNavigate();

    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);

    const [options, setOptions] = useState({
        include3DSnapshots: true,
        includeAgentReasoning: true,
        includeEvidenceHashes: true,
        includeTimeline: true,
        includeContradictions: true
    });

    useEffect(() => {
        fetchCaseData();
    }, [caseId]);

    const fetchCaseData = async () => {
        try {
            const response = await fetch(`/api/cases/${caseId}`);
            if (response.ok) {
                const data = await response.json();
                setCaseData(data);
            }
        } catch (err) {
            // Demo data
            setCaseData({
                case_id: 'CRX-2024-0001',
                location: 'Arkham City, 1st Floor Master Bedroom',
                date: '2024-12-08',
                investigator: 'Demo Investigator',
                status: 'analyzed',
                evidence: [
                    { evidence_id: 'E-001', type: 'bloodstain' },
                    { evidence_id: 'E-002', type: 'weapon' },
                    { evidence_id: 'E-003', type: 'footprint' }
                ],
                agent_logs: [
                    { agent_type: 'scene_interpreter', status: 'completed' },
                    { agent_type: 'evidence_reasoner', status: 'completed' },
                    { agent_type: 'timeline_builder', status: 'completed' },
                    { agent_type: 'hypothesis_challenger', status: 'completed' }
                ],
                hypotheses: [
                    { scenario_id: 'A', confidence: 0.65 },
                    { scenario_id: 'B', confidence: 0.25 }
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        setGenerating(true);

        try {
            const response = await fetch(`/api/cases/${caseId}/report`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `CrimetryxAI_Report_${caseData?.case_id || caseId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setGenerated(true);
            } else {
                throw new Error('Failed to generate report');
            }
        } catch (err) {
            // Demo: simulate download
            await new Promise(resolve => setTimeout(resolve, 2000));
            setGenerated(true);
            alert('Demo mode: Report would be downloaded in production.');
        } finally {
            setGenerating(false);
        }
    };

    const toggleOption = (key) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const reportOptions = [
        { key: 'include3DSnapshots', icon: Camera, label: '3D Scene Snapshots', description: 'Include rendered views of the crime scene' },
        { key: 'includeAgentReasoning', icon: Brain, label: 'Agent Reasoning', description: 'Full reasoning output from each AI agent' },
        { key: 'includeEvidenceHashes', icon: Hash, label: 'Evidence Hashes', description: 'SHA-256 hashes for chain of custody' },
        { key: 'includeTimeline', icon: FileText, label: 'Event Timeline', description: 'Reconstructed sequence of events' },
        { key: 'includeContradictions', icon: FileText, label: 'Contradiction Analysis', description: 'Identified inconsistencies and challenges' }
    ];

    if (loading) {
        return (
            <div className="app-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <nav className="nav-bar">
                <div className="nav-logo">
                    <button className="btn btn-ghost" onClick={() => navigate(`/case/${caseId}/workflow`)}>
                        <ArrowLeft size={18} />
                    </button>
                    <span className="nav-logo-text">CRIMETRYX AI</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '16px', fontFamily: 'var(--font-mono)' }}>
                        Report Export
                    </span>
                </div>
            </nav>

            <div className="main-content" style={{ justifyContent: 'center' }}>
                <div style={{ maxWidth: '700px', width: '100%', padding: '48px 24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <FileText size={36} style={{ color: 'white' }} />
                        </div>
                        <h1 style={{ marginBottom: '8px' }}>Export Forensic Report</h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                            Generate a comprehensive PDF report for {caseData?.case_id}
                        </p>

                        {/* Primary Download Button - Top of page */}
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleGenerateReport}
                            disabled={generating}
                            style={{
                                padding: '16px 48px',
                                fontSize: '1.1rem',
                                background: 'var(--stamp-red)',
                                borderColor: '#8b1e2e',
                                boxShadow: '0 4px 12px rgba(139, 30, 46, 0.4)'
                            }}
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={24} className="animate-spin" />
                                    Generating Report...
                                </>
                            ) : generated ? (
                                <>
                                    <CheckCircle size={24} />
                                    Report Downloaded!
                                </>
                            ) : (
                                <>
                                    <Download size={24} />
                                    Download PDF Report
                                </>
                            )}
                        </button>
                    </div>

                    {/* Case Summary */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Case Summary</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Case ID</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{caseData?.case_id}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Location</div>
                                <div>{caseData?.location}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Evidence Items</div>
                                <div>{caseData?.evidence?.length || 0} items</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Agent Analyses</div>
                                <div>{caseData?.agent_logs?.filter(l => l.status === 'completed').length || 0} completed</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Hypotheses</div>
                                <div>{caseData?.hypotheses?.length || 0} scenarios</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</div>
                                <span className="badge badge-completed">{caseData?.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Report Options */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Include in Report</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {reportOptions.map(opt => (
                                <div
                                    key={opt.key}
                                    onClick={() => toggleOption(opt.key)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        border: `1px solid ${options[opt.key] ? 'var(--accent-primary)' : 'transparent'}`
                                    }}
                                >
                                    {options[opt.key] ? (
                                        <CheckSquare size={20} style={{ color: 'var(--accent-primary)' }} />
                                    ) : (
                                        <Square size={20} style={{ color: 'var(--text-muted)' }} />
                                    )}
                                    <opt.icon size={18} style={{ color: 'var(--text-muted)' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{opt.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opt.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        className="btn btn-primary btn-lg w-full"
                        onClick={handleGenerateReport}
                        disabled={generating}
                        style={{ marginBottom: '16px' }}
                    >
                        {generating ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Generating Report...
                            </>
                        ) : generated ? (
                            <>
                                <CheckCircle size={20} />
                                Report Generated!
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                Download PDF Report
                            </>
                        )}
                    </button>

                    {generated && (
                        <div style={{
                            textAlign: 'center',
                            padding: '16px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid var(--accent-success)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <CheckCircle size={24} style={{ color: 'var(--accent-success)', margin: '0 auto 8px' }} />
                            <p style={{ color: 'var(--accent-success)', margin: 0 }}>
                                Report successfully generated and downloaded!
                            </p>
                        </div>
                    )}

                    {/* Disclaimer */}
                    <div style={{
                        marginTop: '32px',
                        padding: '16px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        textAlign: 'center'
                    }}>
                        <p style={{ margin: 0 }}>
                            This report was generated by Crimetryx AI. All AI-generated analyses should be reviewed
                            by qualified forensic professionals. This document maintains chain-of-custody through
                            cryptographic hashing.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportPage;
