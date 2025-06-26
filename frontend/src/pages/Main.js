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

// frontend 1차 수정
// import React, { useState, useEffect } from 'react';
// // import { fetchLatestSOD2Assessment } from '../../services/djangoApiService';
// import { fetchLatestSOD2Assessment } from '../services/djangoApiService';
// // import { SOD2Result } from '../AI_result/SOD2_result';
// import { SOD2Result } from '../components/AI_result/SOD2_result';

// export const MainPage = ({ selectedPatient, user }) => {
//   const [sod2ResultData, setSod2ResultData] = useState(null);
//   const [loadingSod2, setLoadingSod2] = useState(false);
//   const [errorSod2, setErrorSod2] = useState(null);

//   useEffect(() => {
//     if (selectedPatient && selectedPatient.uuid) {
//       loadSod2Data(selectedPatient.uuid);
//     } else {
//       setSod2ResultData(null);
//     }
//   }, [selectedPatient]);

//   const loadSod2Data = async (patientUuid) => {
//     setLoadingSod2(true);
//     setErrorSod2(null);
//     try {
//       const sod2Data = await fetchLatestSOD2Assessment(patientUuid);
//       if (sod2Data) {
//         setSod2ResultData(sod2Data);
//       } else {
//         setSod2ResultData(null);
//       }
//     } catch (error) {
//       console.error(error);
//       setErrorSod2(error.message || 'SOD2 데이터를 불러오는 데 실패했습니다.');
//     } finally {
//       setLoadingSod2(false);
//     }
//   };
  
//   return (
//     <div>
//       <div style={{ padding: '10px', borderBottom: '2px solid #333', marginBottom: '20px' }}>
//         <h2 style={{ margin: 0 }}>환자 결과 요약</h2>
//         <p style={{ marginTop: '5px', color: '#555' }}>
//             {selectedPatient ? `선택된 환자: ${selectedPatient.display}` : '환자를 선택해주세요.'}
//         </p>
//       </div>

//       <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
//         <p>이곳에 여러 모델 결과, 바이탈 정보, LAB 결과 등을 종합하여 표시합니다.</p>
//         <p>각각의 결과 영역을 별도의 컴포넌트로 만들고, 이 페이지에서 조합하여 보여주는 방식으로 확장할 수 있습니다.</p>
//       </div>

//       {/* ⚡️ SOD2 결과 부분 */}
//       <div style={{ marginTop: '30px' }}>
//         <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>SOD2 평가 결과</h3>
//         {loadingSod2 && (
//             <div style={{ padding: '20px', textAlign: 'center' }}>
//               로딩 중...
//             </div>
//         )}
//         {errorSod2 && (
//             <div style={{ color: 'red', padding: '20px' }}>
//               {errorSod2}
//             </div>
//         )}
//         {!loadingSod2 && !errorSod2 && sod2ResultData && (
//             <SOD2Result assessmentData={sod2ResultData} />
//         )}
//         {!loadingSod2 && !errorSod2 && !sod2ResultData && (
//             <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
//               SOD2 평가 결과가 없습니다.
//             </div>
//         )}
//       </div>
//     </div>
//   );
// };


import React, { useState, useEffect } from 'react';
import { fetchLatestSOD2Assessment } from '../services/djangoApiService';
import { SOD2Result } from '../components/AI_result/SOD2_result';

export const MainPage = ({ selectedPatient, user }) => {
  const [sod2Results, setSOD2Results] = useState(null);
  const [loadingSod2, setLoadingSod2] = useState(false);
  const [errorSod2, setErrorSod2] = useState(null);

  // ⚡️ selectedPatient 변경될 때마다 loadSOD2Data 호출
  useEffect(() => {
    if (selectedPatient && selectedPatient.uuid) {
      loadSOD2Data(selectedPatient.uuid);
    } else {
      setSOD2Results(null);
    }
  }, [selectedPatient]);

  // ⚡️ SOD2 데이터 로드
  const loadSOD2Data = async (patientUuid) => {
    setLoadingSod2(true);
    setErrorSod2(null);
    try {
      const latestSOD2Assessment = await fetchLatestSOD2Assessment(patientUuid);


      console.log('[loadSOD2Data 호출 성공]', patientUuid);
      console.log('[loadSOD2Data 반환 값]', latestSOD2Assessment);


      if (latestSOD2Assessment) {
        setSOD2Results({
          patient_info: {
            age: latestSOD2Assessment.age,
            gender: latestSOD2Assessment.gender,
            stroke_type: latestSOD2Assessment.stroke_type,
            nihss_score: latestSOD2Assessment.nihss_score,
            hours_after_stroke: latestSOD2Assessment.hours_after_stroke,
          },
          sod2_status: {
            current_level: latestSOD2Assessment.current_sod2_level,
            oxidative_stress_risk: latestSOD2Assessment.oxidative_stress_risk,
            prediction_confidence: latestSOD2Assessment.prediction_confidence,
            overall_status: latestSOD2Assessment.overall_status,
          },
          sod2_prediction_data: latestSOD2Assessment.sod2_prediction_data || [],
          exercise_recommendations: {
            can_start: latestSOD2Assessment.exercise_can_start,
            intensity: latestSOD2Assessment.exercise_intensity,
            monitoring_schedule:
              latestSOD2Assessment.exercise_recommendations || '정기적 재평가 필요',
            time_until_start: latestSOD2Assessment.time_until_start || 0,
            sod2_target: latestSOD2Assessment.sod2_target || 0,
          },
          clinical_recommendations: latestSOD2Assessment.clinical_recommendations || []
        });
      }
    } catch (error) {
      console.error(error);
      setErrorSod2(error.message || 'SOD2 데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoadingSod2(false);
    }
  };
  
  return (
    <div>
      <div style={{ padding: '10px', borderBottom: '2px solid #333', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>환자 결과 요약</h2>
        <p style={{ marginTop: '5px', color: '#555' }}>
            {selectedPatient ? `선택된 환자: ${selectedPatient.display}` : '환자를 선택해주세요.'}
        </p>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
        <p>이곳에 여러 모델 결과, 바이탈 정보, LAB 결과 등을 종합하여 표시합니다.</p>
        <p>각각의 결과 영역을 별도의 컴포넌트로 만들고, 이 페이지에서 조합하여 보여주는 방식으로 확장할 수 있습니다.</p>
      </div>

      {/* ⚡️ SOD2 결과 부분 */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>SOD2 평가 결과</h3>
        {loadingSod2 && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              로딩 중...
            </div>
        )}
        {errorSod2 && (
            <div style={{ color: 'red', padding: '20px' }}>
              {errorSod2}
            </div>
        )}
        {!loadingSod2 && !errorSod2 && sod2Results && (
            <SOD2Result assessmentData={sod2Results} />
        )}
        {!loadingSod2 && !errorSod2 && !sod2Results && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              SOD2 평가 결과가 없습니다.
            </div>
        )}
      </div>
    </div>
  );
};

// import React from 'react';
// // import { Header } from '../components/Header';
// import Header from '../components/Common/Header';
// // import Header from '../components/Header';
// import { SOD2ResultSection } from '../components/sections/SOD2ResultSection';
// import { SurvivalResultSection } from '../components/sections/SurvivalResultSection';
// import { ComplicationResultSection } from '../components/sections/ComplicationResultSection';

// export const MainPage = ({ selectedPatient }) => {
//   // ✅ 핵심 체크: selectedPatient가 유효하고 uuid 속성을 가지고 있는가?
//   if (!selectedPatient?.uuid) {
//     return (
//       <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
//         ⚠️ 환자가 선택되지 않았거나 UUID 값이 누락되었습니다.
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '20px' }}>
//       {/* 👤 환자 기본 정보 */}
//       <Header patient={selectedPatient} />

//       <div className="results-sections">
//         {/* 🩺 원래 성공했던 로직 그대로 재사용하는 SOD2 검사 결과 */}
//         <SOD2ResultSection patientUuid={selectedPatient?.uuid} />

//         {/* 🫀 앞으로 개발될 다른 검사도 같은 로직 재사용 가능 */}
//         <SurvivalResultSection patientUuid={selectedPatient?.uuid} />

//         <ComplicationResultSection patientUuid={selectedPatient?.uuid} />
//       </div>
//     </div>
//   );
// };

// import React from 'react';
// // import { Header } from '../components/Header';
// import Header from '../components/Common/Header';
// // 변경된 파일로 import 경로 변경
// import { SOD2ResultSection } from '../components/AI_result/SOD2_result';
// import { SurvivalResultSection } from '../components/sections/SurvivalResultSection';
// import { ComplicationResultSection } from '../components/sections/ComplicationResultSection';

// export const MainPage = ({ selectedPatient }) => {
//   // ✅ 핵심 체크: selectedPatient가 유효하고 uuid 속성을 가지고 있는가?
//   if (!selectedPatient?.uuid) {
//     return (
//       <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
//         ⚠️ 환자가 선택되지 않았거나 UUID 값이 누락되었습니다.
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '20px' }}>
//       {/* 👤 환자 기본 정보 */}
//       <Header patient={selectedPatient} />

//       <div className="results-sections">
//         {/* 🩺 변경된 SOD2 검사 결과 컴포넌트 */}
//         <SOD2ResultSection patientUuid={selectedPatient?.uuid} />

//         {/* 🫀 앞으로 개발될 다른 검사도 같은 로직 재사용 가능 */}
//         <SurvivalResultSection patientUuid={selectedPatient?.uuid} />
//         <ComplicationResultSection patientUuid={selectedPatient?.uuid} />
//       </div>
//     </div>
//   );
// };