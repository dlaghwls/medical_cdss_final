import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import GeneResultDisplay from '../AI_result/Gene_result';

export const GeneSummary = ({ patientId, selectedPatient }) => {
    const [latestResult, setLatestResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!patientId) { setLoading(false); setLatestResult(null); return; }
        const fetchLatest = async () => {
            setLoading(true); setError(null);
            try {
                const history = await aiService.getGeneHistory(patientId);
                if (history && history.length > 0) {
                    const sorted = history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    setLatestResult(sorted[0]);
                } else { setLatestResult(null); }
            } catch (err) { setError('유전자 분석 결과 로딩 실패'); } finally { setLoading(false); }
        };
        fetchLatest();
    }, [patientId]);

    if (loading) return <p>로딩 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    
    // GeneResultDisplay는 result와 selectedPatient prop을 모두 필요로 함
    return <GeneResultDisplay result={latestResult} selectedPatient={selectedPatient} />;
};