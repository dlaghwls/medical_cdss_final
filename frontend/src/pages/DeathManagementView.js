// frontend/src/pages/DeathManagementView.js (수정)
import React, { useState, useEffect, useCallback } from 'react';
import Death_import from './AI_import/Death_import';
import Death_history_view from '../components/AI_result/Death_history_view';
import Death_result from '../components/AI_result/Death_result'; // ★ 추가
import aiService from '../services/aiService';

const DeathManagementView = ({ selectedPatient, onBackToPatientList }) => {
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    
    // ★ 예측 결과를 위한 상태 추가
    const [predictionResult, setPredictionResult] = useState(null);
    const [isPredicting, setIsPredicting] = useState(false);
    const [predictionError, setPredictionError] = useState(null);

    const fetchHistory = useCallback(async () => {
        if (!selectedPatient?.uuid) return;
        setLoadingHistory(true);
        setHistoryError(null);
        try {
            const data = await aiService.fetchMortalityHistory(selectedPatient.uuid);
            setHistory(data);
        } catch (err) {
            setHistoryError(err.message || '이력 조회 중 오류가 발생했습니다.');
        } finally {
            setLoadingHistory(false);
        }
    }, [selectedPatient?.uuid]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);
    
    // ★ 데이터 등록 후 예측을 실행하는 함수
    const handleDataRegistered = async (registeredData) => {
        console.log('New data registered, refreshing history and starting prediction...');
        fetchHistory(); // 이력은 바로 갱신
        
        setIsPredicting(true);
        setPredictionError(null);
        setPredictionResult(null);

        try {
            // 등록된 데이터를 기반으로 예측 API 호출
            const result = await aiService.predictMortality(registeredData);
            setPredictionResult({
                ...result, // 백엔드에서 받은 결과
                patient_display_name: selectedPatient.display, // 프론트에서 환자 이름 추가
            });
        } catch (err) {
            setPredictionError(err.message || '예측 중 오류가 발생했습니다.');
        } finally {
            setIsPredicting(false);
        }
    };

    if (!selectedPatient) {
        // ... (이전과 동일)
    }

    return (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <h3>사망률 예측 관리 - {selectedPatient.display}</h3>
            {/* ... (뒤로가기 버튼 등 이전과 동일) ... */}
            
            <Death_import 
                selectedPatient={selectedPatient}
                onDataRegistered={handleDataRegistered} 
            />

            {isPredicting && <p>AI가 예측을 수행하는 중입니다...</p>}
            {predictionError && <p style={{color: 'red'}}>{predictionError}</p>}
            
            {/* ★ 결과 표시 모달 */}
            <Death_result 
                result={predictionResult} 
                onClose={() => setPredictionResult(null)} 
            />

            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: 'white', marginTop: '30px' }}>
                <Death_history_view 
                    history={history}
                    loading={loadingHistory}
                    error={historyError}
                />
            </div>
        </div>
    );
};

export default DeathManagementView;