// /home/shared/medical_cdss/frontend/src/components/AI_result/Gene_result.js (변경 없음)
import React from 'react';

const GeneResultDisplay = ({ result, selectedPatient }) => {
    if (!result) {
        return <p style={{ textAlign: 'center', color: '#555' }}>분석 결과가 아직 없습니다.</p>;
    }

    const getResultStatus = (probability) => {
        if (probability >= 0.7) {
            return { color: '#28a745', text: '긍정적 예측', icon: '✅' };
        } else if (probability <= 0.3) {
            return { color: '#dc3545', text: '부정적 예측', icon: '❌' };
        } else {
            return { color: '#ffc107', text: '보통', icon: 'ℹ️' };
        }
    };

    const status = getResultStatus(result.prediction_probability); // prediction_probability 사용

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
                    <p style={{ margin: '0 0 5px', fontSize: '0.9em', color: '#555' }}>모델 정보</p>
                    <p style={{ margin: '5px 0' }}><strong>모델 이름:</strong> {result.model_name || 'N/A'}</p>
                    <p style={{ margin: '5px 0' }}><strong>모델 버전:</strong> {result.model_version || 'N/A'}</p>
                    <p style={{ margin: '5px 0' }}><strong>결과 ID:</strong> {result.gene_ai_result_id || 'N/A'}</p>
                </div>

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