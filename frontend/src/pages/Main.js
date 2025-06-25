import React from 'react';

// MainView를 통해 렌더링되므로, 필요한 props(selectedPatient 등)를 받을 수 있습니다.
export const MainPage = ({ selectedPatient, user }) => {
    return (
        <div>
            <div style={{ padding: '10px', borderBottom: '2px solid #333', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>환자 결과 요약</h2>
                <p style={{ marginTop: '5px', color: '#555' }}>
                    {selectedPatient ? `선택된 환자: ${selectedPatient.display}` : '환자를 선택해주세요.'}
                </p>
            </div>

            {/* 이 공간에 앞으로 여러 결과 컴포넌트들을 추가하게 됩니다.
                예: <VitalSummary />, <LabSummary />, <PredictionSummary /> 등
            */}
            
            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
                <p>이곳에 여러 모델 결과, 바이탈 정보, LAB 결과 등을 종합하여 표시합니다.</p>
                <p>각각의 결과 영역을 별도의 컴포넌트로 만들고, 이 페이지에서 조합하여 보여주는 방식으로 확장할 수 있습니다.</p>
            </div>
        </div>
    );
};