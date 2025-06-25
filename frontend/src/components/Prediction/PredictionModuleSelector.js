// 6월 20일 프론트엔드 작업 전
// import React from 'react';

// const PredictionModuleSelector = ({ selectedPatient, onModuleSelect, onBackToPatientList }) => {
//     const modules = [
//         {
//             id: 'complications',
//             name: '합병증 예측',
//             description: '폐렴, 급성 신장손상, 심부전 등의 발생 위험도를 AI로 예측합니다.',
//             status: 'available'
//         },
//         {
//             id: 'sod2',
//             name: 'SOD2 분석',
//             description: '산화스트레스 마커를 분석하여 최적의 운동 치료 시점을 제공합니다.',
//             status: 'coming_soon'
//         },
//         {
//             id: 'mortality',
//             name: '사망률 예측',
//             description: '환자의 생존 확률과 예후를 종합적으로 분석합니다.',
//             status: 'coming_soon'
//         }
//     ];

//     const handleModuleClick = (moduleId) => {
//         if (modules.find(m => m.id === moduleId)?.status === 'available') {
//             onModuleSelect(moduleId);
//         }
//     };

//     return (
//         <div style={{ padding: '20px', maxWidth: '1000px' }}>
//             <h3>AI 예측 모듈 선택</h3>
//             <p style={{ color: '#666', marginBottom: '30px' }}>
//                 선택된 환자에 대해 실행할 AI 예측 모듈을 선택해주세요.
//             </p>
            
//             {/* 선택된 환자 정보 */}
//             <div style={{ 
//                 border: '2px solid #007bff', 
//                 borderRadius: '8px', 
//                 padding: '20px', 
//                 marginBottom: '30px',
//                 backgroundColor: '#f8f9fa'
//             }}>
//                 <h4>선택된 환자</h4>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <div>
//                         <h5 style={{ color: '#007bff', margin: '5px 0' }}>
//                             {selectedPatient?.display || '이름 없음'}
//                         </h5>
//                         <p style={{ margin: '5px 0', color: '#666' }}>
//                             UUID: {selectedPatient?.uuid}
//                         </p>
//                     </div>
//                     <button 
//                         onClick={onBackToPatientList}
//                         style={{
//                             padding: '10px 20px',
//                             backgroundColor: '#6c757d',
//                             color: 'white',
//                             border: 'none',
//                             borderRadius: '4px',
//                             cursor: 'pointer'
//                         }}
//                     >
//                         환자 재선택
//                     </button>
//                 </div>
//             </div>

//             {/* 예측 모듈 버튼들 */}
//             <div style={{ 
//                 display: 'grid', 
//                 gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
//                 gap: '20px' 
//             }}>
//                 {modules.map((module) => (
//                     <div
//                         key={module.id}
//                         onClick={() => handleModuleClick(module.id)}
//                         style={{
//                             border: module.status === 'available' ? '2px solid #28a745' : '2px solid #dee2e6',
//                             borderRadius: '8px',
//                             padding: '25px',
//                             backgroundColor: module.status === 'available' ? 'white' : '#f8f9fa',
//                             cursor: module.status === 'available' ? 'pointer' : 'not-allowed',
//                             transition: 'all 0.3s ease',
//                             opacity: module.status === 'available' ? 1 : 0.6,
//                             position: 'relative'
//                         }}
//                         onMouseEnter={(e) => {
//                             if (module.status === 'available') {
//                                 e.target.style.transform = 'translateY(-5px)';
//                                 e.target.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
//                             }
//                         }}
//                         onMouseLeave={(e) => {
//                             if (module.status === 'available') {
//                                 e.target.style.transform = 'translateY(0)';
//                                 e.target.style.boxShadow = 'none';
//                             }
//                         }}
//                     >
//                         <h4 style={{ 
//                             margin: '0 0 15px 0', 
//                             color: module.status === 'available' ? '#28a745' : '#6c757d',
//                             fontSize: '1.3rem'
//                         }}>
//                             {module.name}
//                         </h4>
//                         <p style={{ 
//                             color: '#666', 
//                             lineHeight: '1.5',
//                             margin: '0 0 15px 0'
//                         }}>
//                             {module.description}
//                         </p>
                        
//                         {module.status === 'available' ? (
//                             <div style={{
//                                 padding: '8px 16px',
//                                 backgroundColor: '#28a745',
//                                 color: 'white',
//                                 borderRadius: '4px',
//                                 textAlign: 'center',
//                                 fontWeight: 'bold'
//                             }}>
//                                 사용 가능
//                             </div>
//                         ) : (
//                             <div style={{
//                                 padding: '8px 16px',
//                                 backgroundColor: '#6c757d',
//                                 color: 'white',
//                                 borderRadius: '4px',
//                                 textAlign: 'center',
//                                 fontWeight: 'bold'
//                             }}>
//                                 준비 중
//                             </div>
//                         )}
//                     </div>
//                 ))}
//             </div>

//             <div style={{ 
//                 marginTop: '30px', 
//                 padding: '15px', 
//                 backgroundColor: '#e3f2fd', 
//                 borderRadius: '4px',
//                 fontSize: '0.9rem',
//                 color: '#1976d2'
//             }}>
//                 <strong>참고:</strong> 각 예측 모듈은 환자의 LAB 데이터를 기반으로 AI 분석을 수행합니다. 
//                 정확한 예측을 위해 최신 검사 결과와 활력징후를 준비해주세요.
//             </div>
//         </div>
//     );
// };

// export default PredictionModuleSelector;

// 여기서부터 6월 20일 프론트 작업 중인 내용
// import React from 'react';
//import styles from './PredictionModuleSelector.module.css';  // ✅ 스타일 임포트
import styles from '../../styles/prediction/PredictionModuleSelector.module.css';
import React from 'react';

const PredictionModuleSelector = ({ selectedPatient, onModuleSelect, onBackToPatientList }) => {
  const modules = [
    {
      id: 'complications',
      name: '합병증 예측',
      description: '폐렴, 급성 신장손상, 심부전 등의 발생 위험도를 AI로 예측합니다.',
      status: 'available'
    },
    {
      id: 'sod2',
      name: 'SOD2 분석',
      description: '산화스트레스 마커를 분석하여 최적의 운동 치료 시점을 제공합니다.',
      status: 'available'
    },
    {
      id: 'mortality',
      name: '사망률 예측',
      description: '30일 사망률을 종합적으로 분석하여 환자의 생존 확률을 예측합니다.',
      status: 'available'
    }
  ];

  const handleModuleClick = (moduleId) => {
    if (modules.find(m => m.id === moduleId)?.status === 'available') {
      onModuleSelect(moduleId);
    }
  };

  return (
    <div className={styles.container}>
      <h3>AI 예측 모듈 선택</h3>
      <p className={styles.description}>
        선택된 환자에 대해 실행할 AI 예측 모듈을 선택해주세요.
      </p>

      <div className={styles.patientCard}>
        <h4>선택된 환자</h4>
        <div className={styles.patientHeader}>
          <div>
            <h5 className={styles.patientName}>{selectedPatient?.display || '이름 없음'}</h5>
            <p className={styles.patientUuid}>UUID: {selectedPatient?.uuid}</p>
          </div>
          <button className={styles.reselectButton} onClick={onBackToPatientList}>환자 재선택</button>
        </div>
      </div>

      <div className={styles.moduleGrid}>
        {modules.map((module) => (
          <div
            key={module.id}
            className={`${styles.moduleCard} ${module.status === 'available' ? styles.available : styles.comingSoon}`}
            onClick={() => handleModuleClick(module.id)}
          >
            <h4 className={`${styles.moduleTitle} ${module.status === 'available' ? styles.moduleAvailable : styles.moduleDisabled}`}>
              {module.name}
            </h4>
            <p className={styles.moduleDesc}>{module.description}</p>
            <div className={`${styles.statusTag} ${module.status === 'available' ? styles.tagAvailable : styles.tagDisabled}`}>
              {module.status === 'available' ? '사용 가능' : '준비 중'}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.note}>
        <strong>참고:</strong> 각 예측 모듈은 환자의 LAB 데이터를 기반으로 AI 분석을 수행합니다.
        정확한 예측을 위해 최신 검사 결과와 활력징후를 준비해주세요.
      </div>
    </div>
  );
};

export default PredictionModuleSelector;