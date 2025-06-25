// /home/shared/medical_cdss/frontend/src/pages/AI_import/SOD2_import.js
import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import { fetchPatientDetails } from '../../services/djangoApiService';
import { SOD2Result } from '../../components/AI_result/SOD2_result';

export const SOD2Import = ({ selectedPatient }) => {
    // Form 상태
    const [strokeType, setStrokeType] = useState('');
    const [nihssScore, setNihssScore] = useState('');
    const [reperfusionTreatment, setReperfusionTreatment] = useState(false);
    const [reperfusionTime, setReperfusionTime] = useState('');
    const [strokeDate, setStrokeDate] = useState('');
    const [hoursAfterStroke, setHoursAfterStroke] = useState('');
    const [notes, setNotes] = useState('');
    const [recordedAt, setRecordedAt] = useState('');

    // UI 상태
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [sod2Results, setSOD2Results] = useState(null);
    const [showForm, setShowForm] = useState(true);

    useEffect(() => {
        // 컴포넌트 로드 시 기록 시간을 현재 시간으로 기본 설정
        const now = new Date();
        now.setHours(now.getHours() + 9); // KST
        setRecordedAt(now.toISOString().slice(0, 16));
    }, []);

    const resetForm = () => {
        setStrokeType('');
        setNihssScore('');
        setReperfusionTreatment(false);
        setReperfusionTime('');
        setStrokeDate('');
        setHoursAfterStroke('');
        setNotes('');
        setError(null);
        setSuccessMessage('');
        setSOD2Results(null);
    };

    // 폼 검증 함수
    const validateForm = () => {
        if (!strokeType) {
            setError('뇌졸중 유형을 선택해주세요.');
            return false;
        }
        if (!nihssScore || nihssScore < 0 || nihssScore > 42) {
            setError('NIHSS 점수를 0-42 범위로 입력해주세요.');
            return false;
        }
        if (!strokeDate) {
            setError('뇌졸중 발생일을 입력해주세요.');
            return false;
        }
        if (!hoursAfterStroke || hoursAfterStroke < 0) {
            setError('뇌졸중 후 경과 시간을 입력해주세요.');
            return false;
        }
        if (reperfusionTreatment && (!reperfusionTime || parseFloat(reperfusionTime) <= 0)) {
            setError('재관류 치료를 선택한 경우 치료 시간을 입력해주세요.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage('');

        try {
            // 1. 환자 정보 조회
            console.log('환자 정보 조회 중...', selectedPatient.uuid);
            const patientDetails = await fetchPatientDetails(selectedPatient.uuid);
            
            const patientAge = patientDetails?.person?.birthdate ? 
                new Date().getFullYear() - new Date(patientDetails.person.birthdate).getFullYear() : 65;
            const patientGender = patientDetails?.person?.gender || 'M';

            console.log('환자 정보:', { age: patientAge, gender: patientGender });

            // 2. 뇌졸중 정보 데이터 구조
            const strokeInfoData = {
                patient: selectedPatient.uuid,
                stroke_info: {
                    stroke_type: strokeType,
                    nihss_score: parseInt(nihssScore) || 0,
                    reperfusion_treatment: reperfusionTreatment,
                    reperfusion_time: reperfusionTreatment ? parseFloat(reperfusionTime) : null,
                    stroke_date: strokeDate,
                    hours_after_stroke: parseFloat(hoursAfterStroke) || 0,
                },
                notes: notes,
                recorded_at: recordedAt,
            };

            console.log('뇌졸중 정보 저장 중...', strokeInfoData);

            // 3. 뇌졸중 정보 저장
            await aiService.registerStrokeInfo(strokeInfoData);
            console.log('뇌졸중 정보 저장 완료');

            // 4. SOD2 평가 데이터 구조
            const assessmentData = {
                patient: selectedPatient.uuid,
                age: patientAge,
                gender: patientGender,
                stroke_info: {
                    stroke_type: strokeType,
                    nihss_score: parseInt(nihssScore) || 0,
                    reperfusion_treatment: reperfusionTreatment,
                    reperfusion_time: reperfusionTreatment ? parseFloat(reperfusionTime) : null,
                    stroke_date: strokeDate,
                    hours_after_stroke: parseFloat(hoursAfterStroke) || 0,
                },
            };

            console.log('SOD2 평가 요청 중...', assessmentData);

            // 5. SOD2 평가 요청
            const result = await aiService.assessSOD2Status(assessmentData);
            console.log('SOD2 평가 결과:', result);
            
            // 6. 결과 설정 (API 응답 구조에 맞게)
            if (result && result.result) {
                const assessmentResult = {
                    assessment_id: result.assessment_id,
                    recorded_at: new Date().toISOString(),
                    result: result.result
                };
                setSOD2Results(assessmentResult);
                setSuccessMessage(`SOD2 평가 완료! 현재 SOD2 수준: ${(result.result.sod2_status.current_level * 100).toFixed(1)}%`);
                setShowForm(false); // 성공 시 폼 숨기기
            } else {
                throw new Error('예상치 못한 응답 형식입니다.');
            }

        } catch (err) {
            console.error('SOD2 평가 오류:', err);
            let errorMessage = '데이터 등록에 실패했습니다.';
            
            if (err.response?.status === 500) {
                errorMessage += ' 서버 내부 오류가 발생했습니다. 입력 데이터를 확인해주세요.';
            } else if (err.response?.status === 400) {
                errorMessage += ' 입력 데이터가 올바르지 않습니다.';
            } else if (err.message) {
                errorMessage += ' ' + err.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleNewAssessment = () => {
        setShowForm(true);
        setSOD2Results(null);
        resetForm();
    };
    
    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4>SOD2 평가 ({selectedPatient?.display})</h4>
                {sod2Results && (
                    <button 
                        onClick={handleNewAssessment}
                        style={{ 
                            padding: '10px 20px', 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        새 평가하기
                    </button>
                )}
            </div>

            {/* 입력 폼 */}
            {showForm && (
                <div style={{ 
                    padding: '20px', 
                    border: '1px solid #eee', 
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa',
                    marginBottom: '20px'
                }}>
                    <h5>새 SOD2 평가 정보 입력</h5>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                뇌졸중 유형:*
                            </label>
                            <select 
                                value={strokeType} 
                                onChange={(e) => setStrokeType(e.target.value)} 
                                required 
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            >
                                <option value="">선택하세요</option>
                                <option value="ischemic_reperfusion">허혈성 재관류</option>
                                <option value="ischemic_no_reperfusion">허혈성 비재관류</option>
                                <option value="hemorrhagic">출혈성</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                NIHSS 점수 (0-42):*
                            </label>
                            <input 
                                type="number" 
                                value={nihssScore} 
                                onChange={(e) => setNihssScore(e.target.value)} 
                                required 
                                min="0" 
                                max="42" 
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} 
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                뇌졸중 발생일:*
                            </label>
                            <input 
                                type="date" 
                                value={strokeDate} 
                                onChange={(e) => setStrokeDate(e.target.value)} 
                                required 
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                뇌졸중 후 경과 시간(시간):*
                            </label>
                            <input 
                                type="number" 
                                value={hoursAfterStroke} 
                                onChange={(e) => setHoursAfterStroke(e.target.value)} 
                                required 
                                min="0" 
                                step="0.1"
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={reperfusionTreatment} 
                                    onChange={(e) => setReperfusionTreatment(e.target.checked)}
                                    style={{ marginRight: '8px' }}
                                />
                                <strong>재관류 치료 받음</strong>
                            </label>
                        </div>

                        {reperfusionTreatment && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    재관류 치료 시간(시간):
                                </label>
                                <input 
                                    type="number" 
                                    value={reperfusionTime} 
                                    onChange={(e) => setReperfusionTime(e.target.value)} 
                                    min="0" 
                                    step="0.1"
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                        )}

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                비고:
                            </label>
                            <textarea 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)} 
                                rows="3" 
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <button 
                                type="submit" 
                                disabled={loading} 
                                style={{ 
                                    width: '100%', 
                                    padding: '15px', 
                                    backgroundColor: loading ? '#6c757d' : '#007bff', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {loading ? '평가 중...' : '기록 및 평가'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 메시지 표시 */}
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

            {/* SOD2 평가 결과 표시 */}
            {sod2Results && (
                <div style={{ 
                    padding: '20px', 
                    border: '2px solid #28a745', 
                    borderRadius: '8px',
                    backgroundColor: '#f8fff9'
                }}>
                    <h5 style={{ color: '#28a745', marginBottom: '15px' }}>
                        📊 SOD2 평가 결과
                    </h5>
                    <SOD2Result assessmentData={sod2Results} />
                </div>
            )}
        </div>
    );
};

export default SOD2Import;