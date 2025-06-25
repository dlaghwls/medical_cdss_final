//   2025-06-20 09:25  유정우가 원상복구 
// src/contexts/AuthContext.js

// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { loginApi } from '../services/authService';
// import axios from 'axios'; // apiClient를 직접 사용하기보다, 여기서 설정할 인터셉터를 위해 import
// import { jwtDecode } from 'jwt-decode'; // JWT 토큰을 해독하기 위한 라이브러리
// import { useNavigate } from 'react-router-dom';
// // Axios 클라이언트 인스턴스 (authService.js와 동일한 설정을 사용해도 되지만, 여기서 재정의하여 인터셉터를 추가합니다)
// const apiClient = axios.create({
//   baseURL: 'http://34.64.188.9/api', // 유정우 제발 정신차려 
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null); // 로그인한 사용자 정보 (예: {employee_id: 'DOC-1111', ...})
//   const [loading, setLoading] = useState(true); // 앱 로딩 상태
//   const [authError, setAuthError] = useState(''); // 인증 관련 에러 메시지
//   const navigate = useNavigate(); // 👈 핵심! // 6월 24일
//   useEffect(() => {
//     // 앱이 처음 시작될 때 실행되는 함수
//     // localStorage에 저장된 토큰이 있는지 확인하여, 자동으로 로그인 상태를 복원합니다.
//     const initializeAuth = async () => {
//       const accessToken = localStorage.getItem('accessToken');

//       if (accessToken) {
//         try {
//           const decodedUser = jwtDecode(accessToken);
//           console.log("✅ [AuthContext] 로그인 직후 토큰에서 디코딩된 정보:", decodedUser);
//           // 토큰의 유효기간(exp)을 확인합니다.
//           if (decodedUser.exp * 1000 > Date.now()) {
//             setUser(decodedUser);
//             // 모든 API 요청 헤더에 기본으로 인증 토큰을 추가합니다.
//             apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
//           } else {
//             // 토큰이 만료되었다면 기존 정보를 삭제합니다.
//             localStorage.removeItem('accessToken');
//             localStorage.removeItem('refreshToken');
//           }
//         } catch (e) {
//             console.error("Invalid token found in localStorage", e);
//             localStorage.removeItem('accessToken');
//             localStorage.removeItem('refreshToken');
//         }
//       }
//       setLoading(false);
//     };

//     initializeAuth();
//   }, []);

//   // 유정우 제발 정신차려 로그인만 수정 
//   const login = async (employeeId, password) => {
//   setLoading(true);
//   setAuthError('');
//   try {
//     const decodedUser = await loginApi(employeeId, password); // loginApi가 이미 토큰을 저장하고 decodedUser를 반환
//     setUser(decodedUser); 
//     return decodedUser;
//   } catch (err) {
//     setAuthError(err.message);
//     throw err;
//   } finally {
//     setLoading(false);
//   }
// };

//   const logout = () => {
//     setUser(null);
//     // localStorage에서 토큰을 깨끗하게 삭제합니다.
//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('refreshToken');
//     // API 요청 헤더에서도 인증 정보를 제거합니다.
//     delete apiClient.defaults.headers.common['Authorization'];
//   };

//   const value = {
//     user, // 현재 로그인된 사용자 정보
//     isAuthenticated: !!user, // 로그인 여부 (true/false)
//     isLoading: loading,
//     authError: authError,
//     login,
//     logout,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {/* 초기 로딩 중이 아닐 때만 앱의 나머지 부분을 보여줍니다. */}
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

//6월 24일 작업
// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { loginApi } from '../services/authService';
// import axios from 'axios';
// import { jwtDecode } from 'jwt-decode';

// const apiClient = axios.create({
//   baseURL: 'http://34.64.188.9/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null); // 로그인된 사용자 정보
//   const [loading, setLoading] = useState(true);
//   const [authError, setAuthError] = useState('');
//   const navigate = useNavigate();

//   useEffect(() => {
//     const initializeAuth = async () => {
//       const accessToken = localStorage.getItem('accessToken');

//       if (accessToken) {
//         try {
//           const decodedUser = jwtDecode(accessToken);
//           console.log("✅ [AuthContext] 로그인 직후 디코딩된 정보:", decodedUser);
          
//           if (decodedUser.exp * 1000 > Date.now()) {
//             setUser(decodedUser);
//             apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
//           } else {
//             localStorage.removeItem('accessToken');
//             localStorage.removeItem('refreshToken');
//           }
//         } catch (e) {
//           console.error("Invalid token found in localStorage:", e);
//           localStorage.removeItem('accessToken');
//           localStorage.removeItem('refreshToken');
//         }
//       }
//       setLoading(false);
//     };
//     initializeAuth();
//   }, []);

//   const login = async (employeeId, password) => {
//     setLoading(true);
//     setAuthError('');
//     try {
//       const decodedUser = await loginApi(employeeId, password);
//       setUser(decodedUser);

//       // 🔥 역할별 페이지로 리디렉션
//       if (decodedUser.role === 'DOC') {
//         navigate('/dashboard/doctor');
//       } else if (decodedUser.role === 'NUR') {
//         navigate('/dashboard/nurse');
//       } else if (decodedUser.role === 'TAC') {
//         navigate('/dashboard/technician');
//       } else {
//         navigate('/');
//       }

//       return decodedUser;
//     } catch (err) {
//       setAuthError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('refreshToken');
//     delete apiClient.defaults.headers.common['Authorization'];
//     navigate('/');
//   };

//   const value = {
//     user,
//     isAuthenticated: !!user,
//     isLoading: loading,
//     authError,
//     login,
//     logout,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };



import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginApi } from '../services/authService';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const apiClient = axios.create({
  baseURL: 'http://34.64.188.9/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("App component mounted. Ensuring CSRF token...");
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const decodedUser = jwtDecode(accessToken);
          console.log("✅ [AuthContext] 로그인 직후 토큰 디코딩된 정보:", decodedUser);
          
          if (decodedUser.exp * 1000 > Date.now()) {
            setUser(decodedUser);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } catch (e) {
            console.error("Invalid token found in localStorage", e);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (employeeId, password) => {
    setLoading(true);
    setAuthError('');
    try {
      const decodedUser = await loginApi(employeeId, password);
      setUser(decodedUser);
      return decodedUser;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete apiClient.defaults.headers.common['Authorization'];
  };
  
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading: loading,
    authError,
    login,
    logout,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};