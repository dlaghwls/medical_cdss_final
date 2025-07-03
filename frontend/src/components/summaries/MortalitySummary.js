// 파일: /home/shared/medical_cdss/frontend/src/components/summaries/MortalitySummary.js

import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import { MortalityResult } from '../AI_result/Death_result';

export const MortalitySummary = ({ patientId }) => {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!patientId) {
            setLoading(false);
            setPrediction(null);
            return;
        }

        const fetchLatest = async () => {
            setLoading(true);
            setError(null);
            try {
                // ✅ 1. 모든 예측을 가져오는 통합 API로 호출을 변경합니다. (위와 동일)
                const response = await aiService.getPredictionResults(patientId);

                // ✅ 2. 전체 응답 객체에서 사망률 예측(mortality_prediction) 데이터만 추출합니다.
                if (response && response.latest_predictions && response.latest_predictions.mortality_prediction) {
                    const mortalityData = response.latest_predictions.mortality_prediction;

                    // 데이터가 비어있는 객체({})가 아닌지 확인합니다.
                    if (mortalityData && Object.keys(mortalityData).length > 0) {
                        setPrediction(mortalityData);
                    } else {
                        setPrediction(null); // 결과가 없으면 null로 설정
                    }
                } else {
                    setPrediction(null);
                }
            } catch (err) { 
                setError('사망률 예측 로딩 실패'); 
            } finally { 
                setLoading(false); 
            }
        };

        fetchLatest();
    }, [patientId]);

    if (loading) return <p>로딩 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    
    return <MortalityResult predictionData={prediction} />;
};