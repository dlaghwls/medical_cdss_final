// /home/shared/medical_cdss/frontend/src/pages/SOD2ManagementView.js
import React, { useState } from 'react';
import SOD2Import from './AI_import/SOD2_import';
import SOD2HistoryView from '../components/AI_result/SOD2_history_view';

const SOD2ManagementView = ({ selectedPatient }) => {
    const [activeTab, setActiveTab] = useState('input'); // 'input' or 'history'

    if (!selectedPatient) {
        return <p>환자를 선택해주세요.</p>;
    }

    return (
        <div>
            <h3>SOD2 평가 관리 ({selectedPatient.display})</h3>
            <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
                <button 
                    onClick={() => setActiveTab('input')}
                    style={{ 
                        padding: '10px 15px', 
                        marginRight: '10px', 
                        cursor: 'pointer',
                        border: activeTab === 'input' ? '2px solid #007bff' : '1px solid #ccc',
                        backgroundColor: activeTab === 'input' ? '#e7f3ff' : 'white',
                        fontWeight: activeTab === 'input' ? 'bold' : 'normal'
                    }}
                >
                    평가 정보 입력
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    style={{ 
                        padding: '10px 15px',
                        cursor: 'pointer',
                        border: activeTab === 'history' ? '2px solid #007bff' : '1px solid #ccc',
                        backgroundColor: activeTab === 'history' ? '#e7f3ff' : 'white',
                        fontWeight: activeTab === 'history' ? 'bold' : 'normal'
                    }}
                >
                    과거 기록 조회
                </button>
            </div>

            {activeTab === 'input' && <SOD2Import selectedPatient={selectedPatient} />}
            {activeTab === 'history' && <SOD2HistoryView selectedPatient={selectedPatient} />}
        </div>
    );
};

export default SOD2ManagementView; 