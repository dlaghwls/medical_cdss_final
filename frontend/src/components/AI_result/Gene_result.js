import React from 'react';

const GeneResultDisplay = ({ result, selectedPatient }) => {
    if (!result) {
        return <p>분석 결과가 없습니다.</p>;
    }

    return (
        <div style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <h4>유전자 분석 최종 결과</h4>
            {selectedPatient && <p><strong>대상 환자:</strong> {selectedPatient.display}</p>}
            <p><strong>결과 ID:</strong> {result.gene_ai_result_id}</p>
            <p><strong>예측 확률:</strong> {(result.prediction_probability * 100).toFixed(2)}%</p>
            <p><strong>모델 이름:</strong> {result.model_name || 'N/A'}</p>
            <p><strong>모델 버전:</strong> {result.model_version || 'N/A'}</p>
            <p><strong>결과 메시지:</strong> {result.result_text}</p>
            
            {/* 필요하다면 여기에 추가적인 분석 결과 (표, 그래프 등)를 렌더링 */}
            {/* 예: result.details && <pre>{JSON.stringify(result.details, null, 2)}</pre> */}
        </div>
    );
};

export default GeneResultDisplay;