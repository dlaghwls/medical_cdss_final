// /home/shared/medical_cdss/frontend/src/components/AI_result/SOD2_result.js

import React from 'react';

/**
 * SOD2 평가 결과 한 건을 시각적으로 표시하는 컴포넌트입니다.
 * @param {{ assessmentData: object }} props - assessment_id, recorded_at, result, assessed_stroke_info 등을 포함하는 평가 결과 객체
 */
export const SOD2Result = ({ assessmentData }) => {
    if (!assessmentData) {
        return null;
    }

    const {
        recorded_at,
        result,
        assessed_stroke_info
    } = assessmentData;

    const {
        current_level,
        oxidative_stress_risk
    } = result.sod2_status;

    // 위험도에 따라 배경색을 다르게 설정
    const getRiskColor = (risk) => {
        if (risk === 'high') return '#ffebee'; // 옅은 빨강
        if (risk === 'medium') return '#fff8e1'; // 옅은 노랑
        return '#e8f5e9'; // 옅은 초록
    };

    return (
        <div style={{ 
            border: '1px solid #ddd', 
            padding: '15px', 
            marginBottom: '10px', 
            borderRadius: '8px',
            backgroundColor: getRiskColor(oxidative_stress_risk),
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
            <h5 style={{ marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                평가 시간: {new Date(recorded_at).toLocaleString()}
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                    <strong>SOD2 Level:</strong>
                    <p style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '5px 0', color: '#0056b3' }}>
                        {(current_level * 100).toFixed(1)}%
                    </p>
                </div>
                <div>
                    <strong>산화 스트레스 위험도:</strong>
                    <p style={{ fontSize: '1.2em', fontWeight: 'bold', margin: '5px 0', textTransform: 'capitalize' }}>
                        {oxidative_stress_risk}
                    </p>
                </div>
                <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
                    <h6 style={{ margin: '0 0 5px 0' }}>평가 시점의 뇌졸중 정보</h6>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9em' }}>
                        <li>NIHSS 점수: {assessed_stroke_info.nihss_score}</li>
                        <li>뇌졸중 유형: {assessed_stroke_info.stroke_type}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SOD2Result; 