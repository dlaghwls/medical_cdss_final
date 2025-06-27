import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';

const styles = { table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px', }, td: { border: '1px solid #ddd', padding: '8px', }};

export const LabSummary = ({ patientId }) => {
    const [lab, setLab] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!patientId) { setLoading(false); setLab(null); return; }

        const fetchLatestLab = async () => {
            setLoading(true); setError(null);
            try {
                const history = await aiService.fetchLabHistory(patientId);
                
                if (history && history.length > 0) {
                    const sorted = history.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
                    setLab(sorted[0]);
                } else {
                    setLab(null); 
                }
            } catch (err) {
                setError('LAB 정보 로딩 실패');
                console.error("Fetch Latest Lab Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLatestLab();
    }, [patientId]);

    if (loading) return <p>로딩 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!lab) return <p>데이터 없음</p>;

    return (
        <table style={styles.table}>
             <tbody>
                <tr><td style={styles.td}>혈당 (Glucose)</td><td style={styles.td}>{lab.glucose ? `${lab.glucose} mg/dL` : ''}</td></tr>
                <tr><td style={styles.td}>크레아티닌 (Creatinine)</td><td style={styles.td}>{lab.creatinine ? `${lab.creatinine} mg/dL` : ''}</td></tr>
                <tr><td style={styles.td}>나트륨 (Sodium)</td><td style={styles.td}>{lab.sodium ? `${lab.sodium} mmol/L` : ''}</td></tr>
                <tr><td style={styles.td}>칼륨 (Potassium)</td><td style={styles.td}>{lab.potassium ? `${lab.potassium} mmol/L` : ''}</td></tr>
                <tr><td style={styles.td}>측정일시</td><td style={styles.td}>{new Date(lab.recorded_at).toLocaleString()}</td></tr>
            </tbody>
        </table>
    );
};
