// frontend/src/pages/AI_import/Death_import.js - 사망률 예측 기능 완전 구현

import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';

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
            await aiService.registerMortalityData(submissionData);
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
            const results = await aiService.predictMortality(predictionData);
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
        borderBottom: isActive ? '2px solid white' : '2px solid #dee2e6'
    });

    const getRiskColor = (riskLevel) => {
        const colors = {
            'LOW': '#28a745',
            'MODERATE': '#ffc107',
            'HIGH': '#fd7e14',
            'CRITICAL': '#dc3545'
        };
        return colors[riskLevel] || '#6c757d';
    };

    // ============= 렌더링 =============
    return (
        <div style={{ 
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            {/* 헤더 */}
            <div style={{ 
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '2px solid #e9ecef'
            }}>
                <h3 style={{ margin: 0, color: '#dc3545' }}>30일 사망률 예측 시스템</h3>
                <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                    <strong>환자:</strong> {selectedPatient?.display || '환자를 선택해주세요'}
                </p>
            </div>

            {/* 탭 네비게이션 */}
            <div style={{ 
                marginBottom: '20px',
                borderBottom: '2px solid #dee2e6',
                paddingBottom: '0'
            }}>
                <button onClick={() => setActiveTab('input')} style={tabStyle(activeTab === 'input')}>
                    데이터 입력
                </button>
                <button onClick={() => setActiveTab('predict')} style={tabStyle(activeTab === 'predict')}>
                    예측 실행
                </button>
                <button onClick={() => setActiveTab('result')} style={tabStyle(activeTab === 'result')} disabled={!predictionResults}>
                    결과 보기
                </button>
            </div>

            {/* 에러/성공 메시지 */}
            {error && (
                <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #f5c6cb' }}>
                    <strong>오류:</strong> {error}
                </div>
            )}

            {successMessage && (
                <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                    <strong>성공:</strong> {successMessage}
                </div>
            )}

            {/* 탭 컨텐츠 */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '0 8px 8px 8px', minHeight: '400px' }}>
                {/* 데이터 입력 탭 */}
                {activeTab === 'input' && (
                    <form onSubmit={handleDataSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px' }}>
                            {/* 환자 정보 */}
                            <div>
                                <h4 style={{ marginBottom: '15px', color: '#dc3545' }}>환자 기본 정보</h4>
                                <div style={{ display: 'grid', gap: '15px' }}>
                                    <div>
                                        <label>나이:</label>
                                        <input 
                                            type="number" 
                                            name="age"
                                            value={patientInfo.age}
                                            onChange={handlePatientInfoChange}
                                            required
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', marginTop: '5px' }}
                                        />
                                    </div>
                                    <div>
                                        <label>성별:</label>
                                        <select 
                                            name="gender"
                                            value={patientInfo.gender}
                                            onChange={handlePatientInfoChange}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', marginTop: '5px' }}
                                        >
                                            <option value="M">남성</option>
                                            <option value="F">여성</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label>NIHSS 점수:</label>
                                        <input 
                                            type="number" 
                                            name="nihss_score"
                                            value={patientInfo.nihss_score}
                                            onChange={handlePatientInfoChange}
                                            min="0" max="42"
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', marginTop: '5px' }}
                                        />
                                    </div>
                                    <div>
                                        <label>뇌졸중 유형:</label>
                                        <select 
                                            name="stroke_type"
                                            value={patientInfo.stroke_type}
                                            onChange={handlePatientInfoChange}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', marginTop: '5px' }}
                                        >
                                            <option value="ischemic">허혈성</option>
                                            <option value="hemorrhagic">출혈성</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input 
                                                type="checkbox" 
                                                name="reperfusion_treatment"
                                                checked={patientInfo.reperfusion_treatment}
                                                onChange={handlePatientInfoChange}
                                                style={{ marginRight: '8px' }}
                                            />
                                            재관류 치료
                                        </label>
                                    </div>
                                    {patientInfo.reperfusion_treatment && (
                                        <div>
                                            <label>재관류 시간 (시간):</label>
                                            <input 
                                                type="number" 
                                                step="0.5"
                                                name="reperfusion_time"
                                                value={patientInfo.reperfusion_time}
                                                onChange={handlePatientInfoChange}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', marginTop: '5px' }}
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
                                        heart_rate: '심박수 (bpm)',
                                        systolic_bp: '수축기 혈압 (mmHg)',
                                        diastolic_bp: '이완기 혈압 (mmHg)',
                                        temperature: '체온 (°C)',
                                        respiratory_rate: '호흡수 (/min)',
                                        spo2: '산소포화도 (%)'
                                    }).map(([key, label]) => (
                                        <div key={key}>
                                            <label>{label}:</label>
                                            <input 
                                                type="number" 
                                                step={key === 'temperature' ? '0.1' : '1'}
                                                name={key}
                                                value={vitalSigns[key]}
                                                onChange={handleVitalSignChange}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', marginTop: '5px' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 검사결과 */}
                            <div>
                                <h4 style={{ marginBottom: '15px', color: '#dc3545' }}>검사결과</h4>
                                <div style={{ display: 'grid', gap: '10px' }}>
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
                                            <label>{label}:</label>
                                            <input 
                                                type="number" 
                                                step="0.1"
                                                name={key}
                                                value={labResults[key]}
                                                onChange={handleLabResultChange}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', marginTop: '5px' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 기록 시간 및 비고 */}
                        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
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
                                    placeholder="추가 정보나 특이사항을 입력하세요"
                                    rows={3}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        {/* 제출 버튼 */}
                        <div style={{ marginTop: '20px' }}>
                            <button 
                                type="submit" 
                                disabled={loading || !selectedPatient}
                                style={{ 
                                    backgroundColor: loading ? '#6c757d' : '#dc3545',
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
                        
                        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
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
                                padding: '15px 40px', 
                                border: 'none', 
                                borderRadius: '8px', 
                                cursor: predicting ? 'not-allowed' : 'pointer',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            {predicting ? '예측 중...' : '⚡ AI 사망률 예측 시작'}
                        </button>
                    </div>
                )}

                {/* 결과 보기 탭 */}
                {activeTab === 'result' && (
                    <div>
                        {predictionResults ? (
                            <div>
                                <h4 style={{ marginBottom: '20px', color: '#dc3545' }}>30일 사망률 예측 결과</h4>
                                
                                {/* 주요 결과 카드 */}
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                                    gap: '20px',
                                    marginBottom: '30px'
                                }}>
                                    {/* 사망률 */}
                                    <div style={{
                                        backgroundColor: 'white',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                        border: `3px solid ${getRiskColor(predictionResults.risk_level)}`,
                                        textAlign: 'center'
                                    }}>
                                        <h5 style={{ margin: '0 0 15px 0', color: '#333' }}>30일 사망률</h5>
                                        <div style={{ 
                                            fontSize: '36px', 
                                            fontWeight: 'bold', 
                                            color: getRiskColor(predictionResults.risk_level),
                                            marginBottom: '10px'
                                        }}>
                                            {(predictionResults.mortality_30_day * 100).toFixed(1)}%
                                        </div>
                                        <div style={{
                                            backgroundColor: getRiskColor(predictionResults.risk_level),
                                            color: 'white',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            display: 'inline-block'
                                        }}>
                                            위험도: {aiService.translateRiskLevel(predictionResults.risk_level)}
                                        </div>
                                    </div>

                                    {/* 신뢰도 */}
                                    <div style={{
                                        backgroundColor: 'white',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                        border: '2px solid #007bff',
                                        textAlign: 'center'
                                    }}>
                                        <h5 style={{ margin: '0 0 15px 0', color: '#333' }}>예측 신뢰도</h5>
                                        <div style={{ 
                                            fontSize: '32px', 
                                            fontWeight: 'bold', 
                                            color: '#007bff',
                                            marginBottom: '10px'
                                        }}>
                                            {(predictionResults.confidence * 100).toFixed(1)}%
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                            모델 정확도: {(predictionResults.model_performance?.auc * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>

                                {/* 위험 요인 및 권장사항 */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    {/* 위험 요인 */}
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

                                    {/* 보호 요인 */}
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