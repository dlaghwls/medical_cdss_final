// frontend/src/services/aiService.js

// 기존 Django API용 apiClient를 djangoApiClient로 임포트합니다.
import { apiClient as djangoApiClient } from './djangoApiService'; 
import axios from 'axios'; // axios 직접 임포트

// ★★★ FastAPI 전용 axios 인스턴스 정의 ★★★
export const fastApiGeneClient = axios.create({
    baseURL: 'http://34.64.188.9:8002/', // FastAPI 서버의 실제 URL
});

const FASTAPI_GENE_API_BASE_URL = 'http://34.64.188.9:8002';

const aiService = {
    /**
     * 합병증 예측을 위한 데이터를 백엔드로 전송합니다.
     * 엔드포인트: ml_models/predict/complications/
     * @param {object} patientData - 합병증 예측에 필요한 환자 데이터
     * @returns {Promise<object>} 예측 결과 데이터를 포함하는 Promise
     */
    predictComplications: async (patientData) => {
        try {
            const response = await djangoApiClient.post('ml_models/predict/complications/', patientData);
            return response.data;
        } catch (error) {
            console.error("Error predicting complications:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * ⭐⭐⭐ 새로 추가된 함수 ⭐⭐⭐
     * 사망률 예측을 위한 데이터를 백엔드로 전송합니다.
     * 엔드포인트: ml_models/predict/mortality/
     * @param {object} patientData - 사망률 예측에 필요한 환자 데이터
     * @returns {Promise<object>} 예측 결과 데이터를 포함하는 Promise
     */
    predictMortality: async (patientData) => {
        try {
            const response = await djangoApiClient.post('ml_models/predict/mortality/', patientData);
            return response.data;
        } catch (error) {
            console.error("Error predicting mortality:", error.response?.data || error.message);
            throw error;
        }
    },

    registerComplicationsAndMedications: async (data) => {
        try {
            // djangoApiClient를 사용하여 Django API 호출
            const response = await djangoApiClient.post('ml_models/register-complications-data/', data);
            return response.data;
        } catch (error) {
            console.error("Error registering complications/medications:", error.response?.data || error.message);
            throw error;
        }
    },

    fetchComplicationsHistory: async (patientUuid) => {
        try {
        // 기존에 동작하던 엔드포인트로 복구
            const response = await djangoApiClient.get(`lab-results/complications-medications/?patient_uuid=${patientUuid}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching complications history for patient ${patientUuid}:`, error.response || error);
            throw error;
        }
    },

    /**
     * @desc 사망률 예측 모델에 사용될 환자 데이터를 등록합니다.
     * @param {object} data - 사망률 예측에 필요한 데이터 (age, gender, vitals, labs 등)
     * @returns {Promise<object>}
     */
    registerMortalityData: async (data) => {
        try {
            const response = await djangoApiClient.post('ml_models/register-mortality-data/', data);
            return response.data;
        } catch (error) {
            console.error("Error registering mortality data:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * @desc 특정 환자의 사망률 예측 데이터 등록 이력을 조회합니다.
     * @param {string} patientUuid - 조회할 환자의 UUID
     * @returns {Promise<Array>}
     */
    fetchMortalityHistory: async (patientUuid) => {
        try {
            const response = await djangoApiClient.get(`ml_models/mortality-history/${patientUuid}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching mortality history for patient ${patientUuid}:`, error.response || error);
            throw error;
        }
    },

    /**
     * SOD2 상태 평가를 위한 데이터를 백엔드로 전송합니다.
     * 엔드포인트: ml/sod2/assess/
     * @param {object} assessmentData - SOD2 평가에 필요한 데이터
     * @returns {Promise<object>} 평가 결과 데이터를 포함하는 Promise
     */
    assessSOD2Status: async (assessmentData) => {
        try {
            console.log('SOD2 평가 요청 데이터:', assessmentData);
            const response = await djangoApiClient.post('ml/sod2/assess/', assessmentData);
            console.log('SOD2 평가 응답:', response.data);
            return response.data;
        } catch (error) {
            console.error('SOD2 평가 API 오류:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * 특정 환자의 SOD2 평가 이력을 조회합니다.
     * 엔드포인트: ml/patients/{patientUuid}/sod2/assessments/
     * @param {string} patientUuid - 환자 UUID
     * @returns {Promise<Array>} SOD2 평가 이력 배열
     */
    fetchSOD2Assessments: async (patientUuid) => {
        try {
            console.log('SOD2 평가 이력 조회:', patientUuid);
            const response = await djangoApiClient.get(`ml/patients/${patientUuid}/sod2/assessments/`);
            console.log('SOD2 평가 이력 응답:', response.data);
            
            // 백엔드 응답 구조에 따라 적절히 반환
            if (Array.isArray(response.data)) {
                return response.data;
            } else if (response.data.assessments && Array.isArray(response.data.assessments)) {
                return response.data.assessments;
            } else if (response.data.results && Array.isArray(response.data.results)) {
                return response.data.results;
            } else {
                return [];
            }
        } catch (error) {
            console.error('SOD2 평가 이력 조회 API 오류:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * 특정 환자의 최신 SOD2 평가 결과를 조회합니다.
     * 엔드포인트: ml/patients/{patientUuid}/sod2/latest/
     * @param {string} patientUuid - 환자 UUID
     * @returns {Promise<object | null>} 최신 SOD2 평가 결과 또는 없을 경우 null
     */
    fetchLatestSOD2Assessment: async (patientUuid) => {
        try {
            console.log('최신 SOD2 평가 조회:', patientUuid);
            const response = await djangoApiClient.get(`ml/patients/${patientUuid}/sod2/latest/`);
            console.log('최신 SOD2 평가 응답:', response.data);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('SOD2 평가 결과 없음');
                return null; // 평가 결과 없음
            }
            console.error('최신 SOD2 평가 조회 API 오류:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * 뇌졸중 관련 정보를 Django 백엔드에 저장합니다.
     * 엔드포인트: lab-results/stroke-info/
     * @param {object} data - 뇌졸중 정보 데이터
     * @returns {Promise<object>}
     */
    registerStrokeInfo: async (data) => {
        try {
            console.log('뇌졸중 정보 등록 요청:', data);
            const response = await djangoApiClient.post('lab-results/stroke-info/', data);
            console.log('뇌졸중 정보 등록 응답:', response.data);
            return response.data;
        } catch (error) {
            console.error("뇌졸중 정보 등록 오류:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * 특정 환자의 뇌졸중 정보 이력을 조회합니다.
     * @param {string} patientUuid - 환자 UUID
     * @returns {Promise<Array>} 뇌졸중 정보 이력 배열
     */
    fetchStrokeInfoHistory: async (patientUuid) => {
        try {
            console.log('뇌졸중 정보 이력 조회:', patientUuid);
            const response = await djangoApiClient.get(`lab-results/stroke-info/?patient_uuid=${patientUuid}`);
            console.log('뇌졸중 정보 이력 응답:', response.data);
            return response.data;
        } catch (error) {
            console.error('뇌졸중 정보 이력 조회 오류:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * 유전자 CSV 파일을 백엔드(FastAPI)로 업로드하여 분석을 요청합니다.
     * @param {FormData} formData - 'file'과 'patient_uuid'를 포함하는 FormData 객체.
     * @returns {Promise<object>} 분석 결과 데이터를 포함하는 Promise
     */
    uploadGeneCSV: async (formData) => {
        try {
            // FastAPI의 /predict_csv 엔드포인트로 FormData 전송
            const response = await axios.post(`${FASTAPI_GENE_API_BASE_URL}/predict_csv`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // 파일 업로드 시 필수
                },
            });
            return response.data;
        } catch (error) {
            console.error('유전자 CSV 업로드 및 분석 오류:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * 특정 환자의 유전자 분석 과거 기록을 불러옵니다.
     * @param {string} patientUuid - 기록을 조회할 환자의 UUID.
     * @returns {Promise<Array<object>>} 유전자 분석 기록 배열을 포함하는 Promise
     */
    getGeneHistory: async (patientUuid) => {
        try {
            // FastAPI의 새로운 /gene_results/{patient_uuid} 엔드포인트 호출
            const response = await axios.get(`${FASTAPI_GENE_API_BASE_URL}/gene_results/${patientUuid}`);
            return response.data;
        } catch (error) {
            console.error('유전자 분석 기록 불러오기 오류:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * 특정 환자의 최신 유전자 분석 결과를 불러옵니다.
     * @param {string} patientUuid - 최신 결과를 조회할 환자의 UUID.
     * @returns {Promise<object | null>} 최신 유전자 분석 결과 객체 또는 결과가 없으면 null 반환
     */
    fetchLatestGeneAssessment: async (patientUuid) => {
        try {
            const response = await axios.get(`${FASTAPI_GENE_API_BASE_URL}/gene_results/${patientUuid}`);
            const data = response.data;
            if (data && data.length > 0) {
                // 백엔드 get_gene_results는 created_at 오름차순으로 정렬되므로, 마지막 요소가 최신입니다.
                return data[data.length - 1];
            }
            return null;
        } catch (error) {
            console.error('최신 유전자 분석 결과 불러오기 오류:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * 활력 징후 데이터를 백엔드에 저장합니다.
     * @param {object} vitalData - 저장할 활력 징후 데이터
     * @returns {Promise<object>} - 저장된 데이터
     */
    saveVitals: async (vitalData) => {
        try {
            const response = await djangoApiClient.post('vitals/', vitalData);
            return response.data;
        } catch (error) {
            console.error('Error saving vitals:', error.response || error);
            throw error;
        }
    },

    /**
     * 특정 환자의 활력 징후 기록을 가져옵니다.
     * @param {string} patientUuid - 환자의 UUID
     * @param {string} period - 조회 기간 (예: '1d', '7d')
     * @returns {Promise<Array>} - 활력 징후 기록 배열
     */
    fetchVitalsHistory: async (patientUuid, period = '1d') => {
        try {
            const response = await djangoApiClient.get(`vitals/?patient_uuid=${patientUuid}&period=${period}`);
            
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
    },
};

export default aiService;