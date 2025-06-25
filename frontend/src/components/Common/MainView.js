import React, { useState, useEffect, useCallback } from 'react';
import { fetchPatientDetails } from '../../services/djangoApiService';
import { MainPage } from '../../pages/Main'; 

// TODO: [리팩토링 후 삭제 예정] - LabResultsView의 모든 기능이 개별 페이지/뷰로 분리되면 이 import는 삭제합니다.
import LabResultsView from './LabResultsView';

// AI 입력 폼 컴포넌트 임포트 (기존 유지)
import ComplicationManagementView from '../../pages/ComplicationManagementView';
import DeathManagementView from '../../pages/DeathManagementView';
import GeneImport from '../../pages/AI_import/Gene_import';
import SOD2ManagementView from '../../pages/SOD2ManagementView';

//lab
import LabPage from '../Lab/LabPage';

//pacs
import PacsViewer from '../pacs/PacsViewer';

//vital
import VitalSignsPage from '../Vital/VitalSignsPage';


// MainView 컴포넌트
const MainView = ({ currentViewId, user, onViewChange, selectedPatient, onSelectedPatientUpdated, onBackToPatientList }) => {
    // 역할별 기능이 없어지면서 currentPredictionModule 상태는 더 이상 필요 없습니다.
    // const [currentPredictionModule, setCurrentPredictionModule] = useState(null);

    const handleReturnToPatientList = () => {
        if (onBackToPatientList) {
            onBackToPatientList();
        }
    };

    const handleRefreshSelectedPatient = useCallback(async (patientUuid) => {
        console.log("[MainView] Refreshing selected patient details:", patientUuid);
        try {
            const updatedPatientDetails = await fetchPatientDetails(patientUuid);
            if (onSelectedPatientUpdated) {
                onSelectedPatientUpdated(updatedPatientDetails);
            }
            return updatedPatientDetails;
        } catch (error) {
            console.error("[MainView] Failed to refresh selected patient details:", error);
            return null;
        }
    }, [onSelectedPatientUpdated]);

    const renderContentOrPrompt = (Component, props = {}) => {
        if (!selectedPatient) {
            return (
                <div style={{textAlign: 'center', padding: '50px'}}>
                    <h3>환자 정보가 필요합니다.</h3>
                    <p>왼쪽 사이드바의 환자 목록에서 환자를 선택해주세요.</p>
                </div>
            );
        }
        return <Component {...props} selectedPatient={selectedPatient} onBackToPatientList={handleReturnToPatientList} onSelectedPatientUpdated={handleRefreshSelectedPatient} />;
    };

    let content = null;

    switch (currentViewId) {
        case 'main_dashboard':
            content = <MainPage selectedPatient={selectedPatient} user={user} />;
            break;
        case 'vital_signs':
            content = renderContentOrPrompt(VitalSignsPage);
            break;
        case 'pacs_viewer':
            content = renderContentOrPrompt(PacsViewer);
            break;
        
        // TODO: [리팩토링 후 삭제 예정] - 이 case는 LabResultsView의 기능들이 모두 분리되면 삭제합니다.
        case 'lab_results':
            content = renderContentOrPrompt(LabResultsView);
            break;

        case 'lab':
            content = renderContentOrPrompt(LabPage);
            break;
        case 'ai_complication_import':
            content = renderContentOrPrompt(ComplicationManagementView);
            break;
        case 'ai_death_import':
            content = renderContentOrPrompt(DeathManagementView);
            break;
        case 'ai_gene_import':
            content = renderContentOrPrompt(GeneImport);
            break;
        case 'ai_sod2_import':
            content = renderContentOrPrompt(SOD2ManagementView);
            break;

        default:
            content = (
                <div style={{textAlign: 'center', padding: '50px'}}>
                    <h3>페이지를 찾을 수 없습니다.</h3>
                    <p>올바른 메뉴를 선택해주세요.</p>
                    <button onClick={() => onViewChange('main_dashboard')} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}>
                        메인 현황판으로 돌아가기
                    </button>
                </div>
            );
            break;
    }
    return (
        <div className="main-view" style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
            {content}
        </div>
    );
};

export default MainView;