import React, { useState, useEffect, useCallback } from 'react';
// fetchPatientDetails가 중복으로 import 되어 하나를 정리했습니다.
import { fetchPatientDetails } from '../../services/djangoApiService';

// TODO: [리팩토링 후 삭제 예정] - LabResultsView의 모든 기능이 개별 페이지/뷰로 분리되면 이 import는 삭제합니다.
import LabResultsView from './LabResultsView';
import ComplicationPredictionView from '../Prediction/ComplicationPredictionView';
import PredictionModuleSelector from '../Prediction/PredictionModuleSelector';
import SOD2PredictionView from '../Prediction/SOD2PredictionView';
import MortalityPredictionView from '../Prediction/MortalityPredictionView';

// AI 입력 폼 컴포넌트 임포트
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
    const [currentPredictionModule, setCurrentPredictionModule] = useState(null);

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
                    <button onClick={handleReturnToPatientList} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}>
                        환자 선택하기
                    </button>
                </div>
            );
        }
        return <Component {...props} selectedPatient={selectedPatient} onBackToPatientList={handleReturnToPatientList} onSelectedPatientUpdated={handleRefreshSelectedPatient} />;
    };

    let content = null;

    switch (currentViewId) {
        case 'main_dashboard':
            content = (
                <div>
                    <h3>StrokeCare+ (메인 환자 현황판)</h3>
                    <p>{user?.name}님, 환영합니다. 현재 메인 대시보드를 보고 계십니다.</p>
                    <img src="https://user-images.githubusercontent.com/8344230/227930965-12e8270c-2694-49a9-8862-78f805952f03.png" alt="Main Dashboard Chart Example" style={{maxWidth: '100%', height: 'auto', marginTop: '20px', border: '1px solid #ddd'}} />
                </div>
            );
            break;
        case 'vital_signs':
            content = renderContentOrPrompt(VitalSignsPage);
            break;
        case 'pacs_viewer':
            // ★ 수정된 부분: 존재하지 않는 handlePatientUpdate 대신 정의된 handleRefreshSelectedPatient를 사용합니다.
            content = renderContentOrPrompt(PacsViewer);
            break;
        
        // TODO: [리팩토링 후 삭제 예정] - 이 case는 LabResultsView의 기능들이 모두 분리되면 삭제합니다.
        case 'lab_results':
            content = renderContentOrPrompt(LabResultsView);
            break;

        case 'lab':
            content = renderContentOrPrompt(LabPage);
            break;
        case 'nurse_tasks':
            content = (
                <div style={{textAlign: 'center', padding: '50px'}}>
                    <h3>간호사 기능</h3>
                    <p>간호 관련 작업을 수행하는 화면입니다.</p>
                    {selectedPatient && <p>현재 선택된 환자: <strong>{selectedPatient.display}</strong></p>}
                    {!selectedPatient && <p>기능을 이용하려면 환자를 선택해주세요.</p>}
                </div>
            );
            break;
        case 'doctor_tasks':
            if (!selectedPatient) {
                content = (
                    <div style={{textAlign: 'center', padding: '50px'}}>
                        <h3>AI 예측 모듈 (의사 전용)</h3>
                        <p>예측 모듈을 사용하려면 왼쪽 사이드바의 환자 목록에서 환자를 먼저 선택해주세요.</p>
                        <button onClick={handleReturnToPatientList} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}>
                            환자 선택하기
                        </button>
                    </div>
                );
            } else if (!currentPredictionModule) {
                content = (
                    <PredictionModuleSelector
                        selectedPatient={selectedPatient}
                        onModuleSelect={setCurrentPredictionModule}
                        onBackToPatientList={handleReturnToPatientList}
                        onBackToModuleSelect={() => setCurrentPredictionModule(null)}
                    />
                );
            } else {
                switch (currentPredictionModule) {
                    case 'complications':
                        content = (
                            <ComplicationPredictionView
                                selectedPatient={selectedPatient}
                                onBackToPatientList={handleReturnToPatientList}
                                onBackToModuleSelect={() => setCurrentPredictionModule(null)}
                            />
                        );
                        break;
                    case 'ai_sod2_import':
                        content = (
                            <SOD2ManagementView
                                selectedPatient={selectedPatient}
                            />
                        );
                        break;
                    case 'ai_death_import':
                        content = (
                            <DeathManagementView
                                selectedPatient={selectedPatient}
                                onBackToPatientList={handleReturnToPatientList}
                            />
                        );
                        break;
                    default:
                        content = <div>준비 중인 모듈입니다.</div>;
                }
            }
            break;
        case 'technician_tasks':
            content = (
                <div style={{textAlign: 'center', padding: '50px'}}>
                    <h3>기타 직원 기능</h3>
                    <p>검사 접수/결과 입력 등의 작업을 수행하는 화면입니다.</p>
                    {selectedPatient && <p>현재 선택된 환자: <strong>{selectedPatient.display}</strong></p>}
                    {!selectedPatient && <p>기능을 이용하려면 환자를 선택해주세요.</p>}
                </div>
            );
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