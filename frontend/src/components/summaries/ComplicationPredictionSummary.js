// frontend/src/components/summaries/ComplicationPredictionSummary.js

import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
// "예측 결과"를 보여주는 ComplicationResult 컴포넌트를 import 합니다.
import { ComplicationResult } from '../AI_result/Complication_result'; 

export const ComplicationPredictionSummary = ({ patientId }) => {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!patientId) {
            setLoading(false);
            setPrediction(null);
            return;
        }

        const fetchLatestPrediction = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. 모든 예측 결과를 가져오는 통합 API를 호출합니다.
                const results = await aiService.getPredictionResults(patientId);
                
                // 2. 받아온 전체 결과에서 'complications' 부분만 추출합니다.
                if (results && results.complications) {
                    setPrediction(results.complications);
                } else {
                    // 예측 결과가 없는 경우
                    setPrediction(null);
                }
            } catch (err) {
                setError('합병증 예측 결과를 불러오는 데 실패했습니다.');
                console.error("Fetch Complication Prediction Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestPrediction();
    }, [patientId]);

    if (loading) return <p>로딩 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    // 3. 이제 예측 결과를 표시하는 ComplicationResult 컴포넌트를 사용합니다.
    // 데이터가 없거나 비어있는 경우, ComplicationResult 내부에서 "예측 결과가 없습니다"라고 표시해줍니다.
    return <ComplicationResult predictionData={prediction} />;
};
