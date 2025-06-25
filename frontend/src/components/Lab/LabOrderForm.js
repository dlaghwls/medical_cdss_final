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
      performed_by: user?.name || "알 수 없음", // 임시
      collected_at: new Date().toISOString(),
      lab_location: "some_location_value"
    };

    console.log('최종적으로 서버에 보낼 데이터:', orderData);

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
    return <div>검사를 요청할 환자를 먼저 선택해주세요.</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>새 검사 요청</h3>
      <p><strong>환자:</strong> {selectedPatient.display}</p>
      <div>
        <label htmlFor="test-type">검사 종류: </label>
        <select
          id="test-type"
          value={selectedTestType}
          onChange={(e) => setSelectedTestType(e.target.value)}
          required
        >
          <option value="">검사를 선택하세요</option>
          {testTypes.map(type => (
            <option key={type.pk} value={type.pk}>
              {type.fields.name} ({type.fields.description})
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={isLoading} style={{marginTop: '15px'}}>
        {isLoading ? '요청 중...' : '검사 요청하기'}
      </button>
      {message && <p style={{color: message.includes('오류') ? 'red' : 'green'}}>{message}</p>}
    </form>
  );
};

export default LabOrderForm;