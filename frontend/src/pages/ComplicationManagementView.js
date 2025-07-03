// frontend/src/pages/ComplicationManagementView.js
import React, { useState, useEffect } from 'react';
import aiService from '../services/aiService';
import { ComplicationHistoryView } from '../components/AI_result/Complication_history_view';

const ComplicationManagementView = ({ selectedPatient }) => {
    const [activeTab, setActiveTab] = useState('input'); // 'input', 'predict', 'result'
    const [loading, setLoading] = useState(false);
    const [predicting, setPredicting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [predictionResults, setPredictionResults] = useState(null);

    // 기존 합병증 정보
    const [complications, setComplications] = useState({
        sepsis: false,
        respiratory_failure: false,
        deep_vein_thrombosis: false,
        pulmonary_embolism: false,
        urinary_tract_infection: false,
        gastrointestinal_bleeding: false,
    });

    // 현재 투약 정보
    const [medications, setMedications] = useState({
        anticoagulant_flag: false,
        antiplatelet_flag: false,
        thrombolytic_flag: false,
        antihypertensive_flag: false,
        statin_flag: false,
        antibiotic_flag: false,
        vasopressor_flag: false,
    });

    // 활력징후 (예측용)
    const [vitalSigns, setVitalSigns] = useState({
        heart_rate: '',
        systolic_bp: '',
        diastolic_bp: '',
        temperature: '',
        respiratory_rate: '',
        oxygen_saturation: ''
    });

    // 혈액검사 (예측용)
    const [labResults, setLabResults] = useState({
        wbc: '',
        hemoglobin: '',
        creatinine: '',
        bun: '',
        glucose: '',
        sodium: '',
        potassium: ''
    });

    const [notes, setNotes] = useState('');
    const [recordedAt, setRecordedAt] = useState('');

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

    // 환자 정보 추출 함수
    const getPatientInfo = (selectedPatient) => {
        if (!selectedPatient) return { age: null, gender: null };

        console.log('선택된 환자 정보:', selectedPatient); // 디버깅용

        // 나이 계산
        let age = null;
        if (selectedPatient.person?.birthdate) {
            age = calculateAge(selectedPatient.person.birthdate);
            console.log('생년월일에서 계산된 나이:', age);
        } else if (selectedPatient.age) {
            age = parseInt(selectedPatient.age);
            console.log('직접 추출된 나이:', age);
        }

        // 성별 추출
        let gender = null;
        if (selectedPatient.person?.gender) {
            const genderValue = selectedPatient.person.gender.toString().toUpperCase();
            if (genderValue === 'M' || genderValue === 'MALE') {
                gender = 'M';
            } else if (genderValue === 'F' || genderValue === 'FEMALE') {
                gender = 'F';
            }
            console.log('person.gender에서 추출된 성별:', gender);
        } else if (selectedPatient.gender) {
            gender = selectedPatient.gender.toString().toUpperCase();
            console.log('직접 추출된 성별:', gender);
        }

        console.log('최종 환자 정보:', { age, gender });
        return { age, gender };
    };

    // 초기화
    useEffect(() => {
        const now = new Date();
        const formattedDateTime = now.toISOString().slice(0, 16);
        setRecordedAt(formattedDateTime);
    }, []);

    // 이벤트 핸들러
    const handleComplicationChange = (e) => {
        setComplications({
            ...complications,
            [e.target.name]: e.target.checked
        });
    };

    const handleMedicationChange = (e) => {
        setMedications({
            ...medications,
            [e.target.name]: e.target.checked
        });
    };

    const handleVitalSignChange = (e) => {
        setVitalSigns({
            ...vitalSigns,
            [e.target.name]: e.target.value
        });
    };

    const handleLabResultChange = (e) => {
        setLabResults({
            ...labResults,
            [e.target.name]: e.target.value
        });
    };

    // 데이터 등록 함수
    const handleDataSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');
        setLoading(true);

        if (!selectedPatient || !selectedPatient.uuid) {
            setError("환자가 선택되지 않았습니다.");
            setLoading(false);
            return;
        }

        const submissionData = {
            patient_uuid: selectedPatient.uuid,
            complications,
            medications,
            notes,
            recorded_at: recordedAt,
        };

        try {
            await aiService.registerComplicationsAndMedications(submissionData);
            setSuccessMessage('합병증 및 투약 정보가 성공적으로 기록되었습니다.');

            // 폼 초기화
            setComplications({
                sepsis: false,
                respiratory_failure: false,
                deep_vein_thrombosis: false,
                pulmonary_embolism: false,
                urinary_tract_infection: false,
                gastrointestinal_bleeding: false
            });
            setMedications({
                anticoagulant_flag: false,
                antiplatelet_flag: false,
                thrombolytic_flag: false,
                antihypertensive_flag: false,
                statin_flag: false,
                antibiotic_flag: false,
                vasopressor_flag: false
            });
            setNotes('');

            // 예측 탭으로 이동
            setActiveTab('predict');

        } catch (err) {
            setError(`기록 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
        }
    };

    // 예측 실행 함수
    const handlePredictionSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setPredicting(true);

        if (!selectedPatient || !selectedPatient.uuid) {
            setError("환자가 선택되지 않았습니다.");
            setPredicting(false);
            return;
        }

        // 환자 정보 추출
        const patientInfo = getPatientInfo(selectedPatient);

        // 환자 정보 검증
        if (!patientInfo.age) {
            setError("선택된 환자의 나이 정보가 없습니다. 환자 정보를 확인해주세요.");
            setPredicting(false);
            return;
        }

        if (!patientInfo.gender) {
            setError("선택된 환자의 성별 정보가 없습니다. 환자 정보를 확인해주세요.");
            setPredicting(false);
            return;
        }

        // 예측용 데이터 구성 (실제 환자 정보 사용)
        const predictionData = {
            patient_uuid: selectedPatient.uuid,
            age: patientInfo.age,
            gender: patientInfo.gender,
            vital_signs: vitalSigns,
            lab_results: labResults,
            complications,
            medications
        };

        try {
            console.log('합병증 예측 요청 데이터:', predictionData);
            const results = await aiService.predictComplications(predictionData);
            console.log('합병증 예측 결과:', results);

            setPredictionResults(results);
            setActiveTab('result');

        } catch (err) {
            setError(`예측 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setPredicting(false);
        }
    };

    // 스타일 함수
    const tabStyle = (isActive) => ({
        padding: '12px 20px',
        marginRight: '5px',
        cursor: 'pointer',
        border: 'none',
        backgroundColor: isActive ? '#007bff' : '#f8f9fa',
        color: isActive ? 'white' : '#495057',
        borderRadius: '8px 8px 0 0',
        fontWeight: isActive ? 'bold' : 'normal',
        fontSize: '14px',
        transition: 'all 0.2s ease-in-out',
        border: isActive ? '2px solid #007bff' : '2px solid #dee2e6',
        borderBottom: isActive ? '2px solid #007bff' : '2px solid #dee2e6'
    });

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>합병증 예측 시스템</h2>

            {/* 환자 정보 표시 */}
            {selectedPatient ? (
                (() => {
                    const patientInfo = getPatientInfo(selectedPatient);
                    return (
                        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 10px 0' }}>대상 환자: {selectedPatient.display}</h4>
                            <p style={{ margin: '0', color: '#666' }}>
                                나이: {patientInfo.age || '정보 없음'}세 |
                                성별: {patientInfo.gender === 'M' ? '남성' : patientInfo.gender === 'F' ? '여성' : '정보 없음'}
                            </p>
                        </div>
                    );
                })()
            ) : (
                <div style={{
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    <h4>환자를 선택해주세요</h4>
                    <p>왼쪽 사이드바에서 환자를 선택하면 합병증 예측을 진행할 수 있습니다.</p>
                </div>
            )}

            {/* 탭 네비게이션 */}
            <div style={{ borderBottom: '2px solid #dee2e6', marginBottom: '20px' }}>
                <button style={tabStyle(activeTab === 'input')} onClick={() => setActiveTab('input')}>
                    데이터 입력
                </button>
                <button style={tabStyle(activeTab === 'predict')} onClick={() => setActiveTab('predict')}>
                    예측 실행
                </button>
                <button style={tabStyle(activeTab === 'result')} onClick={() => setActiveTab('result')}>
                    결과 보기
                </button>
                <button style={tabStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>
                    투약 기록
                </button>
            </div>

            {/* 오류 및 성공 메시지 */}
            {error && (
                <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #f5c6cb'
                }}>
                    <strong>오류:</strong> {error}
                </div>
            )}

            {successMessage && (
                <div style={{
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #c3e6cb'
                }}>
                    <strong>성공:</strong> {successMessage}
                </div>
            )}

            {/* 탭 컨텐츠 */}
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '0 8px 8px 8px',
                minHeight: '500px'
            }}>
                {/* 데이터 입력 탭 */}
                {activeTab === 'input' && (
                    <form onSubmit={handleDataSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            {/* 기존 합병증 */}
                            <div>
                                <h4 style={{ marginBottom: '15px', color: '#333' }}>기존 합병증</h4>
                                {[
                                    { key: 'sepsis', label: 'Sepsis' },
                                    { key: 'respiratory_failure', label: 'Respiratory Failure' },
                                    { key: 'deep_vein_thrombosis', label: 'Deep Vein Thrombosis' },
                                    { key: 'pulmonary_embolism', label: 'Pulmonary Embolism' },
                                    { key: 'urinary_tract_infection', label: 'Urinary Tract Infection' },
                                    { key: 'gastrointestinal_bleeding', label: 'Gastrointestinal Bleeding' }
                                ].map(item => (
                                    <div key={item.key} style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                name={item.key}
                                                checked={complications[item.key]}
                                                onChange={handleComplicationChange}
                                                style={{ marginRight: '8px' }}
                                            />
                                            {item.label}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {/* 현재 투약 정보 */}
                            <div>
                                <h4 style={{ marginBottom: '15px', color: '#333' }}>현재 투약 정보</h4>
                                {[
                                    { key: 'anticoagulant_flag', label: 'Anticoagulant' },
                                    { key: 'antiplatelet_flag', label: 'Antiplatelet' },
                                    { key: 'thrombolytic_flag', label: 'Thrombolytic' },
                                    { key: 'antihypertensive_flag', label: 'Antihypertensive' },
                                    { key: 'statin_flag', label: 'Statin' },
                                    { key: 'antibiotic_flag', label: 'Antibiotic' },
                                    { key: 'vasopressor_flag', label: 'Vasopressor' }
                                ].map(item => (
                                    <div key={item.key} style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                name={item.key}
                                                checked={medications[item.key]}
                                                onChange={handleMedicationChange}
                                                style={{ marginRight: '8px' }}
                                            />
                                            {item.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 기록 일시 */}
                        <div style={{ marginTop: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                기록 일시/시간:
                            </label>
                            <input
                                type="datetime-local"
                                value={recordedAt}
                                onChange={e => setRecordedAt(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        {/* 비고 */}
                        <div style={{ marginTop: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                비고:
                            </label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="추가 정보나 특이사항을 입력하세요"
                                style={{
                                    width: '100%',
                                    height: '80px',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: '20px',
                                backgroundColor: loading ? '#6c757d' : '#007bff',
                                color: 'white',
                                padding: '12px 24px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            {loading ? '저장 중...' : '데이터 저장'}
                        </button>
                    </form>
                )}

                {/* 예측 실행 탭 */}
                {activeTab === 'predict' && (
                    <form onSubmit={handlePredictionSubmit}>
                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ color: '#333', marginBottom: '15px' }}>예측을 위한 추가 정보</h4>
                            <p style={{ color: '#666', marginBottom: '20px' }}>
                                {(() => {
                                    const patientInfo = getPatientInfo(selectedPatient);
                                    return `정확한 예측을 위해 현재 활력징후와 검사결과를 입력해주세요. 
                                    환자의 나이(${patientInfo.age || '정보없음'})와 성별(${patientInfo.gender === 'M' ? '남성' : patientInfo.gender === 'F' ? '여성' : '정보없음'})은 자동으로 적용됩니다.`;
                                })()}
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            {/* 활력 징후 */}
                            <div>
                                <h5 style={{ color: '#007bff', marginBottom: '15px' }}>핵심 활력징후 (필수)</h5>
                                <div style={{ display: 'grid', gap: '15px' }}>
                                    <div>
                                        <label>심박수 (60-100):</label>
                                        <input
                                            type="number"
                                            name="heart_rate"
                                            value={vitalSigns.heart_rate}
                                            onChange={handleVitalSignChange}
                                            placeholder="예: 80"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label>수축기혈압 (90-140):</label>
                                        <input
                                            type="number"
                                            name="systolic_bp"
                                            value={vitalSigns.systolic_bp}
                                            onChange={handleVitalSignChange}
                                            placeholder="예: 120"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label>이완기혈압 (60-90):</label>
                                        <input
                                            type="number"
                                            name="diastolic_bp"
                                            value={vitalSigns.diastolic_bp}
                                            onChange={handleVitalSignChange}
                                            placeholder="예: 80"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label>체온 (36-37.5):</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            name="temperature"
                                            value={vitalSigns.temperature}
                                            onChange={handleVitalSignChange}
                                            placeholder="예: 36.5"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label>산소포화도 (95-100%):</label>
                                        <input
                                            type="number"
                                            name="oxygen_saturation"
                                            value={vitalSigns.oxygen_saturation}
                                            onChange={handleVitalSignChange}
                                            placeholder="예: 98"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 주요 혈액검사 (선택사항) */}
                            <div>
                                <h5 style={{ color: '#007bff', marginBottom: '15px' }}>주요 혈액검사 (선택사항)</h5>
                                <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
                                    입력하지 않으면 정상값으로 처리됩니다.
                                </p>
                                <div style={{ display: 'grid', gap: '15px' }}>
                                    <div>
                                        <label>백혈구 (4-11 x10³/μL):</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            name="wbc"
                                            value={labResults.wbc}
                                            onChange={handleLabResultChange}
                                            placeholder="예: 8.0"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label>헤모글로빈 (12-16 g/dL):</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            name="hemoglobin"
                                            value={labResults.hemoglobin}
                                            onChange={handleLabResultChange}
                                            placeholder="예: 14.0"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label>크레아티닌 (0.7-1.3 mg/dL):</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            name="creatinine"
                                            value={labResults.creatinine}
                                            onChange={handleLabResultChange}
                                            placeholder="예: 1.0"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label>BUN (15.0):</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            name="bun"
                                            value={labResults.bun}
                                            onChange={handleLabResultChange}
                                            placeholder="예: 15.0"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label>혈당 (70-100 mg/dL):</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            name="glucose"
                                            value={labResults.glucose}
                                            onChange={handleLabResultChange}
                                            placeholder="예: 100.0"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={predicting}
                            style={{
                                marginTop: '30px',
                                backgroundColor: predicting ? '#6c757d' : '#28a745',
                                color: 'white',
                                padding: '15px 30px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: predicting ? 'not-allowed' : 'pointer',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                display: 'block',
                                margin: '30px auto 0'
                            }}
                        >
                            {predicting ? '예측 실행 중...' : 'AI 합병증 예측 시작'}
                        </button>
                    </form>
                )}

                {/* 결과 보기 탭 */}
                {activeTab === 'result' && (
                    <div>
                        {predictionResults ? (
                            <div>
                                <h4 style={{ color: '#333', marginBottom: '20px' }}>AI 합병증 예측 결과</h4>

                                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                    <h5 style={{ marginBottom: '20px' }}>예측 확률</h5>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                                            <h6 style={{ margin: '0 0 10px 0' }}>폐렴</h6>
                                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                                                {predictionResults.predictions?.pneumonia?.probability ? (predictionResults.predictions.pneumonia.probability * 100).toFixed(1) : '0.0'}%
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
                                            <h6 style={{ margin: '0 0 10px 0' }}>급성 신장손상</h6>
                                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
                                                {predictionResults.predictions?.acute_kidney_injury?.probability ? (predictionResults.predictions.acute_kidney_injury.probability * 100).toFixed(1) : '0.0'}%
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fce4ec', borderRadius: '8px' }}>
                                            <h6 style={{ margin: '0 0 10px 0' }}>심부전</h6>
                                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#c2185b' }}>
                                                {predictionResults.predictions?.heart_failure?.probability ? (predictionResults.predictions.heart_failure.probability * 100).toFixed(1) : '0.0'}%
                                            </span>
                                        </div>
                                    </div>

                                    <h5 style={{ marginBottom: '15px' }}>위험도 평가</h5>
                                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '15px' }}>
                                            <div>
                                                <strong>폐렴:</strong>
                                                <span style={{
                                                    marginLeft: '8px',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    backgroundColor: predictionResults.predictions?.pneumonia?.risk_level === 'HIGH' ? '#ffebee' :
                                                        predictionResults.predictions?.pneumonia?.risk_level === 'MEDIUM' ? '#fff3e0' : '#e8f5e8',
                                                    color: predictionResults.predictions?.pneumonia?.risk_level === 'HIGH' ? '#c62828' :
                                                        predictionResults.predictions?.pneumonia?.risk_level === 'MEDIUM' ? '#f57c00' : '#2e7d32',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {predictionResults.predictions?.pneumonia?.risk_level || 'LOW'}
                                                </span>
                                            </div>
                                            <div>
                                                <strong>급성 신장손상:</strong>
                                                <span style={{
                                                    marginLeft: '8px',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    backgroundColor: predictionResults.predictions?.acute_kidney_injury?.risk_level === 'HIGH' ? '#ffebee' :
                                                        predictionResults.predictions?.acute_kidney_injury?.risk_level === 'MEDIUM' ? '#fff3e0' : '#e8f5e8',
                                                    color: predictionResults.predictions?.acute_kidney_injury?.risk_level === 'HIGH' ? '#c62828' :
                                                        predictionResults.predictions?.acute_kidney_injury?.risk_level === 'MEDIUM' ? '#f57c00' : '#2e7d32',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {predictionResults.predictions?.acute_kidney_injury?.risk_level || 'LOW'}
                                                </span>
                                            </div>
                                            <div>
                                                <strong>심부전:</strong>
                                                <span style={{
                                                    marginLeft: '8px',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    backgroundColor: predictionResults.predictions?.heart_failure?.risk_level === 'HIGH' ? '#ffebee' :
                                                        predictionResults.predictions?.heart_failure?.risk_level === 'MEDIUM' ? '#fff3e0' : '#e8f5e8',
                                                    color: predictionResults.predictions?.heart_failure?.risk_level === 'HIGH' ? '#c62828' :
                                                        predictionResults.predictions?.heart_failure?.risk_level === 'MEDIUM' ? '#f57c00' : '#2e7d32',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {predictionResults.predictions?.heart_failure?.risk_level || 'LOW'}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <p style={{ margin: '0' }}>
                                                <strong>전체 위험도:</strong>
                                                <span style={{
                                                    marginLeft: '8px',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    backgroundColor: (() => {
                                                        const hasHigh = [predictionResults.predictions?.pneumonia?.risk_level,
                                                        predictionResults.predictions?.acute_kidney_injury?.risk_level,
                                                        predictionResults.predictions?.heart_failure?.risk_level].includes('HIGH');
                                                        const hasMedium = [predictionResults.predictions?.pneumonia?.risk_level,
                                                        predictionResults.predictions?.acute_kidney_injury?.risk_level,
                                                        predictionResults.predictions?.heart_failure?.risk_level].includes('MEDIUM');
                                                        return hasHigh ? '#ffebee' : hasMedium ? '#fff3e0' : '#e8f5e8';
                                                    })(),
                                                    color: (() => {
                                                        const hasHigh = [predictionResults.predictions?.pneumonia?.risk_level,
                                                        predictionResults.predictions?.acute_kidney_injury?.risk_level,
                                                        predictionResults.predictions?.heart_failure?.risk_level].includes('HIGH');
                                                        const hasMedium = [predictionResults.predictions?.pneumonia?.risk_level,
                                                        predictionResults.predictions?.acute_kidney_injury?.risk_level,
                                                        predictionResults.predictions?.heart_failure?.risk_level].includes('MEDIUM');
                                                        return hasHigh ? '#c62828' : hasMedium ? '#f57c00' : '#2e7d32';
                                                    })(),
                                                    fontWeight: 'bold'
                                                }}>
                                                    {(() => {
                                                        const hasHigh = [predictionResults.predictions?.pneumonia?.risk_level,
                                                        predictionResults.predictions?.acute_kidney_injury?.risk_level,
                                                        predictionResults.predictions?.heart_failure?.risk_level].includes('HIGH');
                                                        const hasMedium = [predictionResults.predictions?.pneumonia?.risk_level,
                                                        predictionResults.predictions?.acute_kidney_injury?.risk_level,
                                                        predictionResults.predictions?.heart_failure?.risk_level].includes('MEDIUM');
                                                        return hasHigh ? 'HIGH' : hasMedium ? 'MEDIUM' : 'LOW';
                                                    })()}
                                                </span>
                                            </p>
                                            <p style={{ margin: '0' }}>
                                                <strong>평균 신뢰도:</strong>
                                                {(() => {
                                                    const confidences = [
                                                        predictionResults.predictions?.pneumonia?.confidence || 0,
                                                        predictionResults.predictions?.acute_kidney_injury?.confidence || 0,
                                                        predictionResults.predictions?.heart_failure?.confidence || 0
                                                    ];
                                                    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
                                                    return (avgConfidence * 100).toFixed(1);
                                                })()}%
                                            </p>
                                        </div>
                                    </div>

                                    {(predictionResults.predictions?.pneumonia?.clinical_recommendations ||
                                        predictionResults.predictions?.acute_kidney_injury?.clinical_recommendations ||
                                        predictionResults.predictions?.heart_failure?.clinical_recommendations) && (
                                            <div>
                                                <h5 style={{ marginBottom: '15px' }}>임상 권장사항</h5>
                                                <div style={{ backgroundColor: '#e8f5e8', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #4caf50' }}>
                                                    {predictionResults.predictions?.pneumonia?.clinical_recommendations && (
                                                        <p style={{ margin: '0 0 10px 0', lineHeight: '1.5' }}>
                                                            <strong>폐렴:</strong> {predictionResults.predictions.pneumonia.clinical_recommendations}
                                                        </p>
                                                    )}
                                                    {predictionResults.predictions?.acute_kidney_injury?.clinical_recommendations && (
                                                        <p style={{ margin: '0 0 10px 0', lineHeight: '1.5' }}>
                                                            <strong>급성 신장손상:</strong> {predictionResults.predictions.acute_kidney_injury.clinical_recommendations}
                                                        </p>
                                                    )}
                                                    {predictionResults.predictions?.heart_failure?.clinical_recommendations && (
                                                        <p style={{ margin: '0', lineHeight: '1.5' }}>
                                                            <strong>심부전:</strong> {predictionResults.predictions.heart_failure.clinical_recommendations}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                <h4>예측 결과가 없습니다</h4>
                                <p>예측 실행 탭에서 AI 예측을 먼저 진행해주세요.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 과거 기록 탭 */}
                {activeTab === 'history' && (
                    <ComplicationHistoryView selectedPatient={selectedPatient} />
                )}
            </div>

            {/* 모델 설명 섹션 */}
            <div style={{
                marginTop: '30px',
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h4 style={{ color: '#333', marginBottom: '15px' }}>뇌졸중 합병증 AI 예측 모델 안내</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                        <h6 style={{ color: '#007bff', marginBottom: '10px' }}>어떤 데이터를 사용하나요?</h6>
                        <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                            환자의 기본 정보, 현재 활력징후, 혈액검사 결과, 기존 합병증 이력, 현재 투약 정보를 종합하여
                            주요 뇌졸중 합병증 발생 가능성을 예측합니다.
                        </p>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                        <h6 style={{ color: '#007bff', marginBottom: '10px' }}>무엇을 예측하나요?</h6>
                        <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                            폐렴, 급성 신장손상, 심부전 등 주요 합병증의 발생 확률과 위험도를 예측하여
                            선제적 모니터링과 예방적 치료 계획 수립을 지원합니다.
                        </p>
                    </div>
                </div>

                <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                    <p style={{ marginBottom: '10px' }}>
                        <strong>모델 정확도:</strong> 내부 검증에서 AUC 0.85 이상의 성능을 보였으며,
                        실제 임상 환경에서 지속적으로 성능을 모니터링하고 있습니다.
                    </p>
                    <p style={{ marginBottom: '10px' }}>
                        <strong>중요 주의사항:</strong> 이 AI 예측 결과는 의료진의 임상 판단을 보조하는 도구로,
                        최종 진단 및 치료 결정은 반드시 의료진이 내려야 합니다.
                    </p>
                    <p style={{ margin: 0, fontStyle: 'italic' }}>
                        모델 버전: v2.1 | 최근 업데이트: 2025년 6월 | 학습 데이터: 뇌졸중 환자 15,000명
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ComplicationManagementView;