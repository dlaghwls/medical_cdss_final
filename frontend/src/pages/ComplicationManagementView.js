// /home/shared/medical_cdss/frontend/src/pages/ComplicationManagementView.js
import React, { useState } from 'react';
import { ComplicationImport } from './AI_import/Complication_import';
import { ComplicationHistoryView } from '../components/AI_result/Complication_history_view';

const ComplicationManagementView = ({ selectedPatient }) => {
    const [activeTab, setActiveTab] = useState('input'); // 'input' or 'history'

    return (
        <div>
            <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
                <button 
                    onClick={() => setActiveTab('input')}
                    style={{ 
                        padding: '10px 15px', 
                        marginRight: '10px', 
                        cursor: 'pointer',
                        border: activeTab === 'input' ? '2px solid #007bff' : '1px solid #ccc',
                        backgroundColor: activeTab === 'input' ? '#e7f3ff' : 'white',
                    }}
                >
                    기록 입력
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    style={{ 
                        padding: '10px 15px',
                        cursor: 'pointer',
                        border: activeTab === 'history' ? '2px solid #007bff' : '1px solid #ccc',
                        backgroundColor: activeTab === 'history' ? '#e7f3ff' : 'white',
                    }}
                >
                    과거 기록 조회
                </button>
            </div>

            {activeTab === 'input' && <ComplicationImport selectedPatient={selectedPatient} />}
            {activeTab === 'history' && <ComplicationHistoryView selectedPatient={selectedPatient} />}
        </div>
    );
};

export default ComplicationManagementView;