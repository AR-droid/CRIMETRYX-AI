import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CaseSetupPage from './pages/CaseSetupPage';
import SceneViewerPage from './pages/SceneViewerPage';
import WorkflowCanvasPage from './pages/WorkflowCanvasPage';
import ReportPage from './pages/ReportPage';
import PredictionsPage from './pages/PredictionsPage';
import NetworkPage from './pages/NetworkPage';

// Context for authentication
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('crimetryx_user');
        return saved ? JSON.parse(saved) : null;
    });

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('crimetryx_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('crimetryx_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            <Router>
                <div className="app-container">
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <DashboardPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <DashboardPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/predictions"
                            element={
                                <ProtectedRoute>
                                    <PredictionsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/network"
                            element={
                                <ProtectedRoute>
                                    <NetworkPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/case/:caseId/setup"
                            element={
                                <ProtectedRoute>
                                    <CaseSetupPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/case/:caseId/scene"
                            element={
                                <ProtectedRoute>
                                    <SceneViewerPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/case/:caseId/workflow"
                            element={
                                <ProtectedRoute>
                                    <WorkflowCanvasPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/case/:caseId/report"
                            element={
                                <ProtectedRoute>
                                    <ReportPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </Router>
        </AuthContext.Provider>
    );
}

export default App;

