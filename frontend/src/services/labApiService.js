import axios from 'axios';

// 기본 URL에 /api를 포함시킵니다.
const API_BASE_URL = 'http://34.64.188.9:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API 응답을 컴포넌트가 사용하기 쉬운 형태로 가공합니다.
 * 1. DRF 페이지네이션 응답에서 결과 배열을 추출합니다.
 * 2. 평면적인 객체 배열을 Django fixture와 유사한 { pk, fields } 형태로 변환합니다.
 * @param {object} response - Axios 응답 객체
 * @returns {object} - 데이터가 처리된 Axios 응답 객체
 */
const processApiResponse = (response) => {
  let dataArray = [];

  // 1. 페이지네이션 처리: 응답 데이터에서 실제 배열을 추출합니다.
  if (response.data && Array.isArray(response.data.results)) {
    dataArray = response.data.results;
  } else if (Array.isArray(response.data)) {
    dataArray = response.data;
  } else {
    // 배열이 아닌 경우, 원본 그대로 반환합니다.
    return response;
  }

  // 2. 데이터 구조 변환: 평면 구조를 { pk, fields } 구조로 변환합니다.
  // 첫 번째 항목에 'fields' 속성이 없다면 변환이 필요한 것으로 간주합니다.
  if (dataArray.length > 0 && dataArray[0] && dataArray[0].fields === undefined) {
    const transformedData = dataArray.map(item => {
      // pk, uuid, id 등을 primary key로 사용하고 나머지를 fields에 넣습니다.
      const { pk, uuid, id, ...rest } = item;
      const primaryKey = pk || uuid || id;
      
      return {
        pk: primaryKey,  // 컴포넌트가 기대하는 최상위 pk
        fields: rest,    // name, description 등이 포함된 fields 객체
      };
    });
    // 가공된 배열을 응답 데이터로 설정합니다.
    response.data = transformedData;
  } else {
     // 이미 올바른 형식이거나 배열이 비어있는 경우
    response.data = dataArray;
  }
  
  return response;
};

/**
 * 모든 검사 종류 (예: CBC, ABGA) 목록을 가져옵니다.
 */
export const fetchTestTypes = async () => {
  const response = await apiClient.get('/labs/test-types/');
  return processApiResponse(response);
};

/**
 * 특정 검사 종류에 포함된 세부 항목 목록을 가져옵니다.
 * @param {string} testTypeId - 검사 종류의 UUID
 */
export const fetchTestItems = async (testTypeId) => {
  const response = await apiClient.get(`/labs/test-types/${testTypeId}/items/`);
  return processApiResponse(response);
};

/**
 * 결과 입력이 필요한 검사 요청 목록을 가져옵니다.
 */
export const fetchPendingOrders = async () => {
  const response = await apiClient.get('/labs/orders/', { params: { status: 'pending' } });
  return processApiResponse(response);
};

/**
 * 특정 환자의 모든 검사 결과를 가져옵니다.
 * @param {string} patientUuid - 환자의 UUID
 */
export const fetchPatientResults = async (patientUuid) => {
  const response = await apiClient.get('/labs/results/', { params: { patient_uuid: patientUuid } });
  return processApiResponse(response);
};

/**
 * 새로운 검사를 요청(Order)합니다.
 * @param {object} orderData - { patient, test_type, performed_by, ... }
 */
export const createLabOrder = (orderData) => {
  // POST 요청은 일반적으로 데이터 가공이 필요 없습니다.
  return apiClient.post('/labs/orders/', orderData);
};

/**
 * 여러 개의 검사 결과를 한 번에 제출합니다.
 * @param {Array<object>} resultsData - [{ lab_order, test_item, result_value, ... }, ...]
 */
export const createLabResults = (resultsData) => {
  const requests = resultsData.map(result => apiClient.post('/labs/results/', result));
  return Promise.all(requests);
};

// 기본 export 추가 (필요시)
export default apiClient;

