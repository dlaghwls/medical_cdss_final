import React, { useState, useCallback } from 'react';
import Header from '../components/Common/Header';

import FunctionSidebar from '../components/Common/FunctionSidebar'; // 기능 사이드바 임포트
import PatientSidebar from '../components/Common/PatientSidebar';   // 환자 사이드바 임포트

import MainView from '../components/Common/MainView';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
    const { user } = useAuth();

    const [currentViewId, setCurrentViewId] = useState('main_dashboard');
    const [selectedPatient, setSelectedPatient] = useState(null);
    // boolean 대신 숫자로 트리거하는 것이 더 안정적일 수 있습니다.
    const [refreshPatientListTrigger, setRefreshPatientListTrigger] = useState(0);

    const handleMenuClick = useCallback((viewId) => {
        setCurrentViewId(viewId);
        if (viewId === 'main_dashboard') {
             setSelectedPatient(null);
        }
    }, []);

    const handlePatientSelect = useCallback((patient) => {
        setSelectedPatient(patient);
        if (currentViewId !== 'lab_results' && currentViewId !== 'doctor_tasks' && currentViewId !== 'vital_signs') {
            setCurrentViewId('lab_results');
        }
    }, [currentViewId]); // 종속성 배열에 currentViewId 추가

    const handlePatientRegistered = useCallback(() => {
        console.log("DashboardPage: Patient registered, triggering refresh.");
        setRefreshPatientListTrigger(prev => prev + 1); // 숫자를 증가시켜 변경을 감지
    }, []);

    const handleSelectedPatientUpdate = useCallback((updatedPatient) => {
        console.log("DashboardPage: Selected patient updated from MainView child:", updatedPatient);
        setSelectedPatient(updatedPatient);
    }, []);

    const handleBackToPatientList = useCallback(() => {
        setSelectedPatient(null);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Header user={user} />

            <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>

                {/* 왼쪽: 기능 메뉴 사이드바 */}
                <FunctionSidebar
                    user={user}
                    onMenuClick={handleMenuClick} // 기능 메뉴 클릭 핸들러 전달
                    style={{
                        width: '200px',
                        flexShrink: 0,
                        overflowY: 'auto',
                        borderRight: '1px solid #ddd',
                        backgroundColor: '#f8f9fa'
                    }}
                />

                {/* 중앙: 환자 관련 사이드바 */}
                <PatientSidebar
                    onPatientSelect={handlePatientSelect}           // 환자 선택 핸들러 전달
                    onPatientRegistered={handlePatientRegistered} // 환자 등록 핸들러 전달
                    refreshPatientListTrigger={refreshPatientListTrigger} // 새로고침 트리거 전달
                    selectedPatient={selectedPatient} 
                    style={{
                        width: '250px',
                        flexShrink: 0,
                        overflowY: 'auto',
                        borderRight: '1px solid #ddd',
                        backgroundColor: '#ffffff'
                    }}
                />

                {/* 오른쪽: 메인 콘텐츠 영역 (이 부분은 수정 없음) */}
                <MainView
                    currentViewId={currentViewId}
                    user={user}
                    selectedPatient={selectedPatient}
                    onViewChange={setCurrentViewId}
                    onSelectedPatientUpdated={handleSelectedPatientUpdate}
                    onBackToPatientList={handleBackToPatientList}
                />
            </div>
        </div>
    );
};

export default DashboardPage;