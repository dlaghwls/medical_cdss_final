// src/pages/DashboardPage.js
import React, { useState, useCallback } from 'react';
import Header from '../components/Common/Header';
import FunctionSidebar from '../components/Common/FunctionSidebar';
import PatientSidebar from '../components/Common/PatientSidebar';
import MainView from '../components/Common/MainView';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
    const { user } = useAuth();
    const [currentViewId, setCurrentViewId] = useState('main_dashboard');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [refreshPatientListTrigger, setRefreshPatientListTrigger] = useState(0);

    const handleMenuClick = useCallback((viewId) => {
        setCurrentViewId(viewId);
        if (viewId === 'main_dashboard') {
            setSelectedPatient(null);
        }
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Header user={user} />
            <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
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
                    style={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        height: '100%' // 🔥 핵심 추가
                    }}
                />
            </div>
        </div>
    );
};

export default DashboardPage;
