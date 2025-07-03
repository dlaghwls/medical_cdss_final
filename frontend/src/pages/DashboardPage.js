// src/pages/DashboardPage.js
import React, { useState, useCallback } from 'react';
import Header from '../components/Common/Header';
import FunctionSidebar from '../components/Common/FunctionSidebar';
import PatientSidebar from '../components/Common/PatientSidebar';
import MainView from '../components/Common/MainView';
import { useAuth } from '../contexts/AuthContext';

// DashboardPage 전용 CSS Modules 임포트
import styles from '../styles/pages/DashboardPage.module.css';

const DashboardPage = () => {
    const { user } = useAuth();
    const [currentViewId, setCurrentViewId] = useState('main_dashboard');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [refreshPatientListTrigger, setRefreshPatientListTrigger] = useState(0);

    const handleMenuClick = useCallback((viewId) => {
        setCurrentViewId(viewId);
        // 추교상넌할수있어
       // if (viewId === 'main_dashboard') {
       //     setSelectedPatient(null);
       // }
    }, []);

    const handlePatientSelect = useCallback((patient) => {
        setSelectedPatient(patient);
    }, []);

    const handlePatientRegistered = useCallback(() => {
        setRefreshPatientListTrigger(prev => prev + 1);
    }, []);

    const handleSelectedPatientUpdate = useCallback((updatedPatient) => {
        setSelectedPatient(updatedPatient);
    }, []);

    const handleBackToPatientList = useCallback(() => {
        setSelectedPatient(null);
    }, []);

    return (
        // 최상위 div에 CSS Module 클래스 적용
        <div className={styles.dashboardContainer}>
            <Header user={user} />
            {/* 컨텐츠 영역 div에 CSS Module 클래스 적용 */}
            <div className={styles.contentArea}>
                <PatientSidebar
                    onPatientSelect={handlePatientSelect}
                    onPatientRegistered={handlePatientRegistered}
                    refreshPatientListTrigger={refreshPatientListTrigger}
                    selectedPatient={selectedPatient}
                />
                <FunctionSidebar
                    user={user}
                    onMenuClick={handleMenuClick}
                />
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
