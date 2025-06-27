// frontend/src/pages/AI_import/Death_import.js - 사망률 예측 기능 완전 구현

import React, { useState, useEffect } from 'react';
import djangoApiService from '../../services/djangoApiService';

export const DeathImport = ({ selectedPatient, onPredictionComplete }) => {
    // ============= State 관리 =============
    const [activeTab, setActiveTab] = useState('input'); // 'input', 'predict', 'result'
    
    // 환자 기본 정보
    const [patientInfo, setPatientInfo] = useState({
        age: '',
        gender: 'M',
        nihss_score: '',
        stroke_type: 'ischemic',
        reperfusion_treatment: false,
        reperfusion_time: ''
    });
    
    // 활력징후
    const [vitalSigns, setVitalSigns] = useState({
        heart_rate: '',
        systolic_bp: '',
        diastolic_bp: '',
        temperature: '',
        respiratory_rate: '',
        spo2: ''
    });
    
    // 검사결과
    const [labResults, setLabResults] = useState({
        wbc: '',
        hemoglobin: '',
        creatinine: '',
        bun: '',
        glucose: '',
        sodium: '',
        potassium: ''
    });
    
    // 기타
    const [notes, setNotes] = useState('');
    const [recordedAt, setRecordedAt] = useState('');
    
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [predicting, setPredicting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [predictionResults, setPredictionResults] = useState(null);

    // ============= 초기화 =============
    useEffect(() => {
        const now = new Date();
        setRecordedAt(now.toISOString().slice(0, 16));
        
        // 선택된 환자 정보로 초기화
        if (selectedPatient) {
            setPatientInfo(prev => ({
                ...prev,
                age: selectedPatient.age || '',
                gender: selectedPatient.gender || 'M'
            }));
        }
    }, [selectedPatient]);

    // ============= 이벤트 핸들러 =============
    const handlePatientInfoChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPatientInfo(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleVitalSignChange = (e) => {
        setVitalSigns(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleLabResultChange = (e) => {
        setLabResults(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    // ============= 데이터 등록 함수 =============
    const handleDataSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');
        setLoading(true);

        if (!selectedPatient?.uuid) {
            setError("환자가 선택되지 않았습니다.");
            setLoading(false);
            return;
        }

        const submissionData = {
            patient_uuid: selectedPatient.uuid,
            ...patientInfo,
            vital_signs: vitalSigns,
            lab_results: labResults,
            notes,
            recorded_at: recordedAt
        };

        try {
            await djangoApiService.registerMortalityData(submissionData);
            setSuccessMessage('사망률 예측용 데이터가 성공적으로 기록되었습니다.');
            setActiveTab('predict');
        } catch (err) {
            setError(`기록 실패: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ============= 예측 실행 함수 =============
    const handlePredictionSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setPredicting(true);

        if (!selectedPatient?.uuid) {
            setError("환자가 선택되지 않았습니다.");
            setPredicting(false);
            return;
        }

        const predictionData = {
            patient_uuid: selectedPatient.uuid,
            ...patientInfo,
            vital_signs: vitalSigns,
            lab_results: labResults
        };

        try {
            const results = await djangoApiService.predictMortality(predictionData);
            setPredictionResults(results);
            setActiveTab('result');
            
            if (onPredictionComplete) {
                onPredictionComplete(results);
            }
        } catch (err) {
            setError(`예측 실패: ${err.message}`);
        } finally {
            setPredicting(false);
        }
    };

    // ============= 스타일 함수 =============
    const tabStyle = (isActive) => ({
        padding: '12px 20px',
        marginRight: '5px',
        cursor: 'pointer',
        border: 'none',
        backgroundColor: isActive ? '#dc3545' : '#f8f9fa',
        color: isActive ? 'white' : '#495057',
        borderRadius: '8px 8px 0 0',
        fontWeight: isActive ? 'bold' : 'normal',
        fontSize: '14px',
        transition: 'all 0.2s ease-in-out',
        border: isActive ? '2px solid #dc3545' : '2px solid #dee2e6',
        borderBottom: isActive ? '2px solid #fff' : '2px solid #dee2e6'
    });

    const getRiskLevelColor = (riskLevel) => {
        switch (riskLevel) {
            case 'HIGH':
            case 'CRITICAL':
                return '#dc3545';
            case 'MEDIUM':
                return '#ffc107';
            case 'LOW':
                return '#28a745';
            default:
                return '#6c757d';
        }
    };

    const formatRiskLevel = (level) => {
        const levelMap = {
            'LOW': '낮음',
            'MEDIUM': '보통',
            'HIGH': '높음',
            'CRITICAL': '매우 높음'
        };
        return levelMap[level] || level;
    };

    // ============= UI 렌더링 =============
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#dc3545' }}>
                30일 사망률 예측
            </h3>
            
            {selectedPatient && (
                <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
                    <strong>선택된 환자:</strong> {selectedPatient.display || selectedPatient.name} (ID: {selectedPatient.uuid})
                </div>
            )}

            {/* 탭 메뉴 */}
            <div style={{ borderBottom: '2px solid #dee2e6', marginBottom: '20px' }}>
                <button 
                    style={tabStyle(activeTab === 'input')} 
                    onClick={() => setActiveTab('input')}
                >
                    기록입력
                </button>
                <button 
                    style={tabStyle(activeTab === 'predict')} 
                    onClick={() => setActiveTab('predict')}
                >
                    예측실행
                </button>
                <button 
                    style={tabStyle(activeTab === 'result')} 
                    onClick={() => setActiveTab('result')}
                >
                    결과보기
                </button>
            </div>

            {/* 오류/성공 메시지 */}
            {error && (
                <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #f5c6cb' }}>
                    {error}
                </div>
            )}
            
            {successMessage && (
                <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                    {successMessage}
                </div>
            )}

            <div style={{ minHeight: '600px' }}>
                {/* 기록입력 탭 */}
                {activeTab === 'input' && (
                    <form onSubmit={handleDataSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            {/* 환자 정보 */}
                            <div>
                                <h4 style={{ marginBottom: '15px', color: '#dc3545' }}>환자 기본 정보</h4>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>나이 (세):</label>
                                        <input 
                                            type="number" 
                                            name="age"
                                            value={patientInfo.age}
                                            onChange={handlePatientInfoChange}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>성별:</label>
                                        <select 
                                            name="gender"
                                            value={patientInfo.gender}
                                            onChange={handlePatientInfoChange}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                        >
                                            <option value="M">남성</option>
                                            <option value="F">여성</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>NIHSS 점수:</label>
                                        <input 
                                            type="number" 
                                            name="nihss_score"
                                            value={patientInfo.nihss_score}
                                            onChange={handlePatientInfoChange}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>뇌졸중 유형:</label>
                                        <select 
                                            name="stroke_type"
                                            value={patientInfo.stroke_type}
                                            onChange={handlePatientInfoChange}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                        >
                                            <option value="ischemic">허혈성</option>
                                            <option value="hemorrhagic">출혈성</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                                            <input 
                                                type="checkbox" 
                                                name="reperfusion_treatment"
                                                checked={patientInfo.reperfusion_treatment}
                                                onChange={handlePatientInfoChange}
                                                style={{ marginRight: '8px' }}
                                            />
                                            재관류 치료 시행
                                        </label>
                                    </div>
                                    {patientInfo.reperfusion_treatment && (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>재관류 치료 시간 (시간):</label>
                                            <input 
                                                type="number" 
                                                step="0.5"
                                                name="reperfusion_time"
                                                value={patientInfo.reperfusion_time}
                                                onChange={handlePatientInfoChange}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 활력징후 */}
                            <div>
                                <h4 style={{ marginBottom: '15px', color: '#dc3545' }}>활력징후</h4>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {Object.entries({
                                        heart_rate: '심박수 (회/분)',
                                        systolic_bp: '수축기 혈압 (mmHg)',
                                        diastolic_bp: '이완기 혈압 (mmHg)',
                                        temperature: '체온 (°C)',
                                        respiratory_rate: '호흡수 (회/분)',
                                        spo2: '산소포화도 (%)'
                                    }).map(([key, label]) => (
                                        <div key={key}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{label}:</label>
                                            <input 
                                                type="number" 
                                                step={key === 'temperature' ? '0.1' : '1'}
                                                name={key}
                                                value={vitalSigns[key]}
                                                onChange={handleVitalSignChange}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 검사결과 */}
                        <div style={{ marginTop: '30px' }}>
                            <h4 style={{ marginBottom: '15px', color: '#dc3545' }}>검사결과</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                {Object.entries({
                                    wbc: '백혈구 (×10³/μL)',
                                    hemoglobin: '혈색소 (g/dL)',
                                    creatinine: '크레아티닌 (mg/dL)',
                                    bun: 'BUN (mg/dL)',
                                    glucose: '혈당 (mg/dL)',
                                    sodium: '나트륨 (mEq/L)',
                                    potassium: '칼륨 (mEq/L)'
                                }).map(([key, label]) => (
                                    <div key={key}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{label}:</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            name={key}
                                            value={labResults[key]}
                                            onChange={handleLabResultChange}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 기록 시간 및 비고 */}
                        <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>기록 날짜/시간:</label>
                                <input 
                                    type="datetime-local" 
                                    value={recordedAt}
                                    onChange={(e) => setRecordedAt(e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>비고:</label>
                                <textarea 
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', minHeight: '60px' }}
                                    placeholder="추가 정보나 특이사항을 입력하세요..."
                                />
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '30px' }}>
                            <button 
                                type="submit" 
                                disabled={loading || !selectedPatient}
                                style={{ 
                                    backgroundColor: loading ? '#6c757d' : '#dc3545', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '12px 30px', 
                                    borderRadius: '8px', 
                                    fontSize: '16px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {loading ? '저장 중...' : '데이터 저장'}
                            </button>
                        </div>
                    </form>
                )}

                {/* 예측 실행 탭 */}
                {activeTab === 'predict' && (
                    <div style={{ textAlign: 'center' }}>
                        <h4 style={{ color: '#dc3545', marginBottom: '20px' }}>사망률 예측 실행</h4>
                        <p style={{ color: '#666', marginBottom: '30px' }}>
                            입력된 환자 데이터를 바탕으로 30일 사망률을 예측합니다.
                        </p>
                        
                        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #dee2e6' }}>
                            <h5>입력된 데이터 요약</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'left' }}>
                                <div>
                                    <strong>환자 정보:</strong>
                                    <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                                        <li>나이: {patientInfo.age}세</li>
                                        <li>성별: {patientInfo.gender === 'M' ? '남성' : '여성'}</li>
                                        <li>NIHSS: {patientInfo.nihss_score || 'N/A'}</li>
                                    </ul>
                                </div>
                                <div>
                                    <strong>활력징후:</strong>
                                    <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                                        <li>혈압: {vitalSigns.systolic_bp}/{vitalSigns.diastolic_bp}</li>
                                        <li>심박수: {vitalSigns.heart_rate}</li>
                                        <li>체온: {vitalSigns.temperature}</li>
                                    </ul>
                                </div>
                                <div>
                                    <strong>주요 검사:</strong>
                                    <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                                        <li>크레아티닌: {labResults.creatinine}</li>
                                        <li>혈색소: {labResults.hemoglobin}</li>
                                        <li>혈당: {labResults.glucose}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handlePredictionSubmit}
                            disabled={predicting || !selectedPatient}
                            style={{ 
                                backgroundColor: predicting ? '#6c757d' : '#dc3545', 
                                color: 'white', 
                                border: 'none', 
                                padding: '15px 40px', 
                                borderRadius: '8px', 
                                fontSize: '18px',
                                cursor: predicting ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {predicting ? '예측 실행 중...' : '사망률 예측 실행'}
                        </button>
                    </div>
                )}

                {/* 결과보기 탭 */}
                {activeTab === 'result' && (
                    <div>
                        {predictionResults ? (
                            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                                <h4 style={{ textAlign: 'center', marginBottom: '30px', color: '#dc3545' }}>
                                    30일 사망률 예측 결과
                                </h4>

                                {/* 주요 예측 결과 */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                    <div style={{
                                        backgroundColor: '#f8f9fa',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        textAlign: 'center',
                                        border: '2px solid #dee2e6'
                                    }}>
                                        <h5 style={{ margin: '0 0 10px 0', color: '#495057' }}>30일 사망률</h5>
                                        <div style={{ 
                                            fontSize: '2rem', 
                                            fontWeight: 'bold', 
                                            color: getRiskLevelColor(predictionResults.risk_level) 
                                        }}>
                                            {(predictionResults.mortality_30_day * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div style={{
                                        backgroundColor: '#f8f9fa',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        textAlign: 'center',
                                        border: '2px solid #dee2e6'
                                    }}>
                                        <h5 style={{ margin: '0 0 10px 0', color: '#495057' }}>위험도</h5>
                                        <div style={{ 
                                            fontSize: '1.5rem', 
                                            fontWeight: 'bold', 
                                            color: getRiskLevelColor(predictionResults.risk_level) 
                                        }}>
                                            {formatRiskLevel(predictionResults.risk_level)}
                                        </div>
                                    </div>
                                </div>

                                {/* 위험 요인 및 보호 요인 */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div style={{
                                        backgroundColor: '#fff5f5',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        border: '1px solid #fed7d7'
                                    }}>
                                        <h5 style={{ margin: '0 0 15px 0', color: '#c53030' }}>주요 위험 요인</h5>
                                        <ul style={{ margin: '0', paddingLeft: '20px' }}>
                                            {predictionResults.risk_factors?.map((factor, index) => (
                                                <li key={index} style={{ marginBottom: '5px', color: '#744210' }}>
                                                    {factor}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div style={{
                                        backgroundColor: '#f0fff4',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        border: '1px solid #9ae6b4'
                                    }}>
                                        <h5 style={{ margin: '0 0 15px 0', color: '#2f855a' }}>보호 요인</h5>
                                        <ul style={{ margin: '0', paddingLeft: '20px' }}>
                                            {predictionResults.protective_factors?.map((factor, index) => (
                                                <li key={index} style={{ marginBottom: '5px', color: '#2f855a' }}>
                                                    {factor}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* 임상 권장사항 */}
                                <div style={{
                                    backgroundColor: '#e7f3ff',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    border: '1px solid #b8daff'
                                }}>
                                    <h5 style={{ margin: '0 0 15px 0', color: '#004085' }}>임상 권장사항</h5>
                                    <ul style={{ margin: '0', paddingLeft: '20px' }}>
                                        {predictionResults.clinical_recommendations?.map((rec, index) => (
                                            <li key={index} style={{ marginBottom: '8px', color: '#004085' }}>
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* 메타 정보 */}
                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    marginTop: '20px',
                                    fontSize: '12px',
                                    color: '#666'
                                }}>
                                    <div>예측 시간: {new Date(predictionResults.created_at).toLocaleString()}</div>
                                    <div>작업 ID: {predictionResults.task_id}</div>
                                    <div>모델 사용: {predictionResults.model_used ? '실제 ML 모델' : '목업 데이터'}</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
                                <h4>예측 결과가 없습니다</h4>
                                <p>먼저 '예측 실행' 탭에서 예측을 실행해주세요.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeathImport;