// frontend/src/components/AI_result/Mortality_history_view.js
import React, { useState, useEffect } from 'react';
import * as djangoApiService from '../../services/djangoApiService';

export const formatMortalityRecord = (record) => {
    const formatPercentage = (value) => {
        if (typeof value === 'number') {
            return `${(value * 100).toFixed(1)}%`;
        }
        return 'N/A';
    };

    const formatRiskLevel = (level) => {
        const levelMap = {
            'LOW': '낮음',
            'MODERATE': '보통', 
            'HIGH': '높음',
            'CRITICAL': '매우 높음'
        };
        return levelMap[level] || level;
    };

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleString('ko-KR');
        } catch {
            return dateString;
        }
    };

    return [
        { label: '30일 사망률', value: formatPercentage(record.mortality_30_day) },
        { label: '위험도', value: formatRiskLevel(record.risk_level) },
        { label: '신뢰도', value: formatPercentage(record.confidence) },
        { label: '나이', value: `${record.age || 'N/A'}세` },
        { label: '성별', value: record.gender === 'M' ? '남성' : record.gender === 'F' ? '여성' : 'N/A' },
        { label: 'NIHSS 점수', value: record.nihss_score || 'N/A' },
        { label: '뇌졸중 유형', value: record.stroke_type === 'ischemic' ? '허혈성' : record.stroke_type === 'hemorrhagic' ? '출혈성' : 'N/A' },
        { label: '재관류 치료', value: record.reperfusion_treatment ? '시행' : '미시행' },
        { label: '기록 시각', value: formatDate(record.recorded_at) },
        { label: '비고', value: record.notes || '없음' }
    ];
};

export const MortalityHistoryView = ({ selectedPatient }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRecords, setExpandedRecords] = useState(new Set());

    useEffect(() => {
        if (!selectedPatient?.uuid) {
            setLoading(false);
            setRecords([]);
            return;
        }

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await djangoApiService.fetchMortalityHistory(selectedPatient.uuid);
                const sortedData = data.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
                setRecords(sortedData);
            } catch (err) {
                console.error('사망률 이력 조회 실패:', err);
                setError(`기록 조회 실패: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [selectedPatient]);

    const toggleRecordExpansion = (index) => {
        const newExpanded = new Set(expandedRecords);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedRecords(newExpanded);
    };

    const getRiskLevelColor = (riskLevel) => {
        switch (riskLevel) {
            case 'HIGH':
            case 'CRITICAL':
                return '#dc3545';
            case 'MODERATE':
                return '#ffc107';
            case 'LOW':
                return '#28a745';
            default:
                return '#6c757d';
        }
    };

    const formatRiskLevel = (level) => {
        const levelMap = {
            'LOW': '낮음',
            'MODERATE': '보통', 
            'HIGH': '높음',
            'CRITICAL': '매우 높음'
        };
        return levelMap[level] || level;
    };

    if (loading) return <p>과거 기록을 불러오는 중입니다...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
            <h4>30일 사망률 예측 과거 기록</h4>
            <p><strong>대상 환자:</strong> {selectedPatient?.display || '환자를 선택해주세요'}</p>
            
            {records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>저장된 사망률 예측 기록이 없습니다.</p>
                    <p>기록 입력 탭에서 데이터를 입력하고 예측을 실행해보세요.</p>
                </div>
            ) : (
                <div>
                    <p style={{ marginBottom: '20px', color: '#666' }}>
                        총 <strong>{records.length}</strong>건의 기록이 있습니다.
                    </p>
                    
                    {records.map((record, index) => {
                        const isExpanded = expandedRecords.has(index);
                        const formattedData = formatMortalityRecord(record);
                        
                        return (
                            <div 
                                key={index} 
                                style={{ 
                                    border: '1px solid #ddd', 
                                    borderRadius: '8px', 
                                    marginBottom: '15px',
                                    backgroundColor: '#f8f9fa'
                                }}
                            >
                                {/* 기록 헤더 (요약) */}
                                <div 
                                    onClick={() => toggleRecordExpansion(index)}
                                    style={{ 
                                        padding: '15px', 
                                        cursor: 'pointer',
                                        borderBottom: isExpanded ? '1px solid #ddd' : 'none'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ 
                                                fontWeight: 'bold', 
                                                fontSize: '18px',
                                                color: '#dc3545'
                                            }}>
                                                사망률: {((record.mortality_30_day || 0) * 100).toFixed(1)}%
                                            </span>
                                            <span style={{ 
                                                marginLeft: '20px',
                                                color: getRiskLevelColor(record.risk_level),
                                                fontWeight: 'bold'
                                            }}>
                                                위험도: {formatRiskLevel(record.risk_level)}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ color: '#666', marginRight: '10px' }}>
                                                {new Date(record.recorded_at).toLocaleDateString('ko-KR')}
                                            </span>
                                            <span style={{ color: '#007bff' }}>
                                                {isExpanded ? '▼ 접기' : '▶ 자세히'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 상세 정보 (확장 시) */}
                                {isExpanded && (
                                    <div style={{ padding: '20px', backgroundColor: 'white' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                                            {formattedData.map((item, itemIndex) => (
                                                <div key={itemIndex} style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between',
                                                    padding: '8px 0',
                                                    borderBottom: '1px solid #eee'
                                                }}>
                                                    <span style={{ fontWeight: 'bold', color: '#333' }}>{item.label}:</span>
                                                    <span style={{ color: '#666' }}>{item.value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* 위험 요인 및 보호 요인 */}
                                        {(record.risk_factors || record.protective_factors) && (
                                            <div style={{ marginTop: '20px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                    {record.risk_factors && record.risk_factors.length > 0 && (
                                                        <div>
                                                            <h6 style={{ color: '#dc3545', marginBottom: '10px' }}>위험 요인:</h6>
                                                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                                {record.risk_factors.map((factor, factorIndex) => (
                                                                    <li key={factorIndex} style={{ marginBottom: '5px', color: '#666' }}>
                                                                        {factor}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    
                                                    {record.protective_factors && record.protective_factors.length > 0 && (
                                                        <div>
                                                            <h6 style={{ color: '#28a745', marginBottom: '10px' }}>보호 요인:</h6>
                                                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                                {record.protective_factors.map((factor, factorIndex) => (
                                                                    <li key={factorIndex} style={{ marginBottom: '5px', color: '#666' }}>
                                                                        {factor}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* 임상 권장사항 */}
                                        {record.clinical_recommendations && record.clinical_recommendations.length > 0 && (
                                            <div style={{ 
                                                marginTop: '20px',
                                                padding: '15px',
                                                backgroundColor: '#e3f2fd',
                                                borderRadius: '8px',
                                                border: '1px solid #90caf9'
                                            }}>
                                                <h6 style={{ color: '#1565c0', marginBottom: '10px' }}>임상 권장사항:</h6>
                                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                    {record.clinical_recommendations.map((rec, recIndex) => (
                                                        <li key={recIndex} style={{ marginBottom: '5px', color: '#333' }}>
                                                            {rec}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* 모델 성능 정보 */}
                                        {record.model_performance && (
                                            <div style={{ 
                                                marginTop: '20px',
                                                padding: '15px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '8px',
                                                border: '1px solid #dee2e6'
                                            }}>
                                                <h6 style={{ color: '#495057', marginBottom: '10px' }}>모델 성능 지표:</h6>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                                                    {record.model_performance.auc && (
                                                        <div>
                                                            <strong>AUC:</strong> {record.model_performance.auc.toFixed(3)}
                                                        </div>
                                                    )}
                                                    {record.model_performance.sensitivity && (
                                                        <div>
                                                            <strong>민감도:</strong> {record.model_performance.sensitivity.toFixed(3)}
                                                        </div>
                                                    )}
                                                    {record.model_performance.specificity && (
                                                        <div>
                                                            <strong>특이도:</strong> {record.model_performance.specificity.toFixed(3)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};