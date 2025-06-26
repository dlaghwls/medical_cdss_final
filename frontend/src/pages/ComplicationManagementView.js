// /home/shared/medical_cdss/frontend/src/pages/ComplicationManagementView.js
import React, { useState, useEffect } from 'react';
import { ComplicationImport } from './AI_import/Complication_import';
import { ComplicationHistoryView } from '../components/AI_result/Complication_history_view';
import { ComplicationResult } from '../components/AI_result/Complication_result';

const ComplicationManagementView = ({ selectedPatient }) => {
    const [activeTab, setActiveTab] = useState('prediction'); // 'prediction', 'input', 'history'
    const [predictionResults, setPredictionResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [inputData, setInputData] = useState({
        // 활력징후 (필수)
        heart_rate: '',
        systolic_bp: '',
        diastolic_bp: '',
        temperature: '',
        respiratory_rate: '',
        oxygen_saturation: '',
        
        // 검사 결과 (선택)
        wbc: '',
        hemoglobin: '',
        creatinine: '',
        bun: '',
        glucose: '',
        sodium: '',
        potassium: '',

        // 기본 정보
        age: '',
        gender: 'M',
        stroke_type: 'ischemic',
        nihss_score: ''
    });

    // 환자 정보 로드
    useEffect(() => {
        if (selectedPatient) {
            setInputData(prev => ({
                ...prev,
                age: selectedPatient.age || '',
                gender: selectedPatient.gender || 'M'
            }));
        }
    }, [selectedPatient]);

    const handleInputChange = (field, value) => {
        setInputData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateInputs = () => {
        const required = ['heart_rate', 'systolic_bp', 'diastolic_bp', 'temperature', 'oxygen_saturation', 'age'];
        const missing = required.filter(field => !inputData[field]);
        
        if (missing.length > 0) {
            throw new Error(`다음 필수 항목을 입력해주세요: ${missing.join(', ')}`);
        }
    };

    const handlePredict = async () => {
        if (!selectedPatient) {
            setError('환자를 선택해주세요.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            validateInputs();

            const requestData = {
                patient_uuid: selectedPatient.uuid,
                age: parseInt(inputData.age),
                gender: inputData.gender,
                vital_signs: {
                    heart_rate: parseFloat(inputData.heart_rate),
                    systolic_bp: parseFloat(inputData.systolic_bp),
                    diastolic_bp: parseFloat(inputData.diastolic_bp),
                    temperature: parseFloat(inputData.temperature),
                    respiratory_rate: parseFloat(inputData.respiratory_rate) || 16,
                    oxygen_saturation: parseFloat(inputData.oxygen_saturation)
                },
                lab_results: {
                    wbc: parseFloat(inputData.wbc) || 8.0,
                    hemoglobin: parseFloat(inputData.hemoglobin) || 14.0,
                    creatinine: parseFloat(inputData.creatinine) || 1.0,
                    bun: parseFloat(inputData.bun) || 15.0,
                    glucose: parseFloat(inputData.glucose) || 100.0,
                    sodium: parseFloat(inputData.sodium) || 140.0,
                    potassium: parseFloat(inputData.potassium) || 4.0
                },
                stroke_info: {
                    stroke_type: inputData.stroke_type,
                    nihss_score: parseInt(inputData.nihss_score) || 0
                }
            };

            const response = await fetch('http://34.64.188.9:8000/api/ml/predict/complications/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`예측 API 호출 실패: ${response.status}`);
            }

            const results = await response.json();
            setPredictionResults(results);
            
        } catch (err) {
            setError(err.message || '예측 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const renderPredictionTab = () => (
        <div style={{ padding: '20px' }}>
            <h3 style={{ color: '#333', marginBottom: '20px' }}>🔮 AI 합병증 예측</h3>
            
            {!selectedPatient && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <h4>환자를 선택해주세요</h4>
                    <p>왼쪽 사이드바에서 환자를 선택하면 예측을 진행할 수 있습니다.</p>
                </div>
            )}

            {selectedPatient && (
                <>
                    {/* 환자 정보 */}
                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>환자 정보</h4>
                        <p><strong>이름:</strong> {selectedPatient.display}</p>
                        <p><strong>UUID:</strong> {selectedPatient.uuid}</p>
                    </div>

                    {/* 입력 폼 */}
                    <div style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                        <h4 style={{ marginBottom: '15px' }}>📊 예측을 위한 데이터 입력</h4>
                        
                        {/* 기본 정보 */}
                        <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ color: '#007bff', marginBottom: '10px' }}>기본 정보</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>나이 *</label>
                                    <input
                                        type="number"
                                        value={inputData.age}
                                        onChange={e => handleInputChange('age', e.target.value)}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                        placeholder="65"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>성별</label>
                                    <select
                                        value={inputData.gender}
                                        onChange={e => handleInputChange('gender', e.target.value)}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    >
                                        <option value="M">남성</option>
                                        <option value="F">여성</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>NIHSS 점수</label>
                                    <input
                                        type="number"
                                        value={inputData.nihss_score}
                                        onChange={e => handleInputChange('nihss_score', e.target.value)}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                        placeholder="0-42"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 활력징후 */}
                        <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ color: '#007bff', marginBottom: '10px' }}>활력징후 (필수)</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                                {[
                                    { field: 'heart_rate', label: '심박수 *', placeholder: '80' },
                                    { field: 'systolic_bp', label: '수축기혈압 *', placeholder: '120' },
                                    { field: 'diastolic_bp', label: '이완기혈압 *', placeholder: '80' },
                                    { field: 'temperature', label: '체온 *', placeholder: '36.5' },
                                    { field: 'respiratory_rate', label: '호흡수', placeholder: '16' },
                                    { field: 'oxygen_saturation', label: '산소포화도 *', placeholder: '98' }
                                ].map(({ field, label, placeholder }) => (
                                    <div key={field}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{label}</label>
                                        <input
                                            type="number"
                                            value={inputData[field]}
                                            onChange={e => handleInputChange(field, e.target.value)}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                            placeholder={placeholder}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 검사 결과 */}
                        <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ color: '#007bff', marginBottom: '10px' }}>검사 결과 (선택사항)</h5>
                            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>입력하지 않으면 정상값이 자동 적용됩니다.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px' }}>
                                {[
                                    { field: 'wbc', label: '백혈구', placeholder: '8.0' },
                                    { field: 'hemoglobin', label: '헤모글로빈', placeholder: '14.0' },
                                    { field: 'creatinine', label: '크레아티닌', placeholder: '1.0' },
                                    { field: 'bun', label: 'BUN', placeholder: '15.0' },
                                    { field: 'glucose', label: '혈당', placeholder: '100.0' },
                                    { field: 'sodium', label: '나트륨', placeholder: '140.0' },
                                    { field: 'potassium', label: '칼륨', placeholder: '4.0' }
                                ].map(({ field, label, placeholder }) => (
                                    <div key={field}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{label}</label>
                                        <input
                                            type="number"
                                            value={inputData[field]}
                                            onChange={e => handleInputChange(field, e.target.value)}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                            placeholder={placeholder}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handlePredict}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '15px',
                                backgroundColor: loading ? '#6c757d' : '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? '🔄 AI 분석 중...' : '🔮 AI 합병증 예측 시작'}
                        </button>
                    </div>

                    {/* 오류 메시지 */}
                    {error && (
                        <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            ❌ {error}
                        </div>
                    )}

                    {/* 예측 결과 */}
                    {predictionResults && (
                        <div style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
                            <h4 style={{ marginBottom: '15px' }}>📊 AI 예측 결과</h4>
                            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                                분석 시간: {new Date().toLocaleString()}
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                {Object.entries(predictionResults).map(([key, result]) => {
                                    if (!result || typeof result.probability === 'undefined') return null;
                                    
                                    const probability = (result.probability * 100).toFixed(1);
                                    const riskColor = getRiskColor(result.risk_level);
                                    const riskText = getRiskText(result.risk_level);
                                    
                                    return (
                                        <div 
                                            key={key} 
                                            style={{ 
                                                backgroundColor: '#f8f9fa',
                                                border: `3px solid ${riskColor}`,
                                                borderRadius: '12px',
                                                padding: '20px',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <h5 style={{ margin: '0 0 10px 0', color: '#333' }}>
                                                {getComplicationName(key)}
                                            </h5>
                                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: riskColor, marginBottom: '10px' }}>
                                                {probability}%
                                            </div>
                                            <div style={{ fontSize: '14px', color: riskColor, fontWeight: 'bold', marginBottom: '5px' }}>
                                                위험도: {riskText}
                                            </div>
                                            {result.model_confidence && (
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    모델 신뢰도: {(result.model_confidence * 100).toFixed(1)}%
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 위험도 설명 */}
                            <div style={{ backgroundColor: '#e7f3ff', padding: '15px', borderRadius: '8px', border: '1px solid #b8daff' }}>
                                <h5 style={{ margin: '0 0 10px 0', color: '#004085' }}>📋 위험도 정의</h5>
                                <ul style={{ margin: '0', paddingLeft: '20px', color: '#004085' }}>
                                    <li><strong>높은 위험도(HIGH):</strong> 집중 모니터링 및 예방 조치 강화 권장</li>
                                    <li><strong>중간 위험도(MEDIUM):</strong> 정기적 관찰 및 조기 개입 준비 필요</li>
                                    <li><strong>낮은 위험도(LOW):</strong> 표준 프로토콜에 따른 관리</li>
                                </ul>
                                <p style={{ margin: '10px 0 0 0', fontSize: '12px', fontStyle: 'italic' }}>
                                    ※ 본 예측 결과는 의료진의 판단을 보조하는 도구이며, 최종 진료는 종합적인 임상 판단에 따릅니다.
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    return (
        <div>
            <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
                <button 
                    onClick={() => setActiveTab('prediction')}
                    style={{ 
                        padding: '10px 15px', 
                        marginRight: '10px', 
                        cursor: 'pointer',
                        border: activeTab === 'prediction' ? '2px solid #007bff' : '1px solid #ccc',
                        backgroundColor: activeTab === 'prediction' ? '#e7f3ff' : 'white',
                        borderRadius: '8px 8px 0 0'
                    }}
                >
                    AI 예측
                </button>
                <button 
                    onClick={() => setActiveTab('input')}
                    style={{ 
                        padding: '10px 15px', 
                        marginRight: '10px', 
                        cursor: 'pointer',
                        border: activeTab === 'input' ? '2px solid #007bff' : '1px solid #ccc',
                        backgroundColor: activeTab === 'input' ? '#e7f3ff' : 'white',
                        borderRadius: '8px 8px 0 0'
                    }}
                >
                    기록 입력
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    style={{ 
                        padding: '10px 15px',
                        cursor: 'pointer',
                        border: activeTab === 'history' ? '2px solid #007bff' : '1px solid #ccc',
                        backgroundColor: activeTab === 'history' ? '#e7f3ff' : 'white',
                        borderRadius: '8px 8px 0 0'
                    }}
                >
                    과거 기록 조회
                </button>
            </div>

            {activeTab === 'prediction' && renderPredictionTab()}
            {activeTab === 'input' && <ComplicationImport selectedPatient={selectedPatient} />}
            {activeTab === 'history' && <ComplicationHistoryView selectedPatient={selectedPatient} />}
        </div>
    );
};

export default ComplicationManagementView;