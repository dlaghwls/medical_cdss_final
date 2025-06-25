import React, { useState, useEffect } from 'react';
import GeneImport from '../pages/AI_import/Gene_import'; 
import GeneHistoryView from '../components/AI_result/Gene_history_view';
import aiService from '../services/aiService'; // aiService 임포트

const GeneManagementView = ({ selectedPatient }) => {
    const [activeTab, setActiveTab] = useState('input'); // 'input', 'history'
    const [refreshTrigger, setRefreshTrigger] = useState(0); // 기록 갱신 트리거
    const [latestAssessment, setLatestAssessment] = useState(null); // 최신 평가 결과
    const [loadingLatest, setLoadingLatest] = useState(false); // 최신 결과 로딩 상태

    // 환자 선택이 변경되거나 refreshTrigger가 변경될 때마다 최신 평가 결과 조회
    useEffect(() => {
        const fetchLatestAssessment = async () => {
            if (!selectedPatient?.uuid) {
                setLatestAssessment(null); // 환자 선택 해제 시 최신 평가도 초기화
                return;
            }
            
            setLoadingLatest(true);
            try {
                const latest = await aiService.fetchLatestGeneAssessment(selectedPatient.uuid);
                setLatestAssessment(latest);
            } catch (error) {
                console.error('최신 유전자 분석 조회 실패:', error);
                setLatestAssessment(null);
            } finally {
                setLoadingLatest(false);
            }
        };

        fetchLatestAssessment();
    }, [selectedPatient, refreshTrigger]);

    // 유전자 분석 완료 후 호출되는 콜백
    const handleAssessmentComplete = () => {
        setRefreshTrigger(prev => prev + 1); // 기록 갱신 트리거 증가 (historyView와 latestAssessment 갱신)
        setActiveTab('history'); // 분석 완료 후 과거 기록 조회 탭으로 이동
    };

    // 환자가 선택되지 않았을 때의 UI (SOD2ManagementView와 유사)
    if (!selectedPatient) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '50px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                margin: '20px' // 부모 컨테이너가 있다면 margin을 주어 중앙에 배치
            }}>
                <h3 style={{ color: '#6c757d' }}>환자를 선택해주세요</h3>
                <p style={{ color: '#6c757d' }}>
                    왼쪽 사이드바에서 환자를 선택하면 유전자 분석 평가를 시작할 수 있습니다.
                </p>
            </div>
        );
    }

    // 탭 스타일 함수 (SOD2ManagementView와 동일하게)
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

    // 상태 뱃지 생성 함수 (SOD2ManagementView와 유사)
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
            // 유전자 분석 결과에 따른 색상 (SOD2의 riskColor 로직 참고)
            // 여기서는 confidence_score (prediction_probability)를 기준으로 판단
            const prob = latestAssessment.prediction_probability; // 백엔드에서 이 이름으로 옴
            let probColor = '#6c757d'; // 기본 색상
            let probText = '판단 보류';

            if (prob >= 0.7) {
                probColor = '#28a745'; // 높음 (긍정)
                probText = '확률 높음';
            } else if (prob <= 0.3) {
                probColor = '#dc3545'; // 낮음 (부정)
                probText = '확률 낮음';
            } else {
                probColor = '#ffc107'; // 중간
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
                    새 유전자 데이터 입력
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
                minHeight: '400px' // 최소 높이 설정
            }}>
                {activeTab === 'input' && (
                    <GeneImport 
                        selectedPatient={selectedPatient} 
                        onPredictionComplete={handleAssessmentComplete} // 함수 이름 변경: onPredictionComplete
                    />
                )}

                {activeTab === 'history' && (
                    <GeneHistoryView 
                        selectedPatient={selectedPatient}
                        refreshTrigger={refreshTrigger} // historyView 갱신을 위해 전달
                    />
                )}
            </div>
        </div>
    );
};

export default GeneManagementView;