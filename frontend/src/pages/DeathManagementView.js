// frontend/src/pages/DeathManagementView.js
import React, { useState, useEffect } from 'react';
import * as djangoApiService from '../services/djangoApiService';
import { MortalityHistoryView } from '../components/AI_result/Mortality_history_view';

const DeathManagementView = ({ selectedPatient, onBackToPatientList }) => {
    const [activeTab, setActiveTab] = useState('input');
    
    // 기록입력 상태
    const [patientInfo, setPatientInfo] = useState({
        age: '',
        gender: 'M',
        nihss_score: '',
        stroke_type: 'ischemic',
        reperfusion_treatment: false,
        reperfusion_time: ''
    });
    
    const [vitalSigns, setVitalSigns] = useState({
        heart_rate: '',
        systolic_bp: '',
        diastolic_bp: '',
        temperature: '',
        respiratory_rate: '',
        oxygen_saturation: ''
    });
    
    const [labResults, setLabResults] = useState({
        glucose: '',
        creatinine: '',
        hemoglobin: '',
        white_blood_cell_count: '',
        platelet_count: '',
        bun: '',
        sodium: '',
        potassium: ''
    });
    
    const [comorbidities, setComorbidities] = useState({
        diabetes: false,
        hypertension: false,
        atrial_fibrillation: false,
        previous_stroke: false,
        smoking: false
    });
    
    const [notes, setNotes] = useState('');
    const [recordedAt, setRecordedAt] = useState(new Date().toISOString().slice(0, 16));
    
    // 예측 상태
    const [predicting, setPredicting] = useState(false);
    const [predictionResults, setPredictionResults] = useState(null);
    
    // UI 상태
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // 환자 선택 시 기본 정보 자동 추출
    useEffect(() => {
        if (selectedPatient) {
            setError(null);
            setSuccessMessage('');
            
            // 환자 기본 정보 추출
            const extractedInfo = extractPatientInfo(selectedPatient);
            setPatientInfo(prev => ({
                ...prev,
                age: extractedInfo.age,
                gender: extractedInfo.gender
            }));
        }
    }, [selectedPatient]);

    const extractPatientInfo = (patient) => {
        if (!patient) return { age: '', gender: 'M' };
        
        // 나이 추출
        let age = '';
        if (patient.person?.age) {
            age = patient.person.age;
        } else if (patient.person?.birthdate) {
            const birthYear = new Date(patient.person.birthdate).getFullYear();
            const currentYear = new Date().getFullYear();
            age = currentYear - birthYear;
        }
        
        // 성별 추출
        let gender = 'M';
        if (patient.person?.gender) {
            gender = patient.person.gender.toUpperCase().startsWith('F') ? 'F' : 'M';
        }
        
        return { age: age.toString(), gender };
    };

    // 폼 핸들러
    const handlePatientInfoChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPatientInfo(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleVitalSignsChange = (e) => {
        const { name, value } = e.target;
        setVitalSigns(prev => ({ ...prev, [name]: value }));
    };

    const handleLabResultsChange = (e) => {
        const { name, value } = e.target;
        setLabResults(prev => ({ ...prev, [name]: value }));
    };

    const handleComorbiditiesChange = (e) => {
        const { name, checked } = e.target;
        setComorbidities(prev => ({ ...prev, [name]: checked }));
    };

    // 데이터 저장 및 예측 실행
    const handleDataSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');
        setLoading(true);
        setPredicting(true);

        if (!selectedPatient || !selectedPatient.uuid) {
            setError("환자가 선택되지 않았습니다.");
            setLoading(false);
            setPredicting(false);
            return;
        }

        // 필수 필드 검증
        if (!patientInfo.age || !patientInfo.nihss_score) {
            setError("나이와 NIHSS 점수는 필수 입력 항목입니다.");
            setLoading(false);
            setPredicting(false);
            return;
        }

        const submissionData = {
            patient_uuid: selectedPatient.uuid,
            age: parseInt(patientInfo.age),
            gender: patientInfo.gender,
            nihss_score: parseInt(patientInfo.nihss_score),
            stroke_type: patientInfo.stroke_type,
            reperfusion_treatment: patientInfo.reperfusion_treatment,
            reperfusion_time: patientInfo.reperfusion_time ? parseFloat(patientInfo.reperfusion_time) : null,
            vital_signs: {
                heart_rate: vitalSigns.heart_rate ? parseFloat(vitalSigns.heart_rate) : null,
                systolic_bp: vitalSigns.systolic_bp ? parseFloat(vitalSigns.systolic_bp) : null,
                diastolic_bp: vitalSigns.diastolic_bp ? parseFloat(vitalSigns.diastolic_bp) : null,
                temperature: vitalSigns.temperature ? parseFloat(vitalSigns.temperature) : null,
                respiratory_rate: vitalSigns.respiratory_rate ? parseFloat(vitalSigns.respiratory_rate) : null,
                oxygen_saturation: vitalSigns.oxygen_saturation ? parseFloat(vitalSigns.oxygen_saturation) : null
            },
            lab_results: {
                glucose: labResults.glucose ? parseFloat(labResults.glucose) : null,
                creatinine: labResults.creatinine ? parseFloat(labResults.creatinine) : null,
                hemoglobin: labResults.hemoglobin ? parseFloat(labResults.hemoglobin) : null,
                white_blood_cell_count: labResults.white_blood_cell_count ? parseFloat(labResults.white_blood_cell_count) : null,
                platelet_count: labResults.platelet_count ? parseFloat(labResults.platelet_count) : null,
                bun: labResults.bun ? parseFloat(labResults.bun) : null,
                sodium: labResults.sodium ? parseFloat(labResults.sodium) : null,
                potassium: labResults.potassium ? parseFloat(labResults.potassium) : null
            },
            comorbidities,
            notes,
            recorded_at: recordedAt
        };

        try {
            // 1. 데이터 등록
            console.log('사망률 데이터 등록 중:', submissionData);
            await djangoApiService.registerMortalityData(submissionData);
            
            // 2. 예측 실행
            console.log('사망률 예측 실행 중...');
            const predictionData = await djangoApiService.predictMortality(submissionData);
            
            setPredictionResults(predictionData);
            setSuccessMessage('예후 예측 데이터가 성공적으로 등록되고 예측이 완료되었습니다.');
            
            // 예측 탭으로 이동
            setActiveTab('results');

        } catch (err) {
            console.error('사망률 처리 실패:', err);
            setError(`처리 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
            setPredicting(false);
        }
    };

    if (!selectedPatient) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h3>환자 정보가 필요합니다.</h3>
                <p>왼쪽 사이드바의 환자 목록에서 환자를 선택해주세요.</p>
                {onBackToPatientList && (
                    <button 
                        onClick={onBackToPatientList}
                        style={{ 
                            padding: '10px 20px', 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer' 
                        }}
                    >
                        환자 선택하기
                    </button>
                )}
            </div>
        );
    }

    return (
        <div>
            {/* 환자 정보 표시 */}
            <div style={{
                backgroundColor: '#e3f2fd',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #90caf9'
            }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>예후 예측 시스템</h3>
                <p style={{ margin: '0', color: '#333' }}>
                    <strong>대상 환자:</strong> {selectedPatient.display || '이름 없음'} 
                    <span style={{ marginLeft: '20px' }}>
                        <strong>나이:</strong> {patientInfo.age}세 
                        <strong style={{ marginLeft: '20px' }}>성별:</strong> {patientInfo.gender === 'M' ? '남성' : '여성'}
                    </span>
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                    환자 데이터를 입력하여 30일 사망률을 예측합니다.
                </p>
            </div>

            {/* 탭 네비게이션 */}
            <div style={{ 
                display: 'flex', 
                borderBottom: '2px solid #ddd', 
                marginBottom: '20px' 
            }}>
                <button 
                    onClick={() => setActiveTab('input')}
                    style={{ 
                        padding: '12px 24px', 
                        border: 'none',
                        backgroundColor: activeTab === 'input' ? '#dc3545' : '#f8f9fa',
                        color: activeTab === 'input' ? 'white' : '#666',
                        cursor: 'pointer',
                        borderRadius: '8px 8px 0 0',
                        fontWeight: activeTab === 'input' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'input' ? '3px solid #dc3545' : 'none'
                    }}
                >
                    기록 입력 및 예측
                </button>
                <button 
                    onClick={() => setActiveTab('results')}
                    style={{ 
                        padding: '12px 24px', 
                        border: 'none',
                        backgroundColor: activeTab === 'results' ? '#dc3545' : '#f8f9fa',
                        color: activeTab === 'results' ? 'white' : '#666',
                        cursor: 'pointer',
                        borderRadius: '8px 8px 0 0',
                        fontWeight: activeTab === 'results' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'results' ? '3px solid #dc3545' : 'none'
                    }}
                >
                    예측 결과
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    style={{ 
                        padding: '12px 24px', 
                        border: 'none',
                        backgroundColor: activeTab === 'history' ? '#dc3545' : '#f8f9fa',
                        color: activeTab === 'history' ? 'white' : '#666',
                        cursor: 'pointer',
                        borderRadius: '8px 8px 0 0',
                        fontWeight: activeTab === 'history' ? 'bold' : 'normal',
                        borderBottom: activeTab === 'history' ? '3px solid #dc3545' : 'none'
                    }}
                >
                    과거 기록
                </button>
            </div>

            {/* 성공 메시지 */}
            {successMessage && (
                <div style={{
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '20px',
                    border: '1px solid #c3e6cb'
                }}>
                    <strong>성공:</strong> {successMessage}
                </div>
            )}

            {/* 오류 메시지 */}
            {error && (
                <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '20px',
                    border: '1px solid #f5c6cb'
                }}>
                    <strong>오류:</strong> {error}
                </div>
            )}

            {/* 탭 컨텐츠 */}
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '0 8px 8px 8px',
                minHeight: '500px'
            }}>
                {/* 기록 입력 및 예측 탭 */}
                {activeTab === 'input' && (
                    <form onSubmit={handleDataSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            {/* 환자 기본 정보 */}
                            <div>
                                <h4 style={{ marginBottom: '15px', color: '#333' }}>환자 기본 정보</h4>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        나이 (필수)
                                    </label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={patientInfo.age}
                                        onChange={handlePatientInfoChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        성별
                                    </label>
                                    <select
                                        name="gender"
                                        value={patientInfo.gender}
                                        onChange={handlePatientInfoChange}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        <option value="M">남성</option>
                                        <option value="F">여성</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        NIHSS 점수 (필수)
                                    </label>
                                    <input
                                        type="number"
                                        name="nihss_score"
                                        value={patientInfo.nihss_score}
                                        onChange={handlePatientInfoChange}
                                        required
                                        min="0"
                                        max="42"
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        뇌졸중 유형
                                    </label>
                                    <select
                                        name="stroke_type"
                                        value={patientInfo.stroke_type}
                                        onChange={handlePatientInfoChange}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        <option value="ischemic">허혈성</option>
                                        <option value="hemorrhagic">출혈성</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
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
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            재관류 치료 시간 (시간)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            name="reperfusion_time"
                                            value={patientInfo.reperfusion_time}
                                            onChange={handlePatientInfoChange}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>
                                )}

                                {/* 동반질환 */}
                                <h5 style={{ marginTop: '20px', marginBottom: '10px', color: '#666' }}>동반질환</h5>
                                {[
                                    { key: 'diabetes', label: '당뇨병' },
                                    { key: 'hypertension', label: '고혈압' },
                                    { key: 'atrial_fibrillation', label: '심방세동' },
                                    { key: 'previous_stroke', label: '과거 뇌졸중' },
                                    { key: 'smoking', label: '흡연' }
                                ].map(item => (
                                    <div key={item.key} style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                name={item.key}
                                                checked={comorbidities[item.key]}
                                                onChange={handleComorbiditiesChange}
                                                style={{ marginRight: '8px' }}
                                            />
                                            {item.label}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {/* 활력징후 및 검사결과 */}
                            <div>
                                <h4 style={{ marginBottom: '15px', color: '#333' }}>활력징후</h4>
                                {[
                                    { key: 'heart_rate', label: '심박수 (bpm)' },
                                    { key: 'systolic_bp', label: '수축기 혈압 (mmHg)' },
                                    { key: 'diastolic_bp', label: '이완기 혈압 (mmHg)' },
                                    { key: 'temperature', label: '체온 (°C)' },
                                    { key: 'respiratory_rate', label: '호흡수 (/min)' },
                                    { key: 'oxygen_saturation', label: '산소포화도 (%)' }
                                ].map(item => (
                                    <div key={item.key} style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            {item.label}
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            name={item.key}
                                            value={vitalSigns[item.key]}
                                            onChange={handleVitalSignsChange}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>
                                ))}

                                <h4 style={{ marginTop: '25px', marginBottom: '15px', color: '#333' }}>검사결과</h4>
                                {[
                                    { key: 'glucose', label: '혈당 (mg/dL)' },
                                    { key: 'creatinine', label: '크레아티닌 (mg/dL)' },
                                    { key: 'hemoglobin', label: '혈색소 (g/dL)' },
                                    { key: 'white_blood_cell_count', label: '백혈구 (×10³/μL)' },
                                    { key: 'platelet_count', label: '혈소판 (×10³/μL)' },
                                    { key: 'bun', label: 'BUN (mg/dL)' },
                                    { key: 'sodium', label: '나트륨 (mEq/L)' },
                                    { key: 'potassium', label: '칼륨 (mEq/L)' }
                                ].map(item => (
                                    <div key={item.key} style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            {item.label}
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name={item.key}
                                            value={labResults[item.key]}
                                            onChange={handleLabResultsChange}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 기록 날짜/시간 및 비고 */}
                        <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    기록 날짜/시간
                                </label>
                                <input
                                    type="datetime-local"
                                    value={recordedAt}
                                    onChange={(e) => setRecordedAt(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    비고
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="특이사항이나 추가 정보를 입력하세요"
                                    style={{
                                        width: '100%',
                                        height: '80px',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                        </div>

                        {/* 제출 버튼 */}
                        <div style={{ textAlign: 'center', marginTop: '30px' }}>
                            <button
                                type="submit"
                                disabled={loading || predicting}
                                style={{
                                    padding: '15px 30px',
                                    backgroundColor: loading || predicting ? '#6c757d' : '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: loading || predicting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {loading || predicting ? '처리 중...' : '데이터 저장 및 예측 실행'}
                            </button>
                        </div>
                    </form>
                )}

                {/* 예측 결과 탭 */}
                {activeTab === 'results' && (
                    <div>
                        <h4 style={{ marginBottom: '20px', color: '#333' }}>예후 예측 결과</h4>
                        {predictionResults ? (
                            <div style={{ 
                                backgroundColor: 'white', 
                                padding: '20px', 
                                borderRadius: '8px', 
                                border: '1px solid #ddd' 
                            }}>
                                <div style={{ 
                                    fontSize: '24px', 
                                    fontWeight: 'bold', 
                                    color: '#dc3545',
                                    textAlign: 'center',
                                    marginBottom: '20px'
                                }}>
                                    30일 이내 사망할 확률: {(predictionResults.mortality_30_day * 100).toFixed(1)}%
                                </div>
                                
                                <div style={{ 
                                    backgroundColor: 
                                        predictionResults.risk_level === 'HIGH' ? '#f8d7da' : 
                                        predictionResults.risk_level === 'MODERATE' ? '#fff3cd' : '#d4edda',
                                    color: 
                                        predictionResults.risk_level === 'HIGH' ? '#721c24' : 
                                        predictionResults.risk_level === 'MODERATE' ? '#856404' : '#155724',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    marginBottom: '20px',
                                    textAlign: 'center'
                                }}>
                                    <strong>위험도: {predictionResults.risk_level}</strong>
                                </div>

                                {predictionResults.clinical_recommendations && (
                                    <div style={{ marginTop: '20px' }}>
                                        <h5>임상 권장사항:</h5>
                                        <ul>
                                            {predictionResults.clinical_recommendations.map((rec, index) => (
                                                <li key={index} style={{ marginBottom: '5px' }}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {predictionResults.model_performance && (
                                    <div style={{ 
                                        marginTop: '20px', 
                                        padding: '15px', 
                                        backgroundColor: '#f8f9fa', 
                                        borderRadius: '8px' 
                                    }}>
                                        <h6>모델 성능 지표:</h6>
                                        <p>AUC: {predictionResults.model_performance.auc?.toFixed(3)}</p>
                                        <p>민감도: {predictionResults.model_performance.sensitivity?.toFixed(3)}</p>
                                        <p>특이도: {predictionResults.model_performance.specificity?.toFixed(3)}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                                <p>예측 결과가 없습니다.</p>
                                <p>기록 입력 탭에서 데이터를 입력하고 예측을 실행해주세요.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 과거 기록 탭 */}
                {activeTab === 'history' && (
                    <MortalityHistoryView selectedPatient={selectedPatient} />
                )}
            </div>
        </div>
    );
};

export default DeathManagementView;