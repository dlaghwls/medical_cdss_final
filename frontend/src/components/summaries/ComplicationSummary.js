import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import { formatComplicationsRecord } from '../../utils/aiResultFormatters';

export const ComplicationSummary = ({ patientId }) => {
    const [latestRecord, setLatestRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!patientId) { setLoading(false); setLatestRecord(null); return; }
        const fetchLatest = async () => {
            setLoading(true); setError(null);
            try {
                const history = await aiService.fetchComplicationsHistory(patientId);
                if (history && history.length > 0) {
                    setLatestRecord(history[0]);
                } else { setLatestRecord(null); }
            } catch (err) { setError('합병증 기록 로딩 실패'); } finally { setLoading(false); }
        };
        fetchLatest();
    }, [patientId]);

    if (loading) return <p>로딩 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!latestRecord) return <p>데이터 없음</p>;
    
    return (
        <div>
            {formatComplicationsRecord(latestRecord).map((item, index) => (
                <p key={index} style={{ margin: '5px 0' }}>
                    <strong>{item.label}:</strong> {item.value}
                </p>
            ))}
        </div>
    );
};