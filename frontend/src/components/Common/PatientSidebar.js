// src/components/Common/PatientSidebar.js

import React, { useState, useEffect } from 'react';
import { fetchLocalPatients, fetchAndSyncPatients } from '../../services/djangoApiService';
import { registerPatient } from '../../services/djangoApiService';
import { Modal } from './Modal';
import styles from './PatientSidebar.module.css'; // CSS 모듈 임포트

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
        displayName: (selectedPatient.display && selectedPatient.display.includes(' - '))
            ? selectedPatient.display.split(' - ')[1].trim()
            : selectedPatient.display,
        age: calculateAge(selectedPatient.person?.birthdate),
        gender: formatGender(selectedPatient.person?.gender),
        birthdate: selectedPatient.person?.birthdate?.substring(0, 10) || '정보 없음',
        identifier: selectedPatient.identifier ||
                    (selectedPatient.display?.includes(' - ') ? selectedPatient.display.split(' - ')[0] : 'ID 없음')
    } : null;

    return (
        <div className={styles.selectedPatientInfoContainer}>
            <h5 className={styles.selectedPatientInfoHeader}>
                선택한 환자 정보
            </h5>
            {patientInfo ? (
                <div className={styles.patientDetails}>
                    <div className={styles.patientDisplayName}>
                        <span className={styles.patientName}>
                            {patientInfo.displayName}
                            {patientInfo.age !== null && ` (${patientInfo.age}세 / ${patientInfo.gender})`}
                        </span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>생년월일:</span>
                        <span>{patientInfo.birthdate}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>환자번호:</span>
                        <span>{patientInfo.identifier}</span>
                    </div>
                </div>
            ) : (
                <p className={styles.noPatientSelected}>환자 목록에서 환자를 선택해주세요.</p>
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
            setTimeout(() => {
                onClose();
                setSuccessMessage('');
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
        <div className={styles.registrationForm}>
            <h4>새 환자 등록</h4>
            <p className={styles.registrationFormDescription}>필수 정보를 입력하여 새 환자를 등록합니다.</p>
            <form onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                    <div><label>이름:*</label><input type="text" value={givenName} onChange={(e) => setGivenName(e.target.value)} required className={styles.formInput} /></div>
                    <div><label>성:*</label><input type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} required className={styles.formInput} /></div>
                    <div><label>환자 ID:*</label><input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required placeholder="새로운 고유 ID" className={styles.formInput} /></div>
                    <div><label>성별:*</label><select value={gender} onChange={(e) => setGender(e.target.value)} className={styles.formSelect}><option value="M">남</option><option value="F">여</option><option value="O">기타</option></select></div>
                    <div><label>생년월일:*</label><input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} required className={styles.formInput} /></div>
                </div>
                <button type="submit" disabled={loading} className={styles.registerButton}>
                    {loading ? '등록 중...' : '환자 등록'}
                </button>
                {error && <p className={styles.errorMessage}>{error}</p>}
                {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
            </form>
        </div>
    );
};

// --- 3. 환자 등록 모달을 여는 버튼 컴포넌트 ---
const PatientRegistration = ({ onRegistrationSuccess }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <div className={styles.registrationSection}>
            <button
                onClick={() => setIsModalOpen(true)}
                className={styles.openRegistrationModalButton}
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
            // const fetchedPatients 추교상넌할수있어
            const fetchedPatients = responseData.results || [];
            // const isKorean 추교상넌할수있어
            const isKorean = (str) => str && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(str);
            
            fetchedPatients.sort((a, b) => {
                const nameA = a.display_name || '';
                const nameB = b.display_name || '';
                const aIsKorean = isKorean(nameA);
                const bIsKorean = isKorean(nameB);

                if (aIsKorean && !bIsKorean) return -1;
                if (!aIsKorean && bIsKorean) return 1;
                
                return nameA.localeCompare(nameB);
            });
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
        <div className={styles.patientListContainer}>
            <h4>환자 목록</h4>
            <div className={styles.searchSyncSection}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input type="text" placeholder="환자 이름, ID 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput}/>
                    <button type="submit" disabled={loading} className={styles.searchButton}>
                        검색
                    </button>
                </form>
                <button onClick={handleSyncAndRefreshList} disabled={loading} className={styles.syncButton}>
                    {loading ? '동기화 중...' : 'OpenMRS 동기화'}
                </button>
            </div>
            {loading && <p className={styles.loadingMessage}>환자 목록을 불러오는 중...</p>}
            {error && <p className={styles.listErrorMessage}>{error}</p>}
            {!loading && patients.length === 0 && !error && (
                <p className={styles.noPatientsMessage}>표시할 환자가 없거나, 검색 결과가 없습니다.</p>
            )}
            {!loading && !error && patients.length > 0 && (
                <div className={styles.patientListScrollable}>
                    <p className={styles.totalPatientsCount}>총 {totalPatients}명</p>
                    <ul className={styles.patientList}>
                        {patients.map(patient => (
                            <li
                                key={patient.uuid}
                                onClick={() => onPatientSelect && onPatientSelect(patient)}
                                className={styles.patientListItem}
                            >
                                <strong>{patient.display || `환자 (UUID: ${patient.uuid ? patient.uuid.substring(0,8) : 'N/A'})`}</strong>
                                <br/><span className={styles.patientUuid}>UUID: {patient.uuid ? patient.uuid.substring(0,8) + '...' : 'N/A'}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// --- 최종 조립: 메인 환자 사이드바 컴포넌트 ---
export const PatientSidebar = ({ onPatientSelect, onPatientRegistered, refreshPatientListTrigger, style, selectedPatient }) => {
    return (
        <div className={`${styles.patientSidebar} ${style ? style.className : ''}`} style={style}>
            <SelectedPatientInfo selectedPatient={selectedPatient} />
            <PatientRegistration onRegistrationSuccess={onPatientRegistered} />
            <hr className={styles.divider} />
            <OpenMRSPatientList
                refreshTrigger={refreshPatientListTrigger}
                onPatientSelect={onPatientSelect}
            />
        </div>
    );
};

export default PatientSidebar;