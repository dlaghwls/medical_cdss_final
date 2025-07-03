// =====================================================================
// 파일: /home/shared/medical_cdss/frontend/src/components/summaries/GeneSummary.js
// 자식 컴포넌트(GeneResultDisplay)에 맞춰 수정한 최종 코드입니다.
// =====================================================================

import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
// ★★★ 1. default export된 GeneResultDisplay를 올바르게 import 합니다. ★★★
import GeneResultDisplay from '../AI_result/Gene_result'; 

// ★★★ 2. selectedPatient prop을 통째로 받도록 수정합니다. ★★★
export const GeneSummary = ({ selectedPatient }) => {
    const [geneData, setGeneData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // patientId 대신 selectedPatient 객체의 존재 여부를 확인합니다.
        if (!selectedPatient?.uuid) { 
            setLoading(false); 
            setGeneData(null); 
            return; 
        }

        const fetchLatest = async () => {
            setLoading(true); 
            setError(null);
            try {
                // selectedPatient에서 uuid를 사용합니다.
                const latestGeneResult = await aiService.fetchLatestGeneAssessment(selectedPatient.uuid);
                setGeneData(latestGeneResult);
            } catch (err) { 
                setError('유전자 분석 결과를 불러오는 데 실패했습니다.'); 
            } finally { 
                setLoading(false); 
            }
        };

        fetchLatest();
    }, [selectedPatient]); // 의존성 배열을 selectedPatient로 변경합니다.

    if (loading) return <p>로딩 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    // ★★★ 3. GeneResultDisplay를 렌더링하고, 자식이 원하는 props(result, selectedPatient)를 내려줍니다. ★★★
    return <GeneResultDisplay result={geneData} selectedPatient={selectedPatient} />;
};