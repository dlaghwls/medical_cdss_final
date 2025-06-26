import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import { SOD2Result } from '../AI_result/SOD2_result';
import { normalizeAssessmentData } from '../../utils/aiResultFormatters';

export const SOD2Summary = ({ patientId }) => {
    const [latestAssessment, setLatestAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!patientId) { setLoading(false); setLatestAssessment(null); return; }
        const fetchLatestAssessment = async () => {
            setLoading(true); setError(null);
            try {
                const allAssessments = await aiService.fetchSOD2Assessments(patientId);
                if (allAssessments && allAssessments.length > 0) {
                    const sorted = allAssessments.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
                    const latest = sorted[sorted.length - 1];
                    setLatestAssessment(normalizeAssessmentData(latest));
                } else { setLatestAssessment(null); }
            } catch (err) { setError('SOD2 평가 결과 로딩 실패'); } finally { setLoading(false); }
        };
        fetchLatestAssessment();
    }, [patientId]);

    if (loading) return <p>로딩 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!latestAssessment) return <p>데이터 없음</p>;

    return (
        <div style={{ padding: '15px', border: '1px solid #dee2e6', borderRadius: '8px', backgroundColor: 'white' }}>
            <SOD2Result assessmentData={latestAssessment} />
        </div>
    );
};