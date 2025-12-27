import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Filter,
    ZoomIn,
    ZoomOut,
    Eye,
    EyeOff,
    RefreshCw,
    User,
    MapPin,
    AlertTriangle,
    Fingerprint
} from 'lucide-react';

// Network node types and colors
const NODE_TYPES = {
    suspect: { color: '#d4a574', label: 'Suspect', icon: '👤' },
    location: { color: '#fbbf24', label: 'Location', icon: '📍' },
    crimeType: { color: '#6ee7b7', label: 'Crime Type', icon: '⚠️' },
    moPattern: { color: '#93c5fd', label: 'MO Pattern', icon: '🔍' }
};

// Demo network data
const DEMO_NODES = [
    // Suspects
    { id: 'S0001', type: 'suspect', label: 'S0001', x: 100, y: 100 },
    { id: 'S0004', type: 'suspect', label: 'S0004', x: 450, y: 180 },
    { id: 'S0005', type: 'suspect', label: 'S0005', x: 280, y: 350 },

    // Locations
    { id: 'L01', type: 'location', label: 'T. Nagar', x: 200, y: 50 },
    { id: 'L04', type: 'location', label: 'Velachery', x: 380, y: 280 },
    { id: 'L05', type: 'location', label: 'Fairlands', x: 220, y: 420 },

    // Crime Types
    { id: 'C01', type: 'crimeType', label: 'Robbery', x: 520, y: 100 },
    { id: 'C02', type: 'crimeType', label: 'Fraud', x: 80, y: 200 },

    // MO Patterns
    { id: 'MO01', type: 'moPattern', label: 'hundi theft', x: 480, y: 380 },
    { id: 'MO02', type: 'moPattern', label: 'Temple', x: 580, y: 300 },
    { id: 'MO03', type: 'moPattern', label: 'Screwdriver', x: 350, y: 120 }
];

const DEMO_EDGES = [
    // S0001 connections
    { from: 'S0001', to: 'L01', label: 'ACTIVE_IN' },
    { from: 'S0001', to: 'C02', label: 'COMMITTED' },

    // S0004 connections
    { from: 'S0004', to: 'L04', label: 'ACTIVE_IN' },
    { from: 'S0004', to: 'C01', label: 'LIKELY_TO_COMMIT' },
    { from: 'S0004', to: 'MO03', label: 'LIKELY_TO_USE' },
    { from: 'S0004', to: 'MO01', label: 'MATCHED_WITH' },

    // S0005 connections
    { from: 'S0005', to: 'L05', label: 'ACTIVE_IN' },
    { from: 'S0005', to: 'MO03', label: 'LIKELY_TO_USE' },
    { from: 'S0005', to: 'MO01', label: 'MATCHED_WITH' },
    { from: 'S0005', to: 'MO02', label: 'MATCHED_WITH' },

    // Location-Crime connections
    { from: 'L04', to: 'C01', label: 'HOTSPOT_FOR' },
    { from: 'MO02', to: 'MO01', label: 'RELATED_TO' }
];

const NetworkPage = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [nodes, setNodes] = useState(DEMO_NODES);
    const [edges] = useState(DEMO_EDGES);
    const [selectedNode, setSelectedNode] = useState(null);
    const [showLabels, setShowLabels] = useState(true);
    const [showRelations, setShowRelations] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [filter, setFilter] = useState('All');
    const [dragging, setDragging] = useState(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const filterOptions = ['All', 'Suspects', 'Locations', 'Crime Types', 'Patterns'];

    const getFilteredNodes = () => {
        if (filter === 'All') return nodes;
        const typeMap = {
            'Suspects': 'suspect',
            'Locations': 'location',
            'Crime Types': 'crimeType',
            'Patterns': 'moPattern'
        };
        return nodes.filter(n => n.type === typeMap[filter]);
    };

    const getFilteredEdges = () => {
        const visibleNodeIds = getFilteredNodes().map(n => n.id);
        return edges.filter(e =>
            visibleNodeIds.includes(e.from) && visibleNodeIds.includes(e.to)
        );
    };

    const handleMouseDown = (e, nodeId) => {
        e.preventDefault();
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            setDragging(nodeId);
            setOffset({
                x: e.clientX - node.x * zoom,
                y: e.clientY - node.y * zoom
            });
        }
    };

    const handleMouseMove = (e) => {
        if (dragging) {
            setNodes(prev => prev.map(n =>
                n.id === dragging
                    ? { ...n, x: (e.clientX - offset.x) / zoom, y: (e.clientY - offset.y) / zoom }
                    : n
            ));
        }
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    const resetLayout = () => {
        setNodes(DEMO_NODES);
        setZoom(1);
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
                    <button className="btn btn-ghost" onClick={() => navigate('/predictions')}>
                        📈 Predictions
                    </button>
                    <button className="btn btn-ghost" style={{ background: 'var(--accent-primary)20' }}>
                        🔗 Network
                    </button>
                    <button className="btn btn-ghost" onClick={() => navigate('/osint')}>
                        🌐 OSINT
                    </button>
                </div>
            </nav>

            <div className="main-content" style={{ padding: '24px' }}>
                {/* Filter Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '24px',
                    background: 'var(--paper)',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    width: 'fit-content'
                }}>
                    {filterOptions.map(opt => (
                        <button
                            key={opt}
                            onClick={() => setFilter(opt)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                background: filter === opt ? 'var(--accent-primary)' : 'transparent',
                                color: filter === opt ? 'white' : 'var(--ink-black)',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-typewriter)',
                                fontSize: '0.85rem',
                                fontWeight: filter === opt ? 600 : 400
                            }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                {/* Main Network Canvas Area */}
                <div style={{ display: 'flex', gap: '24px' }}>
                    {/* Canvas */}
                    <div
                        ref={canvasRef}
                        style={{
                            flex: 1,
                            height: '600px',
                            background: 'var(--paper)',
                            borderRadius: 'var(--radius-lg)',
                            border: '3px solid var(--manila-dark)',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: dragging ? 'grabbing' : 'grab'
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* SVG for edges */}
                        <svg style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none'
                        }}>
                            {showRelations && getFilteredEdges().map((edge, idx) => {
                                const fromNode = nodes.find(n => n.id === edge.from);
                                const toNode = nodes.find(n => n.id === edge.to);
                                if (!fromNode || !toNode) return null;

                                const midX = (fromNode.x + toNode.x) / 2 * zoom;
                                const midY = (fromNode.y + toNode.y) / 2 * zoom;

                                return (
                                    <g key={idx}>
                                        <line
                                            x1={fromNode.x * zoom}
                                            y1={fromNode.y * zoom}
                                            x2={toNode.x * zoom}
                                            y2={toNode.y * zoom}
                                            stroke="#888"
                                            strokeWidth={1.5}
                                            strokeDasharray="4,4"
                                        />
                                        {showLabels && (
                                            <text
                                                x={midX}
                                                y={midY - 5}
                                                fill="#666"
                                                fontSize="10"
                                                textAnchor="middle"
                                                style={{ fontFamily: 'var(--font-mono)' }}
                                            >
                                                {edge.label}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Nodes */}
                        {getFilteredNodes().map(node => {
                            const config = NODE_TYPES[node.type];
                            const size = node.type === 'suspect' ? 50 : 40;

                            return (
                                <div
                                    key={node.id}
                                    style={{
                                        position: 'absolute',
                                        left: node.x * zoom - size / 2,
                                        top: node.y * zoom - size / 2,
                                        width: size,
                                        height: size,
                                        borderRadius: '50%',
                                        background: config.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'grab',
                                        boxShadow: selectedNode === node.id
                                            ? `0 0 0 4px ${config.color}60, 0 4px 12px rgba(0,0,0,0.3)`
                                            : '0 2px 8px rgba(0,0,0,0.2)',
                                        transition: 'box-shadow 0.2s',
                                        zIndex: selectedNode === node.id ? 10 : 1
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, node.id)}
                                    onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                                >
                                    <span style={{ fontSize: size * 0.4 }}>{config.icon}</span>
                                </div>
                            );
                        })}

                        {/* Node Labels */}
                        {showLabels && getFilteredNodes().map(node => {
                            const size = node.type === 'suspect' ? 50 : 40;
                            return (
                                <div
                                    key={`label-${node.id}`}
                                    style={{
                                        position: 'absolute',
                                        left: node.x * zoom,
                                        top: node.y * zoom + size / 2 + 8,
                                        transform: 'translateX(-50%)',
                                        fontSize: '0.75rem',
                                        fontFamily: 'var(--font-mono)',
                                        color: 'var(--ink-black)',
                                        background: 'rgba(255,255,255,0.9)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {node.label}
                                </div>
                            );
                        })}
                    </div>

                    {/* Controls Panel */}
                    <div style={{
                        width: '200px',
                        background: 'var(--paper)',
                        borderRadius: 'var(--radius-md)',
                        padding: '20px',
                        border: '2px solid var(--manila-dark)'
                    }}>
                        <h4 style={{
                            fontFamily: 'var(--font-typewriter)',
                            marginBottom: '16px',
                            fontSize: '0.9rem'
                        }}>
                            Controls
                        </h4>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                marginBottom: '8px'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={showLabels}
                                    onChange={(e) => setShowLabels(e.target.checked)}
                                />
                                <span style={{ fontSize: '0.85rem' }}>Show Labels</span>
                            </label>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={showRelations}
                                    onChange={(e) => setShowRelations(e.target.checked)}
                                />
                                <span style={{ fontSize: '0.85rem' }}>Show Relations</span>
                            </label>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginBottom: '8px'
                            }}>
                                Zoom Level
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <button
                            className="btn btn-secondary btn-sm w-full"
                            onClick={resetLayout}
                            style={{ marginBottom: '24px' }}
                        >
                            <RefreshCw size={14} /> Reset Layout
                        </button>

                        <h4 style={{
                            fontFamily: 'var(--font-typewriter)',
                            marginBottom: '12px',
                            fontSize: '0.9rem'
                        }}>
                            Network Elements
                        </h4>

                        {Object.entries(NODE_TYPES).map(([key, config]) => (
                            <div key={key} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px'
                            }}>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '4px',
                                    background: config.color
                                }} />
                                <span style={{ fontSize: '0.8rem' }}>{config.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkPage;
