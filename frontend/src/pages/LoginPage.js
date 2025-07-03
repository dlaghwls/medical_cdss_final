// /home/shared/medical_cdss/frontend/src/pages/LoginPage.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styles from './styles/LoginPage.module.css'; 

const LoginPage = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [userProfileData, setUserProfileData] = useState(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const { login, isLoading, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    let fadeOutTimer;
    let navigateTimer;

    if (showSuccess && userProfileData) {
      fadeOutTimer = setTimeout(() => {
        setIsFadingOut(true); 
      }, 4500); 

      navigateTimer = setTimeout(() => {
        navigate(from, { replace: true }); 
      }, 5000); 
    }

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(navigateTimer);
    };
  }, [showSuccess, userProfileData, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(''); 
    
    if (!employeeId || employeeId.trim() === '') {
      setLocalError('사원번호를 입력해주세요.');
      return;
    }
    if (!password || password.trim() === '') {
      setLocalError('비밀번호를 입력해주세요.');
      return;
    }

    try {
      const userProfile = await login(employeeId, password); 
      
      console.log("[LoginPage] AuthContext의 login 함수 성공적으로 반환된 사용자 프로필:", userProfile);

      if (userProfile && userProfile.name && userProfile.employee_id && userProfile.department) {
        setUserProfileData(userProfile);
        setShowSuccess(true); 
      } else {
        setLocalError('로그인 성공했지만, 사용자 프로필 정보가 불완전합니다. 개발자 도구 콘솔을 확인해주세요.');
        console.error("User profile data incomplete or incorrect structure:", userProfile);
      }

    } catch (err) {
      console.error("[LoginPage] 로그인 실패 처리:", err);
      setLocalError(authError || err.message || '로그인에 실패했습니다. 사원번호 또는 비밀번호를 확인해주세요.');
    }
  };

  return (
    <div className={styles.loginPageContainer}>
      {/* 모든 로그인 관련 내용을 담을 단일 흰색 박스 */}
      <div className={styles.loginBox}>
        {/* StrokeCare+ 로고를 이 박스 안에 포함 */}
        <div className={styles.strokeCarePlusLogo}>StrokeCare+</div>

        {showSuccess && userProfileData ? (
          // 로그인 성공 시 보여줄 메시지 박스 (loginBox 내부에 위치)
          <div className={`${styles.successMessageBox} ${isFadingOut ? styles['fade-out'] : ''}`}>
            <h2 className={styles.welcomeText}>{userProfileData.name}님, 환영합니다</h2>
            <p className={styles.userInfo}>사원번호: {userProfileData.employee_id}</p>
            <p className={styles.userInfo}>소속: {userProfileData.department}</p>
            <p className={styles.infoDescription}>
              이 흰색 박스는 로그인 성공 시 표시됩니다. 로그인 시 발급되는 토큰이나 그런 정보를 받아서 로그인하면 이렇게 뜹니다. 그리고 5초 뒤에 페이드아웃 되면서 화면이 넘어갑니다.
            </p>
          </div>
        ) : (
          // 로그인 폼 (loginBox 내부에 위치)
          <>
            <h2 className={styles.loginHeader}>로그인</h2>
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
            <div className={styles.informationLinkContainer}>
              <Link to="/information" className={styles.informationLink}>
                 StrokeCare+ 소개
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;