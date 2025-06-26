import axios from 'axios';

// API 서버의 기본 URL을 설정합니다.
const API_BASE_URL = 'http://34.64.188.9:8000/api';

// baseURL이 설정된 axios 인스턴스를 생성합니다.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 활력 징후 데이터를 백엔드에 저장합니다.
 * @param {object} vitalData - 저장할 활력 징후 데이터
 * @returns {Promise<object>} - 저장된 데이터
 */
export const saveVitals = async (vitalData) => {
    try {
        // '/api'는 baseURL에 포함되어 있으므로 '/vitals/'로 요청합니다.
        const response = await apiClient.post('/vitals/', vitalData);
        return response.data;
    } catch (error) {
        console.error('Error saving vitals:', error.response || error);
        throw error;
    }
};

/**
 * 특정 환자의 활력 징후 기록을 가져옵니다.
 * @param {string} patientUuid - 환자의 UUID
 * @param {string} period - 조회 기간 (예: '1d', '7d')
 * @returns {Promise<Array>} - 활력 징후 기록 배열
 */
export const fetchVitalsHistory = async (patientUuid, period = '30d') => {
    try {
        // 백엔드 API의 파라미터 이름('patient_uuid')에 맞춰 요청합니다.
        const response = await apiClient.get(`/vitals/?patient_uuid=${patientUuid}&period=${period}`);
        
        // DRF의 페이지네이션 응답을 처리하여 결과 배열만 반환합니다.
        if (response.data && Array.isArray(response.data.results)) {
            return response.data.results;
        }
        // 페이지네이션이 없는 경우, 받은 데이터 그대로 반환합니다.
        return response.data;
    } catch (error) {
        console.error('Error fetching vitals history:', error.response || error);
        throw error;
    }
};
