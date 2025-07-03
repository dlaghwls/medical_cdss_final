// /home/shared/medical_cdss/frontend/src/components/AI_result/SOD2HistoryView.js
import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import { SOD2Result } from './SOD2_result';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const SOD2HistoryView = ({ selectedPatient }) => {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!selectedPatient?.uuid) return;
            try {
                setLoading(true);
                const data = await aiService.fetchSOD2Assessments(selectedPatient.uuid);
                setAssessments(data.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))); // 시간순 정렬
            } catch (err) {
                setError('과거 기록을 불러오는 데 실패했습니다.');
                console.error('SOD2 기록 조회 오류:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [selectedPatient]);

    if (loading) return <p>과거 기록을 불러오는 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (assessments.length === 0) return <p>표시할 평가 기록이 없습니다.</p>;

    // API 응답 구조에 맞게 차트 데이터 생성 수정
    const chartData = {
        labels: assessments.map(a => new Date(a.recorded_at).toLocaleString()),
        datasets: [{
            label: 'SOD2 Level (%)',
            // API 응답 구조에 맞게 수정: current_sod2_level 필드 사용
            data: assessments.map(a => {
                // 백엔드 API 응답 구조에 맞게 데이터 접근
                if (a.current_sod2_level !== undefined) {
                    return (a.current_sod2_level * 100).toFixed(1);
                }
                // 기존 구조도 지원 (호환성)
                if (a.result?.sod2_status?.current_level !== undefined) {
                    return (a.result.sod2_status.current_level * 100).toFixed(1);
                }
                return 0; // 기본값
            }),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
        }],
    };

    const chartOptions = {
        maintainAspectRatio: false,
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'SOD2 Level (%)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: '시간'
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: 'SOD2 수준 변화 추이'
            },
            legend: {
                display: true
            }
        }
    };

    // 평가 결과를 표준화된 형태로 변환하는 함수
    const normalizeAssessmentData = (assessment) => {
        // 새로운 API 응답 구조에 맞게 변환
        if (assessment.current_sod2_level !== undefined) {
            return {
                assessment_id: assessment.id,
                recorded_at: assessment.recorded_at,
                result: {
                    sod2_status: {
                        current_level: assessment.current_sod2_level,
                        oxidative_stress_risk: assessment.oxidative_stress_risk,
                        overall_status: assessment.overall_status || '평가됨',
                        prediction_confidence: assessment.prediction_confidence || 0.8
                    },
                    patient_info: {
                        age: assessment.age || 'N/A',
                        gender: assessment.patient_info?.gender_display || (assessment.gender === 'M' ? '남성' : assessment.gender === 'F' ? '여성' : 'N/A'),
                        stroke_type: assessment.stroke_type,
                        nihss_score: assessment.nihss_score,
                        hours_after_stroke: assessment.hours_after_stroke
                    },
                    exercise_recommendations: {
                        can_start: assessment.exercise_can_start,
                        intensity: assessment.exercise_intensity,
                        monitoring_schedule: (() => {
                            try {
                                if (assessment.monitoring_schedule_display) {
                                    const parsed = JSON.parse(assessment.monitoring_schedule_display.replace(/'/g, '"'));
                                    return parsed.text || '정기적 재평가 필요';
                                }
                                return '정기적 재평가 필요';
                            } catch (e) {
                                return '정기적 재평가 필요';
                            }
                        })()
                    },
                    clinical_recommendations: assessment.clinical_recommendations ?
                        (Array.isArray(assessment.clinical_recommendations) ?
                            assessment.clinical_recommendations :
                            assessment.clinical_recommendations.split('\n')) :
                        [],
                    sod2_prediction_data: assessment.sod2_prediction_data || []
                }
            };
        }

        // 기존 구조는 그대로 반환 (호환성)
        return assessment;
    };

    return (
        <div>
            <h4>SOD2 평가 이력</h4>

            {/* 차트 영역 */}
            <div style={{
                height: '300px',
                marginBottom: '30px',
                padding: '20px',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
            }}>
                <Line data={chartData} options={chartOptions} />
            </div>

            {/* 개별 평가 결과들 */}
            <div>
                <h5>상세 평가 기록</h5>
                {assessments.map(item => {
                    const normalizedData = normalizeAssessmentData(item);
                    return (
                        <div key={item.id || item.assessment_id} style={{
                            marginBottom: '20px',
                            padding: '15px',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            backgroundColor: 'white'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <strong>평가 일시: {new Date(normalizedData.recorded_at).toLocaleString()}</strong>
                                <span style={{
                                    padding: '4px 8px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '0.8em'
                                }}>
                                    완료
                                </span>
                            </div>
                            <SOD2Result assessmentData={normalizedData} />
                        </div>
                    );
                }).reverse() /* 최신순으로 표시 */}
            </div>
        </div>
    );
};

export default SOD2HistoryView;