// /home/shared/medical_cdss/frontend/src/App.js

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ensureCsrfToken } from './services/djangoApiService';

// 페이지 import
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage'; // DashboardPage가 레이아웃을 포함할 것임
import SignupPage from './pages/SignupPage';
import AnnotationPage from './pages/AnnotationPage';
import InformationPage from './pages/information';

// AI
import ComplicationImport from './pages/AI_import/Complication_import';
import DeathImport from './pages/AI_import/Death_import';
import GeneImport from './pages/AI_import/Gene_import';
import SOD2Import from './pages/AI_import/SOD2_import';

// 전역 스타일시트 임포트 (App.css는 이미 존재함)
import './App.css'; 

// 보호된 Route
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div>Loading application...</div>;
    }
    return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

// 비로그인 Route (PublicRoute)
const PublicRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading application...</div>;
    }
    return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

// 최초 로그인 후 Redirect
const AuthRedirector = () => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <div>Loading...</div>;
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

function AppRoutes() {
    return (
        <Routes>
            {/* 비로그인 페이지 */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            
            {/* 소프트웨어 소개 페이지 (로그인 여부와 관계없이 접근 가능) */}
            <Route path="/information" element={<InformationPage />} /> 

            {/* 보호된 페이지 */}
            <Route
                path="/dashboard/annotation/:patientId/:studyId/:seriesId"
                element={<ProtectedRoute><AnnotationPage /></ProtectedRoute>}
            />
            {/* DashboardPage는 이제 사이드바와 MainView를 포함하는 전체 레이아웃을 렌더링합니다. */}
            <Route
                path="/dashboard/*"
                element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
            />

            {/* AI 관련 페이지들 (DashboardPage 내에서 MainView의 content로 렌더링될 것으로 예상) */}
            {/* 이 부분은 DashboardPage 내의 MainView에서 currentViewId에 따라 렌더링되므로,
               별도의 라우트가 필요 없을 수 있습니다.
               만약 각 AI 페이지가 독립적인 URL을 가져야 한다면, DashboardPage 내에서 라우팅 로직을 조정해야 합니다.
               현재 구조에서는 DashboardPage가 MainView를 포함하고, MainView가 currentViewId에 따라
               각 AI 컴포넌트를 렌더링하는 방식이므로, DashboardPage 라우트 하나로 충분합니다.
            */}
            {/* <Route path="/dashboard/complication" element={<ProtectedRoute><ComplicationImport /></ProtectedRoute>} /> */}
            {/* ... 기타 AI 페이지 라우트 ... */}

            {/* Fallback Route: 모든 경로에 매칭되지 않을 경우 초기 로그인 상태에 따라 리다이렉트 */}
            <Route path="*" element={<AuthRedirector />} />
        </Routes>
    );
}

function App() {
    const [isCsrfReady, setIsCsrfReady] = useState(false);

    useEffect(() => {
        const initializeApp = async () => {
            console.log("App component mounted. Ensuring CSRF token...");
            try {
                await ensureCsrfToken();
                console.log("CSRF setup finished.");
            } catch (error) {
                console.error("CSRF setup failed, but continuing app load.", error);
            } finally {
                setIsCsrfReady(true);
            }
        };
        initializeApp();
    }, []);

    if (!isCsrfReady) {
        return <div>Initializing security session...</div>;
    }

    return (
        <AuthProvider>
            <Router>
                <AppRoutes /> {/* 모든 라우팅은 AppRoutes에서 처리 */}
            </Router>
        </AuthProvider>
    );
}

export default App;