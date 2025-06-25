// 기존 Django API용 apiClient를 djangoApiClient로 임포트합니다.
import { apiClient as djangoApiClient } from './djangoApiService'; 
import axios from 'axios'; // axios 직접 임포트

// ★★★ FastAPI 전용 axios 인스턴스 정의 ★★★
export const fastApiGeneClient = axios.create({
    baseURL: 'http://34.64.188.9:8002/', // FastAPI 서버의 실제 URL
});

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

    registerComplicationsAndMedications: async (data) => {
        try {
            // djangoApiClient를 사용하여 Django API 호출
            const response = await djangoApiClient.post('lab-results/complications-medications/', data);
            return response.data;
        } catch (error) {
            console.error("Error registering complications/medications:", error.response?.data || error.message);
            throw error;
        }
    },

    fetchComplicationsHistory: async (patientUuid) => {
        try {
            // djangoApiClient를 사용하여 Django API 호출
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
            // LabResultsView.js의 handleSubmit에 있던 로직을 기반으로 재구성합니다.
            // 백엔드 API 엔드포인트는 '/ml_models/register-mortality-data/' 등으로 가정합니다.
            // 실제 엔드포인트에 맞게 수정해주세요.
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
            // 실제 엔드포인트에 맞게 수정해주세요.
            const response = await djangoApiClient.get(`ml_models/mortality-history/?patient_uuid=${patientUuid}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching mortality history for patient ${patientUuid}:`, error.response || error);
            throw error;
        }
    },

    /**
     * 사망률 예측을 위한 데이터를 백엔드로 전송합니다.
     * 엔드포인트: ml_models/predict_mortality/
     * @param {object} data - 사망률 예측에 필요한 데이터
     * @returns {Promise<object>} 예측 결과 데이터를 포함하는 Promise
     */
    predictMortality: async (data) => {
        try {
            const response = await djangoApiClient.post('ml_models/predict_mortality/', data);
            return response.data;
        } catch (error) {
            console.error('사망률 예측 API 오류:', error);
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
            const response = await djangoApiClient.post('ml/sod2/assess/', assessmentData);
            return response.data;
        } catch (error) {
            console.error('SOD2 평가 API 오류:', error);
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
            const response = await djangoApiClient.get(`ml/patient/${patientUuid}/sod2/assessments/`);
            return response.data.assessments || []; // 백엔드 응답 구조에 따라 'assessments' 키가 있을 수 있음
        } catch (error) {
            console.error('SOD2 평가 이력 조회 API 오류:', error);
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
            const response = await djangoApiClient.get(`ml/patient/${patientUuid}/sod2/latest/`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null; // 평가 결과 없음
            }
            console.error('최신 SOD2 평가 조회 API 오류:', error);
            throw error;
        }
    },

    /**
     * @desc 뇌졸중 관련 정보를 Django 백엔드에 저장합니다. (djangoApiService에서 이동)
     * @param {object} data - 뇌졸중 정보 데이터
     * @returns {Promise<object>}
     */
    registerStrokeInfo: async (data) => {
        try {
            const response = await djangoApiClient.post('lab-results/stroke-info/', data);
            return response.data;
        } catch (error) {
            console.error("Error registering stroke info:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * 유전자 CSV 파일을 백엔드(FastAPI)로 업로드하여 분석을 요청합니다.
     * CSV 파일은 'patient_id' 컬럼(UUID 형식)을 포함해야 합니다.
     * 엔드포인트: http://34.64.188.9:8002/predict_csv
     * @param {File} file - 업로드할 CSV File 객체. 반드시 'patient_id' 컬럼을 포함해야 함.
     * @returns {Promise<object>} 분석 결과 데이터를 포함하는 Promise
     */
    uploadGeneCSV: async (file) => {
        const formData = new FormData();
        formData.append('file', file); // FastAPI의 endpoint 파라미터 이름이 'file'이므로 여기에 맞춤.

        try {
            // ★★★ 다른 모델과 다르게 fastApiGeneClient 사용 ★★★
            const response = await fastApiGeneClient.post('predict_csv', formData, {
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
};

export default aiService;