import React from 'react';
const GeneResultDisplay = ({ result, selectedPatient }) => {
    if (!result) {
        return <p style={{ textAlign: 'center', color: '#555' }}>분석 결과가 아직 없습니다.</p>;
    }

    // 예측 확률에 따른 시각적 피드백 로직 재설정
    // "높을수록 뇌졸중일 확률이 높은 것으로 부정적" 기준 적용
    const getResultStatus = (probability) => {
        if (probability >= 0.7) { // 70% 이상: 뇌졸중 확률 높음 (부정적)
            return { color: '#dc3545', text: '뇌졸중 위험 높음', icon: '🚨' }; // 경고 아이콘
        } else if (probability <= 0.3) { // 30% 이하: 뇌졸중 확률 낮음 (긍정적)
            return { color: '#28a745', text: '뇌졸중 위험 낮음', icon: '👍' }; // 긍정 아이콘
        } else { // 30% 초과 70% 미만: 중간 (관찰 필요)
            return { color: '#ffc107', text: '관찰 필요', icon: '⚠️' }; // 주의 아이콘
        }
    };

    const status = getResultStatus(result.prediction_probability);

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px', 
            padding: '20px', 
            backgroundColor: '#ffffff', 
            borderRadius: '10px', 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' 
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#333' }}>유전자 분석 최종 결과</h3>
                {selectedPatient && (
                    <span style={{ fontSize: '0.9em', color: '#666' }}>
                        대상 환자: <strong>{selectedPatient.display}</strong> ({selectedPatient.uuid.substring(0,8)}...)
                    </span>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {/* 예측 확률 카드 */}
                <div style={{ 
                    border: `2px solid ${status.color}`, 
                    borderRadius: '8px', 
                    padding: '20px', 
                    textAlign: 'center', 
                    backgroundColor: '#f8f9fa',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    <p style={{ margin: '0 0 10px', fontSize: '0.9em', color: '#555' }}>예측 확률</p>
                    <h2 style={{ margin: 0, color: status.color, fontSize: '2.5em' }}>
                        {status.icon} {(result.prediction_probability * 100).toFixed(1)}%
                    </h2>
                    <p style={{ margin: '10px 0 0', fontSize: '1em', fontWeight: 'bold', color: status.color }}>
                        {status.text}
                    </p>
                    <div style={{ 
                        width: '100%', 
                        backgroundColor: '#e0e0e0', 
                        borderRadius: '5px', 
                        height: '10px', 
                        marginTop: '10px', 
                        overflow: 'hidden' 
                    }}>
                        <div style={{ 
                            width: `${(result.prediction_probability * 100).toFixed(1)}%`, 
                            backgroundColor: status.color, 
                            height: '100%', 
                            borderRadius: '5px' 
                        }}></div>
                    </div>
                </div>

                {/* 모델 정보 카드 */}
                <div style={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    backgroundColor: '#f8f9fa',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <p style={{ margin: '0 0 5px', fontSize: '0.9em', color: '#555' }}>정보</p>
                    {/* ⭐⭐ 결과 ID 대신 환자 이름/식별자 표시 ⭐⭐ */}
                    <p style={{ margin: '5px 0' }}>
                        <strong>분석 대상:</strong> {selectedPatient ? selectedPatient.display : '환자 정보 없음'}
                    </p>
                    <p style={{ margin: '5px 0' }}><strong>모델 이름:</strong> {result.model_name || 'N/A'}</p>
                    <p style={{ margin: '5px 0' }}><strong>모델 버전:</strong> {result.model_version || 'N/A'}</p>
                </div>

                {/* 결과 메시지 카드 */}
                <div style={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px', 
                    padding: '20px', 
                    backgroundColor: '#f8f9fa',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <p style={{ margin: '0 0 5px', fontSize: '0.9em', color: '#555' }}>종합 의견</p>
                    <p style={{ margin: 0, fontSize: '1.1em', fontWeight: 'bold', color: '#444' }}>
                        {result.result_text || '제공된 추가 메시지가 없습니다.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GeneResultDisplay;