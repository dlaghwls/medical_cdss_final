// import React from 'react';

// // MainView를 통해 렌더링되므로, 필요한 props(selectedPatient 등)를 받을 수 있습니다.
// export const MainPage = ({ selectedPatient, user }) => {
//     return (
//         <div>
//             <div style={{ padding: '10px', borderBottom: '2px solid #333', marginBottom: '20px' }}>
//                 <h2 style={{ margin: 0 }}>환자 결과 요약</h2>
//                 <p style={{ marginTop: '5px', color: '#555' }}>
//                     {selectedPatient ? `선택된 환자: ${selectedPatient.display}` : '환자를 선택해주세요.'}
//                 </p>
//             </div>

//             {/* 이 공간에 앞으로 여러 결과 컴포넌트들을 추가하게 됩니다.
//                 예: <VitalSummary />, <LabSummary />, <PredictionSummary /> 등
//             */}
            
//             <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
//                 <p>이곳에 여러 모델 결과, 바이탈 정보, LAB 결과 등을 종합하여 표시합니다.</p>
//                 <p>각각의 결과 영역을 별도의 컴포넌트로 만들고, 이 페이지에서 조합하여 보여주는 방식으로 확장할 수 있습니다.</p>
//             </div>
//         </div>
//     );
// };

import React from 'react';
import { VitalSummary } from '../components/summaries/VitalSummary';
import { LabSummary } from '../components/summaries/LabSummary';
import { ComplicationSummary } from '../components/summaries/ComplicationSummary';
import { MortalitySummary } from '../components/summaries/MortalitySummary';
import { SOD2Summary } from '../components/summaries/SOD2Summary';
import { GeneSummary } from '../components/summaries/GeneSummary';

// 환자 요약 페이지의 메인 컴포넌트
export const MainPage = ({ selectedPatient }) => {
    
    // 환자가 선택되지 않았을 때 보여줄 UI
    const Placeholder = () => (
        <div style={{ border: '1px solid #ccc', padding: '40px', borderRadius: '8px', textAlign: 'center', color: '#777', backgroundColor: '#f9f9f9' }}>
            <h2>환자 정보 요약</h2>
            <p>좌측 목록에서 환자를 선택하시면, 해당 환자의 최신 의료 정보를 종합하여 보여줍니다.</p>
        </div>
    );

    // 각 요약 정보를 감싸는 카드 컴포넌트
    const SummaryCard = ({ title, children }) => (
        <div style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, paddingBottom: '10px', borderBottom: '2px solid #dee2e6', color: '#495057' }}>{title}</h3>
            <div>{children}</div>
        </div>
    );

    // 환자가 선택되었을 때 보여줄 요약 정보 UI
    const SummaryDashboard = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            <SummaryCard title="최신 Vital 정보">
                <VitalSummary patientId={selectedPatient.uuid} />
            </SummaryCard>
            
            <SummaryCard title="최신 LAB 결과">
                <LabSummary patientId={selectedPatient.uuid} />
            </SummaryCard>
            
            <SummaryCard title="최신 합병증 기록">
                <ComplicationSummary patientId={selectedPatient.uuid} />
            </SummaryCard>

            <SummaryCard title="최신 사망률 예측">
                <MortalitySummary patientId={selectedPatient.uuid} />
            </SummaryCard>

            <SummaryCard title="최신 SOD2 평가">
                 <SOD2Summary patientId={selectedPatient.uuid} />
            </SummaryCard>
            
            <SummaryCard title="최신 유전자 분석">
                 <GeneSummary patientId={selectedPatient.uuid} selectedPatient={selectedPatient} />
            </SummaryCard>
        </div>
    );

    return (
        <div style={{padding: '20px'}}>
            {selectedPatient ? <SummaryDashboard /> : <Placeholder />}
        </div>
    );
};
