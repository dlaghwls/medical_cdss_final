// 6월 26일 작업 전 원본 코드
// import React, { useState, useEffect } from 'react';
// import { fetchTestTypes, createLabOrder } from '../../services/labApiService';

// const LabOrderForm = ({ selectedPatient, user }) => {
//   const [testTypes, setTestTypes] = useState([]);
//   const [selectedTestType, setSelectedTestType] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [message, setMessage] = useState('');

//   useEffect(() => {
//     fetchTestTypes()
//       .then(response => {
//         setTestTypes(response.data);
//       })
//       .catch(error => console.error("검사 종류를 불러오는 데 실패했습니다:", error));
//   }, []);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!selectedPatient || !selectedTestType) {
//       setMessage("환자와 검사 종류를 모두 선택해주세요.");
//       return;
//     }
//     setIsLoading(true);
//     setMessage('');

//     const orderData = {
//       patient: selectedPatient.uuid,
//       test_type: selectedTestType,
//       performed_by: user?.name || "알 수 없음", // 임시
//       collected_at: new Date().toISOString(),
//       lab_location: "some_location_value"
//     };

//     console.log('최종적으로 서버에 보낼 데이터:', orderData);

//     createLabOrder(orderData)
//       .then(() => {
//         setMessage("검사 요청이 성공적으로 등록되었습니다.");
//         setSelectedTestType('');
//       })
//       .catch(error => {
//         setMessage(`오류 발생: ${error.message}`);
//       })
//       .finally(() => {
//         setIsLoading(false);
//       });
//   };

//   if (!selectedPatient) {
//     return <div>검사를 요청할 환자를 먼저 선택해주세요.</div>;
//   }

//   return (
//     <form onSubmit={handleSubmit}>
//       <h3>새 검사 요청</h3>
//       <p><strong>환자:</strong> {selectedPatient.display}</p>
//       <div>
//         <label htmlFor="test-type">검사 종류: </label>
//         <select
//           id="test-type"
//           value={selectedTestType}
//           onChange={(e) => setSelectedTestType(e.target.value)}
//           required
//         >
//           <option value="">검사를 선택하세요</option>
//           {testTypes.map(type => (
//             <option key={type.pk} value={type.pk}>
//               {type.fields.name} ({type.fields.description})
//             </option>
//           ))}
//         </select>
//       </div>
//       <button type="submit" disabled={isLoading} style={{marginTop: '15px'}}>
//         {isLoading ? '요청 중...' : '검사 요청하기'}
//       </button>
//       {message && <p style={{color: message.includes('오류') ? 'red' : 'green'}}>{message}</p>}
//     </form>
//   );
// };

// export default LabOrderForm;

import React, { useState, useEffect } from 'react';
import { fetchTestTypes, createLabOrder } from '../../services/labApiService';

const LabOrderForm = ({ selectedPatient, user }) => {
  const [testTypes, setTestTypes] = useState([]);
  const [selectedTestType, setSelectedTestType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTestTypes()
      .then(response => {
        setTestTypes(response.data);
      })
      .catch(error => console.error("검사 종류를 불러오는 데 실패했습니다:", error));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPatient || !selectedTestType) {
      setMessage("환자와 검사 종류를 모두 선택해주세요.");
      return;
    }
    setIsLoading(true);
    setMessage('');

    const orderData = {
      patient: selectedPatient.uuid,
      test_type: selectedTestType,
      performed_by: user?.name || "알 수 없음",
      collected_at: new Date().toISOString(),
      lab_location: "some_location_value"
    };
    createLabOrder(orderData)
      .then(() => {
        setMessage("검사 요청이 성공적으로 등록되었습니다.");
        setSelectedTestType('');
      })
      .catch(error => {
        setMessage(`오류 발생: ${error.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  if (!selectedPatient) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#777',
        fontSize: '1rem'
      }}>
        ⚠️ 검사를 요청할 환자를 먼저 선택해주세요.
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#fafafa',
      borderRadius: '8px',
      border: '1px solid #e0e0e0'
    }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '10px' }}>새 검사 요청</h3>
      <p style={{ fontSize: '1rem' }}><strong>환자:</strong> {selectedPatient.display}</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="test-type" style={{ fontWeight: 'bold' }}>검사 종류:</label><br/>
          <select
            id="test-type"
            value={selectedTestType}
            onChange={(e) => setSelectedTestType(e.target.value)}
            required
            style={{
              padding: '8px',
              fontSize: '1rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              marginTop: '5px',
              minWidth: '100%'
            }}
          >
            <option value="">검사를 선택하세요</option>
            {testTypes.map(type => (
              <option key={type.pk} value={type.pk}>
                {type.fields.name} ({type.fields.description})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: isLoading ? '#777' : '#007BFF',
            borderRadius: '4px',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0px 2px 5px rgba(0,0,0,.1)',
            marginTop: '10px'
          }}
        >
          {isLoading ? '요청 중...' : '검사 요청하기'}
        </button>
      </form>
      {message && (
        <div style={{
            marginTop: '15px',
            fontWeight: 'bold',
            fontSize: '1rem',
            color: message.includes('오류') ? 'red' : 'green'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default LabOrderForm;