// src/components/Common/MainView.js
import React, { useCallback } from 'react';
import { fetchPatientDetails } from '../../services/djangoApiService';
import { MainPage } from '../../pages/Main';

import LabResultsView from './LabResultsView';
import ComplicationManagementView from '../../pages/ComplicationManagementView';
import DeathManagementView from '../../pages/DeathManagementView';
import GeneManagementView from '../../pages/GeneManagementView';
import SOD2ManagementView from '../../pages/SOD2ManagementView';
import SegmentationBrowser from '../segmentation/SegmentationBrowser';
import LabPage from '../Lab/LabPage';
import PacsViewer from '../pacs/PacsViewer';
import VitalSignsPage from '../Vital/VitalSignsPage';

const MainView = ({
    currentViewId,
    user,
    onViewChange,
    selectedPatient,
    onSelectedPatientUpdated,
    onBackToPatientList,
    style = {} // style props 받기
}) => {

    const handleReturnToPatientList = () => {
        if (onBackToPatientList) {
            onBackToPatientList();
        }
    };

    const handleRefreshSelectedPatient = useCallback(async (patientUuid) => {
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
                <div style={{ textAlign: 'center', padding: '50px' }}>
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
        case 'segmentation_browser':
            content = renderContentOrPrompt(SegmentationBrowser);
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
            content = renderContentOrPrompt(GeneManagementView);
            break;
        case 'ai_sod2_import':
            content = renderContentOrPrompt(SOD2ManagementView);
            break;
        default:
            content = (
                <div style={{ textAlign: 'center', padding: '50px' }}>
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
        <div className="main-view" style={{
            ...style, // 🔥 핵심: 외부에서 전달된 style 반영
            padding: '20px',
            overflowY: 'auto'
        }}>
            {content}
        </div>
    );
};

export default MainView;
