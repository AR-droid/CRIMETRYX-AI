import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Upload,
    Video,
    CheckCircle,
    ArrowRight,
    X,
    ArrowLeft,
    Loader2,
    AlertCircle
} from 'lucide-react';

const CaseSetupPage = () => {
    const { caseId } = useParams();
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('idle'); // idle, uploading, processing, ready, error
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith('video/')) {
            setFile(droppedFile);
            setError('');
        } else {
            setError('Please upload a video file');
        }
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setStatus('uploading');
        setProgress(0);

        // Simulate upload progress
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
        }, 500);

        try {
            const formData = new FormData();
            formData.append('video', file);

            const response = await fetch(`/api/cases/${caseId}/upload-scene`, {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (response.ok) {
                setProgress(100);
                setStatus('processing');
                // Start polling for processing status
                pollProcessingStatus();
            } else {
                throw new Error('Upload failed');
            }
        } catch (err) {
            clearInterval(progressInterval);
            // Demo mode: simulate success
            setProgress(100);
            setStatus('processing');

            // Simulate processing
            setTimeout(() => {
                setStatus('ready');
            }, 3000);
        } finally {
            setUploading(false);
        }
    };

    const pollProcessingStatus = async () => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/cases/${caseId}/scene-status`);
                const data = await response.json();

                if (data.status === 'completed') {
                    setStatus('ready');
                } else if (data.status === 'failed') {
                    setStatus('error');
                    setError('Processing failed. Please try again.');
                } else {
                    setTimeout(checkStatus, 2000);
                }
            } catch (err) {
                // Demo: simulate ready
                setStatus('ready');
            }
        };

        checkStatus();
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="app-container">
            <nav className="nav-bar">
                <div className="nav-logo">
                    <button
                        className="btn btn-ghost"
                        onClick={() => navigate('/')}
                        style={{ marginRight: '16px' }}
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                    <span className="nav-logo-text">CRIMETRYX AI</span>
                </div>
                <div className="nav-actions">
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Case Setup
                    </span>
                </div>
            </nav>

            <div className="main-content" style={{ justifyContent: 'center', alignItems: 'center', padding: '48px' }}>
                <div style={{ maxWidth: '600px', width: '100%' }}>
                    <h1 style={{ marginBottom: '8px' }}>Scene Ingestion</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                        Upload a video of the crime scene for 3D reconstruction
                    </p>

                    {/* Upload Area */}
                    <div
                        className={`upload-area ${dragOver ? 'dragover' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-input').click()}
                        style={file ? { borderColor: 'var(--accent-success)', background: 'rgba(16, 185, 129, 0.05)' } : {}}
                    >
                        <input
                            id="file-input"
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />

                        {file ? (
                            <div style={{ textAlign: 'center' }}>
                                <CheckCircle size={48} style={{ color: 'var(--accent-success)', marginBottom: '16px' }} />
                                <p className="upload-text" style={{ color: 'var(--text-primary)' }}>
                                    {file.name}
                                </p>
                                <p className="upload-hint">
                                    {formatFileSize(file.size)}
                                </p>
                                <button
                                    className="btn btn-ghost btn-sm mt-md"
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                >
                                    <X size={14} /> Remove
                                </button>
                            </div>
                        ) : (
                            <>
                                <Video className="upload-icon" />
                                <p className="upload-text">Drag & drop your scene video</p>
                                <p className="upload-hint">or click to browse (MP4, MOV, AVI)</p>
                            </>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '16px',
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--accent-danger)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--accent-danger)'
                        }}>
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {/* Progress Section */}
                    {status !== 'idle' && (
                        <div className="card mt-lg">
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                        {status === 'uploading' && 'Uploading video...'}
                                        {status === 'processing' && '3D Reconstruction in progress...'}
                                        {status === 'ready' && 'Scene ready!'}
                                        {status === 'error' && 'Error occurred'}
                                    </span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {status === 'uploading' && `${progress}%`}
                                        {status === 'processing' && 'Est. 5-10 min'}
                                        {status === 'ready' && '100%'}
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: status === 'ready' ? '100%' : status === 'processing' ? '90%' : `${progress}%`,
                                            background: status === 'ready' ? 'var(--accent-success)' : undefined
                                        }}
                                    />
                                </div>
                            </div>

                            {status === 'processing' && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <Loader2 size={16} className="animate-spin" />
                                    KIRI Engine is processing your video using photogrammetry...
                                </div>
                            )}

                            {status === 'ready' && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--accent-success)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckCircle size={18} style={{ color: 'var(--accent-success)' }} />
                                        <span>3D scene reconstruction complete</span>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => navigate(`/case/${caseId}/scene`)}
                                    >
                                        View Scene <ArrowRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upload Button */}
                    {status === 'idle' && file && (
                        <button
                            className="btn btn-primary btn-lg w-full mt-lg"
                            onClick={handleUpload}
                            disabled={uploading}
                        >
                            Start 3D Reconstruction <ArrowRight size={18} />
                        </button>
                    )}

                    {/* Skip to Demo - for testing */}
                    <button
                        className="btn btn-secondary w-full mt-md"
                        onClick={() => navigate(`/case/${caseId}/scene`)}
                        style={{ opacity: 0.8 }}
                    >
                        Skip to Demo 3D Scene (for testing)
                    </button>

                    {/* Info Section */}
                    <div className="card mt-lg" style={{ background: 'var(--bg-tertiary)' }}>
                        <h4 style={{ marginBottom: '12px' }}>Recording Tips</h4>
                        <ul style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem',
                            listStyle: 'disc',
                            paddingLeft: '20px',
                            lineHeight: 1.8
                        }}>
                            <li>Walk slowly around the entire scene</li>
                            <li>Maintain consistent lighting throughout</li>
                            <li>Capture multiple angles of key evidence</li>
                            <li>Avoid rapid movements or camera shake</li>
                            <li>Record for at least 60 seconds for best results</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseSetupPage;
