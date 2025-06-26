// frontend/src/pages/AI_import/Complication_import.js - 예측 기능 완전 구현

import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';

export const ComplicationImport = ({ selectedPatient, onPredictionComplete }) => {
    // ============= State 관리 =============
    const [activeTab, setActiveTab] = useState('input'); // 'input', 'predict', 'result'
    
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
    
    // 예측용 추가 데이터
    const [vitalSigns, setVitalSigns] = useState({
        heart_rate: '',
        systolic_bp: '',
        diastolic_bp: '',
        temperature: '',
        respiratory_rate: '',
        spo2: ''
    });
    
    const [labResults, setLabResults] = useState({
        wbc: '',
        hemoglobin: '',
        creatinine: '',
        bun: '',
        glucose: '',
        sodium: '',
        potassium: ''
    });
    
    // 일반 정보
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
        const formattedDateTime = now.toISOString().slice(0, 16);
        setRecordedAt(formattedDateTime);
    }, []);

    // ============= 이벤트 핸들러 =============
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

    // ============= 데이터 등록 함수 =============
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

    // ============= 예측 실행 함수 =============
    const handlePredictionSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setPredicting(true);

        if (!selectedPatient || !selectedPatient.uuid) {
            setError("환자가 선택되지 않았습니다.");
            setPredicting(false);
            return;
        }

        // 예측용 데이터 구성
        const predictionData = {
            patient_uuid: selectedPatient.uuid,
            age: selectedPatient.age || 65,
            gender: selectedPatient.gender || 'M',
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
            
            // 부모 컴포넌트에 예측 완료 알림
            if (onPredictionComplete) {
                onPredictionComplete(results);
            }
            
        } catch (err) {
            setError(`예측 실패: ${err.message || '알 수 없는 오류'}`);
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
        backgroundColor: isActive ? '#007bff' : '#f8f9fa',
        color: isActive ? 'white' : '#495057',
        borderRadius: '8px 8px 0 0',
        fontWeight: isActive ? 'bold' : 'normal',
        fontSize: '14px',
        transition: 'all 0.2s ease-in-out',
        border: isActive ? '2px solid #007bff' : '2px solid #dee2e6',
        borderBottom: isActive ? '2px solid white' : '2px solid #dee2e6'
    });

    const getRiskColor = (riskLevel) => {
        const colors = {
            'LOW': '#28a745',
            'MEDIUM': '#ffc107',
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
                <h3 style={{ margin: 0, color: '#333' }}>합병증 예측 시스템</h3>
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
                <button 
                    onClick={() => setActiveTab('input')}
                    style={tabStyle(activeTab === 'input')}
                >
                    데이터 입력
                </button>
                <button 
                    onClick={() => setActiveTab('predict')}
                    style={tabStyle(activeTab === 'predict')}
                >
                    예측 실행
                </button>
                <button 
                    onClick={() => setActiveTab('result')}
                    style={tabStyle(activeTab === 'result')}
                    disabled={!predictionResults}
                >
                    결과 보기
                </button>
            </div>

            {/* 에러/성공 메시지 */}
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
                minHeight: '400px'
            }}>
                {/* 데이터 입력 탭 */}
                {activeTab === 'input' && (
                    <form onSubmit={handleDataSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            {/* 기존 합병증 */}
                            <div>
                                <h4 style={{ marginBottom: '15px', color: '#333' }}>기존 합병증</h4>
                                {Object.keys(complications).map(key => (
                                    <div key={key} style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input 
                                                type="checkbox" 
                                                name={key} 
                                                checked={complications[key]} 
                                                onChange={handleComplicationChange}
                                                style={{ marginRight: '8px' }}
                                            />
                                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {/* 현재 투약 정보 */}
                            <div>
                                <h4 style={{ marginBottom: '15px', color: '#333' }}>현재 투약 정보</h4>
                                {Object.keys(medications).map(key => (
                                    <div key={key} style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input 
                                                type="checkbox" 
                                                name={key} 
                                                checked={medications[key]} 
                                                onChange={handleMedicationChange}
                                                style={{ marginRight: '8px' }}
                                            />
                                            {key.replace(/_flag|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 기록 시간 */}
                        <div style={{ marginTop: '20px', marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                기록 날짜/시간:
                            </label>
                            <input 
                                type="datetime-local" 
                                value={recordedAt} 
                                onChange={(e) => setRecordedAt(e.target.value)}
                                style={{ 
                                    padding: '8px 12px', 
                                    border: '1px solid #ced4da', 
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        {/* 비고 */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                비고:
                            </label>
                            <textarea 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="추가 정보나 특이사항을 입력하세요"
                                rows={4}
                                style={{ 
                                    width: '100%', 
                                    padding: '8px 12px', 
                                    border: '1px solid #ced4da', 
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* 제출 버튼 */}
                        <button 
                            type="submit" 
                            disabled={loading || !selectedPatient}
                            style={{ 
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
                                정확한 예측을 위해 현재 활력징후와 검사결과를 입력해주세요. 
                                비어있는 항목은 기본값으로 설정됩니다.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            {/* 활력징후 */}
                            <div>
                                <h5 style={{ marginBottom: '15px', color: '#007bff' }}>활력징후</h5>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <div>
                                        <label>심박수 (bpm):</label>
                                        <input 
                                            type="number" 
                                            name="heart_rate"
                                            value={vitalSigns.heart_rate}
                                            onChange={handleVitalSignChange}
                                            placeholder="80"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                border: '1px solid #ced4da', 
                                                borderRadius: '4px',
                                                marginTop: '5px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label>수축기 혈압 (mmHg):</label>
                                        <input 
                                            type="number" 
                                            name="systolic_bp"
                                            value={vitalSigns.systolic_bp}
                                            onChange={handleVitalSignChange}
                                            placeholder="120"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                border: '1px solid #ced4da', 
                                                borderRadius: '4px',
                                                marginTop: '5px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label>이완기 혈압 (mmHg):</label>
                                        <input 
                                            type="number" 
                                            name="diastolic_bp"
                                            value={vitalSigns.diastolic_bp}
                                            onChange={handleVitalSignChange}
                                            placeholder="80"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                border: '1px solid #ced4da', 
                                                borderRadius: '4px',
                                                marginTop: '5px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label>체온 (°C):</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            name="temperature"
                                            value={vitalSigns.temperature}
                                            onChange={handleVitalSignChange}
                                            placeholder="36.5"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                border: '1px solid #ced4da', 
                                                borderRadius: '4px',
                                                marginTop: '5px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label>호흡수 (/min):</label>
                                        <input 
                                            type="number" 
                                            name="respiratory_rate"
                                            value={vitalSigns.respiratory_rate}
                                            onChange={handleVitalSignChange}
                                            placeholder="18"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                border: '1px solid #ced4da', 
                                                borderRadius: '4px',
                                                marginTop: '5px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label>산소포화도 (%):</label>
                                        <input 
                                            type="number" 
                                            name="spo2"
                                            value={vitalSigns.spo2}
                                            onChange={handleVitalSignChange}
                                            placeholder="98"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                border: '1px solid #ced4da', 
                                                borderRadius: '4px',
                                                marginTop: '5px'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 검사결과 */}
                            <div>
                                <h5 style={{ marginBottom: '15px', color: '#007bff' }}>검사결과</h5>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <div>
                                        <label>백혈구 (×10³/μL):</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            name="wbc"
                                            value={labResults.wbc}
                                            onChange={handleLabResultChange}
                                            placeholder="8.0"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                border: '1px solid #ced4da', 
                                                borderRadius: '4px',
                                                marginTop: '5px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label>혈색소 (g/dL):</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            name="hemoglobin"
                                            value={labResults.hemoglobin}
                                            onChange={handleLabResultChange}
                                            placeholder="14.0"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                border: '1px solid #ced4da', 
                                                borderRadius: '4px',
                                                marginTop: '5px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label>크레아티닌 (mg/dL):</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            name="creatinine"
                                            value={labResults.creatinine}
                                            onChange={handleLabResultChange}
                                            placeholder="1.0"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                border: '1px solid #ced4da', 
                                                borderRadius: '4px',
                                                marginTop: '5px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label>BUN (mg/dL):</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            name="bun"
                                            value={labResults.bun}
                                            onChange={handleLabResultChange}
                                            placeholder="15.0"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                border: '1px solid #ced4da', 
                                                borderRadius: '4px',
                                                marginTop: '5px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label>혈당 (mg/dL):</label>
                                        <input 
                                            type="number" 
                                            name="glucose"
                                            value={labResults.glucose}
                                            onChange={handleLabResultChange}
                                            placeholder="100"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                border: '1px solid #ced4da', 
                                                borderRadius: '4px',
                                                marginTop: '5px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label>나트륨 (mEq/L):</label>
                                        <input 
                                            type="number" 
                                            name="sodium"
                                            value={labResults.sodium}
                                            onChange={handleLabResultChange}
                                            placeholder="140"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                border: '1px solid #ced4da', 
                                                borderRadius: '4px',
                                                marginTop: '5px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label>칼륨 (mEq/L):</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            name="potassium"
                                            value={labResults.potassium}
                                            onChange={handleLabResultChange}
                                            placeholder="4.0"
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px', 
                                                border: '1px solid #ced4da', 
                                                borderRadius: '4px',
                                                marginTop: '5px'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 예측 버튼 */}
                        <div style={{ marginTop: '30px', textAlign: 'center' }}>
                            <button 
                                type="submit" 
                                disabled={predicting || !selectedPatient}
                                style={{ 
                                    backgroundColor: predicting ? '#6c757d' : '#28a745',
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
                                {predicting ? '예측 중...' : '🔮 AI 합병증 예측 시작'}
                            </button>
                        </div>
                    </form>
                )}

                {/* 결과 보기 탭 */}
                {activeTab === 'result' && (
                    <div>
                        {predictionResults ? (
                            <div>
                                <h4 style={{ marginBottom: '20px', color: '#333' }}>합병증 예측 결과</h4>
                                
                                {/* 예측 결과 카드들 */}
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                                    gap: '20px',
                                    marginBottom: '30px'
                                }}>
                                    {['pneumonia', 'acute_kidney_injury', 'heart_failure'].map(comp => {
                                        if (!predictionResults.predictions || !predictionResults.predictions[comp]) return null;
                                        
                                        const result = predictionResults.predictions[comp];
                                        const compNames = {
                                            pneumonia: '폐렴',
                                            acute_kidney_injury: '급성 신장 손상',
                                            heart_failure: '심부전'
                                        };
                                        
                                        return (
                                            <div key={comp} style={{
                                                backgroundColor: 'white',
                                                padding: '20px',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                border: `3px solid ${getRiskColor(result.risk_level)}`
                                            }}>
                                                <h5 style={{ 
                                                    margin: '0 0 15px 0', 
                                                    color: '#333',
                                                    fontSize: '18px'
                                                }}>
                                                    {compNames[comp]}
                                                </h5>
                                                
                                                <div style={{ 
                                                    fontSize: '32px', 
                                                    fontWeight: 'bold', 
                                                    color: getRiskColor(result.risk_level),
                                                    marginBottom: '10px'
                                                }}>
                                                    {(result.probability * 100).toFixed(1)}%
                                                </div>
                                                
                                                <div style={{
                                                    backgroundColor: getRiskColor(result.risk_level),
                                                    color: 'white',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    display: 'inline-block',
                                                    marginBottom: '15px'
                                                }}>
                                                    위험도: {aiService.translateRiskLevel(result.risk_level)}
                                                </div>
                                                
                                                {result.model_performance && (
                                                    <div style={{ 
                                                        fontSize: '12px', 
                                                        color: '#666',
                                                        borderTop: '1px solid #eee',
                                                        paddingTop: '10px'
                                                    }}>
                                                        <div>모델 정확도: {(result.model_performance.auc * 100).toFixed(1)}%</div>
                                                        <div>신뢰도: {(result.confidence * 100).toFixed(1)}%</div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 메타 정보 */}
                                <div style={{
                                    backgroundColor: '#e7f3ff',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    border: '1px solid #b8daff'
                                }}>
                                    <h5 style={{ margin: '0 0 10px 0', color: '#004085' }}>예측 정보</h5>
                                    <div style={{ fontSize: '14px', color: '#004085' }}>
                                        <div>예측 시간: {new Date(predictionResults.predictions.timestamp).toLocaleString()}</div>
                                        <div>처리 시간: {predictionResults.predictions.processing_time?.toFixed(2)}초</div>
                                        <div>모델 사용: {predictionResults.model_used ? '실제 ML 모델' : '목업 데이터'}</div>
                                        <div>작업 ID: {predictionResults.task_id}</div>
                                    </div>
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

export default ComplicationImport;