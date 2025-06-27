// src/services/labApiService.js

import axios from 'axios';

const API_BASE_URL = 'http://34.64.188.9:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API 응답 데이터를 { pk, fields } 형태로 변환합니다.
 * 백엔드 Serializer가 이미 display_name 필드들을 제공하므로,
 * 이 함수는 주로 { id, ...rest } -> { pk, fields: rest } 변환에만 초점을 맞춥니다.
 * @param {object} response - Axios 응답 객체
 * @returns {object} - 데이터가 처리된 Axios 응답 객체
 */
const processApiResponse = (response) => {
  let dataArray = [];

  // 페이지네이션 처리: 응답 데이터에서 실제 배열을 추출합니다.
  if (response.data && Array.isArray(response.data.results)) {
    dataArray = response.data.results;
  } else if (Array.isArray(response.data)) {
    dataArray = response.data;
  } else {
    // 배열이 아닌 경우, 원본 그대로 반환합니다.
    return response;
  }

  // 데이터 구조 변환: 평면 구조를 { pk, fields } 구조로 변환합니다.
  const transformedData = dataArray.map(item => {
    const { id, ...rest } = item;
    return {
      pk: id,
      fields: rest, // 나머지 모든 필드가 여기에 들어갑니다. (display_name 포함)
    };
  });
  response.data = transformedData;
  
  return response;
};

/**
 * 모든 검사 종류 (예: CBC, ABGA) 목록을 가져옵니다.
 * 응답: [{id: UUID, name: 'CBC', description: '...', items: [...]}, ...]
 */
export const fetchTestTypes = async () => {
  const response = await apiClient.get('/labs/test-types/');
  return processApiResponse(response);
};

/**
 * 특정 검사 종류에 포함된 세부 항목 목록을 가져옵니다.
 * @param {string} testTypeUuid - 검사 종류의 UUID (LabTestType.id)
 * 응답: [{id: UUID, test_type: UUID, name: 'Hemoglobin', unit: '...', ref_low: '...', ...}, ...]
 */
export const fetchTestItems = async (testTypeUuid) => {
  const response = await apiClient.get(`/labs/test-types/${testTypeUuid}/items/`);
  return processApiResponse(response);
};

/**
 * 결과 입력이 필요한 검사 요청 목록을 가져옵니다.
 * @param {object} params - 쿼리 파라미터 (예: { patient_uuid: '...' })
 * 응답: [{id: UUID, patient: UUID, patient_display_name: '...', test_type: UUID, test_type_display_name: '...', collected_at: 'YYYY-MM-DDTHH:mm:ssZ', ..., status: 'pending/completed' }, ...]
 */
export const fetchPendingOrders = async (params = {}) => {
  // 기존: const response = await apiClient.get('/labs/orders/', { params: { ...params, status: 'pending' } });
  // 변경: status 파라미터를 동적으로 처리하거나, 아예 제거하여 모든 상태의 주문을 가져오도록 합니다.
  // PendingOrdersList에서 'completed' 상태도 보여주려면, 여기에서 status 필터를 제거해야 합니다.
  // 백엔드 LabOrderViewSet에서 status 쿼리 파라미터를 처리하고 있으므로,
  // 여기서는 params에 status를 직접 설정하지 않고, 호출하는 곳에서 제어하도록 변경합니다.
  const response = await apiClient.get('/labs/orders/', { params: params });
  return processApiResponse(response);
};

/**
 * 특정 환자의 모든 검사 결과를 가져옵니다.
 * @param {string} patientUuid - 환자의 UUID
 * 응답: [{id: UUID, lab_order: UUID, test_item: UUID, result_value: '...', note: '...', patient_display_name: '...', test_type_display_name: '...', test_item_name: '...', test_item_unit: '...', reported_at: '...' }, ...]
 */
export const fetchPatientResults = async (patientUuid) => {
  const response = await apiClient.get('/labs/results/', {
    params: { patient_uuid: patientUuid }
  });

  const processed = processApiResponse(response);
  console.log("🚨 응답 총 개수:", processed.data.length);
  return processed;
};


/**
 * 새로운 검사를 요청(Order)합니다.
 * @param {object} orderData - { patient (UUID), test_type (UUID), collected_at, performed_by, lab_location, ... }
 */
export const createLabOrder = (orderData) => {
  return apiClient.post('/labs/orders/', orderData);
};

/**
 * 여러 개의 검사 결과를 한 번에 제출합니다.
 * 백엔드 LabResultViewSet.create가 ListSerializer를 사용하여 `many=True`를 처리하므로
 * 한 번의 POST 요청으로 전체 배열을 보냅니다.
 * @param {Array<object>} resultsData - [{ lab_order (UUID), test_item (UUID), result_value, note }, ...]
 */
export const createLabResults = (resultsData) => {
  return apiClient.post('/labs/results/', resultsData);
};

/**
 * 모든 OpenMRS 환자 목록을 가져옵니다.
 * 이 API는 { uuid, display, ... } 형태의 배열을 직접 반환하므로 processApiResponse를 사용하지 않습니다.
 * @param {string} searchTerm - 검색어 (선택 사항)
 */
export const fetchAllOpenMRSPatients = async (searchTerm = '') => {
    const response = await apiClient.get('/omrs/patients/local-list/', { params: { q: searchTerm } });
    return { data: response.data.results || [] };
};

export default apiClient;

