// /home/shared/medical_cdss/frontend/src/pages/AI_import/SOD2_import.js
import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import { fetchPatientDetails } from '../../services/djangoApiService'; // 나이, 성별 가져오기 위해 필요

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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage('');

        const strokeInfoData = {
            patient: selectedPatient.uuid,
            stroke_info: {
                stroke_type: strokeType,
                nihss_score: parseInt(nihssScore) || 0,
                reperfusion_treatment: reperfusionTreatment,
                reperfusion_time: parseFloat(reperfusionTime) || null,
                stroke_date: strokeDate,
                hours_after_stroke: parseFloat(hoursAfterStroke) || null,
            },
            notes: notes,
            recorded_at: recordedAt,
        };

        try {
            // 1. 뇌졸중 정보 저장
            await aiService.registerStrokeInfo(strokeInfoData);

            // 2. SOD2 평가를 위한 환자 정보(나이, 성별) 조회
            const patientDetails = await fetchPatientDetails(selectedPatient.uuid);
            const patientAge = patientDetails?.person?.birthdate ? new Date().getFullYear() - new Date(patientDetails.person.birthdate).getFullYear() : 65;
            const patientGender = patientDetails?.person?.gender || 'M';

            // 3. SOD2 평가 요청
            const assessmentData = {
                patient: selectedPatient.uuid,
                age: patientAge,
                gender: patientGender,
                stroke_info: strokeInfoData.stroke_info,
            };
            const result = await aiService.assessSOD2Status(assessmentData);
            
            setSuccessMessage(`평가 등록 성공! SOD2 Level: ${(result.result.sod2_status.current_level * 100).toFixed(1)}%`);
            resetForm();

        } catch (err) {
            setError('데이터 등록에 실패했습니다. ' + (err.message || ''));
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
                    <select value={strokeType} onChange={(e) => setStrokeType(e.target.value)} required style={{ width: '100%', padding: '8px' }}>
                        <option value="">선택</option>
                        <option value="ischemic_reperfusion">허혈성 재관류</option>
                        <option value="ischemic_no_reperfusion">허혈성 비재관류</option>
                        <option value="hemorrhagic">출혈성</option>
                    </select>
                </div>
                <div>
                    <label>NIHSS 점수 (0-42):*</label>
                    <input type="number" value={nihssScore} onChange={(e) => setNihssScore(e.target.value)} required min="0" max="42" style={{ width: '100%', padding: '8px' }} />
                </div>
                {/* ... 다른 폼 필드들도 동일한 패턴으로 구성 ... */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <label>비고:</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" style={{ width: '100%', padding: '8px' }}></textarea>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                        {loading ? '처리 중...' : '기록 및 평가'}
                    </button>
                </div>
            </form>
            {successMessage && <p style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
    );
};

export default SOD2Import; 