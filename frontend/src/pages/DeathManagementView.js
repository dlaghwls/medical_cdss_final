// /home/shared/medical_cdss/frontend/src/pages/DeathManagementView.js
import React, { useState, useEffect, useCallback } from 'react';
import Death_import from './AI_import/Death_import';
import Death_history_view from '../components/AI_result/Death_history_view';
import { MortalityResult } from '../components/AI_result/Death_result';

const DeathManagementView = ({ selectedPatient, onBackToPatientList }) => {
    const [activeTab, setActiveTab] = useState('prediction'); // 'prediction', 'input', 'history'
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    
    // 예측 관련 상태
    const [predictionResults, setPredictionResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [inputData, setInputData] = useState({
        // 기본 정보
        age: '',
        gender: 'M',
        stroke_type: 'ischemic',
        
        // 핵심 활력징후 (평균값)
        GCS_mean: '',
        NIBP_sys_mean: '',
        NIBP_dias_mean: '',
        NIBP_mean_mean: '',
        SBP_art_mean: '',
        DBP_art_mean: '',
        RespRate_mean: '',
        
        // 검사 결과 (평균값)
        BUN_chart_mean: '',
        CK_lab_mean: '',
        CRP_chart_mean: '',
        CRP_lab_mean: '',
        Creatinine_chart_mean: '',
        Creatinine_lab_mean: '',
        
        // 최대값 (자동 계산되거나 별도 입력)
        GCS_max: '',
        NIBP_sys_max: '',
        NIBP_dias_max: '',
        NIBP_mean_max: '',
        SBP_art_max: '',
        DBP_art_max: '',
        RespRate_max: '',
        BUN_chart_max: '',
        CK_lab_max: '',
        CRP_chart_max: '',
        CRP_lab_max: '',
        Creatinine_chart_max: '',
        Creatinine_lab_max: ''
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

    const fetchHistory = useCallback(async () => {
        if (!selectedPatient?.uuid) return;
        setLoadingHistory(true);
        setHistoryError(null);
        try {
            // AI Service를 동적으로 import
            const { default: aiService } = await import('../services/aiService');
            const data = await aiService.fetchMortalityHistory(selectedPatient.uuid);
            setHistory(data);
        } catch (err) {
            setHistoryError(err.message || '이력 조회 중 오류가 발생했습니다.');
        } finally {
            setLoadingHistory(false);
        }
    }, [selectedPatient?.uuid]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleInputChange = (field, value) => {
        setInputData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateInputs = () => {
        const required = ['age', 'GCS_mean', 'NIBP_sys_mean', 'NIBP_dias_mean', 'SBP_art_mean', 'DBP_art_mean'];
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
                
                // 활력징후 평균값
                GCS_mean: parseFloat(inputData.GCS_mean),
                NIBP_sys_mean: parseFloat(inputData.NIBP_sys_mean),
                NIBP_dias_mean: parseFloat(inputData.NIBP_dias_mean),
                NIBP_mean_mean: parseFloat(inputData.NIBP_mean_mean) || parseFloat(inputData.NIBP_sys_mean),
                SBP_art_mean: parseFloat(inputData.SBP_art_mean),
                DBP_art_mean: parseFloat(inputData.DBP_art_mean),
                RespRate_mean: parseFloat(inputData.RespRate_mean) || 16,
                
                // 검사결과 평균값
                BUN_chart_mean: parseFloat(inputData.BUN_chart_mean) || 18.0,
                CK_lab_mean: parseFloat(inputData.CK_lab_mean) || 120.0,
                CRP_chart_mean: parseFloat(inputData.CRP_chart_mean) || 5.0,
                CRP_lab_mean: parseFloat(inputData.CRP_lab_mean) || 5.0,
                Creatinine_chart_mean: parseFloat(inputData.Creatinine_chart_mean) || 1.2,
                Creatinine_lab_mean: parseFloat(inputData.Creatinine_lab_mean) || 1.2,
                
                // 최대값 (평균값에서 자동 계산하거나 별도 입력)
                GCS_max: parseFloat(inputData.GCS_max) || parseFloat(inputData.GCS_mean),
                NIBP_sys_max: parseFloat(inputData.NIBP_sys_max) || parseFloat(inputData.NIBP_sys_mean) + 15,
                NIBP_dias_max: parseFloat(inputData.NIBP_dias_max) || parseFloat(inputData.NIBP_dias_mean) + 10,
                NIBP_mean_max: parseFloat(inputData.NIBP_mean_max) || parseFloat(inputData.NIBP_mean_mean) + 10,
                SBP_art_max: parseFloat(inputData.SBP_art_max) || parseFloat(inputData.SBP_art_mean) + 15,
                DBP_art_max: parseFloat(inputData.DBP_art_max) || parseFloat(inputData.DBP_art_mean) + 10,
                RespRate_max: parseFloat(inputData.RespRate_max) || parseFloat(inputData.RespRate_mean) + 5,
                BUN_chart_max: parseFloat(inputData.BUN_chart_max) || parseFloat(inputData.BUN_chart_mean) + 5,
                CK_lab_max: parseFloat(inputData.CK_lab_max) || parseFloat(inputData.CK_lab_mean) + 50,
                CRP_chart_max: parseFloat(inputData.CRP_chart_max) || parseFloat(inputData.CRP_chart_mean) + 2,
                CRP_lab_max: parseFloat(inputData.CRP_lab_max) || parseFloat(inputData.CRP_lab_mean) + 2,
                Creatinine_chart_max: parseFloat(inputData.Creatinine_chart_max) || parseFloat(inputData.Creatinine_chart_mean) + 0.3,
                Creatinine_lab_max: parseFloat(inputData.Creatinine_lab_max) || parseFloat(inputData.Creatinine_lab_mean) + 0.3,
                
                // 뇌졸중 정보
                stroke_type: inputData.stroke_type
            };

            const response = await fetch('http://34.64.188.9:8000/api/ml/predict_mortality/', {
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
            setPredictionResults({
                ...results,
                patient_display_name: selectedPatient.display
            });
            
        } catch (err) {
            setError(err.message || '예측 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDataRegistered = async (registeredData) => {
        console.log('New data registered, refreshing history...');
        fetchHistory(); // 이력 갱신
    };

    const renderPredictionTab = () => (
        <div style={{ padding: '20px' }}>
            <h3 style={{ color: '#333', marginBottom: '20px' }}>💀 AI 사망률 예측</h3>
            
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
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>뇌졸중 유형</label>
                                    <select
                                        value={inputData.stroke_type}
                                        onChange={e => handleInputChange('stroke_type', e.target.value)}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    >
                                        <option value="ischemic">허혈성</option>
                                        <option value="hemorrhagic">출혈성</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 핵심 활력징후 */}
                        <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ color: '#007bff', marginBottom: '10px' }}>핵심 활력징후 (평균값) *</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                                {[
                                    { field: 'GCS_mean', label: 'GCS 점수 *', placeholder: '15' },
                                    { field: 'NIBP_sys_mean', label: '수축기혈압 *', placeholder: '120' },
                                    { field: 'NIBP_dias_mean', label: '이완기혈압 *', placeholder: '80' },
                                    { field: 'SBP_art_mean', label: '동맥 수축기압 *', placeholder: '120' },
                                    { field: 'DBP_art_mean', label: '동맥 이완기압 *', placeholder: '80' },
                                    { field: 'RespRate_mean', label: '호흡수', placeholder: '16' }
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
                            <h5 style={{ color: '#007bff', marginBottom: '10px' }}>주요 검사 결과 (평균값, 선택사항)</h5>
                            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>입력하지 않으면 정상값이 자동 적용됩니다.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px' }}>
                                {[
                                    { field: 'BUN_chart_mean', label: 'BUN', placeholder: '18.0' },
                                    { field: 'CK_lab_mean', label: 'CK', placeholder: '120.0' },
                                    { field: 'CRP_chart_mean', label: 'CRP (Chart)', placeholder: '5.0' },
                                    { field: 'CRP_lab_mean', label: 'CRP (Lab)', placeholder: '5.0' },
                                    { field: 'Creatinine_chart_mean', label: '크레아티닌 (Chart)', placeholder: '1.2' },
                                    { field: 'Creatinine_lab_mean', label: '크레아티닌 (Lab)', placeholder: '1.2' }
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
                                backgroundColor: loading ? '#6c757d' : '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? '🔄 AI 분석 중...' : '💀 30일 사망률 예측 시작'}
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
                        <MortalityResult 
                            predictionData={predictionResults}
                            analysisTime={new Date().toLocaleString()}
                        />
                    )}
                </>
            )}
        </div>
    );

    if (!selectedPatient) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h3>환자 정보가 필요합니다.</h3>
                <p>왼쪽 사이드바의 환자 목록에서 환자를 선택해주세요.</p>
                {onBackToPatientList && (
                    <button 
                        onClick={onBackToPatientList}
                        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        환자 선택하기
                    </button>
                )}
            </div>
        );
    }

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
            {activeTab === 'input' && (
                <Death_import 
                    selectedPatient={selectedPatient}
                    onDataRegistered={handleDataRegistered} 
                />
            )}
            {activeTab === 'history' && (
                <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
                    <Death_history_view 
                        history={history}
                        loading={loadingHistory}
                        error={historyError}
                    />
                </div>
            )}
        </div>
    );
};

export default DeathManagementView;