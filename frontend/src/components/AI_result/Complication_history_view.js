// /home/shared/medical_cdss/frontend/src/components/AI_result/Complication_history_view.js
import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';

export const formatComplicationsRecord = (record) => {
    const complicationLabels = { 
        sepsis: '패혈증', 
        respiratory_failure: '호흡부전', 
        deep_vein_thrombosis: '심부정맥혈전증', 
        pulmonary_embolism: '폐색전증', 
        urinary_tract_infection: '요로감염', 
        gastrointestinal_bleeding: '위장관 출혈' 
    };
    const medicationLabels = { 
        anticoagulant_flag: '항응고제', 
        antiplatelet_flag: '항혈소판제', 
        thrombolytic_flag: '혈전용해제', 
        antihypertensive_flag: '항고혈압제', 
        statin_flag: '스타틴', 
        antibiotic_flag: '항생제', 
        vasopressor_flag: '승압제' 
    };
    const complicationEntries = Object.entries(record.complications || {}).filter(([, value]) => value).map(([key]) => complicationLabels[key]);
    const medicationEntries = Object.entries(record.medications || {}).filter(([, value]) => value).map(([key]) => medicationLabels[key]);
    
    return [
        { label: '조회된 합병증', value: complicationEntries.length > 0 ? complicationEntries.join(', ') : '해당 없음' },
        { label: '처방된 약물', value: medicationEntries.length > 0 ? medicationEntries.join(', ') : '해당 없음' },
        { label: '기록 시각', value: new Date(record.recorded_at).toLocaleString() },
        { label: '비고', value: record.notes || '없음' }
    ];
};

export const ComplicationHistoryView = ({ selectedPatient }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedPatient?.uuid) {
            setLoading(false);
            // ★★★ 수정된 부분 ★★★
            // 환자 선택이 해제되면 기존 기록을 비웁니다.
            setRecords([]); 
            return;
        }

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await aiService.fetchComplicationsHistory(selectedPatient.uuid);
                const sortedData = data.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
                setRecords(sortedData);
            } catch (err) {
                setError(`기록 조회 실패: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [selectedPatient]);

    if (loading) return <p>과거 기록을 불러오는 중입니다...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
            <h4>합병증 및 투약 정보 과거 기록</h4>
            <p><strong>대상 환자:</strong> {selectedPatient?.display || '환자를 선택해주세요'}</p>
            {records.length === 0 ? (
                <p>이 환자에 대한 기록이 없습니다.</p>
            ) : (
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {records.map(record => (
                        <div key={record.id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
                            {formatComplicationsRecord(record).map((item, index) => (
                                <p key={index} style={{ margin: '5px 0' }}>
                                    <strong>{item.label}:</strong> {item.value}
                                </p>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};