// /home/shared/medical_cdss/frontend/src/pages/SOD2ManagementView.js
import React, { useState, useEffect } from 'react';
import SOD2Import from './AI_import/SOD2_import';
import SOD2HistoryView from '../components/AI_result/SOD2_history_view';
import aiService from '../services/aiService';

const SOD2ManagementView = ({ selectedPatient }) => {
    const [activeTab, setActiveTab] = useState('input'); // 'input', 'history', 'overview'
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [latestAssessment, setLatestAssessment] = useState(null);
    const [loadingLatest, setLoadingLatest] = useState(false);

    // 환자 선택이 변경될 때마다 최신 평가 결과 조회
    useEffect(() => {
        const fetchLatestAssessment = async () => {
            if (!selectedPatient?.uuid) return;
            
            setLoadingLatest(true);
            try {
                const latest = await aiService.fetchLatestSOD2Assessment(selectedPatient.uuid);
                setLatestAssessment(latest);
            } catch (error) {
                console.error('최신 SOD2 평가 조회 실패:', error);
                setLatestAssessment(null);
            } finally {
                setLoadingLatest(false);
            }
        };

        fetchLatestAssessment();
    }, [selectedPatient, refreshTrigger]);

    // SOD2 평가 완료 후 호출되는 콜백
    const handleAssessmentComplete = () => {
        setRefreshTrigger(prev => prev + 1);
        setActiveTab('history'); // 평가 완료 후 기록 조회 탭으로 이동
    };

    if (!selectedPatient) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '50px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                margin: '20px'
            }}>
                <h3 style={{ color: '#6c757d' }}>환자를 선택해주세요</h3>
                <p style={{ color: '#6c757d' }}>
                    왼쪽 사이드바에서 환자를 선택하면 SOD2 평가를 시작할 수 있습니다.
                </p>
            </div>
        );
    }

    const tabStyle = (isActive) => ({
        padding: '12px 20px',
        marginRight: '5px',
        cursor: 'pointer',
        border: 'none',
        backgroundColor: isActive ? '#007bff' : '#f8f9fa',
        color: isActive ? 'white' : '#495057',
        borderRadius: '8px 8px 0 0',
        fontWeight: isActive ? 'bold' : 'normal',
        fontSize: '14px',
        transition: 'all 0.2s ease-in-out',
        border: isActive ? '2px solid #007bff' : '2px solid #dee2e6',
        borderBottom: isActive ? '2px solid white' : '2px solid #dee2e6'
    });

    const getStatusBadge = () => {
        if (loadingLatest) {
            return <span style={{ 
                padding: '4px 8px', 
                backgroundColor: '#6c757d', 
                color: 'white', 
                borderRadius: '12px',
                fontSize: '0.75em',
                marginLeft: '10px'
            }}>
                조회 중...
            </span>;
        }
        
        if (latestAssessment) {
            const riskColor = {
                'high': '#dc3545',
                'medium': '#ffc107',
                'low': '#28a745'
            }[latestAssessment.oxidative_stress_risk] || '#6c757d';
            
            return <span style={{ 
                padding: '4px 8px', 
                backgroundColor: riskColor, 
                color: 'white', 
                borderRadius: '12px',
                fontSize: '0.75em',
                marginLeft: '10px'
            }}>
                최근: {(latestAssessment.current_sod2_level * 100).toFixed(1)}%
            </span>;
        }
        
        return <span style={{ 
            padding: '4px 8px', 
            backgroundColor: '#6c757d', 
            color: 'white', 
            borderRadius: '12px',
            fontSize: '0.75em',
            marginLeft: '10px'
        }}>
            평가 필요
        </span>;
    };

    return (
        <div style={{ 
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            {/* 헤더 */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '2px solid #e9ecef'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>
                        SOD2 평가 관리
                    </h3>
                    {getStatusBadge()}
                </div>
                <div style={{ 
                    fontSize: '0.9em', 
                    color: '#6c757d',
                    textAlign: 'right'
                }}>
                    <strong>환자:</strong> {selectedPatient.display}<br/>
                    <small>UUID: {selectedPatient.uuid.substring(0, 8)}...</small>
                </div>
            </div>

            {/* 탭 네비게이션 */}
            <div style={{ 
                marginBottom: '20px',
                borderBottom: '2px solid #dee2e6',
                paddingBottom: '0'
            }}>
                <button 
                    onClick={() => setActiveTab('input')}
                    style={tabStyle(activeTab === 'input')}
                >
                    새 평가 입력
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    style={tabStyle(activeTab === 'history')}
                >
                    과거 기록 조회
                </button>
            </div>

            {/* 탭 컨텐츠 */}
            <div style={{ 
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '0 8px 8px 8px',
                minHeight: '400px'
            }}>
                {activeTab === 'input' && (
                    <SOD2Import 
                        selectedPatient={selectedPatient} 
                        onAssessmentComplete={handleAssessmentComplete}
                    />
                )}

                {activeTab === 'history' && (
                    <SOD2HistoryView 
                        selectedPatient={selectedPatient}
                        refreshTrigger={refreshTrigger}
                    />
                )}
            </div>
        </div>
    );
};

export default SOD2ManagementView;