// 파일: /home/shared/medical_cdss/frontend/src/components/summaries/ComplicationPredictionSummary.js

import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
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
        
        const fetchLatest = async () => {
            setLoading(true);
            setError(null);
            try {
                // ✅ 1. 모든 예측을 가져오는 통합 API로 호출을 변경합니다.
                const response = await aiService.getPredictionResults(patientId);
                
                // ✅ 2. 전체 응답 객체에서 합병증 예측(complication_prediction) 데이터만 추출합니다.
                if (response && response.latest_predictions && response.latest_predictions.complication_prediction) {
                    const complicationData = response.latest_predictions.complication_prediction;
                    
                    // 데이터가 비어있는 객체({})가 아닌지 확인합니다.
                    if (complicationData && Object.keys(complicationData).length > 0) {
                        setPrediction(complicationData);
                    } else {
                        setPrediction(null); // 결과가 없으면 null로 설정
                    }
                } else {
                    setPrediction(null);
                }
            } catch (err) { 
                setError('합병증 예측 결과를 불러오는 데 실패했습니다.'); 
            } finally { 
                setLoading(false); 
            }
        };

        fetchLatest();
    }, [patientId]);

    if (loading) return <p>로딩 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return <ComplicationResult predictionData={prediction} />;
};