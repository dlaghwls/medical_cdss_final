// 6월 23일 Frontend 작업 전 내용
// import React, { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { signupApi } from '../services/authService'; // 수정된 signupApi 임포트

// const SignupPage = () => {
//   const [employeeId, setEmployeeId] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [name, setName] = useState('');
//   const [department, setDepartment] = useState('');
//   const [patientUuid, setPatientUuid] = useState(''); //  UUID 상태 추가
//   const [showUuidInput, setShowUuidInput] = useState(false); //  UUID 입력 칸 표시 여부 상태 추가

//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();


//   const handleEmployeeIdChange = (e) => {
//     const value = e.target.value;
//     setEmployeeId(value);

//     // 'PAT-'으로 시작하는지 확인하여 UUID 입력 칸 표시 여부 결정
//     if (value.startsWith('PAT-')) {
//       setShowUuidInput(true);
//     } else {
//       setShowUuidInput(false);
//       setPatientUuid(''); // 'PAT-'이 아니면 UUID 값 초기화
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(''); // 이전 에러 메시지 초기화

//     // ✨ 사원번호 유효성 검사 (기존 직원 + PAT- 추가)
//     if (!employeeId.match(/^(DOC-|NUR-|TEC-)\d{4}$/) && !employeeId.match(/^PAT-\d{4}$/)) {
//         setError('사원번호 형식이 올바르지 않습니다. (예: DOC-0001, NUR-0001, TEC-0001, PAT-0001)');
//         return;
//     }

//     if (password !== confirmPassword) {
//       setError('비밀번호가 일치하지 않습니다.');
//       return;
//     }
    
//     //  환자 회원가입 시 UUID 필수로 입력받기
//     if (showUuidInput && !patientUuid) {
//         setError('환자 회원가입 시 UUID는 필수입니다.');
//         return;
//     }

//     setLoading(true);

//     try {
//       const signupData = {
//         employee_id: employeeId,
//         password: password,
//         password2: confirmPassword,
//         name: name,
//       };

//       //  'PAT-'으로 시작하는 사원번호일 경우에만 patient_uuid 추가
//       if (showUuidInput) {
//         signupData.patient_uuid = patientUuid;
//       } else {
//         // 직원의 경우에만 department 추가 (환자는 부서 없음)
//         signupData.department = department; 
//       }

//       await signupApi(signupData); 
//       alert('회원가입이 완료되었습니다. 로그인해주세요.');
//       navigate('/login');

//     } catch (err) {
//       setError(err.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{maxWidth: '450px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 0 10px rgba(0,0,0,0.1)'}}>
//       <h2 style={{textAlign: 'center', marginBottom: '20px'}}>회원가입</h2>
//       <form onSubmit={handleSubmit}>
//         <div style={{ marginBottom: '10px' }}>
//           <label>사원번호:</label>
//           {/*  사원번호 입력 핸들러 변경 */}
//           <input 
//             type="text" 
//             value={employeeId} 
//             onChange={handleEmployeeIdChange} 
//             placeholder="DOC-0001, NUR-0001, TEC-0001, PAT-0001" 
//             required 
//             style={{width: 'calc(100% - 22px)', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}} 
//           />
//         </div>
//         <div style={{ marginBottom: '10px' }}>
//           <label>이름:</label>
//           <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{width: 'calc(100% - 22px)', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}} />
//         </div>
        
//         {/*  부서 입력 필드 (PAT-이 아닐 때만 표시) */}
//         {!showUuidInput && (
//           <div style={{ marginBottom: '10px' }}>
//             <label>부서:</label>
//             <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required={!showUuidInput} style={{width: 'calc(100% - 22px)', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}} />
//           </div>
//         )}

//         {/*  UUID 입력 칸 (조건부 렌더링) */}
//         {showUuidInput && (
//           <div style={{ marginBottom: '10px' }}>
//             <label>환자 UUID:</label>
//             <input 
//               type="text" 
//               value={patientUuid} 
//               onChange={(e) => setPatientUuid(e.target.value)} 
//               placeholder="환자 UUID를 입력하세요" 
//               required={showUuidInput} // PAT-일 경우 필수
//               style={{width: 'calc(100% - 22px)', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}} 
//             />
//             <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
//               환자 등록 시 발급된 UUID를 입력해주세요.
//             </p>
//           </div>
//         )}

//         <div style={{ marginBottom: '10px' }}>
//           <label>비밀번호:</label>
//           <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{width: 'calc(100% - 22px)', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}} />
//         </div>
//         <div style={{ marginBottom: '15px' }}>
//           <label>비밀번호 확인:</label>
//           <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{width: 'calc(100% - 22px)', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}} />
//         </div>
//         <button type="submit" disabled={loading} style={{width: '100%', padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px'}}>
//           {loading ? '가입 처리 중...' : '회원가입'}
//         </button>
//         {error && <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{error}</p>}
//       </form>
//       <div style={{ textAlign: 'center', marginTop: '20px' }}>
//         <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
//           이미 계정이 있으신가요? 로그인
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default SignupPage;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupApi } from '../services/authService';
import styles from '../styles/pages/SignupPage.module.css';

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

    // 사원번호 접두사에 따라 UUID 입력 필드 표시 여부 결정
    if (value.startsWith('PAT-')) {
      setShowUuidInput(true);
    } else {
      setShowUuidInput(false);
      setPatientUuid(''); // PAT-가 아니면 UUID 필드 초기화
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 사원번호 형식 유효성 검사
    if (!employeeId.match(/^(DOC|NUR|TEC|PAT)-\d{4}$/)) {
      setError('사원번호 형식이 올바르지 않습니다. (예: DOC-0001, NUR-0001, TEC-0001, PAT-0001)');
      return;
    }

    // 비밀번호 일치 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 환자 회원가입 시 UUID 필수 여부 확인
    if (showUuidInput && !patientUuid) {
      setError('환자 회원가입 시 UUID는 필수입니다.');
      return;
    }

    setLoading(true);

    try {
      let role = 'tec'; // 기본 역할 설정 (예상치 못한 접두사 대비)

      // ▼▼▼▼▼ 사원번호 접두사에 따라 role 결정 ▼▼▼▼▼
      const prefix = employeeId.substring(0, 3); // 앞 3글자 추출 (DOC, NUR, TEC, PAT)
      switch (prefix) {
        case 'DOC':
          role = 'doctor';
          break;
        case 'NUR':
          role = 'nurse';
          break;
        case 'TEC':
          role = 'technician';
          break;
        case 'PAT':
          role = 'patient';
          break;
        default:
          role = 'tec'; // 위 4가지 외의 경우
      }
      // ▲▲▲▲▲ 여기까지 추가/수정합니다. ▲▲▲▲▲

      const signupData = {
        employee_id: employeeId,
        password: password,
        password2: confirmPassword,
        name: name,
        role: role, // ▼▼▼▼▼ 결정된 role 필드를 signupData에 추가합니다! ▼▼▼▼▼
      };

      // UUID 입력 필드가 표시될 때 (PAT- 사원번호) patient_uuid 추가
      if (showUuidInput) {
        signupData.patient_uuid = patientUuid;
      } else { // 그 외의 경우 (DOC-, NUR-, TEC-), department 추가
        signupData.department = department;
      }

      await signupApi(signupData);
      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      navigate('/login');
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <h2 className={styles.header}>회원가입</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label>사원번호:</label>
          <input
            type="text"
            value={employeeId}
            onChange={handleEmployeeIdChange}
            placeholder="DOC-0001, NUR-0001, TEC-0001, PAT-0001"
            required
            className={styles.inputField}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>이름:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={styles.inputField}
          />
        </div>

        {/* UUID 입력 필드가 표시되지 않을 때만 부서 필드를 보여줌 */}
        {!showUuidInput && (
          <div className={styles.inputGroup}>
            <label>부서:</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required={!showUuidInput} // showUuidInput이 false일 때(즉, 환자가 아닐 때)만 필수
              className={styles.inputField}
            />
          </div>
        )}

        {/* UUID 입력 필드가 표시될 때만 (PAT- 사원번호) 환자 UUID 입력 필드 보여줌 */}
        {showUuidInput && (
          <div className={styles.inputGroup}>
            <label>환자 UUID:</label>
            <input
              type="text"
              value={patientUuid}
              onChange={(e) => setPatientUuid(e.target.value)}
              placeholder="환자 UUID를 입력하세요"
              required={showUuidInput} // showUuidInput이 true일 때(즉, 환자일 때) 필수
              className={styles.inputField}
            />
            <p className={styles.uuidHint}>
              환자 등록 시 발급된 UUID를 입력해주세요.
            </p>
          </div>
        )}

        <div className={styles.inputGroup}>
          <label>비밀번호:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.inputField}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>비밀번호 확인:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={styles.inputField}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? '가입 처리 중...' : '회원가입'}
        </button>

        {error && (
          <p className={styles.errorMessage}>{error}</p>
        )}
      </form>
      <div className={styles.loginLink}>
        <Link to="/login">이미 계정이 있으신가요? 로그인</Link>
      </div>
    </div>
  );
};

export default SignupPage;