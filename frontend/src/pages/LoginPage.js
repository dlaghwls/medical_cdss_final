// // 유정우가 원상복구함 
// // src/pages/LoginPage.js
// import React, { useState } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import { useNavigate, useLocation, Link } from 'react-router-dom';

// const LoginPage = () => {
//   const [employeeId, setEmployeeId] = useState('');
//   const [password, setPassword] = useState('');
//   const { login, isLoading, authError } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const from = location.state?.from?.pathname || '/dashboard';

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // ▼▼▼ 이 코드를 추가해서 콘솔에 찍히는 값을 확인해주세요. ▼▼▼
//     console.log('로그인 버튼 클릭! 전달되는 employeeId 값:', `'${employeeId}'`);

//     // 만약 employeeId가 비어있으면 아예 요청을 보내지 않도록 막는 방어 코드 (추천)
//     if (!employeeId || employeeId.trim() === '') {
//         alert('사원번호를 입력해주세요.'); // 사용자에게 알림
//         return; // 함수 실행 중단
//     }

//     try {
//       await login(employeeId, password);
//       navigate(from, { replace: true });
//     } catch (err) {
//       console.error("Login failed from LoginPage:", err);
//     }
//   };

//   return (
//     <div className="login-page-container" style={{maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 0 10px rgba(0,0,0,0.1)'}}>
//       <h2 style={{textAlign: 'center', marginBottom: '20px'}}>병원 시스템 로그인</h2>
//       <form onSubmit={handleSubmit}>
//         <div style={{ marginBottom: '15px' }}>
//           <label htmlFor="employeeId" style={{ display: 'block', marginBottom: '5px' }}>사원번호:</label>
//           <input
//             type="text"
//             id="employeeId"
//             value={employeeId}
//             onChange={(e) => setEmployeeId(e.target.value)}
//             placeholder="예: DOC-0001, NUR-0001, TEC-0001"
//             required
//             style={{ width: 'calc(100% - 22px)', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
//           />
//         </div>
//         <div style={{ marginBottom: '20px' }}> {/* 비밀번호 필드 아래 마진 증가 */}
//           <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>비밀번호:</label>
//           <input
//             type="password"
//             id="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             style={{ width: 'calc(100% - 22px)', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
//           />
//         </div>
//         <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', marginBottom: '10px' }}>
//           {isLoading ? '로그인 중...' : '로그인'}
//         </button>
//         {authError && <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{authError}</p>}
//       </form>
//       <div style={{ textAlign: 'center', marginTop: '20px' }}>
//         <p style={{marginBottom: '5px'}}>계정이 없으신가요?</p>
//         <Link to="/signup" style={{ color: '#007bff', textDecoration: 'none' }}>
//           회원가입
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;
// 6월 23일 Frontend 작업 
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styles from '../styles/pages/LoginPage.module.css';

const LoginPage = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  // 'localError' 상태 변수를 여기에 선언합니다. 
  const [localError, setLocalError] = useState(''); 
  const { login, isLoading, authError } = useAuth(); // AuthContext에서 login, authError, isLoading 가져옴
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(''); // 새로운 로그인 시도 전에 로컬 에러 초기화
    console.log('로그인 버튼 클릭! 전달되는 employeeId 값:', `'${employeeId}'`);

    if (!employeeId || employeeId.trim() === '') {
      setLocalError('사원번호를 입력해주세요.'); // alert 대신 setLocalError 사용
      return;
    }

    try {
      // login 함수는 한 번만 호출하도록 정리합니다. 
      const userProfile = await login(employeeId, password); // useAuth의 login 함수 호출
      
      // loginApi 호출 후 AuthContext의 login 함수 반환 값 로그를 강화합니다. 
      console.log("[LoginPage] AuthContext의 login 함수 성공적으로 반환:", userProfile);
      
      // 로그인 성공 시 대시보드로 이동
      navigate(from, { replace: true });

    } catch (err) {
      // AuthContext에서 던져진 에러를 받아서 처리
      console.error("[LoginPage] 로그인 실패 처리:", err);
      // AuthContext의 authError 또는 err.message를 사용하여 사용자에게 표시
      setLocalError(authError || err.message || '로그인에 실패했습니다. 사원번호 또는 비밀번호를 확인해주세요.');
    }
  };
  
  return (
    <div className={styles.loginPageContainer}>
      <h2 className={styles.loginHeader}>병원 시스템 로그인</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="employeeId">사원번호:</label>
          <input
            type="text"
            id="employeeId"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="예: DOC-0001, NUR-0001, TEC-0001"
            required
            className={styles.inputField}
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="password">비밀번호:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.inputField}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={styles.loginButton}
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
        {/* authError와 localError를 모두 표시하도록 합니다.*/}
        {(authError || localError) && (
          <p className={styles.errorMessage}>{authError || localError}</p>
        )}
      </form>
      <div className={styles.signupLinkContainer}>
        <p>계정이 없으신가요?</p>
        <Link to="/signup" className={styles.signupLink}>
          회원가입
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
