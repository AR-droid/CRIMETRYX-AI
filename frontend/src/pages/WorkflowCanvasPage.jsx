import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Play,
    Eye,
    Brain,
    Clock,
    AlertTriangle,
    CheckCircle,
    Loader2,
    ChevronRight,
    FileText,
    X,
    Zap,
    GitBranch,
    Shield
} from 'lucide-react';

// Agent configurations
const AGENTS = [
    {
        id: 'scene_interpreter',
        name: 'Scene Interpreter',
        icon: Eye,
        description: 'Analyzes spatial layout, entry/exit points, visibility',
        color: '#3b82f6'
    },
    {
        id: 'evidence_reasoner',
        name: 'Evidence Reasoner',
        icon: Brain,
        description: 'Reasons about evidence patterns and correlations',
        color: '#8b5cf6'
    },
    {
        id: 'timeline_builder',
        name: 'Timeline Builder',
        icon: Clock,
        description: 'Reconstructs possible event timelines',
        color: '#10b981'
    },
    {
        id: 'hypothesis_challenger',
        name: 'Hypothesis Challenger',
        icon: AlertTriangle,
        description: 'Identifies contradictions and inconsistencies',
        color: '#f59e0b'
    }
];

// Agent Node Component - Enhanced Design
const AgentNode = ({ agent, status, result, onRun, onViewDetails, position }) => {
    const [isHovered, setIsHovered] = useState(false);

    const statusConfig = {
        idle: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', label: 'Ready to run', icon: null },
        running: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', label: 'Processing...', icon: Loader2 },
        completed: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', label: 'Complete', icon: CheckCircle },
        error: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Error', icon: AlertTriangle }
    };

    const Icon = agent.icon;
    const StatusIcon = statusConfig[status].icon;

    return (
        <div
            className={`agent-node ${status}`}
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                width: '220px',
                padding: '16px',
                background: 'var(--paper)',
                border: `3px solid ${status === 'completed' ? agent.color : 'var(--manila-dark)'}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: isHovered
                    ? `0 8px 24px rgba(0,0,0,0.3), 0 0 0 2px ${agent.color}40`
                    : '0 4px 12px rgba(0,0,0,0.2)',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                transition: 'all 0.2s ease',
                cursor: result ? 'pointer' : 'default'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => result ? onViewDetails(agent, result) : null}
        >
            {/* File tab header */}
            <div style={{
                position: 'absolute',
                top: '-12px',
                left: '12px',
                background: agent.color,
                color: 'white',
                padding: '2px 12px',
                fontSize: '0.6rem',
                fontFamily: 'var(--font-typewriter)',
                fontWeight: 'bold',
                borderRadius: '4px 4px 0 0',
                textTransform: 'uppercase',
                letterSpacing: '1px'
            }}>
                AI AGENT
            </div>

            {/* Header with icon and title */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    background: `${agent.color}20`,
                    border: `2px solid ${agent.color}40`,
                    flexShrink: 0
                }}>
                    {status === 'running' ? (
                        <Loader2 size={24} style={{ color: agent.color }} className="animate-spin" />
                    ) : (
                        <Icon size={24} style={{ color: agent.color }} />
                    )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontFamily: 'var(--font-typewriter)',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        color: 'var(--ink-black)',
                        marginBottom: '4px'
                    }}>
                        {agent.name}
                    </div>
                    <div style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.3
                    }}>
                        {agent.description}
                    </div>
                </div>
            </div>

            {/* Status indicator */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: statusConfig[status].bg,
                borderRadius: 'var(--radius-sm)',
                marginBottom: status === 'idle' && isHovered ? '12px' : '0'
            }}>
                {StatusIcon && <StatusIcon size={14} style={{ color: statusConfig[status].color }} className={status === 'running' ? 'animate-spin' : ''} />}
                <span style={{
                    flex: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: statusConfig[status].color,
                    fontFamily: 'var(--font-mono)'
                }}>
                    {statusConfig[status].label}
                </span>
                {result && (
                    <span style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)'
                    }}>
                        {result.execution_time?.toFixed(1)}s
                    </span>
                )}
            </div>

            {/* Action buttons */}
            {isHovered && status === 'idle' && (
                <button
                    className="btn btn-primary btn-sm"
                    style={{
                        width: '100%',
                        background: agent.color,
                        borderColor: agent.color
                    }}
                    onClick={(e) => { e.stopPropagation(); onRun(agent.id); }}
                >
                    <Play size={14} /> Run Analysis
                </button>
            )}

            {status === 'completed' && isHovered && (
                <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', marginTop: '8px' }}
                    onClick={(e) => { e.stopPropagation(); onViewDetails(agent, result); }}
                >
                    <Eye size={14} /> View Results
                </button>
            )}
        </div>
    );
};

// Connection Line Component
const ConnectionLine = ({ from, to, status }) => {
    const statusColors = {
        idle: '#333',
        active: '#3b82f6',
        completed: '#10b981',
        conflict: '#ef4444'
    };

    // Calculate SVG path
    const startX = from.x + 200;
    const startY = from.y + 50;
    const endX = to.x;
    const endY = to.y + 50;
    const midX = (startX + endX) / 2;

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'visible'
            }}
        >
            <defs>
                <marker
                    id={`arrow-${status}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path d="M0,0 L0,6 L9,3 z" fill={statusColors[status]} />
                </marker>
            </defs>
            <path
                d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                stroke={statusColors[status]}
                strokeWidth={status === 'conflict' ? 2 : 2}
                strokeDasharray={status === 'conflict' ? '5,5' : undefined}
                fill="none"
                markerEnd={`url(#arrow-${status})`}
            />
        </svg>
    );
};

// Agent Detail Modal with proper output rendering
const AgentDetailModal = ({ agent, result, onClose }) => {
    if (!agent || !result) return null;

    const Icon = agent.icon;

    // Parse the output - handle nested JSON strings and markdown code blocks
    const parseOutput = (output) => {
        if (!output) return null;

        try {
            // If output has a 'reasoning' field that's a string, try to extract JSON from it
            if (output.reasoning && typeof output.reasoning === 'string') {
                let reasoning = output.reasoning;

                // Remove markdown code blocks
                reasoning = reasoning.replace(/```json\n?/g, '').replace(/```\n?/g, '');

                // Try to parse as JSON
                try {
                    return JSON.parse(reasoning);
                } catch {
                    // Return as structured text if not valid JSON
                    return { text: reasoning };
                }
            }

            return output;
        } catch (e) {
            return output;
        }
    };

    const parsedOutput = parseOutput(result.output);

    // Render a key-value pair nicely
    const renderValue = (key, value, depth = 0) => {
        if (value === null || value === undefined) return null;

        const labelStyle = {
            fontFamily: 'var(--font-typewriter)',
            fontWeight: 'bold',
            color: agent.color,
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            letterSpacing: '0.5px',
            marginBottom: '4px'
        };

        const containerStyle = {
            marginBottom: '16px',
            paddingLeft: depth > 0 ? '16px' : '0',
            borderLeft: depth > 0 ? `2px solid ${agent.color}40` : 'none'
        };

        // Format key name
        const formatKey = (k) => k.replace(/_/g, ' ').toUpperCase();

        if (Array.isArray(value)) {
            return (
                <div key={key} style={containerStyle}>
                    <div style={labelStyle}>{formatKey(key)}</div>
                    {value.map((item, index) => (
                        <div key={index} style={{
                            background: 'var(--paper-aged)',
                            padding: '12px',
                            marginBottom: '8px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--manila-dark)'
                        }}>
                            {typeof item === 'object' ? (
                                Object.entries(item).map(([k, v]) => renderValue(k, v, depth + 1))
                            ) : (
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{String(item)}</span>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        if (typeof value === 'object') {
            return (
                <div key={key} style={containerStyle}>
                    <div style={labelStyle}>{formatKey(key)}</div>
                    <div style={{ paddingLeft: '8px' }}>
                        {Object.entries(value).map(([k, v]) => renderValue(k, v, depth + 1))}
                    </div>
                </div>
            );
        }

        // Simple value
        return (
            <div key={key} style={{ ...containerStyle, display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ ...labelStyle, minWidth: '120px', marginBottom: 0 }}>{formatKey(key)}:</span>
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    color: 'var(--ink-black)',
                    flex: 1
                }}>
                    {String(value)}
                </span>
            </div>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            padding: '8px',
                            borderRadius: 'var(--radius-md)',
                            background: `${agent.color}20`
                        }}>
                            <Icon size={24} style={{ color: agent.color }} />
                        </div>
                        <div>
                            <h3 className="modal-title">{agent.name}</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                {agent.description}
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '70vh', overflow: 'auto' }}>
                    <div style={{
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div className="badge badge-completed">
                            <CheckCircle size={12} />
                            Completed in {result.execution_time?.toFixed(2)}s
                        </div>
                    </div>

                    <h4 style={{
                        marginBottom: '16px',
                        fontFamily: 'var(--font-typewriter)',
                        borderBottom: '2px solid var(--manila-dark)',
                        paddingBottom: '8px'
                    }}>
                        Analysis Results
                    </h4>

                    <div style={{
                        background: 'var(--paper)',
                        padding: '20px',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--manila-dark)'
                    }}>
                        {parsedOutput && typeof parsedOutput === 'object' ? (
                            Object.entries(parsedOutput).map(([key, value]) => renderValue(key, value))
                        ) : (
                            <pre style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.8rem',
                                whiteSpace: 'pre-wrap',
                                margin: 0
                            }}>
                                {JSON.stringify(result.output, null, 2)}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Scenario Comparison Component
const ScenarioComparison = ({ hypotheses }) => {
    if (!hypotheses || hypotheses.length === 0) return null;

    return (
        <div style={{ marginTop: '32px' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitBranch size={20} />
                Generated Scenarios
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {hypotheses.map((h, i) => (
                    <div key={i} className="scenario-card">
                        <div className="scenario-header">
                            <span className="scenario-id">Scenario {h.scenario_id}</span>
                            <div className="confidence-meter">
                                <div className="confidence-bar">
                                    <div
                                        className="confidence-fill"
                                        style={{
                                            width: `${h.confidence * 100}%`,
                                            background: h.confidence > 0.5 ? 'var(--accent-success)' : 'var(--accent-warning)'
                                        }}
                                    />
                                </div>
                                <span className="confidence-value">{(h.confidence * 100).toFixed(0)}%</span>
                            </div>
                        </div>

                        <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>{h.title}</h4>

                        {h.timeline && h.timeline.length > 0 && (
                            <div className="timeline" style={{ marginTop: '16px' }}>
                                {h.timeline.slice(0, 4).map((event, j) => (
                                    <div key={j} className="timeline-item">
                                        <div className="timeline-dot" />
                                        <div className="timeline-content" style={{ padding: '8px 12px' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {event.estimated_time}
                                            </div>
                                            <div style={{ fontSize: '0.875rem' }}>{event.event}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {h.contradictions && h.contradictions.length > 0 && (
                            <div style={{
                                marginTop: '12px',
                                padding: '8px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--accent-danger)'
                            }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-danger)', marginBottom: '4px' }}>
                                    Contradictions Detected
                                </div>
                                {h.contradictions.map((c, j) => (
                                    <div key={j} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        • {c.description}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const WorkflowCanvasPage = () => {
    const { caseId } = useParams();
    const navigate = useNavigate();

    const [agentStatuses, setAgentStatuses] = useState({
        scene_interpreter: 'idle',
        evidence_reasoner: 'idle',
        timeline_builder: 'idle',
        hypothesis_challenger: 'idle'
    });

    const [agentResults, setAgentResults] = useState({});
    const [hypotheses, setHypotheses] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [isRunningAll, setIsRunningAll] = useState(false);

    // Agent positions for the workflow graph - adjusted for larger cards
    const agentPositions = {
        scene_interpreter: { x: 40, y: 60 },
        evidence_reasoner: { x: 320, y: 60 },
        timeline_builder: { x: 600, y: 60 },
        hypothesis_challenger: { x: 880, y: 60 }
    };

    const runAgent = async (agentId) => {
        setAgentStatuses(prev => ({ ...prev, [agentId]: 'running' }));

        try {
            const response = await fetch(`/api/cases/${caseId}/agents/${agentId}/run`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                setAgentResults(prev => ({ ...prev, [agentId]: result }));
                setAgentStatuses(prev => ({ ...prev, [agentId]: 'completed' }));

                // If timeline builder, extract hypotheses
                if (agentId === 'timeline_builder' && result.output?.scenarios) {
                    setHypotheses(result.output.scenarios);
                }
            } else {
                throw new Error('Agent execution failed');
            }
        } catch (err) {
            // Demo: simulate result
            await new Promise(resolve => setTimeout(resolve, 2000));

            const demoResult = {
                status: 'completed',
                execution_time: 2.5 + Math.random() * 2,
                output: getDemoOutput(agentId)
            };

            setAgentResults(prev => ({ ...prev, [agentId]: demoResult }));
            setAgentStatuses(prev => ({ ...prev, [agentId]: 'completed' }));

            if (agentId === 'timeline_builder') {
                setHypotheses(demoResult.output.scenarios || []);
            }
        }
    };

    const runFullAnalysis = async () => {
        setIsRunningAll(true);

        // Run agents in sequence
        const agentOrder = ['scene_interpreter', 'evidence_reasoner', 'timeline_builder', 'hypothesis_challenger'];

        for (const agentId of agentOrder) {
            await runAgent(agentId);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        setIsRunningAll(false);
    };

    const getDemoOutput = (agentId) => {
        const outputs = {
            scene_interpreter: {
                entry_exit_points: [
                    { location: 'Main entrance', type: 'entry' },
                    { location: 'Back window', type: 'exit' }
                ],
                visibility_analysis: [
                    { from: 'Doorway', to: 'Living room', visible: true }
                ],
                reasoning: 'The scene shows a single-story residence with limited entry points. The main entrance shows signs of forced entry, while the back window was found unlocked.'
            },
            evidence_reasoner: {
                evidence_analysis: [
                    { evidence_id: 'E-001', type: 'bloodstain', findings: ['Directional spray indicating movement', 'Height suggests standing victim'] },
                    { evidence_id: 'E-002', type: 'weapon', findings: ['Fingerprints recovered', 'Consistent with wound patterns'] }
                ],
                reasoning: 'Blood spatter patterns indicate the victim was struck while standing and moving toward the exit. The weapon location suggests it was dropped during the struggle.'
            },
            timeline_builder: {
                scenarios: [
                    {
                        scenario_id: 'A',
                        title: 'Confrontation at Entry',
                        confidence: 0.72,
                        timeline: [
                            { sequence: 1, event: 'Perpetrator enters through main door', estimated_time: 'T+0' },
                            { sequence: 2, event: 'Confrontation in living room', estimated_time: 'T+2min' },
                            { sequence: 3, event: 'Physical altercation occurs', estimated_time: 'T+5min' },
                            { sequence: 4, event: 'Perpetrator exits via back window', estimated_time: 'T+8min' }
                        ],
                        supporting_evidence: ['E-001', 'E-002']
                    },
                    {
                        scenario_id: 'B',
                        title: 'Staged Scene',
                        confidence: 0.28,
                        timeline: [
                            { sequence: 1, event: 'Victim was incapacitated elsewhere', estimated_time: 'Unknown' },
                            { sequence: 2, event: 'Scene was arranged post-incident', estimated_time: 'Unknown' },
                            { sequence: 3, event: 'Evidence was planted', estimated_time: 'Unknown' }
                        ],
                        supporting_evidence: ['E-003']
                    }
                ],
                reasoning: 'Based on evidence patterns, Scenario A has higher probability due to consistent blood spatter and witness timeline.'
            },
            hypothesis_challenger: {
                challenges: [
                    {
                        scenario_id: 'A',
                        contradictions: [
                            { type: 'timeline_conflict', description: 'Blood drying pattern suggests longer timeline than witness accounts' }
                        ],
                        revised_confidence: 0.65
                    },
                    {
                        scenario_id: 'B',
                        contradictions: [
                            { type: 'physical_impossibility', description: 'No evidence of victim being moved post-mortem' }
                        ],
                        revised_confidence: 0.25
                    }
                ],
                overall_assessment: 'Scenario A remains most likely but requires timeline verification with forensic lab results.'
            }
        };

        return outputs[agentId] || {};
    };

    const getConnectionStatus = (fromId, toId) => {
        if (agentStatuses[toId] === 'running') return 'active';
        if (agentStatuses[toId] === 'completed' && agentStatuses[fromId] === 'completed') return 'completed';
        return 'idle';
    };

    return (
        <div className="app-container">
            <nav className="nav-bar">
                <div className="nav-logo">
                    <button className="btn btn-ghost" onClick={() => navigate(`/case/${caseId}/scene`)}>
                        <ArrowLeft size={18} />
                    </button>
                    <span className="nav-logo-text">CRIMETRYX AI</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '16px', fontFamily: 'var(--font-mono)' }}>
                        Agent Workflow
                    </span>
                </div>
                <div className="nav-actions">
                    <button
                        className="btn btn-primary"
                        onClick={runFullAnalysis}
                        disabled={isRunningAll}
                    >
                        {isRunningAll ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Running Analysis...
                            </>
                        ) : (
                            <>
                                <Zap size={16} />
                                Run Full Analysis
                            </>
                        )}
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate(`/case/${caseId}/report`)}
                    >
                        <FileText size={16} />
                        Export Report
                    </button>
                </div>
            </nav>

            <div className="main-content">
                <div className="page-container">
                    {/* Workflow Canvas */}
                    <div style={{
                        position: 'relative',
                        height: '280px',
                        background: 'linear-gradient(145deg, var(--manila-dark) 0%, var(--manila) 100%)',
                        borderRadius: 'var(--radius-lg)',
                        border: '3px solid var(--manila-dark)',
                        marginBottom: '32px',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        minWidth: '100%'
                    }}>
                        {/* Canvas title */}
                        <div style={{
                            position: 'absolute',
                            top: '12px',
                            left: '16px',
                            fontFamily: 'var(--font-typewriter)',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: 'var(--ink-faded)',
                            textTransform: 'uppercase',
                            letterSpacing: '2px'
                        }}>
                            Agent Analysis Pipeline
                        </div>

                        {/* Connection Lines - Horizontal Flow */}
                        <ConnectionLine
                            from={agentPositions.scene_interpreter}
                            to={agentPositions.evidence_reasoner}
                            status={getConnectionStatus('scene_interpreter', 'evidence_reasoner')}
                        />
                        <ConnectionLine
                            from={agentPositions.evidence_reasoner}
                            to={agentPositions.timeline_builder}
                            status={getConnectionStatus('evidence_reasoner', 'timeline_builder')}
                        />
                        <ConnectionLine
                            from={agentPositions.timeline_builder}
                            to={agentPositions.hypothesis_challenger}
                            status={getConnectionStatus('timeline_builder', 'hypothesis_challenger')}
                        />

                        {/* Agent Nodes */}
                        {AGENTS.map(agent => (
                            <AgentNode
                                key={agent.id}
                                agent={agent}
                                status={agentStatuses[agent.id]}
                                result={agentResults[agent.id]}
                                position={agentPositions[agent.id]}
                                onRun={runAgent}
                                onViewDetails={(a, r) => setSelectedAgent({ agent: a, result: r })}
                            />
                        ))}

                        {/* Legend */}
                        <div style={{
                            position: 'absolute',
                            bottom: '16px',
                            right: '16px',
                            display: 'flex',
                            gap: '16px',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)'
                        }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6b7280' }} /> Idle
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> Running
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Complete
                            </span>
                        </div>
                    </div>

                    {/* Hypotheses Comparison */}
                    <ScenarioComparison hypotheses={hypotheses} />

                    {/* Agent Logs */}
                    {Object.keys(agentResults).length > 0 && (
                        <div style={{ marginTop: '32px' }}>
                            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={20} />
                                Agent Audit Log
                            </h3>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>Agent</th>
                                            <th>Status</th>
                                            <th>Execution Time</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(agentResults).map(([agentId, result]) => {
                                            const agent = AGENTS.find(a => a.id === agentId);
                                            return (
                                                <tr key={agentId}>
                                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                                                        {new Date().toLocaleTimeString()}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <agent.icon size={14} style={{ color: agent.color }} />
                                                            {agent.name}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-completed">
                                                            <CheckCircle size={10} />
                                                            Completed
                                                        </span>
                                                    </td>
                                                    <td>{result.execution_time?.toFixed(2)}s</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => setSelectedAgent({ agent, result })}
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Agent Detail Modal */}
            {selectedAgent && (
                <AgentDetailModal
                    agent={selectedAgent.agent}
                    result={selectedAgent.result}
                    onClose={() => setSelectedAgent(null)}
                />
            )}
        </div>
    );
};

export default WorkflowCanvasPage;
