// 6월 26일 오후 4시 작업 전 원본 코드
// import React, { useState } from 'react';
// import LabOrderForm from './LabOrderForm';
// import PatientLabResultsView from './PatientLabResultsView';
// import PendingOrdersList from './PendingOrdersList';

// const LabPage = ({ user, selectedPatient }) => {
//   // TODO: user.role 인증이 구현되면 아래 코드로 교체하세요.
//   // const userRole = user?.role; // 'nurse', 'tec'
  
//   // 임시 역할 전환기
//   const [viewAs, setViewAs] = useState('nurse'); 
//   const userRole = viewAs;

//   const [activeNurseTab, setActiveNurseTab] = useState('order');

//   const renderRoleSwitcher = () => (
//     <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}>
//       <h4>임시 뷰 전환 (개발용)</h4>
//       <button onClick={() => setViewAs('nurse')} style={{ backgroundColor: viewAs === 'nurse' ? '#007bff' : 'grey', color: 'white', marginRight: '10px' }}>간호사 뷰</button>
//       <button onClick={() => setViewAs('tec')} style={{ backgroundColor: viewAs === 'tec' ? '#007bff' : 'grey', color: 'white' }}>검사 담당자 뷰</button>
//       <p style={{marginTop: '5px'}}>현재 뷰: <strong>{viewAs}</strong></p>
//     </div>
//   );

//   const renderNurseView = () => (
//     <div>
//         <div style={{ marginBottom: '20px' }}>
//             <button onClick={() => setActiveNurseTab('order')} style={{ marginRight: '10px', fontWeight: activeNurseTab === 'order' ? 'bold' : 'normal' }}>검사 요청</button>
//             <button onClick={() => setActiveNurseTab('results')} style={{ fontWeight: activeNurseTab === 'results' ? 'bold' : 'normal' }}>결과 조회</button>
//         </div>
//         {activeNurseTab === 'order' ? 
//             <LabOrderForm selectedPatient={selectedPatient} user={user} /> :
//             <PatientLabResultsView selectedPatient={selectedPatient} />
//         }
//     </div>
//   );

//   const renderTechnicianView = () => (
//     <PendingOrdersList />
//   );

//   return (
//     <div style={{ padding: '20px' }}>
//       {renderRoleSwitcher()}
//       <h2>랩 검사 (Lab Tests)</h2>
      
//       {/* // user.role 인증 구현 후 사용할 실제 렌더링 로직
//         {userRole === 'nurse' && renderNurseView()}
//         {userRole === 'tec' && renderTechnicianView()}
//         {!userRole && <div>역할이 지정되지 않은 사용자입니다.</div>}
//       */}
      
//       {/* 임시 렌더링 로직 */}
//       {userRole === 'nurse' && renderNurseView()}
//       {userRole === 'tec' && renderTechnicianView()}
//     </div>
//   );
// };

// export default LabPage;

// import React, { useState } from 'react';
// import LabOrderForm from './LabOrderForm';
// import PatientLabResultsView from './PatientLabResultsView';
// import PendingOrdersList from './PendingOrdersList';

// const LabPage = ({ user, selectedPatient }) => {
//   const [viewAs, setViewAs] = useState('nurse'); 
//   const userRole = viewAs;

//   const [activeNurseTab, setActiveNurseTab] = useState('order');

//   const renderRoleSwitcher = () => (
//     <div style={{
//       marginBottom: '20px',
//       padding: '10px',
//       backgroundColor: '#f9f9f9',
//       border: '1px solid #e0e0e0',
//       borderRadius: '6px'
//     }}>
//       <h4 style={{ fontWeight: 'bold' }}>임시 뷰 전환 (개발용)</h4>
//       <div>
//         <button
//           onClick={() => setViewAs('nurse')}
//           style={{
//             padding: '5px 15px',
//             marginRight: '10px',
//             fontWeight: viewAs === 'nurse' ? 'bold' : 'normal',
//             backgroundColor: viewAs === 'nurse' ? '#007BFF' : '#777',
//             color: 'white',
//             borderRadius: '4px'
//           }}
//         >
//           간호사 뷰
//         </button>
//         <button
//           onClick={() => setViewAs('tec')}
//           style={{
//             padding: '5px 15px',
//             fontWeight: viewAs === 'tec' ? 'bold' : 'normal',
//             backgroundColor: viewAs === 'tec' ? '#007BFF' : '#777',
//             color: 'white',
//             borderRadius: '4px'
//           }}
//         >
//           검사 담당자 뷰
//         </button>
//       </div>
//       <p style={{ marginTop: '5px' }}>현재 뷰: <strong>{viewAs}</strong></p>
//     </div>
//   );

//   const renderNurseView = () => (
//     <div>
//       <div style={{ marginBottom: '15px' }}>
//         <button
//           onClick={() => setActiveNurseTab('order')}
//           style={{
//             marginRight: '15px',
//             padding: '7px 20px',
//             fontWeight: activeNurseTab === 'order' ? 'bold' : 'normal',
//             borderBottom: activeNurseTab === 'order' ? '2px solid #007BFF' : 'none',
//             fontSize: '1rem',
//             cursor: 'pointer',
//             background: 'none',
//             border: 'none'
//           }}
//         >
//           검사 요청
//         </button>
//         <button
//           onClick={() => setActiveNurseTab('results')}
//           style={{
//             padding: '7px 20px',
//             fontWeight: activeNurseTab === 'results' ? 'bold' : 'normal',
//             borderBottom: activeNurseTab === 'results' ? '2px solid #007BFF' : 'none',
//             fontSize: '1rem',
//             cursor: 'pointer',
//             background: 'none',
//             border: 'none'
//           }}
//         >
//           결과 조회
//         </button>
//       </div>
//       <div style={{
//         padding: '20px',
//         backgroundColor: '#fff',
//         borderRadius: '8px',
//         border: '1px solid #e0e0e0',
//         boxShadow: '0px 2px 8px rgba(0,0,0,.1)',
//       }}>
//         {activeNurseTab === 'order' ? 
//             <LabOrderForm selectedPatient={selectedPatient} user={user} /> :
//             <PatientLabResultsView selectedPatient={selectedPatient} />
//         }
//       </div>
//     </div>
//   );

//   const renderTechnicianView = () => (
//     <div style={{
//       padding: '20px',
//       backgroundColor: '#fff',
//       borderRadius: '8px',
//       border: '1px solid #e0e0e0',
//       boxShadow: '0px 2px 8px rgba(0,0,0,.1)',
//     }}>
//       <PendingOrdersList />
//     </div>
//   );

//   return (
//     <div style={{ padding: '20px' }}>
//       {renderRoleSwitcher()}
//       <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>랩 검사 (Lab Tests)</h2>
//       {userRole === 'nurse' && renderNurseView()}
//       {userRole === 'tec' && renderTechnicianView()}
//     </div>
//   );
// };

// export default LabPage;

import React, { useState } from 'react';
import LabOrderForm from './LabOrderForm';
import PatientLabResultsView from './PatientLabResultsView';
import PendingOrdersList from './PendingOrdersList';

const LabPage = ({ user, selectedPatient }) => {
  const [viewAs, setViewAs] = useState('nurse'); 
  const userRole = viewAs;

  const [activeNurseTab, setActiveNurseTab] = useState('order');

  const renderRoleSwitcher = () => (
    <div style={{
      padding: '20px',
      borderRadius: '12px',
      backgroundColor: '#fafafa',
      border: '1px solid #e0e0e0',
      boxShadow: '0px 2px 8px rgba(0,0,0,.1)',
      marginBottom: '25px'
    }}>
      <h4 style={{
        fontWeight: 'bold',
        fontSize: '1.1rem',
        color: '#333',
        marginBottom: '12px'
      }}>
        👥 임시 뷰 전환 (개발용)
      </h4>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => setViewAs('nurse')}
          style={{
            padding: '8px 20px',
            fontWeight: 'bold',
            fontSize: '1rem',
            color: 'white',
            backgroundColor: viewAs === 'nurse' ? '#007BFF' : '#777',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            marginRight: '12px',
            boxShadow: '0px 2px 6px rgba(0,0,0,.1)',
            transition: 'all .3s',
          }}
        >
          간호사 뷰
        </button>
        <button
          onClick={() => setViewAs('tec')}
          style={{
            padding: '8px 20px',
            fontWeight: 'bold',
            fontSize: '1rem',
            color: 'white',
            backgroundColor: viewAs === 'tec' ? '#007BFF' : '#777',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0px 2px 6px rgba(0,0,0,.1)',
            transition: 'all .3s',
          }}
        >
          검사 담당자 뷰
        </button>
      </div>
      <p style={{
        marginTop: '10px',
        fontSize: '0.95rem',
        fontWeight: 'bold',
        color: '#555'
      }}>
        현재 뷰: <span style={{ color: '#007BFF' }}>{viewAs}</span>
      </p>
    </div>
  );

  const renderNurseView = () => (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={() => setActiveNurseTab('order')}
          style={{
            marginRight: '15px',
            padding: '7px 20px',
            fontWeight: activeNurseTab === 'order' ? 'bold' : 'normal',
            borderBottom: activeNurseTab === 'order' ? '2px solid #007BFF' : 'none',
            fontSize: '1rem',
            cursor: 'pointer',
            background: 'none',
            border: 'none'
          }}
        >
          검사 요청
        </button>
        <button
          onClick={() => setActiveNurseTab('results')}
          style={{
            padding: '7px 20px',
            fontWeight: activeNurseTab === 'results' ? 'bold' : 'normal',
            borderBottom: activeNurseTab === 'results' ? '2px solid #007BFF' : 'none',
            fontSize: '1rem',
            cursor: 'pointer',
            background: 'none',
            border: 'none'
          }}
        >
          결과 조회
        </button>
      </div>
      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        boxShadow: '0px 2px 8px rgba(0,0,0,.1)',
      }}>
        {activeNurseTab === 'order' ? 
            <LabOrderForm selectedPatient={selectedPatient} user={user} /> :
            <PatientLabResultsView selectedPatient={selectedPatient} />
        }
      </div>
    </div>
  );

  const renderTechnicianView = () => (
    <div style={{
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      boxShadow: '0px 2px 8px rgba(0,0,0,.1)',
    }}>
      <PendingOrdersList />
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      {renderRoleSwitcher()}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>랩 검사 (Lab Tests)</h2>
      {userRole === 'nurse' && renderNurseView()}
      {userRole === 'tec' && renderTechnicianView()}
    </div>
  );
};

export default LabPage;