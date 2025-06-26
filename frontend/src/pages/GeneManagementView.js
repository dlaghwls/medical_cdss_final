import React, { useState, useEffect } from 'react';
import GeneImport from '../pages/AI_import/Gene_import'; 
import GeneHistoryView from '../components/AI_result/Gene_history_view';
import aiService from '../services/aiService'; 
import GeneModelExplanation from '../components/AI_explanation/Gene_model_explanation';

const GeneManagementView = ({ selectedPatient }) => {
    const [activeTab, setActiveTab] = useState('input');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [latestAssessment, setLatestAssessment] = useState(null);
    const [loadingLatest, setLoadingLatest] = useState(false);
    // const [isCsvUploaded, setIsCsvUploaded] = useState(false); // 이 상태는 더 이상 설명 표시 제어에 사용되지 않음

    useEffect(() => {
        const fetchLatestAssessment = async () => {
            if (!selectedPatient?.uuid) {
                setLatestAssessment(null);
                // setIsCsvUploaded(false); // 사용하지 않으므로 제거
                return;
            }
            
            setLoadingLatest(true);
            try {
                const latest = await aiService.fetchLatestGeneAssessment(selectedPatient.uuid);
                setLatestAssessment(latest);
                // if (latest) { // 사용하지 않으므로 제거
                //     setIsCsvUploaded(true);
                // } else {
                //     setIsCsvUploaded(false);
                // }
            } catch (error) {
                console.error('최신 유전자 분석 조회 실패:', error);
                setLatestAssessment(null);
                // setIsCsvUploaded(false); // 사용하지 않으므로 제거
            } finally {
                setLoadingLatest(false);
            }
        };

        fetchLatestAssessment();
    }, [selectedPatient, refreshTrigger]);

    const handleAssessmentComplete = () => {
        setRefreshTrigger(prev => prev + 1);
        setActiveTab('history');
        // setIsCsvUploaded(true); // 사용하지 않으므로 제거
    };

    // (handleFileSelected 함수는 더 이상 필요 없거나 다른 용도로 사용)

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
                    왼쪽 사이드바에서 환자를 선택하면 유전자 분석 평가를 시작할 수 있습니다.
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
            const prob = latestAssessment.prediction_probability;
            let probColor = '#6c757d'; 
            let probText = '판단 보류';

            if (prob >= 0.7) {
                probColor = '#28a745';
                probText = '확률 높음';
            } else if (prob <= 0.3) {
                probColor = '#dc3545';
                probText = '확률 낮음';
            } else {
                probColor = '#ffc107';
                probText = '관찰 필요';
            }
            
            return <span style={{ 
                padding: '4px 8px', 
                backgroundColor: probColor, 
                color: 'white', 
                borderRadius: '12px',
                fontSize: '0.75em',
                marginLeft: '10px'
            }}>
                최근: {(prob * 100).toFixed(1)}% ({probText})
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
                        유전자 분석 평가 관리
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

            <div style={{ 
                marginBottom: '20px',
                borderBottom: '2px solid #dee2e6',
                paddingBottom: '0'
            }}>
                <button 
                    onClick={() => setActiveTab('input')}
                    style={tabStyle(activeTab === 'input')}
                >
                    새 유전자 데이터 입력
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    style={tabStyle(activeTab === 'history')}
                >
                    과거 기록 조회
                </button>
            </div>

            <div style={{ 
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '0 8px 8px 8px',
                minHeight: '400px'
            }}>
                {activeTab === 'input' && (
                    <>
                        <GeneImport 
                            selectedPatient={selectedPatient} 
                            onPredictionComplete={handleAssessmentComplete}
                        />
                        {/* activeTab이 'input' 일 때 무조건 설명 박스 표시 */}
                        <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                            <GeneModelExplanation />
                        </div>
                    </>
                )}

                {activeTab === 'history' && (
                    <GeneHistoryView 
                        selectedPatient={selectedPatient}
                        refreshTrigger={refreshTrigger} 
                    />
                )}
            </div>
        </div>
    );
};

export default GeneManagementView;