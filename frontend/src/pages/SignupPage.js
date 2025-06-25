import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupApi } from '../services/authService';
import styles from './styles/SignupPage.module.css';

const SignupPage = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [patientUuid, setPatientUuid] = useState('');
  const [showUuidInput, setShowUuidInput] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmployeeIdChange = (e) => {
    const value = e.target.value;
    setEmployeeId(value);
    setShowUuidInput(value.startsWith('PAT-'));
    if (!value.startsWith('PAT-')) setPatientUuid('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!employeeId.match(/^(DOC|NUR|TEC|PAT)-\d{4}$/)) {
      setError('사원번호 형식이 올바르지 않습니다. (예: DOC-0001)');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (showUuidInput && !patientUuid) {
      setError('환자 UUID는 필수입니다.');
      return;
    }

    setLoading(true);
    try {
      let role = 'technician';
      const prefix = employeeId.substring(0, 3);
      if (prefix === 'DOC') role = 'doctor';
      else if (prefix === 'NUR') role = 'nurse';
      else if (prefix === 'PAT') role = 'patient';

      const signupData = {
        employee_id: employeeId,
        password,
        password2: confirmPassword,
        name,
        role,
        ...(showUuidInput ? { patient_uuid: patientUuid } : { department }),
      };

      await signupApi(signupData);
      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      navigate('/login');
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.signupContainer} ${styles.signupSlideIn}`}>
      <h2 className={styles.signupHeader}>회원가입</h2>
      <form onSubmit={handleSubmit} className={styles.signupForm}>
        <div className={styles.signupInputGroup}>
          <label>사원번호:</label>
          <input
            type="text"
            value={employeeId}
            onChange={handleEmployeeIdChange}
            placeholder="DOC-0001, NUR-0001, TEC-0001, PAT-0001"
            required
            className={styles.signupInputField}
          />
        </div>

        <div className={styles.signupInputGroup}>
          <label>이름:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={styles.signupInputField}
          />
        </div>

        {!showUuidInput && (
          <div className={styles.signupInputGroup}>
            <label>부서:</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className={styles.signupInputField}
            />
          </div>
        )}

        {showUuidInput && (
          <div className={styles.signupInputGroup}>
            <label>환자 UUID:</label>
            <input
              type="text"
              value={patientUuid}
              onChange={(e) => setPatientUuid(e.target.value)}
              placeholder="환자 UUID를 입력하세요"
              required
              className={styles.signupInputField}
            />
            <p className={styles.signupUuidHint}>환자 등록 시 발급된 UUID를 입력해주세요.</p>
          </div>
        )}

        <div className={styles.signupInputGroup}>
          <label>비밀번호:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.signupInputField}
          />
        </div>

        <div className={styles.signupInputGroup}>
          <label>비밀번호 확인:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={styles.signupInputField}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.signupSubmitButton}
        >
          {loading ? '가입 처리 중...' : '회원가입'}
        </button>

        {error && <p className={styles.signupErrorMessage}>{error}</p>}
      </form>

      <div className={styles.signupLoginLink}>
        <Link to="/login">이미 계정이 있으신가요? 로그인</Link>
      </div>
    </div>
  );
};

export default SignupPage;
