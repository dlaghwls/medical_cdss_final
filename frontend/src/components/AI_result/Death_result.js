// /home/shared/medical_cdss/frontend/src/components/AI_result/Death_result.js
import React from 'react';

const Death_result = ({ result, onClose }) => {
    if (!result) {
        return null;
    }

    // 예측 결과에 따라 스타일을 다르게 설정
    const resultStyle = {
        padding: '10px',
        borderRadius: '4px',
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: '10px',
        backgroundColor: result.prediction === 'high_risk' ? '#dc3545' : '#28a745', // 예시: 고위험군은 빨간색
    };

    return (
        <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '400px', background: 'white', padding: '25px', borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)', zIndex: 1050
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>사망률 예측 결과</h4>
                <button onClick={onClose} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
            </div>
            <hr style={{ margin: '15px 0' }} />
            <div>
                <p><strong>환자:</strong> {result.patient_display_name || 'N/A'}</p>
                <p><strong>예측 시점:</strong> {new Date(result.predicted_at).toLocaleString()}</p>
                <p><strong>입력된 주요 정보:</strong></p>
                <ul style={{ fontSize: '0.9em' }}>
                    <li>나이: {result.age}, 성별: {result.gender}</li>
                    <li>수축기 혈압: {result.systolic_bp} mmHg</li>
                    <li>혈당: {result.glucose} mg/dL</li>
                </ul>
                <div style={resultStyle}>
                    {/* 백엔드 응답에 따라 키를 'prediction_text' 등으로 수정하세요. */}
                    예측: {result.prediction_text || '결과 없음'}
                </div>
            </div>
        </div>
    );
};

export default Death_result;