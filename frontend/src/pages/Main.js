// import React from 'react';

// // ★★★ 모든 요약 컴포넌트를 { }를 사용하여 named import 방식으로 통일합니다. ★★★
// import { VitalSummary } from '../components/summaries/VitalSummary';
// import { LabSummary } from '../components/summaries/LabSummary';
// import { ComplicationSummary } from '../components/summaries/ComplicationSummary';
// import { ComplicationPredictionSummary } from '../components/summaries/ComplicationPredictionSummary';
// import { MortalitySummary } from '../components/summaries/MortalitySummary';
// import { SOD2Summary } from '../components/summaries/SOD2Summary';
// import { GeneSummary } from '../components/summaries/GeneSummary';

// export const MainPage = ({ selectedPatient }) => {
    
//     // ★★★★★ 이 부분이 없어서 발생한 오류입니다. 다시 추가합니다. ★★★★★
//     const Placeholder = () => (
//         <div style={{ border: '1px solid #ccc', padding: '40px', borderRadius: '8px', textAlign: 'center', color: '#777', backgroundColor: '#f9f9f9' }}>
//             <h2>환자 정보 요약</h2>
//             <p>좌측 목록에서 환자를 선택하시면, 해당 환자의 최신 의료 정보를 종합하여 보여줍니다.</p>
//         </div>
//     );

//     const SummaryCard = ({ title, children }) => (
//         <div style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
//             <h3 style={{ marginTop: 0, paddingBottom: '10px', borderBottom: '2px solid #dee2e6', color: '#495057' }}>{title}</h3>
//             <div>{children}</div>
//         </div>
//     );

//     const SummaryDashboard = () => (
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
//             <SummaryCard title="최신 Vital 정보"><VitalSummary patientId={selectedPatient.uuid} /></SummaryCard>
//             <SummaryCard title="최신 LAB 결과"><LabSummary patientId={selectedPatient.uuid} /></SummaryCard>
//             <SummaryCard title="최신 처방 기록"><ComplicationSummary patientId={selectedPatient.uuid} /></SummaryCard>
//             <SummaryCard title="최신 합병증 예측"><ComplicationPredictionSummary patientId={selectedPatient.uuid} /></SummaryCard>
//             <SummaryCard title="최신 사망률 예측"><MortalitySummary patientId={selectedPatient.uuid} /></SummaryCard>
//             <SummaryCard title="최신 SOD2 평가"><SOD2Summary patientId={selectedPatient.uuid} /></SummaryCard>
//             <SummaryCard title="최신 유전자 분석"><GeneSummary selectedPatient={selectedPatient} /></SummaryCard>
//         </div>
//     );

//     return (
//         <div style={{padding: '20px'}}>
//             {/* selectedPatient가 있으면 SummaryDashboard를, 없으면 Placeholder를 보여줍니다. */}
//             {selectedPatient ? <SummaryDashboard /> : <Placeholder />}
//         </div>
//     );
// };

import React from 'react';

import { VitalSummary } from '../components/summaries/VitalSummary';
import { LabSummary } from '../components/summaries/LabSummary';
import { ComplicationSummary } from '../components/summaries/ComplicationSummary';
import { ComplicationPredictionSummary } from '../components/summaries/ComplicationPredictionSummary';
import { MortalitySummary } from '../components/summaries/MortalitySummary';
import { SOD2Summary } from '../components/summaries/SOD2Summary';
import { GeneSummary } from '../components/summaries/GeneSummary';

export const MainPage = ({ selectedPatient }) => {
    
    const Placeholder = () => (
        <div style={{ border: '1px solid #ccc', padding: '40px', borderRadius: '8px', textAlign: 'center', color: '#777', backgroundColor: '#f9f9f9' }}>
            <h2>환자 정보 요약</h2>
            <p>좌측 목록에서 환자를 선택하시면, 해당 환자의 최신 의료 정보를 종합하여 보여줍니다.</p>
        </div>
    );

    const SummaryCard = ({ title, children }) => (
        <div style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, paddingBottom: '10px', borderBottom: '2px solid #dee2e6', color: '#495057', flexShrink: 0 }}>{title}</h3>
            <div style={{ flexGrow: 1, paddingTop: '10px' }}>{children}</div>
        </div>
    );

    const SummaryDashboard = () => (
        // ✅ 전체 대시보드를 감싸는 div 추가
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* ★★★ 윗줄: 3개의 카드 ★★★ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <SummaryCard title="최신 Vital 정보"><VitalSummary patientId={selectedPatient.uuid} /></SummaryCard>
                <SummaryCard title="최신 LAB 결과"><LabSummary patientId={selectedPatient.uuid} /></SummaryCard>
                <SummaryCard title="최신 처방 기록"><ComplicationSummary patientId={selectedPatient.uuid} /></SummaryCard>
            </div>
            {/* ★★★ 아랫줄: 4개의 카드 ★★★ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                <SummaryCard title="최신 합병증 예측"><ComplicationPredictionSummary patientId={selectedPatient.uuid} /></SummaryCard>
                <SummaryCard title="최신 사망률 예측"><MortalitySummary patientId={selectedPatient.uuid} /></SummaryCard>
                <SummaryCard title="최신 SOD2 평가"><SOD2Summary patientId={selectedPatient.uuid} /></SummaryCard>
                <SummaryCard title="최신 유전자 분석"><GeneSummary selectedPatient={selectedPatient} /></SummaryCard>
            </div>
        </div>
    );

    return (
        <div style={{padding: '20px'}}>
            {selectedPatient ? <SummaryDashboard /> : <Placeholder />}
        </div>
    );
};