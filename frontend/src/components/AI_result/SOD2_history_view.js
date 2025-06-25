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
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [selectedPatient]);

    if (loading) return <p>과거 기록을 불러오는 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (assessments.length === 0) return <p>표시할 평가 기록이 없습니다.</p>;

    const chartData = {
        labels: assessments.map(a => new Date(a.recorded_at).toLocaleString()),
        datasets: [{
            label: 'SOD2 Level (%)',
            data: assessments.map(a => a.result.sod2_status.current_level * 100),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
        }],
    };

    return (
        <div>
            <h4>SOD2 평가 이력</h4>
            <div style={{ height: '300px', marginBottom: '30px' }}>
                <Line data={chartData} options={{ maintainAspectRatio: false, responsive: true }} />
            </div>
            <div>
                {assessments.map(item => (
                    <SOD2Result key={item.assessment_id} assessmentData={item} />
                )).reverse() /* 최신순으로 표시 */}
            </div>
        </div>
    );
};

export default SOD2HistoryView; 