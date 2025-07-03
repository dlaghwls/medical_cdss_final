import React, { useState, useEffect, useMemo } from 'react';
import { fetchVitalsHistory } from '../../services/vitalApiService';

// ✅ chart.js와 react-chartjs-2를 사용합니다.
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export const VitalSummary = ({ patientId }) => {
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [latestTime, setLatestTime] = useState(null);

    useEffect(() => {
        if (!patientId) {
            setLoading(false);
            setChartData({ labels: [], datasets: [] });
            return;
        }

        const fetchChartData = async () => {
            setLoading(true);
            setError(null);
            try {
                const history = await fetchVitalsHistory(patientId, '1d');
                
                if (history && history.length > 0) {
                    const sortedHistory = history.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
                    setLatestTime(new Date(sortedHistory[sortedHistory.length - 1].recorded_at));
                    
                    const labels = sortedHistory.map(session => {
                        const date = new Date(session.recorded_at);
                        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                    });

                    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
                    // ✅✅✅ 여기에 모든 Vital 데이터를 추가합니다. ✅✅✅
                    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
                    const datasets = [
                        {
                            label: 'SBP', // 수축기 혈압
                            data: sortedHistory.map(s => s.measurements?.bp ? parseInt(s.measurements.bp.split('/')[0], 10) : null),
                            borderColor: '#6c757d',
                            tension: 0.3,
                            pointRadius: 0,
                        },
                        {
                            label: 'DBP', // 이완기 혈압 (추가)
                            data: sortedHistory.map(s => s.measurements?.bp ? parseInt(s.measurements.bp.split('/')[1], 10) : null),
                            borderColor: '#adb5bd',
                            tension: 0.3,
                            pointRadius: 0,
                        },
                        {
                            label: 'HR', // 심박수
                            data: sortedHistory.map(s => s.measurements?.hr),
                            borderColor: '#fcbf49',
                            tension: 0.3,
                            pointRadius: 0,
                        },
                        {
                            label: 'RR', // 호흡수 (추가)
                            data: sortedHistory.map(s => s.measurements?.rr),
                            borderColor: '#1CCAD8',
                            tension: 0.3,
                            pointRadius: 0,
                        },
                        {
                            label: 'Temp', // 체온 (추가)
                            data: sortedHistory.map(s => s.measurements?.temp),
                            borderColor: '#f4a261',
                            tension: 0.3,
                            pointRadius: 0,
                        },
                        {
                            label: 'SpO2', // 산소포화도
                            data: sortedHistory.map(s => s.measurements?.spo2),
                            borderColor: '#2a9d8f',
                            tension: 0.3,
                            pointRadius: 0,
                        }
                    ];

                    setChartData({ labels, datasets });
                } else {
                    setChartData({ labels: [], datasets: [] });
                    setLatestTime(null);
                }
            } catch (err) {
                setError('Vital 정보 로딩 실패');
            } finally {
                setLoading(false);
            }
        };

        fetchChartData();
    }, [patientId]);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: {
                    boxWidth: 12,
                    padding: 20, // 범례 간격
                    font: { size: 10 }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            x: {
                ticks: {
                    font: { size: 10 },
                    autoSkip: true,
                    maxTicksLimit: 6
                }
            },
            y: {
                ticks: {
                    font: { size: 10 }
                }
            }
        }
    }), []);


    if (loading) return <p>로딩 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (chartData.datasets.length === 0 || chartData.datasets.every(ds => ds.data.every(d => d === null || isNaN(d)))) {
        return <p>지난 24시간 동안의 데이터가 없습니다.</p>;
    }
    
    return (
        <div>
            <div style={{ height: '180px', width: '100%' }}>
                <Line data={chartData} options={chartOptions} />
            </div>
            {latestTime && (
                <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666', textAlign: 'right' }}>
                    최신 측정: {latestTime.toLocaleString()}
                </p>
            )}
        </div>
    );
};