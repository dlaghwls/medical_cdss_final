// /home/shared/medical_cdss/frontend/src/components/AI_result/Death_result.js
import React from 'react';

/**
 * 사망률 예측 결과 표시 컴포넌트
 * Complication_result.js와 일관된 구조로 개선된 버전
 * @param {{ predictionData: object, analysisTime?: string, showAsModal?: boolean, onClose?: function }} props 
 */
export const MortalityResult = ({ predictionData, analysisTime, showAsModal = false, onClose }) => {
    if (!predictionData) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                예측 결과가 없습니다.
            </div>
        );
    }

    // 위험도별 색상과 텍스트 반환
    const getRiskInfo = (probability) => {
        if (probability >= 0.5) {
            return {
                color: '#dc3545', // 빨간색
                level: 'CRITICAL',
                text: '매우 높음',
                description: '즉시 집중치료 및 적극적 모니터링 필요',
                bgColor: '#f8d7da'
            };
        } else if (probability >= 0.3) {
            return {
                color: '#fd7e14', // 주황색
                level: 'HIGH',
                text: '높음',
                description: '집중적인 관찰과 예방적 조치 시행',
                bgColor: '#ffeaa7'
            };
        } else if (probability >= 0.1) {
            return {
                color: '#ffc107', // 노란색
                level: 'MEDIUM',
                text: '보통',
                description: '정기적 관찰 및 조기 개입 준비',
                bgColor: '#fff3cd'
            };
        } else {
            return {
                color: '#28a745', // 녹색
                level: 'LOW',
                text: '낮음',
                description: '표준 치료 프로토콜 적용',
                bgColor: '#d1edcc'
            };
        }
    };

    const mortalityProbability = predictionData.mortality_probability || predictionData.mortality_30_day || 0;
    const survivalProbability = 1 - mortalityProbability;
    const riskInfo = getRiskInfo(mortalityProbability);

    const resultContent = (
        <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #ddd', 
            borderRadius: '12px', 
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* 헤더 */}
            <div style={{ marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '15px' }}>
                <h3 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    💀 30일 사망률 예측 결과
                </h3>
                {analysisTime && (
                    <p style={{ 
                        margin: '0', 
                        fontSize: '14px', 
                        color: '#666' 
                    }}>
                        분석 시간: {analysisTime}
                    </p>
                )}
                {predictionData.patient_display_name && (
                    <p style={{ 
                        margin: '5px 0 0 0', 
                        fontSize: '14px', 
                        color: '#666' 
                    }}>
                        환자: {predictionData.patient_display_name}
                    </p>
                )}
            </div>

            {/* 메인 결과 카드 */}
            <div style={{ 
                backgroundColor: riskInfo.bgColor,
                border: `3px solid ${riskInfo.color}`,
                borderRadius: '16px',
                padding: '30px',
                textAlign: 'center',
                marginBottom: '25px',
                background: `linear-gradient(135deg, ${riskInfo.bgColor} 0%, ${riskInfo.bgColor}ee 100%)`
            }}>
                <h4 style={{ 
                    margin: '0 0 15px 0', 
                    color: '#333',
                    fontSize: '18px'
                }}>
                    30일 사망률
                </h4>
                
                <div style={{ 
                    fontSize: '48px', 
                    fontWeight: 'bold', 
                    color: riskInfo.color, 
                    marginBottom: '15px',
                    lineHeight: '1'
                }}>
                    {(mortalityProbability * 100).toFixed(1)}%
                </div>
                
                <div style={{ 
                    fontSize: '18px', 
                    color: riskInfo.color, 
                    fontWeight: 'bold', 
                    marginBottom: '10px'
                }}>
                    위험도: {riskInfo.text}
                </div>

                <div style={{ 
                    fontSize: '14px', 
                    color: '#333',
                    marginBottom: '15px',
                    lineHeight: '1.4'
                }}>
                    {riskInfo.description}
                </div>

                <div style={{ 
                    fontSize: '16px', 
                    color: '#27ae60',
                    fontWeight: '600',
                    borderTop: '1px solid #ddd',
                    paddingTop: '15px'
                }}>
                    생존 확률: {(survivalProbability * 100).toFixed(1)}%
                </div>
            </div>

            {/* 추가 정보 그리드 */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '15px', 
                marginBottom: '20px' 
            }}>
                {/* 모델 신뢰도 */}
                {predictionData.model_confidence && (
                    <div style={{ 
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'center'
                    }}>
                        <h5 style={{ margin: '0 0 8px 0', color: '#495057', fontSize: '14px' }}>
                            모델 신뢰도
                        </h5>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>
                            {(predictionData.model_confidence * 100).toFixed(1)}%
                        </div>
                    </div>
                )}

                {/* 모델 성능 */}
                {predictionData.model_auc && (
                    <div style={{ 
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'center'
                    }}>
                        <h5 style={{ margin: '0 0 8px 0', color: '#495057', fontSize: '14px' }}>
                            모델 AUC
                        </h5>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6f42c1' }}>
                            {predictionData.model_auc.toFixed(3)}
                        </div>
                    </div>
                )}

                {/* 처리 시간 */}
                {predictionData.processing_time && (
                    <div style={{ 
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'center'
                    }}>
                        <h5 style={{ margin: '0 0 8px 0', color: '#495057', fontSize: '14px' }}>
                            처리 시간
                        </h5>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#17a2b8' }}>
                            {predictionData.processing_time.toFixed(2)}초
                        </div>
                    </div>
                )}
            </div>

            {/* 위험 요인 분석 */}
            {predictionData.risk_factors && Object.keys(predictionData.risk_factors).length > 0 && (
                <div style={{ 
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '20px'
                }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#856404', fontSize: '16px' }}>
                        ⚠️ 주요 위험 요인
                    </h5>
                    <div style={{ fontSize: '14px', color: '#856404' }}>
                        {Object.entries(predictionData.risk_factors).map(([key, value]) => (
                            <div key={key} style={{ marginBottom: '5px' }}>
                                <strong>{key}:</strong> {value}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 임상 가이드라인 */}
            <div style={{ 
                backgroundColor: '#e7f3ff', 
                border: '1px solid #b8daff',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h4 style={{ 
                    margin: '0 0 15px 0', 
                    color: '#004085',
                    fontSize: '16px'
                }}>
                    📋 임상 가이드라인
                </h4>
                
                <div style={{ color: '#004085', fontSize: '14px', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <strong>🔴 매우 높음 (≥50%):</strong> 즉시 집중치료실 입원 및 적극적 생명 유지 치료 고려
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <strong>🟠 높음 (30-49%):</strong> 집중적인 관찰과 예방적 조치 시행, 가족 상담 필요
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <strong>🟡 보통 (10-29%):</strong> 정기적 관찰 및 조기 개입 준비, 증상 변화 모니터링
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <strong>🟢 낮음 (&lt;10%):</strong> 표준 치료 프로토콜 적용, 일반적인 경과 관찰
                    </div>
                </div>

                <div style={{ 
                    marginTop: '15px',
                    fontSize: '12px', 
                    color: '#004085',
                    fontStyle: 'italic',
                    borderTop: '1px solid #b8daff',
                    paddingTop: '10px'
                }}>
                    ※ 본 AI 예측 결과는 의료진의 임상 판단을 보조하는 도구입니다. 
                    환자의 전체적인 상태, 동반 질환, 치료 반응성 등을 종합적으로 고려하여 최종 치료 방향을 결정해야 합니다.
                </div>
            </div>
        </div>
    );

    // 모달로 표시하는 경우
    if (showAsModal) {
        return (
            <div style={{
                position: 'fixed', 
                top: '0', 
                left: '0', 
                width: '100%', 
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1050
            }}>
                <div style={{
                    maxWidth: '600px',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    margin: '20px'
                }}>
                    {/* 닫기 버튼 */}
                    <div style={{ 
                        textAlign: 'right', 
                        marginBottom: '10px' 
                    }}>
                        <button 
                            onClick={onClose}
                            style={{ 
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '35px',
                                height: '35px',
                                fontSize: '18px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            ×
                        </button>
                    </div>
                    {resultContent}
                </div>
            </div>
        );
    }

    // 일반 컴포넌트로 표시하는 경우
    return resultContent;
};

// 기존 컴포넌트와의 호환성을 위한 별칭
const Death_result = ({ result, onClose }) => {
    if (!result) return null;
    
    return (
        <MortalityResult 
            predictionData={result}
            analysisTime={result.predicted_at ? new Date(result.predicted_at).toLocaleString() : new Date().toLocaleString()}
            showAsModal={true}
            onClose={onClose}
        />
    );
};

export default Death_result;