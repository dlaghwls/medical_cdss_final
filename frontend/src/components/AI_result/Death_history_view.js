// frontend/src/components/AI_result/Death_history_view.js
import React from 'react';

const Death_history_view = ({ history, loading, error }) => {
    if (loading) return <p>이력 로딩 중...</p>;
    if (error) return <p style={{ color: 'red' }}>이력 조회 실패: {error}</p>;
    if (!history || history.length === 0) {
        return <p>등록된 데이터가 없습니다.</p>;
    }

    // 최신순으로 정렬
    const sortedHistory = [...history].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));

    return (
        <div style={{ marginTop: '20px' }}>
            <h4>데이터 등록 이력</h4>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                    {sortedHistory.map((record) => (
                        <li key={record.id} style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
                            <strong>기록 시간: {new Date(record.recorded_at).toLocaleString()}</strong>
                            <p style={{ margin: '5px 0' }}>
                                나이: {record.age}, 성별: {record.gender}, BP: {record.systolic_bp}/{record.diastolic_bp}, Glucose: {record.glucose}
                            </p>
                            {record.notes && <p style={{ margin: '5px 0', fontSize: '0.9em', color: '#555' }}>비고: {record.notes}</p>}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Death_history_view;