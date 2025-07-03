// /home/shared/medical_cdss/frontend/src/components/AI_result/Gene_history_view.js
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import aiService from '../../services/aiService'; // AI 서비스 임포트
import styles from './style/GeneHistoryView.module.css'; // CSS 모듈 임포트

const GeneHistoryView = ({ selectedPatient }) => {
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGeneHistory = async () => {
            if (!selectedPatient || !selectedPatient.uuid) {
                setHistoryData([]);
                setLoading(false);
                setError("환자가 선택되지 않았습니다.");
                return;
            }

            setLoading(true);
            setError(null);
            try {
                // aiService의 getGeneHistory(patientUuid) 함수 호출
                const data = await aiService.getGeneHistory(selectedPatient.uuid);
                
                // 데이터를 날짜 순으로 정렬 (오름차순) - created_at 필드 활용
                const sortedData = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                const chartFormattedData = sortedData.map(item => ({
                    ...item,
                    date: new Date(item.created_at).toLocaleDateString('ko-KR', {
                        year: '2-digit', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', hour12: false
                    }).replace(/\s/g, ''),
                }));
                setHistoryData(chartFormattedData);
            } catch (err) {
                console.error('Failed to fetch gene history:', err);
                // 백엔드에서 전달되는 detail 메시지를 사용자에게 보여줍니다.
                const errorMessage = err.response?.data?.detail || err.message || '알 수 없는 오류';
                setError(`과거 유전자 분석 기록을 불러오는데 실패했습니다: ${errorMessage}`);
                setHistoryData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGeneHistory();
    }, [selectedPatient]);

    if (loading) {
        return <div className={styles.loadingMessage}>유전자 분석 기록을 불러오는 중...</div>;
    }

    if (error) {
        return <div className={styles.errorMessage}>오류: {error}</div>;
    }

    if (!selectedPatient || !selectedPatient.uuid) {
        return (
            <div className={`${styles.infoBox} ${styles.noPatientSelected}`}>
                <p>환자를 선택하면 과거 유전자 분석 기록을 확인할 수 있습니다.</p>
            </div>
        );
    }

    if (historyData.length === 0) {
        return (
            <div className={`${styles.infoBox} ${styles.noHistory}`}>
                <p>선택된 환자의 유전자 분석 기록이 없습니다.</p>
                <p>새로운 유전자 데이터를 업로드하여 첫 기록을 생성해보세요!</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h3 className={styles.mainTitle}>
                {selectedPatient.display}님의 유전자 분석 추이
            </h3>
            <p className={styles.subTitle}>
                기간에 따른 예측 확률 변화를 확인하세요.
            </p>

            <div className={styles.chartWrapper}>
                <h4 className={styles.chartTitle}>예측 확률 변화 (Prediction Probability)</h4>
                <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={historyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                            dataKey="date" 
                            interval="preserveStartEnd" 
                            angle={-30} 
                            textAnchor="end" 
                            height={60} 
                            tick={{ fontSize: 12, fill: '#666' }} 
                        />
                        <YAxis 
                            domain={[0, 1]} 
                            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                            tick={{ fontSize: 12, fill: '#666' }}
                            label={{ value: '확률 (%)', angle: -90, position: 'insideLeft', fill: '#666' }}
                        />
                        <Tooltip 
                            formatter={(value) => [`${(value * 100).toFixed(1)}%`, '예측 확률']}
                            labelFormatter={(label) => `날짜: ${label}`}
                        />
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey="prediction_probability" // prediction_probability 사용
                            stroke="#8884d8" 
                            activeDot={{ r: 8 }} 
                            strokeWidth={2}
                            name="예측 확률"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <h4 className={styles.detailTitle}>상세 평가 기록</h4>
            <div className={styles.detailGrid}>
                {historyData.map((record, index) => (
                    <div 
                        key={record.gene_ai_result_id || index} // id 대신 gene_ai_result_id 사용 (백엔드 응답에 따름)
                        className={styles.recordCard}
                    >
                        <p className={styles.recordTimestamp}>
                            기록 일시: <strong>{new Date(record.created_at).toLocaleString('ko-KR')}</strong>
                        </p>
                        <p className={styles.recordProbability}>
                            <strong>예측 확률:</strong> <span 
                                className={
                                    record.prediction_probability >= 0.7 ? styles.highProbability :
                                    record.prediction_probability <= 0.3 ? styles.lowProbability :
                                    styles.mediumProbability
                                }
                            >
                                {(record.prediction_probability * 100).toFixed(1)}%
                            </span>
                        </p>
                        <p className={styles.recordMessage}><strong>결과 메시지:</strong> {record.result_text || 'N/A'}</p>
                        <p className={styles.recordModel}><strong>모델:</strong> {record.model_name || 'N/A'} (v{record.model_version || 'N/A'})</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GeneHistoryView;