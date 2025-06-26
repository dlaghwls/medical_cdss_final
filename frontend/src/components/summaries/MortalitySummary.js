import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import { MortalityResult } from '../AI_result/Death_result';

export const MortalitySummary = ({ patientId }) => {
    const [latestResult, setLatestResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!patientId) { setLoading(false); setLatestResult(null); return; }
        const fetchLatest = async () => {
            setLoading(true); setError(null);
            try {
                const history = await aiService.getMortalityHistory(patientId);
                if (history && history.length > 0) {
                    const sorted = history.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
                    setLatestResult(sorted[0]);
                } else { setLatestResult(null); }
            } catch (err) { setError('사망률 예측 로딩 실패'); } finally { setLoading(false); }
        };
        fetchLatest();
    }, [patientId]);

    if (loading) return <p>로딩 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!latestResult) return <p>데이터 없음</p>;

    return <MortalityResult predictionData={latestResult} />;
};