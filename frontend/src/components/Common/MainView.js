// /home/shared/medical_cdss/frontend/src/components/Common/MainView.js
import React, { useCallback } from 'react';
import { fetchPatientDetails } from '../../services/djangoApiService';

import { MainPage } from '../../pages/Main';
import ComplicationManagementView from '../../pages/ComplicationManagementView';
import DeathManagementView from '../../pages/DeathManagementView';
import GeneManagementView from '../../pages/GeneManagementView';
import SOD2ManagementView from '../../pages/SOD2ManagementView';
import SegmentationBrowser from '../segmentation/SegmentationBrowser';
import LabPage from '../Lab/LabPage';
import PacsViewer from '../pacs/PacsViewer';
import VitalSignsPage from '../Vital/VitalSignsPage';

import styles from '../../styles/common/MainView.module.css';

const MainView = ({
    currentViewId,
    user,
    onViewChange,
    selectedPatient,
    onSelectedPatientUpdated,
    onBackToPatientList,
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
                // 클래스 이름을 CSS Module에서 가져옵니다.
                <div className={styles.noPatientSelected}>
                    <h3>환자 정보가 필요합니다.</h3>
                    <p>왼쪽 사이드바의 환자 목록에서 환자를 선택해주세요.</p>
                </div>
            );
        }
        // 자식 컴포넌트들은 MainView의 flexbox 규칙을 따르도록
        // 각 페이지 컴포넌트(MainPage, VitalSignsPage 등) 자체에서 높이/너비를 조절해야 할 수 있습니다.
        // 또는 MainView 내부에서 자식 컴포넌트들을 감싸는 div에 flex: 1 등을 적용할 수도 있습니다.
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
                // 클래스 이름을 CSS Module에서 가져옵니다.
                <div className={styles.notFoundPage}>
                    <h3>페이지를 찾을 수 없습니다.</h3>
                    <p>올바른 메뉴를 선택해주세요.</p>
                    {/* 버튼 스타일도 CSS Module에서 가져옵니다. */}
                    <button className={styles.notFoundButton} onClick={() => onViewChange('main_dashboard')}>
                        메인 현황판으로 돌아가기
                    </button>
                </div>
            );
            break;
    }

    return (
        // style props는 제거하고 className을 CSS Module에서 가져옵니다.
        <div className={styles.mainView}>
            {content}
        </div>
    );
};

export default MainView;