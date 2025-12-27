import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Html, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import {
    ArrowLeft,
    Plus,
    Crosshair,
    Move,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Grid3x3,
    Eye,
    Layers,
    Network,
    X,
    Save,
    Droplet,
    Footprints,
    Swords,
    Shell,
    Fingerprint,
    FileText,
    Camera,
    Shirt,
    Pill,
    Cigarette
} from 'lucide-react';

// Detailed Evidence Types with subcategories
const EVIDENCE_TYPES = {
    // Bloodstain Categories
    bloodstain_spatter: {
        label: 'Blood Spatter',
        color: '#dc2626',
        icon: Droplet,
        description: 'Impact spatter pattern',
        category: 'biological'
    },
    bloodstain_pool: {
        label: 'Blood Pool',
        color: '#b91c1c',
        icon: Droplet,
        description: 'Pooled blood accumulation',
        category: 'biological'
    },
    bloodstain_transfer: {
        label: 'Blood Transfer',
        color: '#ef4444',
        icon: Droplet,
        description: 'Contact transfer pattern',
        category: 'biological'
    },
    bloodstain_cast_off: {
        label: 'Cast-Off Pattern',
        color: '#f87171',
        icon: Droplet,
        description: 'Swing/motion pattern',
        category: 'biological'
    },

    // Weapon Categories
    weapon_knife: {
        label: 'Knife/Blade',
        color: '#7c3aed',
        icon: Swords,
        description: 'Sharp instrument',
        category: 'weapon'
    },
    weapon_firearm: {
        label: 'Firearm',
        color: '#6d28d9',
        icon: Crosshair,
        description: 'Gun/projectile weapon',
        category: 'weapon'
    },
    weapon_blunt: {
        label: 'Blunt Object',
        color: '#8b5cf6',
        icon: Swords,
        description: 'Impact weapon',
        category: 'weapon'
    },
    shell_casing: {
        label: 'Shell Casing',
        color: '#a78bfa',
        icon: Shell,
        description: 'Ammunition casing',
        category: 'weapon'
    },

    // Trace Evidence
    fingerprint: {
        label: 'Fingerprint',
        color: '#0891b2',
        icon: Fingerprint,
        description: 'Latent/patent print',
        category: 'trace'
    },
    footprint: {
        label: 'Footprint',
        color: '#f59e0b',
        icon: Footprints,
        description: 'Shoe/foot impression',
        category: 'trace'
    },
    fiber: {
        label: 'Fiber/Hair',
        color: '#84cc16',
        icon: Shirt,
        description: 'Textile or hair sample',
        category: 'trace'
    },

    // Other Evidence
    document: {
        label: 'Document',
        color: '#64748b',
        icon: FileText,
        description: 'Paper evidence',
        category: 'other'
    },
    drug_paraphernalia: {
        label: 'Drug Evidence',
        color: '#ec4899',
        icon: Pill,
        description: 'Narcotics related',
        category: 'other'
    },
    cigarette: {
        label: 'Cigarette/Ash',
        color: '#78716c',
        icon: Cigarette,
        description: 'Smoking material',
        category: 'other'
    },
    photo_marker: {
        label: 'Photo Marker',
        color: '#fbbf24',
        icon: Camera,
        description: 'Reference point',
        category: 'other'
    },
    other: {
        label: 'Other',
        color: '#6b7280',
        icon: Crosshair,
        description: 'Miscellaneous evidence',
        category: 'other'
    }
};

// Group evidence by category
const EVIDENCE_CATEGORIES = {
    biological: { label: 'Biological', color: '#dc2626' },
    weapon: { label: 'Weapons', color: '#7c3aed' },
    trace: { label: 'Trace', color: '#0891b2' },
    other: { label: 'Other', color: '#6b7280' }
};

// 3D Model Component with auto-scaling and proper centering
const SceneModel = ({ url, onClick }) => {
    const { scene } = useGLTF(url);
    const groupRef = useRef();

    // Calculate bounding box and adjust scale/position once
    useEffect(() => {
        if (scene && groupRef.current) {
            // Clone to avoid mutating original
            const box = new THREE.Box3().setFromObject(scene);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            // Scale model to fit within ~8 units
            const targetSize = 8;
            const scale = maxDim > 0 ? targetSize / maxDim : 1;

            // Apply scale and center the model
            scene.scale.setScalar(scale);
            scene.position.x = -center.x * scale;
            scene.position.y = -box.min.y * scale; // Put bottom of model at y=0
            scene.position.z = -center.z * scale;
        }
    }, [scene]);

    return (
        <group ref={groupRef}>
            {/* Floor for clicking */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.01, 0]}
                receiveShadow
                onClick={(e) => {
                    e.stopPropagation();
                    if (onClick) onClick(e.point);
                }}
            >
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial color="#3d3d3d" roughness={0.8} />
            </mesh>

            {/* Grid for reference */}
            <gridHelper args={[30, 30, '#555', '#444']} position={[0, 0.01, 0]} />

            {/* The 3D model */}
            <primitive
                object={scene}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onClick) onClick(e.point);
                }}
            />
        </group>
    );
};

// Evidence Marker in 3D
const EvidenceMarker3D = ({ position, type, id, selected, onClick }) => {
    const config = EVIDENCE_TYPES[type] || EVIDENCE_TYPES.other;

    return (
        <mesh
            position={[position.x, position.y + 0.3, position.z]}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial
                color={config.color}
                emissive={config.color}
                emissiveIntensity={selected ? 0.5 : 0.2}
            />
            <Html
                position={[0, 0.4, 0]}
                center
                style={{
                    background: selected ? config.color : 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none'
                }}
            >
                {id}
            </Html>
        </mesh>
    );
};

// Fallback scene when no model - Realistic crime scene bedroom
const FallbackScene = ({ onClick }) => {
    return (
        <group>
            {/* Floor - wooden texture simulation */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0, 0]}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onClick) onClick(e.point);
                }}
            >
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="#3d3428" roughness={0.8} />
            </mesh>

            {/* Grid for reference */}
            <gridHelper args={[10, 20, '#444', '#333']} position={[0, 0.01, 0]} />

            {/* Room walls */}
            {/* Back wall */}
            <mesh position={[0, 1.5, -5]}>
                <boxGeometry args={[10, 3, 0.15]} />
                <meshStandardMaterial color="#4a4a52" />
            </mesh>
            {/* Left wall */}
            <mesh position={[-5, 1.5, 0]}>
                <boxGeometry args={[0.15, 3, 10]} />
                <meshStandardMaterial color="#52525a" />
            </mesh>
            {/* Right wall */}
            <mesh position={[5, 1.5, 0]}>
                <boxGeometry args={[0.15, 3, 10]} />
                <meshStandardMaterial color="#4a4a52" />
            </mesh>

            {/* Window on back wall */}
            <mesh position={[0, 1.8, -4.9]}>
                <boxGeometry args={[2, 1.5, 0.1]} />
                <meshStandardMaterial color="#1a3a5c" emissive="#1a3a5c" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0, 1.8, -4.85]}>
                <boxGeometry args={[0.05, 1.5, 0.05]} />
                <meshStandardMaterial color="#2a2a34" />
            </mesh>

            {/* Bed frame */}
            <mesh position={[-2, 0.3, -2]}>
                <boxGeometry args={[2.2, 0.6, 3]} />
                <meshStandardMaterial color="#5c4a3d" />
            </mesh>
            {/* Bed mattress */}
            <mesh position={[-2, 0.65, -2]}>
                <boxGeometry args={[2, 0.3, 2.8]} />
                <meshStandardMaterial color="#e8e0d0" />
            </mesh>
            {/* Pillow */}
            <mesh position={[-2, 0.85, -3.2]}>
                <boxGeometry args={[1.5, 0.2, 0.5]} />
                <meshStandardMaterial color="#f0f0f0" />
            </mesh>
            {/* Headboard */}
            <mesh position={[-2, 1.2, -3.4]}>
                <boxGeometry args={[2.2, 1, 0.15]} />
                <meshStandardMaterial color="#4a3d30" />
            </mesh>

            {/* Nightstand */}
            <mesh position={[-0.5, 0.35, -3]}>
                <boxGeometry args={[0.6, 0.7, 0.5]} />
                <meshStandardMaterial color="#3d3428" />
            </mesh>
            {/* Lamp on nightstand */}
            <mesh position={[-0.5, 0.85, -3]}>
                <cylinderGeometry args={[0.08, 0.12, 0.35, 8]} />
                <meshStandardMaterial color="#c4a35a" />
            </mesh>
            <mesh position={[-0.5, 1.1, -3]}>
                <coneGeometry args={[0.2, 0.25, 8]} />
                <meshStandardMaterial color="#f5e6c8" emissive="#f5e6c8" emissiveIntensity={0.2} />
            </mesh>

            {/* Dresser */}
            <mesh position={[3, 0.5, -3]}>
                <boxGeometry args={[1.5, 1, 0.6]} />
                <meshStandardMaterial color="#4d4035" />
            </mesh>
            {/* Mirror on dresser */}
            <mesh position={[3, 1.4, -3]}>
                <boxGeometry args={[1, 0.8, 0.05]} />
                <meshStandardMaterial color="#8899aa" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Rug/Carpet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1]}>
                <planeGeometry args={[4, 3]} />
                <meshStandardMaterial color="#6b4423" roughness={1} />
            </mesh>

            {/* Chair */}
            <mesh position={[2, 0.25, 2]}>
                <boxGeometry args={[0.6, 0.5, 0.6]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>
            <mesh position={[2, 0.75, 2.25]}>
                <boxGeometry args={[0.6, 0.8, 0.1]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>

            {/* Door frame on right wall */}
            <mesh position={[4.9, 1.1, 2]}>
                <boxGeometry args={[0.2, 2.2, 1]} />
                <meshStandardMaterial color="#3d3428" />
            </mesh>

            {/* Some scattered items for crime scene feel */}
            {/* Overturned chair/debris */}
            <mesh position={[1, 0.15, 0]} rotation={[0.3, 0.5, 1.2]}>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color="#554433" />
            </mesh>

            {/* Ceiling */}
            <mesh position={[0, 3, 0]}>
                <boxGeometry args={[10, 0.1, 10]} />
                <meshStandardMaterial color="#3a3a42" />
            </mesh>
        </group>
    );
};

// Loading component
const LoadingModel = () => (
    <Html center>
        <div style={{
            color: 'var(--accent-primary)',
            textAlign: 'center',
            fontFamily: 'var(--font-sans)'
        }}>
            <div style={{
                width: 40,
                height: 40,
                border: '3px solid var(--accent-primary)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                margin: '0 auto 12px',
                animation: 'spin 1s linear infinite'
            }} />
            Loading 3D Scene...
        </div>
    </Html>
);

// Evidence Panel
const EvidencePanel = ({
    evidence,
    selectedEvidence,
    onSelect,
    onAdd,
    onUpdate,
    onDelete,
    isAddingMode,
    setIsAddingMode,
    newEvidenceType,
    setNewEvidenceType
}) => {
    const [editingNotes, setEditingNotes] = useState('');
    const selected = evidence.find(e => e.id === selectedEvidence);

    useEffect(() => {
        if (selected) {
            setEditingNotes(selected.notes || '');
        }
    }, [selected]);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} />
                    Evidence
                </h3>
                <button
                    className={`btn ${isAddingMode ? 'btn-danger' : 'btn-primary'} btn-sm`}
                    onClick={() => setIsAddingMode(!isAddingMode)}
                >
                    {isAddingMode ? <X size={14} /> : <Plus size={14} />}
                    {isAddingMode ? 'Cancel' : 'Add'}
                </button>
            </div>

            {isAddingMode && (
                <div style={{ padding: 'var(--spacing-md)', borderBottom: '2px dashed var(--manila-dark)', maxHeight: '300px', overflowY: 'auto' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--ink-black)', marginBottom: '12px', fontFamily: 'var(--font-typewriter)', textTransform: 'uppercase' }}>
                        Select evidence type:
                    </p>

                    {Object.entries(EVIDENCE_CATEGORIES).map(([catKey, catConfig]) => (
                        <div key={catKey} style={{ marginBottom: '12px' }}>
                            <div style={{
                                fontSize: '0.65rem',
                                fontWeight: 'bold',
                                color: catConfig.color,
                                marginBottom: '6px',
                                fontFamily: 'var(--font-typewriter)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                borderBottom: `1px solid ${catConfig.color}`,
                                paddingBottom: '2px'
                            }}>
                                {catConfig.label}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {Object.entries(EVIDENCE_TYPES)
                                    .filter(([_, config]) => config.category === catKey)
                                    .map(([key, config]) => (
                                        <button
                                            key={key}
                                            className={`btn btn-sm ${newEvidenceType === key ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setNewEvidenceType(key)}
                                            title={config.description}
                                            style={{
                                                fontSize: '0.65rem',
                                                padding: '4px 8px',
                                                borderColor: newEvidenceType === key ? config.color : undefined,
                                                background: newEvidenceType === key ? config.color : 'var(--paper)',
                                                color: newEvidenceType === key ? 'white' : 'var(--ink-black)'
                                            }}
                                        >
                                            <config.icon size={10} />
                                            {config.label}
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                    ))}

                    <div style={{
                        marginTop: '12px',
                        padding: '8px',
                        background: 'var(--manila-light)',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        color: 'var(--ink-black)',
                        fontFamily: 'var(--font-typewriter)'
                    }}>
                        <strong>Selected:</strong> {EVIDENCE_TYPES[newEvidenceType]?.label || 'None'}<br />
                        <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>
                            {EVIDENCE_TYPES[newEvidenceType]?.description}
                        </span>
                    </div>
                </div>
            )}

            <div className="sidebar-content">
                {evidence.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                        <Crosshair size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                        <p style={{ fontSize: '0.875rem' }}>No evidence placed</p>
                        <p style={{ fontSize: '0.75rem' }}>Click "Add" to place markers</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {evidence.map(item => {
                            const config = EVIDENCE_TYPES[item.type] || EVIDENCE_TYPES.other;
                            const isSelected = item.id === selectedEvidence;

                            return (
                                <div
                                    key={item.id}
                                    className="card"
                                    onClick={() => onSelect(item.id)}
                                    style={{
                                        padding: '12px',
                                        cursor: 'pointer',
                                        borderColor: isSelected ? config.color : undefined,
                                        background: isSelected ? 'var(--bg-tertiary)' : undefined
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <span
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: config.color
                                            }}
                                        />
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600 }}>
                                            {item.evidence_id || item.id}
                                        </span>
                                        <span className="badge" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                                            {config.label}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        ({item.x?.toFixed(2)}, {item.y?.toFixed(2)}, {item.z?.toFixed(2)})
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Selected Evidence Detail */}
            {selected && (
                <div style={{
                    borderTop: '1px solid var(--border-subtle)',
                    padding: 'var(--spacing-md)'
                }}>
                    <h4 style={{ fontSize: '0.875rem', marginBottom: '12px' }}>Evidence Details</h4>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label">Notes</label>
                        <textarea
                            className="form-textarea"
                            rows={3}
                            value={editingNotes}
                            onChange={(e) => setEditingNotes(e.target.value)}
                            placeholder="Add observations..."
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onUpdate(selected.id, { notes: editingNotes })}
                        >
                            <Save size={12} /> Save
                        </button>
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={() => onDelete(selected.id)}
                        >
                            Delete
                        </button>
                    </div>
                    {selected.hash && (
                        <div style={{
                            marginTop: '12px',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                            wordBreak: 'break-all'
                        }}>
                            Hash: {selected.hash}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SceneViewerPage = () => {
    const { caseId } = useParams();
    const navigate = useNavigate();

    const [evidence, setEvidence] = useState([]);
    const [selectedEvidence, setSelectedEvidence] = useState(null);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [newEvidenceType, setNewEvidenceType] = useState('bloodstain_spatter');
    const [modelUrl, setModelUrl] = useState(null);
    const [caseData, setCaseData] = useState(null);

    // Demo 3D scene model (used when KIRI Engine model not available)
    const DEMO_MODEL_URL = '/models/scene.gltf';

    useEffect(() => {
        fetchCaseData();
        fetchEvidence();
    }, [caseId]);

    const fetchCaseData = async () => {
        try {
            const response = await fetch(`/api/cases/${caseId}`);
            if (response.ok) {
                const data = await response.json();
                setCaseData(data);
                if (data.scene_model_path) {
                    setModelUrl(`/models/${data.scene_model_path}`);
                }
            }
        } catch (err) {
            console.error('Failed to fetch case:', err);
            // Demo data
            setCaseData({
                case_id: 'CRX-2024-0001',
                location: 'Arkham City',
                status: 'ready'
            });
        }
    };

    const fetchEvidence = async () => {
        try {
            const response = await fetch(`/api/cases/${caseId}/evidence`);
            if (response.ok) {
                const data = await response.json();
                setEvidence(data);
            }
        } catch (err) {
            // Demo evidence
            setEvidence([
                { id: 1, evidence_id: 'E-001', type: 'bloodstain', x: 1, y: 0, z: -1, notes: 'Directional spray pattern', hash: 'abc123...' },
                { id: 2, evidence_id: 'E-002', type: 'weapon', x: -2, y: 0, z: 0.5, notes: 'Kitchen knife, 15cm blade', hash: 'def456...' },
                { id: 3, evidence_id: 'E-003', type: 'footprint', x: 0, y: 0, z: 2, notes: 'Size 10 boot print', hash: 'ghi789...' }
            ]);
        }
    };

    const handleSceneClick = async (point) => {
        if (!isAddingMode) return;

        const newEvidence = {
            id: Date.now(),
            evidence_id: `E-${String(evidence.length + 1).padStart(3, '0')}`,
            type: newEvidenceType,
            x: point.x,
            y: point.y,
            z: point.z,
            notes: '',
            hash: 'pending...'
        };

        try {
            const response = await fetch(`/api/cases/${caseId}/evidence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: newEvidenceType,
                    x: point.x,
                    y: point.y,
                    z: point.z
                })
            });

            if (response.ok) {
                const data = await response.json();
                setEvidence([...evidence, data]);
            } else {
                setEvidence([...evidence, newEvidence]);
            }
        } catch (err) {
            setEvidence([...evidence, newEvidence]);
        }

        setIsAddingMode(false);
    };

    const handleUpdateEvidence = async (id, updates) => {
        try {
            await fetch(`/api/cases/${caseId}/evidence/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
        } catch (err) {
            console.error('Failed to update evidence:', err);
        }

        setEvidence(evidence.map(e => e.id === id ? { ...e, ...updates } : e));
    };

    const handleDeleteEvidence = async (id) => {
        try {
            await fetch(`/api/cases/${caseId}/evidence/${id}`, { method: 'DELETE' });
        } catch (err) {
            console.error('Failed to delete evidence:', err);
        }

        setEvidence(evidence.filter(e => e.id !== id));
        setSelectedEvidence(null);
    };

    return (
        <div className="app-container">
            <nav className="nav-bar">
                <div className="nav-logo">
                    <button className="btn btn-ghost" onClick={() => navigate('/')}>
                        <ArrowLeft size={18} />
                    </button>
                    <span className="nav-logo-text">CRIMETRYX AI</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '16px', fontFamily: 'var(--font-mono)' }}>
                        {caseData?.case_id || `Case #${caseId}`}
                    </span>
                </div>
                <div className="nav-actions">
                    <button className="btn btn-secondary" onClick={() => navigate(`/case/${caseId}/workflow`)}>
                        <Network size={16} />
                        Agent Workflow
                    </button>
                </div>
            </nav>

            <div className="main-content">
                <EvidencePanel
                    evidence={evidence}
                    selectedEvidence={selectedEvidence}
                    onSelect={setSelectedEvidence}
                    onUpdate={handleUpdateEvidence}
                    onDelete={handleDeleteEvidence}
                    isAddingMode={isAddingMode}
                    setIsAddingMode={setIsAddingMode}
                    newEvidenceType={newEvidenceType}
                    setNewEvidenceType={setNewEvidenceType}
                />

                <div className="scene-viewer">
                    {/* Three.js Canvas - uses KIRI model, demo model, or fallback scene */}
                    <Canvas camera={{ position: [12, 10, 12], fov: 45 }}>
                        {/* Better lighting setup */}
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
                        <directionalLight position={[-5, 10, -5]} intensity={0.5} />
                        <pointLight position={[0, 10, 0]} intensity={0.4} />

                        {/* Simple dark background instead of sky */}
                        <color attach="background" args={['#1a1a1a']} />

                        <Suspense fallback={<LoadingModel />}>
                            {/* Use KIRI model if available, otherwise use demo scene.gltf */}
                            <SceneModel url={modelUrl || DEMO_MODEL_URL} onClick={handleSceneClick} />

                            {evidence.map(item => (
                                <EvidenceMarker3D
                                    key={item.id}
                                    id={item.evidence_id || item.id}
                                    position={{ x: item.x, y: item.y, z: item.z }}
                                    type={item.type}
                                    selected={selectedEvidence === item.id}
                                    onClick={() => setSelectedEvidence(item.id)}
                                />
                            ))}
                        </Suspense>

                        <OrbitControls
                            enablePan={true}
                            enableZoom={true}
                            enableRotate={true}
                            minDistance={3}
                            maxDistance={50}
                            target={[0, 2, 0]}
                        />

                        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                            <GizmoViewport labelColor="white" axisHeadScale={1} />
                        </GizmoHelper>
                    </Canvas>

                    {/* Scene Controls */}
                    <div className="scene-toolbar">
                        <button className="btn btn-ghost btn-icon" title="Reset View">
                            <RotateCcw size={18} />
                        </button>
                        <button className="btn btn-ghost btn-icon" title="Zoom In">
                            <ZoomIn size={18} />
                        </button>
                        <button className="btn btn-ghost btn-icon" title="Zoom Out">
                            <ZoomOut size={18} />
                        </button>
                        <button className="btn btn-ghost btn-icon" title="Toggle Grid">
                            <Grid3x3 size={18} />
                        </button>
                    </div>

                    {/* Mode Indicator */}
                    {isAddingMode && (
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: EVIDENCE_TYPES[newEvidenceType]?.color || 'var(--accent-primary)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Crosshair size={16} />
                            Click on scene to place {EVIDENCE_TYPES[newEvidenceType]?.label}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SceneViewerPage;
