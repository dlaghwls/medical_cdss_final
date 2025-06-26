// src/components/Common/PatientSidebar.js

import React, { useState, useEffect } from 'react';
import { fetchLocalPatients, fetchAndSyncPatients } from '../../services/djangoApiService';
import { registerPatient } from '../../services/djangoApiService'; // registerPatient는 Form에서만 사용
import { Modal } from './Modal'; // Modal 컴포넌트 임포트

// 생년월일로 나이를 계산하는 함수
const calculateAge = (birthdateString) => {
    if (!birthdateString) return null;
    const birthDate = new Date(birthdateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// 성별 코드를 텍스트로 변환하는 함수
const formatGender = (genderCode) => {
    if (!genderCode) return '미상';
    if (genderCode.toUpperCase() === 'M') return '남';
    if (genderCode.toUpperCase() === 'F') return '여';
    return '기타';
};

// --- 1. 선택된 환자 정보 컴포넌트 (기존 SinglePatientTester 대체) ---
const SelectedPatientInfo = ({ selectedPatient }) => {

    const patientInfo = selectedPatient ? {
        // [수정] 헬퍼 함수 대신 로직을 직접, 더 단순하게 작성합니다.
        displayName: (selectedPatient.display && selectedPatient.display.includes(' - '))
            ? selectedPatient.display.split(' - ')[1].trim()
            : selectedPatient.display, // ' - '가 없으면 그냥 원래 값을 사용

        age: calculateAge(selectedPatient.person?.birthdate),
        gender: formatGender(selectedPatient.person?.gender),
        birthdate: selectedPatient.person?.birthdate?.substring(0, 10) || '정보 없음',
        identifier: selectedPatient.identifier ||
                    (selectedPatient.display?.includes(' - ') ? selectedPatient.display.split(' - ')[0] : 'ID 없음')
    } : null;

    const infoRowStyle = {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '4px'
    };
    const iconStyle = { marginRight: '8px' };
    const labelStyle = { color: '#666', width: '65px' };

    return (
        <div style={{ border: '1px solid #007bff', padding: '15px', marginBottom: '15px', borderRadius: '5px', backgroundColor: '#f8f9fa' }}>
            <h5 style={{ marginTop: 0, marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #dee2e6' }}>
                선택한 환자 정보
            </h5>
            {patientInfo ? (
                <div style={{ fontSize: '0.9em' }}>
                    <div style={{ ...infoRowStyle, marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.05em' }}>
                            {patientInfo.displayName}
                            {patientInfo.age !== null && ` (${patientInfo.age}세 / ${patientInfo.gender})`}
                        </span>
                    </div>
                    <div style={infoRowStyle}>
                        <span style={labelStyle}>생년월일:</span>
                        <span>{patientInfo.birthdate}</span>
                    </div>
                    <div style={infoRowStyle}>
                        <span style={labelStyle}>환자번호:</span>
                        <span>{patientInfo.identifier}</span>
                    </div>
                </div>
            ) : (
                <p style={{ color: '#6c757d', fontStyle: 'italic', margin: 0, fontSize: '14px' }}>환자 목록에서 환자를 선택해주세요.</p>
            )}
        </div>
    );
};

// --- 2. 환자 등록 폼 (Modal 내부에 들어갈 내용물) ---
const PatientRegistrationForm = ({ onRegistrationSuccess, onClose }) => {
    const [givenName, setGivenName] = useState('');
    const [familyName, setFamilyName] = useState('');
    const [gender, setGender] = useState('M');
    const [birthdate, setBirthdate] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');
        setLoading(true);
        try {
            const patientDataToRegister = { givenName, familyName, gender, birthdate, identifier };
            const registeredPatient = await registerPatient(patientDataToRegister);
            setSuccessMessage(`환자 [${registeredPatient.display}] 등록 성공!`);
            setGivenName(''); setFamilyName(''); setGender('M'); setBirthdate(''); setIdentifier('');
            if (onRegistrationSuccess) {
                onRegistrationSuccess();
            }
            // 성공 메시지를 1.5초간 보여준 후 모달을 닫습니다.
            setTimeout(() => {
                onClose(); 
                setSuccessMessage(''); // 닫힐 때 메시지 초기화
            }, 1500);
        } catch (err) {
            let detailedErrorMessage = `환자 등록 실패: ${err.message || '알 수 없는 오류'}`;
            if (err.response && err.response.data && err.response.data.error) {
                detailedErrorMessage += ` 상세: ${err.response.data.detail || err.response.data.error}`;
            }
            setError(detailedErrorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ fontSize: '0.9em' }}>
            <h4>새 환자 등록</h4>
            <p style={{ fontSize: '0.8em', color: '#666', marginTop: '-5px', marginBottom: '15px' }}>필수 정보를 입력하여 새 환자를 등록합니다.</p>
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    <div><label>이름:*</label><input type="text" value={givenName} onChange={(e) => setGivenName(e.target.value)} required style={{ width: '95%', padding: '4px' }} /></div>
                    <div><label>성:*</label><input type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} required style={{ width: '95%', padding: '4px' }} /></div>
                    <div><label>환자 ID:*</label><input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required placeholder="새로운 고유 ID" style={{ width: '95%', padding: '4px' }} /></div>
                    <div><label>성별:*</label><select value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: '100%', padding: '4px' }}><option value="M">남</option><option value="F">여</option><option value="O">기타</option></select></div>
                    <div><label>생년월일:*</label><input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} required style={{ width: '95%', padding: '4px' }} /></div>
                </div>
                <button type="submit" disabled={loading} style={{ marginTop: '15px', width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.9em' }}>
                    {loading ? '등록 중...' : '환자 등록'}
                </button>
                {error && <p style={{ color: 'red', marginTop: '10px', whiteSpace: 'pre-wrap', fontSize: '0.8em' }}>{error}</p>}
                {successMessage && <p style={{ color: 'green', marginTop: '10px', fontSize: '0.8em' }}>{successMessage}</p>}
            </form>
        </div>
    );
};

// --- 3. 환자 등록 모달을 여는 버튼 컴포넌트 ---
const PatientRegistration = ({ onRegistrationSuccess }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
            <button
                onClick={() => setIsModalOpen(true)}
                style={{ width: '100%', padding: '8px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', fontSize: '0.9em' }}
            >
                + 새 환자 등록
            </button>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <PatientRegistrationForm 
                    onRegistrationSuccess={onRegistrationSuccess} 
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}

// --- 4. 환자 목록 및 검색/동기화 컴포넌트 ---
const OpenMRSPatientList = ({ refreshTrigger, onPatientSelect }) => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [totalPatients, setTotalPatients] = useState(0);

    const loadLocalPatientList = async (currentSearchTerm = '') => {
        setLoading(true);
        setError(null);
        try {
            const responseData = await fetchLocalPatients(currentSearchTerm);
            setPatients(responseData.results || []);
            setTotalPatients(responseData.totalCount || 0);
        } catch (err) {
            setError(`환자 목록 로드 실패: ${err.message || '알 수 없는 오류'}`);
            setPatients([]);
            setTotalPatients(0);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncAndRefreshList = async () => {
        setLoading(true);
        setError(null);
        try {
            const responseData = await fetchAndSyncPatients(searchTerm);
            setPatients(responseData.results || []);
            setTotalPatients(responseData.totalCount || 0);
        } catch (err) {
            setError(`환자 목록 동기화 실패: ${err.message || '알 수 없는 오류'}`);
            setPatients([]);
            setTotalPatients(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLocalPatientList(searchTerm);
    }, [refreshTrigger]);

    const handleSearch = (e) => {
        e.preventDefault();
        loadLocalPatientList(searchTerm);
    };

    return (
        // **변경 시작:** 이 div가 스크롤 가능한 영역이 됩니다.
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <h4>환자 목록</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex' }}>
                    <input type="text" placeholder="환자 이름, ID 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '6px', width: '70%', border: '1px solid #ccc', borderRadius: '3px', fontSize: '0.85rem' }}/>
                    <button type="submit" disabled={loading} style={{ padding: '6px 10px', cursor: loading ? 'not-allowed' : 'pointer', backgroundColor: loading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '3px', fontSize: '0.85rem', marginLeft: '17px' }}>
                        검색
                    </button>
                </form>
                <button onClick={handleSyncAndRefreshList} disabled={loading} style={{ padding: '6px 10px', cursor: loading ? 'not-allowed' : 'pointer', backgroundColor: loading ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '3px', fontSize: '0.85rem'}}>
                    {loading ? '동기화 중...' : 'OpenMRS 동기화'}
                </button>
            </div>
            {loading && <p style={{fontStyle: 'italic', fontSize: '0.8em'}}>환자 목록을 불러오는 중...</p>}
            {error && <p style={{ color: 'red', fontWeight: 'bold', marginTop: '10px', whiteSpace: 'pre-wrap', border: '1px solid red', padding: '8px', borderRadius: '4px', backgroundColor: '#ffebee', fontSize: '0.8em' }}>{error}</p>}
            {!loading && patients.length === 0 && !error && (
                <p style={{marginTop: '10px', fontSize: '0.8em'}}>표시할 환자가 없거나, 검색 결과가 없습니다.</p>
            )}
            {!loading && !error && patients.length > 0 && (
                <div style={{ overflowY: 'auto', flexGrow: 1 }}> {/* **변경:** 이 div가 실제로 스크롤되는 영역입니다. */}
                    <p style={{marginTop: '5px', fontSize: '0.75em', color: '#555'}}>총 {totalPatients}명</p>
                    <ul style={{ listStyleType: 'none', padding: 0, marginTop: '5px' }}>
                        {patients.map(patient => (
                            <li
                                key={patient.uuid}
                                onClick={() => onPatientSelect && onPatientSelect(patient)}
                                style={{
                                    borderBottom: '1px solid #eee', padding: '8px 5px',
                                    transition: 'background-color 0.2s ease-in-out',
                                    cursor: 'pointer',
                                    fontSize: '0.85em'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e9ecef'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <strong>{patient.display || `환자 (UUID: ${patient.uuid ? patient.uuid.substring(0,8) : 'N/A'})`}</strong>
                                <br/><span style={{fontSize: '0.75em', color: '#666'}}>UUID: {patient.uuid ? patient.uuid.substring(0,8) + '...' : 'N/A'}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div> // **변경 끝**
    );
};

// --- 최종 조립: 메인 환자 사이드바 컴포넌트 ---
export const PatientSidebar = ({ onPatientSelect, onPatientRegistered, refreshPatientListTrigger, style, selectedPatient }) => {
    return (
        <div className="patient-sidebar" style={{ padding: '15px', ...style, display: 'flex', flexDirection: 'column', height: '100vh' }}> {/* **변경:** height: '100vh' 또는 부모 컨테이너에 맞게 설정 */}
            <SelectedPatientInfo selectedPatient={selectedPatient} />
            <PatientRegistration onRegistrationSuccess={onPatientRegistered} />
            <hr style={{margin: '20px 0'}} />
            <OpenMRSPatientList
                refreshTrigger={refreshPatientListTrigger}
                onPatientSelect={onPatientSelect}
            />
        </div>
    );
};

export default PatientSidebar;