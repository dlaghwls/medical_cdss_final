import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import { fetchPatientDetails } from '../../services/djangoApiService';

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

    useEffect(() => {
        const now = new Date();
        setRecordedAt(now.toISOString().slice(0, 16));
    }, []);

    // 강화된 환자 정보 추출 함수
    const extractPatientInfo = async (patientUuid) => {
        try {
            const patientDetails = await fetchPatientDetails(patientUuid);
            console.log('전체 환자 정보:', JSON.stringify(patientDetails, null, 2));
            
            let patientAge = null;
            let patientGender = null;
            
            // 1. 나이 추출 시도 - 여러 경로 확인
            if (patientDetails?.person?.birthdate) {
                try {
                    const birthDate = new Date(patientDetails.person.birthdate);
                    if (!isNaN(birthDate.getTime())) {
                        const today = new Date();
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                        }
                        
                        if (age >= 0 && age <= 120) {
                            patientAge = age;
                            console.log('생년월일로부터 계산된 나이:', age);
                        }
                    }
                } catch (dateError) {
                    console.warn('생년월일 파싱 실패:', dateError);
                }
            }
            
            // 나이를 생년월일로부터 계산할 수 없으면 다른 필드들 확인
            if (patientAge === null) {
                // person.age 필드 확인
                if (patientDetails?.person?.age !== undefined && patientDetails.person.age !== null) {
                    const ageValue = parseInt(patientDetails.person.age);
                    if (!isNaN(ageValue) && ageValue >= 0 && ageValue <= 120) {
                        patientAge = ageValue;
                        console.log('person.age 필드에서 추출된 나이:', ageValue);
                    }
                }
                
                // attributes에서 나이 정보 확인
                if (patientAge === null && patientDetails?.person?.attributes) {
                    for (const attr of patientDetails.person.attributes) {
                        if (attr.attributeType?.display?.toLowerCase().includes('age') || 
                            attr.attributeType?.name?.toLowerCase().includes('age')) {
                            const ageValue = parseInt(attr.value);
                            if (!isNaN(ageValue) && ageValue >= 0 && ageValue <= 120) {
                                patientAge = ageValue;
                                console.log('attributes에서 추출된 나이:', ageValue);
                                break;
                            }
                        }
                    }
                }
            }
            
            // 2. 성별 추출 시도 - 여러 경로 확인
            if (patientDetails?.person?.gender) {
                const genderValue = patientDetails.person.gender.toString().toLowerCase();
                if (['m', 'male', '남', '남성', 'man'].includes(genderValue)) {
                    patientGender = 'M';
                } else if (['f', 'female', '여', '여성', 'woman'].includes(genderValue)) {
                    patientGender = 'F';
                }
                console.log('추출된 성별:', patientGender, '(원본:', genderValue, ')');
            }
            
            // attributes에서 성별 정보 확인
            if (patientGender === null && patientDetails?.person?.attributes) {
                for (const attr of patientDetails.person.attributes) {
                    if (attr.attributeType?.display?.toLowerCase().includes('gender') || 
                        attr.attributeType?.display?.toLowerCase().includes('sex') ||
                        attr.attributeType?.name?.toLowerCase().includes('gender') ||
                        attr.attributeType?.name?.toLowerCase().includes('sex')) {
                        const genderValue = attr.value?.toString().toLowerCase();
                        if (['m', 'male', '남', '남성', 'man'].includes(genderValue)) {
                            patientGender = 'M';
                        } else if (['f', 'female', '여', '여성', 'woman'].includes(genderValue)) {
                            patientGender = 'F';
                        }
                        console.log('attributes에서 추출된 성별:', patientGender);
                        break;
                    }
                }
            }
            
            // 기본값 설정 (실제 데이터를 찾을 수 없는 경우에만)
            const finalAge = patientAge !== null ? patientAge : 65;
            const finalGender = patientGender !== null ? patientGender : 'M';
            
            console.log(`최종 환자 정보 - 나이: ${finalAge}${patientAge === null ? ' (기본값)' : ''}, 성별: ${finalGender}${patientGender === null ? ' (기본값)' : ''}`);
            
            return { 
                age: finalAge, 
                gender: finalGender,
                // 디버깅을 위해 원본 데이터도 포함
                _debug: {
                    foundAge: patientAge !== null,
                    foundGender: patientGender !== null,
                    originalData: {
                        birthdate: patientDetails?.person?.birthdate,
                        age: patientDetails?.person?.age,
                        gender: patientDetails?.person?.gender
                    }
                }
            };
            
        } catch (error) {
            console.error('환자 정보 조회 실패:', error);
            return { 
                age: 65, 
                gender: 'M',
                _debug: {
                    error: error.message,
                    foundAge: false,
                    foundGender: false
                }
            };
        }
    };

    const resetForm = () => {
        setStrokeType('');
        setNihssScore('');
        setReperfusionTreatment(false);
        setReperfusionTime('');
        setStrokeDate('');
        setHoursAfterStroke('');
        setNotes('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage('');

        try {
            // 입력값 검증
            if (!strokeType) {
                throw new Error('뇌졸중 유형을 선택해주세요.');
            }
            if (!nihssScore || parseInt(nihssScore) < 0 || parseInt(nihssScore) > 42) {
                throw new Error('유효한 NIHSS 점수를 입력해주세요. (0-42)');
            }
            
            // 재관류 치료 관련 검증
            if (reperfusionTreatment && (!reperfusionTime || parseFloat(reperfusionTime) <= 0)) {
                throw new Error('재관류 치료를 받은 경우 치료 시간을 입력해주세요.');
            }

            // 환자 정보 추출
            const patientInfo = await extractPatientInfo(selectedPatient.uuid);
            console.log('추출된 환자 정보:', patientInfo);

            // 뇌졸중 정보 데이터 구성
            const strokeInfoData = {
                patient: selectedPatient.uuid,
                stroke_info: {
                    stroke_type: strokeType,
                    nihss_score: parseInt(nihssScore) || 0,
                    reperfusion_treatment: Boolean(reperfusionTreatment),
                    reperfusion_time: reperfusionTreatment ? (parseFloat(reperfusionTime) || null) : null,
                    stroke_date: strokeDate || null,
                    hours_after_stroke: hoursAfterStroke ? parseFloat(hoursAfterStroke) : null,
                },
                notes: notes || '',
                recorded_at: recordedAt,
            };

            console.log('전송할 뇌졸중 정보:', strokeInfoData);

            // 1. 뇌졸중 정보 저장
            await aiService.registerStrokeInfo(strokeInfoData);

            // 2. SOD2 평가 요청
            const assessmentData = {
                patient: selectedPatient.uuid,
                age: patientInfo.age,
                gender: patientInfo.gender,
                stroke_info: strokeInfoData.stroke_info,
            };

            console.log('전송할 SOD2 평가 데이터:', assessmentData);
            
            const result = await aiService.assessSOD2Status(assessmentData);
            console.log('SOD2 평가 결과:', result);
            
            const sod2Level = result.result?.sod2_status?.current_level;
            if (sod2Level !== undefined) {
                setSuccessMessage(`평가 등록 성공! SOD2 Level: ${(sod2Level * 100).toFixed(1)}%`);
            } else {
                setSuccessMessage('평가가 성공적으로 등록되었습니다.');
            }
            
            resetForm();

        } catch (err) {
            console.error('SOD2 평가 오류:', err);
            let errorMessage = '데이터 등록에 실패했습니다.';
            
            if (err.response?.data) {
                errorMessage += ` 서버 응답: ${err.response.data.error || err.response.data.detail || JSON.stringify(err.response.data)}`;
            } else if (err.message) {
                errorMessage += ` ${err.message}`;
            } else {
                errorMessage += ' 서버 내부 오류가 발생했습니다. 입력 데이터를 확인해주세요.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
            <h4>새 SOD2 평가 정보 입력</h4>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                    <label>뇌졸중 유형:*</label>
                    <select 
                        value={strokeType} 
                        onChange={(e) => setStrokeType(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '8px' }}
                    >
                        <option value="">선택</option>
                        <option value="ischemic_reperfusion">허혈성 재관류</option>
                        <option value="ischemic_no_reperfusion">허혈성 비재관류</option>
                        <option value="hemorrhagic">출혈성</option>
                    </select>
                </div>
                
                <div>
                    <label>NIHSS 점수 (0-42):*</label>
                    <input 
                        type="number" 
                        value={nihssScore} 
                        onChange={(e) => setNihssScore(e.target.value)} 
                        required 
                        min="0" 
                        max="42" 
                        style={{ width: '100%', padding: '8px' }} 
                    />
                </div>
                
                <div>
                    <label>뇌졸중 발생일:</label>
                    <input 
                        type="date" 
                        value={strokeDate} 
                        onChange={(e) => setStrokeDate(e.target.value)} 
                        style={{ width: '100%', padding: '8px' }} 
                    />
                </div>
                
                <div>
                    <label>뇌졸중 후 경과 시간(시간):</label>
                    <input 
                        type="number" 
                        value={hoursAfterStroke} 
                        onChange={(e) => setHoursAfterStroke(e.target.value)} 
                        min="0"
                        step="0.1"
                        style={{ width: '100%', padding: '8px' }} 
                        placeholder="선택사항 (자동 계산됨)"
                    />
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                            type="checkbox" 
                            checked={reperfusionTreatment} 
                            onChange={(e) => {
                                setReperfusionTreatment(e.target.checked);
                                if (!e.target.checked) {
                                    setReperfusionTime('');
                                }
                            }}
                        />
                        재관류 치료 받음
                    </label>
                </div>
                
                {reperfusionTreatment && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label>재관류 치료 시간(시간):*</label>
                        <input 
                            type="number" 
                            value={reperfusionTime} 
                            onChange={(e) => setReperfusionTime(e.target.value)} 
                            required={reperfusionTreatment}
                            min="0"
                            step="0.1"
                            style={{ width: '100%', padding: '8px' }} 
                            placeholder="예: 2.5"
                        />
                    </div>
                )}
                
                <div style={{ gridColumn: '1 / -1' }}>
                    <label>비고:</label>
                    <textarea 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                        rows="3" 
                        style={{ width: '100%', padding: '8px' }}
                        placeholder="추가 메모사항"
                    />
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                    <button 
                        type="submit" 
                        disabled={loading} 
                        style={{ 
                            width: '100%', 
                            padding: '12px', 
                            backgroundColor: loading ? '#ccc' : '#007bff', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? '처리 중...' : '기록 및 평가'}
                    </button>
                </div>
            </form>
            
            {successMessage && (
                <div style={{ 
                    color: 'green', 
                    marginTop: '10px', 
                    padding: '10px', 
                    backgroundColor: '#d4edda', 
                    border: '1px solid #c3e6cb', 
                    borderRadius: '4px' 
                }}>
                    {successMessage}
                </div>
            )}
            
            {error && (
                <div style={{ 
                    color: 'red', 
                    marginTop: '10px', 
                    padding: '10px', 
                    backgroundColor: '#f8d7da', 
                    border: '1px solid #f5c6cb', 
                    borderRadius: '4px' 
                }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default SOD2Import;