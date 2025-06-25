// // frontend/src/App.js
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// import { AuthProvider, useAuth } from './contexts/AuthContext';
// import LoginPage from './pages/LoginPage';
// import DashboardPage from './pages/DashboardPage';
// import SignupPage from './pages/SignupPage'; // SignupPage 임포트
// import AnnotationPage from './pages/AnnotationPage'; // ★★★ AnnotationPage 임포트 추가 ★★★

// // 로그인한 사용자만 접근 가능한 라우트
// const ProtectedRoute = ({ children }) => {
//   const { isAuthenticated, isLoading } = useAuth();
//   const location = useLocation();

//   if (isLoading) {
//     return <div>Loading application...</div>;
//   }

//   return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
// };

// // 로그인하지 않은 사용자만 접근 가능한 라우트
// const PublicRoute = ({ children }) => {
//   const { isAuthenticated, isLoading } = useAuth();

//   if (isLoading) {
//     return <div>Loading application...</div>;
//   }
//   return !isAuthenticated ? children : <Navigate to="/dashboard" />;
// };

// // 앱 시작 시 적절한 페이지로 리디렉션하는 컴포넌트
// const AuthRedirector = () => {
//   const { isAuthenticated, isLoading } = useAuth();
//   if (isLoading) return <div>Loading...</div>;
//   return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
// };


// function AppRoutes() {
//   return (
//     <Routes>
//       <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
//       <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} /> {/* 회원가입 라우트 추가 */}
//       <Route 
//         path="/dashboard/annotation/:patientId/:studyId/:seriesId" // ★★★ AnnotationPage 라우트 추가 ★★★
//         element={
//           <ProtectedRoute>
//             <AnnotationPage />
//           </ProtectedRoute>
//         } 
//       />
//       <Route
//         path="/dashboard/*"
//         element={
//           <ProtectedRoute>
//             <DashboardPage />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="*"
//         element={
//           <AuthRedirector />
//         }
//       />
//     </Routes>
//   );
// }

// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <div className="App"> {/* div className="App" 태그 추가 (로컬과 동일하게) */}
//           <AppRoutes />
//         </div>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;

// 6월 24일 작업 전 내용
// frontend/src/App.js
// import React, { useEffect, useState } from 'react'; // <--- useState를 import 합니다.
// import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// import { AuthProvider, useAuth } from './contexts/AuthContext';
// import LoginPage from './pages/LoginPage';
// import DashboardPage from './pages/DashboardPage';
// import SignupPage from './pages/SignupPage';
// import AnnotationPage from './pages/AnnotationPage';
// import { ensureCsrfToken } from './services/djangoApiService'; // 새로 추가한 함수를 import 합니다.

// // 로그인한 사용자만 접근 가능한 라우트
// const ProtectedRoute = ({ children }) => {
//     const { isAuthenticated, isLoading } = useAuth();
//     const location = useLocation();

//     if (isLoading) {
//         return <div>Loading application...</div>;
//     }

//     return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
// };

// // 로그인하지 않은 사용자만 접근 가능한 라우트
// const PublicRoute = ({ children }) => {
//     const { isAuthenticated, isLoading } = useAuth();

//     if (isLoading) {
//         return <div>Loading application...</div>;
//     }
//     return !isAuthenticated ? children : <Navigate to="/dashboard" />;
// };

// // 앱 시작 시 적절한 페이지로 리디렉션하는 컴포넌트
// const AuthRedirector = () => {
//     const { isAuthenticated, isLoading } = useAuth();
//     if (isLoading) return <div>Loading...</div>;
//     return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
// };


// function AppRoutes() {
//     return (
//         <Routes>
//             <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
//             <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
//             <Route
//                 path="/dashboard/annotation/:patientId/:studyId/:seriesId"
//                 element={
//                     <ProtectedRoute>
//                         <AnnotationPage />
//                     </ProtectedRoute>
//                 }
//             />
//             <Route
//                 path="/dashboard/*"
//                 element={
//                     <ProtectedRoute>
//                         <DashboardPage />
//                     </ProtectedRoute>
//                 }
//             />
//             <Route
//                 path="*"
//                 element={
//                     <AuthRedirector />
//                 }
//             />   
//             <Route path="/dashboard/doctor" element={<DoctorDashboard />} /> 
//             <Route path="/dashboard/nurse" element={<NurseDashboard />} />
//             <Route path="/dashboard/technician" element={<TechnicianDashboard />} />
//         </Routes>
//     );
// }

// function App() {
//     // ★★★ CSRF 토큰이 준비되었는지 확인하는 상태 추가 ★★★
//     const [isCsrfReady, setIsCsrfReady] = useState(false);

//     // 앱이 처음 시작될 때 CSRF 토큰을 받아오는 함수를 호출합니다.
//     useEffect(() => {
//         const initializeApp = async () => {
//             console.log("App component mounted. Ensuring CSRF token...");
//             try {
//                 // await를 사용해 토큰 요청이 완료될 때까지 기다립니다.
//                 await ensureCsrfToken();
//                 console.log("CSRF setup finished.");
//             } catch (error) {
//                 console.error("CSRF setup failed, but continuing app load.", error);
//             } finally {
//                 // 성공하든 실패하든, CSRF 준비 상태를 true로 바꿔 앱 렌더링을 시작합니다.
//                 setIsCsrfReady(true);
//             }
//         };

//         initializeApp();
//     }, []); // 빈 배열 []을 전달하여, 앱이 최초로 렌더링될 때 딱 한 번만 실행되도록 합니다.


//     // ★★★ CSRF 토큰이 준비되기 전에는 로딩 화면을 보여줍니다. ★★★
//     if (!isCsrfReady) {
//         return <div>Initializing security session...</div>;
//     }

//     return (
//         <AuthProvider>
//             <Router>
//                 <div className="App">
//                     <AppRoutes />
//                 </div>
//             </Router>
//         </AuthProvider>
//     );
// }

// export default App;

//6월 24일 작업 내용
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ensureCsrfToken } from './services/djangoApiService';

// 페이지 import
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SignupPage from './pages/SignupPage';
import AnnotationPage from './pages/AnnotationPage';

// AI
import ComplicationImport from './pages/AI_import/Complication_import';
import DeathImport from './pages/AI_import/Death_import';
import GeneImport from './pages/AI_import/Gene_import';
import SOD2Import from './pages/AI_import/SOD2_import';

// 역할별 페이지 import
// import DoctorDashboard from './components/Doctor/DoctorDashboard';
// import NurseDashboard from './components/Nurse/NurseDashboard';
// import TechnicianDashboard from './components/Technician/TechnicianDashboard';
// import GeneticsUploadPage from './components/Technician/GeneticsUpload';
// import LabInputPage from './components/Nurse/LabInput';
// 보호된 Route
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div>Loading application...</div>;
    }
    return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

// 비로그인 Route
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

            {/* 보호된 페이지 */}
            <Route
                path="/dashboard/annotation/:patientId/:studyId/:seriesId"
                element={<ProtectedRoute><AnnotationPage /></ProtectedRoute>}
            />
            <Route
                path="/dashboard/*"
                element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
            />

            {/* 역할별 대시보드 */}
            {/* <Route path="/dashboard/doctor" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/nurse" element={<ProtectedRoute><NurseDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/technician" element={<ProtectedRoute><TechnicianDashboard /></ProtectedRoute>} /> */}

            {/* 신규 페이지 */}
            {/* <Route path="/dashboard/genetics" element={<ProtectedRoute><GeneticsUploadPage /></ProtectedRoute>} />
            <Route path="/dashboard/lab" element={<ProtectedRoute><LabInputPage /></ProtectedRoute>} /> */}

            {/* Fallback Route */}
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
                <div className="App">
                    <AppRoutes />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;