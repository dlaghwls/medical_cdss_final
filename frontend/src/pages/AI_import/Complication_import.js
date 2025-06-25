// /home/shared/medical_cdss/frontend/src/pages/AI_import/Complication_import.js

import React, { useState, useEffect } from 'react';
// ★★★ 상단의 aiService 임포트 구문을 삭제합니다. ★★★
// import aiService from '../../services/aiService';

// 이 컴포넌트는 부모로부터 selectedPatient(환자정보)를 props로 받습니다.
export const ComplicationImport = ({ selectedPatient }) => {
    // --- State Hooks (기존과 동일) ---
    const [complications, setComplications] = useState({
        sepsis: false,
        respiratory_failure: false,
        deep_vein_thrombosis: false,
        pulmonary_embolism: false,
        urinary_tract_infection: false,
        gastrointestinal_bleeding: false,
    });
    const [medications, setMedications] = useState({
        anticoagulant_flag: false,
        antiplatelet_flag: false,
        thrombolytic_flag: false,
        antihypertensive_flag: false,
        statin_flag: false,
        antibiotic_flag: false,
        vasopressor_flag: false,
    });
    const [notes, setNotes] = useState('');
    const [recordedAt, setRecordedAt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const now = new Date();
        const formattedDateTime = now.toISOString().slice(0, 16);
        setRecordedAt(formattedDateTime);
    }, []);

    const handleComplicationChange = (e) => {
        setComplications({ ...complications, [e.target.name]: e.target.checked });
    };

    const handleMedicationChange = (e) => {
        setMedications({ ...medications, [e.target.name]: e.target.checked });
    };

    // ★★★ handleSubmit 함수를 async로 변경합니다. ★★★
    const handleSubmit = async (e) => {
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
            patient: selectedPatient.uuid,
            complications,
            medications,
            notes,
            recorded_at: recordedAt,
        };

        try {
            // ★★★ 수정된 부분: 함수가 호출되는 시점에 aiService를 동적으로 임포트합니다. ★★★
            const { default: aiService } = await import('../../services/aiService');

            // 이제 aiService 객체를 통해 함수를 정상적으로 호출할 수 있습니다.
            await aiService.registerComplicationsAndMedications(submissionData);

            setSuccessMessage('합병증 및 투약 정보가 성공적으로 기록되었습니다.');
            // 성공 후 폼 초기화
            setComplications({ sepsis: false, respiratory_failure: false, deep_vein_thrombosis: false, pulmonary_embolism: false, urinary_tract_infection: false, gastrointestinal_bleeding: false });
            setMedications({ anticoagulant_flag: false, antiplatelet_flag: false, thrombolytic_flag: false, antihypertensive_flag: false, statin_flag: false, antibiotic_flag: false, vasopressor_flag: false });
            setNotes('');
        } catch (err) {
            setError(`기록 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
        }
    };

    // --- JSX (기존과 동일) ---
    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
            <h4>새 합병증 및 투약 정보 기록</h4>
             <p><strong>대상 환자:</strong> {selectedPatient?.display || '환자를 선택해주세요'}</p>
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <h4>기존 합병증 (해당하는 항목을 체크하세요)</h4>
                        {Object.keys(complications).map(key => (
                            <div key={key} style={{ marginBottom: '5px' }}>
                                <input type="checkbox" id={key} name={key} checked={complications[key]} onChange={handleComplicationChange} style={{ marginRight: '8px' }} />
                                <label htmlFor={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                            </div>
                        ))}
                    </div>
                    <div>
                        <h4>현재 투약 정보 (해당하는 항목을 체크하세요)</h4>
                        {Object.keys(medications).map(key => (
                            <div key={key} style={{ marginBottom: '5px' }}>
                                <input type="checkbox" id={key} name={key} checked={medications[key]} onChange={handleMedicationChange} style={{ marginRight: '8px' }} />
                                <label htmlFor={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                    <label>기록 날짜/시간:</label>
                    <input type="datetime-local" value={recordedAt} onChange={(e) => setRecordedAt(e.target.value)} required style={{ marginLeft: '10px', padding: '5px' }} />
                </div>
                <div style={{ marginTop: '15px' }}>
                    <label>비고:</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" style={{ width: '95%', display: 'block', marginTop: '5px', padding: '8px' }}></textarea>
                </div>
                <button type="submit" disabled={loading} style={{ marginTop: '20px', padding: '10px 20px' }}>
                    {loading ? '기록 중...' : '정보 기록'}
                </button>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                {successMessage && <p style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}
            </form>
        </div>
    );
};