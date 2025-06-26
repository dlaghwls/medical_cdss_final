// /home/shared/medical_cdss/frontend/src/components/AI_result/Complication_result.js
import React from 'react';

/**
 * 합병증 예측 결과 표시 컴포넌트
 * SOD2_result.js와 일관된 구조로 만들어진 컴포넌트
 * @param {{ predictionData: object, analysisTime?: string }} props 
 */
export const ComplicationResult = ({ predictionData, analysisTime }) => {
    if (!predictionData) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                예측 결과가 없습니다.
            </div>
        );
    }

    // 합병증 이름 매핑
    const getComplicationName = (key) => {
        const names = {
            pneumonia: '폐렴',
            acute_kidney_injury: '급성 신장손상',
            heart_failure: '심부전'
        };
        return names[key] || key;
    };

    // 위험도별 색상 반환
    const getRiskColor = (riskLevel) => {
        switch (riskLevel?.toUpperCase()) {
            case 'HIGH':
            case 'CRITICAL':
                return '#dc3545'; // 빨간색
            case 'MEDIUM':
                return '#ffc107'; // 노란색
            case 'LOW':
                return '#28a745'; // 녹색
            default:
                return '#6c757d'; // 회색
        }
    };

    // 위험도 텍스트 반환
    const getRiskText = (riskLevel) => {
        switch (riskLevel?.toUpperCase()) {
            case 'HIGH':
                return '높음';
            case 'MEDIUM':
                return '보통';
            case 'LOW':
                return '낮음';
            case 'CRITICAL':
                return '매우 높음';
            default:
                return '미정';
        }
    };

    // 위험도 설명 반환
    const getRiskDescription = (riskLevel) => {
        switch (riskLevel?.toUpperCase()) {
            case 'HIGH':
            case 'CRITICAL':
                return '집중 모니터링 및 예방 조치 강화 권장';
            case 'MEDIUM':
                return '정기적 관찰 및 조기 개입 준비 필요';
            case 'LOW':
                return '표준 프로토콜에 따른 관리';
            default:
                return '추가 평가 필요';
        }
    };

    // 전체적인 위험도 평가
    const getOverallRiskAssessment = () => {
        const results = Object.values(predictionData).filter(result => 
            result && typeof result.probability !== 'undefined'
        );
        
        if (results.length === 0) return null;

        const highRiskCount = results.filter(r => r.risk_level?.toUpperCase() === 'HIGH' || r.risk_level?.toUpperCase() === 'CRITICAL').length;
        const mediumRiskCount = results.filter(r => r.risk_level?.toUpperCase() === 'MEDIUM').length;

        if (highRiskCount > 0) {
            return {
                level: 'HIGH',
                message: `${highRiskCount}개의 고위험 합병증이 예측됩니다. 즉시 예방 조치를 고려해주세요.`,
                color: '#dc3545'
            };
        } else if (mediumRiskCount > 0) {
            return {
                level: 'MEDIUM',
                message: `${mediumRiskCount}개의 중등도 위험 합병증이 예측됩니다. 주의 깊은 관찰이 필요합니다.`,
                color: '#ffc107'
            };
        } else {
            return {
                level: 'LOW',
                message: '전반적으로 낮은 위험도로 예측됩니다. 표준 관리 프로토콜을 유지해주세요.',
                color: '#28a745'
            };
        }
    };

    const overallAssessment = getOverallRiskAssessment();

    return (
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
                    📊 AI 합병증 예측 결과
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
            </div>

            {/* 전체 위험도 요약 */}
            {overallAssessment && (
                <div style={{ 
                    backgroundColor: '#f8f9fa',
                    border: `2px solid ${overallAssessment.color}`,
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '20px'
                }}>
                    <h4 style={{ 
                        margin: '0 0 8px 0', 
                        color: overallAssessment.color,
                        fontSize: '16px'
                    }}>
                        🎯 종합 위험도 평가
                    </h4>
                    <p style={{ 
                        margin: '0', 
                        color: '#333',
                        fontSize: '14px'
                    }}>
                        {overallAssessment.message}
                    </p>
                </div>
            )}

            {/* 개별 합병증 예측 결과 */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '20px', 
                marginBottom: '20px' 
            }}>
                {Object.entries(predictionData).map(([key, result]) => {
                    if (!result || typeof result.probability === 'undefined') return null;
                    
                    const probability = (result.probability * 100).toFixed(1);
                    const riskColor = getRiskColor(result.risk_level);
                    const riskText = getRiskText(result.risk_level);
                    const riskDescription = getRiskDescription(result.risk_level);
                    
                    return (
                        <div 
                            key={key} 
                            style={{ 
                                backgroundColor: '#f8f9fa',
                                border: `3px solid ${riskColor}`,
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center',
                                transition: 'transform 0.2s ease',
                                cursor: 'default'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                            {/* 합병증 이름 */}
                            <h4 style={{ 
                                margin: '0 0 12px 0', 
                                color: '#333',
                                fontSize: '18px'
                            }}>
                                {getComplicationName(key)}
                            </h4>
                            
                            {/* 확률 */}
                            <div style={{ 
                                fontSize: '36px', 
                                fontWeight: 'bold', 
                                color: riskColor, 
                                marginBottom: '10px',
                                lineHeight: '1'
                            }}>
                                {probability}%
                            </div>
                            
                            {/* 위험도 */}
                            <div style={{ 
                                fontSize: '16px', 
                                color: riskColor, 
                                fontWeight: 'bold', 
                                marginBottom: '8px'
                            }}>
                                위험도: {riskText}
                            </div>

                            {/* 위험도 설명 */}
                            <div style={{ 
                                fontSize: '12px', 
                                color: '#666',
                                marginBottom: '10px',
                                lineHeight: '1.4'
                            }}>
                                {riskDescription}
                            </div>
                            
                            {/* 모델 신뢰도 */}
                            {result.model_confidence && (
                                <div style={{ 
                                    fontSize: '12px', 
                                    color: '#666',
                                    borderTop: '1px solid #ddd',
                                    paddingTop: '8px'
                                }}>
                                    모델 신뢰도: {(result.model_confidence * 100).toFixed(1)}%
                                </div>
                            )}

                            {/* 모델 성능 정보 (있는 경우) */}
                            {result.model_auc && (
                                <div style={{ 
                                    fontSize: '11px', 
                                    color: '#888',
                                    marginTop: '5px'
                                }}>
                                    AUC: {result.model_auc.toFixed(3)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 임상 가이드라인 */}
            <div style={{ 
                backgroundColor: '#e7f3ff', 
                border: '1px solid #b8daff',
                borderRadius: '8px',
                padding: '15px'
            }}>
                <h4 style={{ 
                    margin: '0 0 12px 0', 
                    color: '#004085',
                    fontSize: '16px'
                }}>
                    📋 임상 가이드라인
                </h4>
                
                <div style={{ color: '#004085', fontSize: '14px', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>🔴 높은 위험도 (HIGH):</strong> 즉시 예방 조치를 시행하고 집중 모니터링을 실시하세요.
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>🟡 중간 위험도 (MEDIUM):</strong> 정기적인 관찰과 조기 개입 준비가 필요합니다.
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>🟢 낮은 위험도 (LOW):</strong> 표준 프로토콜에 따른 관리를 유지하세요.
                    </div>
                </div>

                <div style={{ 
                    marginTop: '12px',
                    fontSize: '12px', 
                    color: '#004085',
                    fontStyle: 'italic',
                    borderTop: '1px solid #b8daff',
                    paddingTop: '8px'
                }}>
                    ※ 본 AI 예측 결과는 의료진의 임상 판단을 보조하는 도구입니다. 
                    최종 진료 결정은 환자의 전체적인 상태와 의료진의 종합적 판단에 따라 이루어져야 합니다.
                </div>
            </div>
        </div>
    );
};

export default ComplicationResult;