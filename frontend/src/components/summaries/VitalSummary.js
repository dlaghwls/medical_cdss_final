import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';

const styles = { table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px', }, td: { border: '1px solid #ddd', padding: '8px', }};

export const VitalSummary = ({ patientId }) => {
    const [vitals, setVitals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!patientId) {
            setLoading(false);
            setVitals(null);
            return;
        }

        const fetchLatestVitals = async () => {
            setLoading(true);
            setError(null);
            try {
                // 이 함수는 이제 aiService.js에서 올바르게 동작합니다.
                const history = await aiService.fetchVitalsHistory(patientId, 'all');
                
                if (history && history.length > 0) {
                    const sorted = history.sort((a, b) =>
                        new Date(b.recorded_at || b.created_at) - new Date(a.recorded_at || a.created_at)
                    );
                    setVitals(sorted[0]);
                } else {
                    setVitals(null);
                }
            } catch (err) {
                setError('Vital 정보 로딩 실패');
                console.error("Fetch Latest Vitals Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestVitals();
    }, [patientId]);

    if (loading) return <p>로딩 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!vitals) return <p>데이터 없음</p>;

    // ★★★★★ vitals 객체 안의 'measurements' 객체에서 값을 가져옵니다. ★★★★★
    const vitalMeasurements = vitals.measurements || {};

    return (
        <table style={styles.table}>
            <tbody>
                <tr><td style={styles.td}>체온</td><td style={styles.td}>{vitalMeasurements.temperature ? `${vitalMeasurements.temperature} °C` : ''}</td></tr>
                <tr><td style={styles.td}>심박수</td><td style={styles.td}>{vitalMeasurements.heart_rate ? `${vitalMeasurements.heart_rate} bpm` : ''}</td></tr>
                <tr><td style={styles.td}>호흡수</td><td style={styles.td}>{vitalMeasurements.respiratory_rate ? `${vitalMeasurements.respiratory_rate} breaths/min` : ''}</td></tr>
                <tr><td style={styles.td}>혈압</td><td style={styles.td}>{vitalMeasurements.systolic_bp ? `${vitalMeasurements.systolic_bp} / ${vitalMeasurements.diastolic_bp} mmHg` : ''}</td></tr>
                <tr><td style={styles.td}>측정일시</td><td style={styles.td}>{new Date(vitals.recorded_at || vitals.created_at).toLocaleString()}</td></tr>
            </tbody>
        </table>
    );
};