import React, { useState, useEffect } from 'react';
// ✅ fetchPatientResults API를 사용하는 것이 올바른 접근이었습니다.
import { fetchPatientResults } from '../../services/labApiService'; 

// ❗️ 더 이상 KEY_LABS 배열을 사용하지 않으므로 삭제합니다.

export const LabSummary = ({ patientId }) => {
    const [summaryLabs, setSummaryLabs] = useState([]);
    const [latestDate, setLatestDate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!patientId) {
            setLoading(false);
            setSummaryLabs([]);
            return;
        }

        const fetchLatest = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetchPatientResults(patientId);
                const history = response.data || [];

                if (history.length > 0) {
                    const allRecords = history.map(item => ({
                        ...item.fields,
                        id: item.pk,
                        recorded_at: new Date(item.fields.reported_at || item.fields.collected_at) 
                    }));

                    const latestTimestamp = Math.max.apply(null, allRecords.map(r => r.recorded_at));
                    const latestDateObj = new Date(latestTimestamp);
                    setLatestDate(latestDateObj);

                    // ✅✅✅ 가장 최신 시간과 일치하는 모든 기록(하나의 검사 묶음)을 그대로 사용합니다. ✅✅✅
                    const latestTestGroup = allRecords.filter(item => 
                        item.recorded_at.getTime() === latestTimestamp
                    );
                    
                    // ❗️ KEY_LABS로 한 번 더 필터링하는 로직을 삭제했습니다.
                    setSummaryLabs(latestTestGroup);

                } else {
                    setSummaryLabs([]);
                    setLatestDate(null);
                }
            } catch (err) { 
                setError('LAB 정보 로딩 실패'); 
            } finally { 
                setLoading(false); 
            }
        };

        fetchLatest();
    }, [patientId]);

    if (loading) return <p>로딩 중...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (summaryLabs.length === 0) return <p>데이터 없음</p>;

    return (
        <div>
            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '6px 4px', textAlign: 'left', color: '#333', borderBottom: '1px solid #dee2e6' }}>검사명</th>
                        <th style={{ padding: '6px 4px', textAlign: 'right', color: '#333', borderBottom: '1px solid #dee2e6' }}>결과</th>
                        <th style={{ padding: '6px 4px', textAlign: 'right', color: '#333', borderBottom: '1px solid #dee2e6' }}>단위</th>
                    </tr>
                </thead>
                <tbody>
                    {summaryLabs.map((lab) => (
                        <tr key={lab.id}>
                            <td style={{ padding: '6px 4px', color: '#555' }}><strong>{lab.test_item_name}</strong></td>
                            <td style={{ padding: '6px 4px', color: '#555', textAlign: 'right' }}>{lab.result_value}</td>
                            <td style={{ padding: '6px 4px', color: '#555', textAlign: 'right' }}>{lab.test_item_unit}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666', textAlign: 'right' }}>
                측정일시: {latestDate ? latestDate.toLocaleString() : 'N/A'}
            </p>
        </div>
    );
};