// /home/shared/medical_cdss/frontend/src/components/AI_result/SOD2_result.js

import React from 'react';

/**
 * SOD2 평가 결과 한 건을 시각적으로 표시하는 컴포넌트입니다.
 * API 응답 구조에 맞게 개선된 버전
 * @param {{ assessmentData: object }} props - assessment_id, recorded_at, result 등을 포함하는 평가 결과 객체
 */
export const SOD2Result = ({ assessmentData }) => {
    if (!assessmentData) {
        return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            평가 결과가 없습니다.
        </div>;
    }

    // API 응답 구조 정규화
    const normalizeData = (data) => {
        // 새로운 API 응답 구조 (current_sod2_level 등이 직접 있는 경우)
        if (data.current_sod2_level !== undefined) {
            return {
                recorded_at: data.recorded_at,
                sod2_status: {
                    current_level: data.current_sod2_level,
                    oxidative_stress_risk: data.oxidative_stress_risk,
                    overall_status: data.overall_status || '평가됨',
                    prediction_confidence: data.prediction_confidence || 0.8
                },
                patient_info: {
                    age: data.age || 'N/A',
                    gender: data.gender || 'N/A',
                    stroke_type: data.stroke_type,
                    nihss_score: data.nihss_score,
                    hours_after_stroke: data.hours_after_stroke
                },
                exercise_recommendations: {
                    can_start: data.exercise_can_start,
                    intensity: data.exercise_intensity,
                    monitoring_schedule: data.exercise_recommendations || '정기적 재평가 필요'
                },
                clinical_recommendations: data.clinical_recommendations ? 
                    (Array.isArray(data.clinical_recommendations) ? 
                     data.clinical_recommendations : 
                     data.clinical_recommendations.split('\n')) : 
                    [],
                sod2_prediction_data: data.sod2_prediction_data || []
            };
        }
        
        // 기존 구조 (result.sod2_status 형태)
        if (data.result) {
            return {
                recorded_at: data.recorded_at,
                sod2_status: data.result.sod2_status,
                patient_info: data.result.patient_info,
                exercise_recommendations: data.result.exercise_recommendations,
                clinical_recommendations: data.result.clinical_recommendations || [],
                sod2_prediction_data: data.result.sod2_prediction_data || []
            };
        }

        // 직접 구조인 경우
        return data;
    };

    const normalizedData = normalizeData(assessmentData);
    const {
        recorded_at,
        sod2_status,
        patient_info,
        exercise_recommendations,
        clinical_recommendations,
        sod2_prediction_data
    } = normalizedData;

    // 안전한 값 추출
    const currentLevel = sod2_status?.current_level || 0;
    const oxidativeStressRisk = sod2_status?.oxidative_stress_risk || 'unknown';
    const overallStatus = sod2_status?.overall_status || '평가됨';
    const predictionConfidence = sod2_status?.prediction_confidence || 0;

    // 위험도에 따라 배경색을 다르게 설정
    const getRiskColor = (risk) => {
        switch(risk) {
            case 'high': return '#ffebee'; // 옅은 빨강
            case 'medium': return '#fff8e1'; // 옅은 노랑
            case 'low': return '#e8f5e9'; // 옅은 초록
            default: return '#f5f5f5'; // 기본 회색
        }
    };

    const getRiskTextColor = (risk) => {
        switch(risk) {
            case 'high': return '#d32f2f';
            case 'medium': return '#f57c00';
            case 'low': return '#388e3c';
            default: return '#757575';
        }
    };

    const getRiskLabel = (risk) => {
        switch(risk) {
            case 'high': return '높음';
            case 'medium': return '보통';
            case 'low': return '낮음';
            default: return '알 수 없음';
        }
    };

    const getStrokeTypeLabel = (type) => {
        switch(type) {
            case 'ischemic_reperfusion': return '허혈성 재관류';
            case 'ischemic_no_reperfusion': return '허혈성 비재관류';
            case 'hemorrhagic': return '출혈성';
            default: return type || 'N/A';
        }
    };

    return (
        <div style={{ 
            border: '2px solid #e0e0e0', 
            padding: '20px', 
            marginBottom: '15px', 
            borderRadius: '12px',
            backgroundColor: getRiskColor(oxidativeStressRisk),
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s ease-in-out'
        }}>
            {/* 헤더 */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '2px solid #ddd'
            }}>
                <h5 style={{ 
                    margin: 0, 
                    color: '#333',
                    fontSize: '1.1em',
                    fontWeight: 'bold'
                }}>
                    📊 SOD2 평가 결과
                </h5>
                <span style={{ 
                    fontSize: '0.9em', 
                    color: '#666',
                    fontWeight: 'normal'
                }}>
                    {recorded_at ? new Date(recorded_at).toLocaleString() : '시간 정보 없음'}
                </span>
            </div>

            {/* 주요 지표 */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '15px',
                marginBottom: '20px'
            }}>
                {/* SOD2 수준 */}
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '15px', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <strong style={{ display: 'block', marginBottom: '5px', color: '#0066cc' }}>
                        SOD2 수준
                    </strong>
                    <p style={{ 
                        fontSize: '2em', 
                        fontWeight: 'bold', 
                        margin: '5px 0', 
                        color: '#0056b3' 
                    }}>
                        {(currentLevel * 100).toFixed(1)}%
                    </p>
                    <small style={{ color: '#666' }}>
                        신뢰도: {(predictionConfidence * 100).toFixed(1)}%
                    </small>
                </div>

                {/* 산화 스트레스 위험도 */}
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '15px', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <strong style={{ display: 'block', marginBottom: '5px', color: '#0066cc' }}>
                        산화 스트레스 위험도
                    </strong>
                    <p style={{ 
                        fontSize: '1.5em', 
                        fontWeight: 'bold', 
                        margin: '5px 0',
                        color: getRiskTextColor(oxidativeStressRisk)
                    }}>
                        {getRiskLabel(oxidativeStressRisk)}
                    </p>
                    <small style={{ color: '#666' }}>
                        전체 상태: {overallStatus}
                    </small>
                </div>

                {/* 운동 권장사항 */}
                {exercise_recommendations && (
                    <div style={{ 
                        backgroundColor: 'white', 
                        padding: '15px', 
                        borderRadius: '8px',
                        textAlign: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <strong style={{ display: 'block', marginBottom: '5px', color: '#0066cc' }}>
                            운동 시작 가능
                        </strong>
                        <p style={{ 
                            fontSize: '1.5em', 
                            fontWeight: 'bold', 
                            margin: '5px 0',
                            color: exercise_recommendations.can_start ? '#28a745' : '#dc3545'
                        }}>
                            {exercise_recommendations.can_start ? '가능' : '불가능'}
                        </p>
                        {exercise_recommendations.intensity !== undefined && (
                            <small style={{ color: '#666' }}>
                                권장 강도: {exercise_recommendations.intensity}%
                            </small>
                        )}
                    </div>
                )}
            </div>

            {/* 환자 정보 */}
            {patient_info && (
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '15px', 
                    borderRadius: '8px',
                    marginBottom: '15px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <h6 style={{ 
                        margin: '0 0 10px 0', 
                        color: '#0066cc',
                        fontSize: '1em',
                        fontWeight: 'bold'
                    }}>
                        환자 정보
                    </h6>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                        gap: '10px',
                        fontSize: '0.9em'
                    }}>
                        <div><strong>나이:</strong> {patient_info.age}세</div>
                        <div><strong>성별:</strong> {patient_info.gender === 'M' ? '남성' : patient_info.gender === 'F' ? '여성' : 'N/A'}</div>
                        <div><strong>뇌졸중 유형:</strong> {getStrokeTypeLabel(patient_info.stroke_type)}</div>
                        <div><strong>NIHSS 점수:</strong> {patient_info.nihss_score || 'N/A'}</div>
                        {patient_info.hours_after_stroke !== undefined && (
                            <div><strong>경과 시간:</strong> {patient_info.hours_after_stroke}시간</div>
                        )}
                    </div>
                </div>
            )}

            {/* 임상 권장사항 */}
            {clinical_recommendations && clinical_recommendations.length > 0 && (
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '15px', 
                    borderRadius: '8px',
                    marginBottom: '15px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <h6 style={{ 
                        margin: '0 0 10px 0', 
                        color: '#0066cc',
                        fontSize: '1em',
                        fontWeight: 'bold'
                    }}>
                        📋 임상 권장사항
                    </h6>
                    <ul style={{ 
                        margin: 0, 
                        paddingLeft: '20px', 
                        fontSize: '0.9em',
                        lineHeight: '1.4'
                    }}>
                        {clinical_recommendations.map((recommendation, index) => (
                            <li key={index} style={{ marginBottom: '5px' }}>
                                {recommendation}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 모니터링 일정 */}
            {exercise_recommendations?.monitoring_schedule && (
                <div style={{ 
                    backgroundColor: '#e3f2fd', 
                    padding: '10px', 
                    borderRadius: '8px',
                    marginTop: '10px',
                    border: '1px solid #bbdefb'
                }}>
                    <strong style={{ color: '#1976d2' }}>모니터링 일정:</strong>
                    <span style={{ marginLeft: '10px', fontSize: '0.9em' }}>
                        {exercise_recommendations.monitoring_schedule}
                    </span>
                </div>
            )}
        </div>
    );
};

export default SOD2Result;