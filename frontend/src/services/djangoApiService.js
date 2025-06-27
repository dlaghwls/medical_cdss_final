import axios from 'axios';

export const apiClient = axios.create({
    baseURL: 'http://34.64.188.9:8000/api/',
    withCredentials: true,
    xsrfCookieName: 'csrftoken', 
    xsrfHeaderName: 'X-CSRFToken',
});

export const ensureCsrfToken = async () => {
    try {
        console.log('Ensuring CSRF token is set...');
        await apiClient.get('accounts/csrf/'); // 수정: '/csrf/' → 'accounts/csrf/'
        console.log('CSRF setup finished.');
    } catch (error) {
        console.error('Failed to ensure CSRF token:', error);
    }
};


// 토큰 갱신용 별도 클라이언트
const authClient = axios.create({
    baseURL: 'http://34.64.188.9:8000/api/accounts/',
    withCredentials: true,
});

// 요청 인터셉터: 모든 요청에 토큰 추가
apiClient.interceptors.request.use(
    config => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// 응답 인터셉터: 401 오류 시 토큰 갱신
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    console.log('토큰 갱신 시도 중...');
                    const response = await authClient.post('token/refresh/', {
                        refresh: refreshToken,
                    });
                    
                    const newAccessToken = response.data.access;
                    localStorage.setItem('accessToken', newAccessToken);
                    
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return apiClient(originalRequest);
                    
                } catch (refreshError) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            } else {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

/**
 * OpenMRS와 동기화합니다.
 */
export const fetchOpenMRSPatients = async (query = '') => {
    try {
        const params = new URLSearchParams();
        if (query) {
            params.append('q', query);
        }
        const response = await apiClient.get(`omrs/patients/openmrs-sync/?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Error syncing OpenMRS patients:', error);
        throw error;
    }
};

/**
 * Django 백엔드에 로그인을 요청합니다.
 */
export const loginApi = async (employeeId, password) => {
    try {
        const response = await apiClient.post('auth/login/', {
            username: employeeId,
            password: password,
        });
        return response.data;
    } catch (error) {
        console.error("Login API error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || '로그인에 실패했습니다.');
    }
};

/**
 * Django 로컬 데이터베이스에서만 환자 목록을 조회합니다.
 * (apiClient 인자 제거)
 */
export const fetchLocalPatients = async (query = '') => {
    try {
        const params = new URLSearchParams();
        if (query) {
            params.append('q', query);
        }
        const response = await apiClient.get(`omrs/patients/local-list/?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching local patients from Django backend:', error);
        throw error;
    }
};

/**
 * OpenMRS와 동기화 후 환자 목록을 조회합니다.
 * (apiClient 인자 제거)
 */
export const fetchAndSyncPatients = async (query = '', syncQuery = "1000") => {
    try {
        const params = new URLSearchParams();
        if (query) {
            params.append('q', query);
        }
        if (syncQuery) {
            params.append('sync_q', syncQuery);
        }
        const response = await apiClient.get(`omrs/patients/sync-and-list/?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching and syncing patients from Django backend:', error);
        throw error;
    }
};

/**
 * 특정 환자의 상세 정보를 조회합니다.
 * (apiClient 인자 제거)
 */
export const fetchPatientDetails = async (patientUuid) => {
    if (!patientUuid) throw new Error('Patient UUID is required.');
    try {
        const response = await apiClient.get(`omrs/patients/${patientUuid}/`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching patient ${patientUuid} details from Django backend:`, error);
        throw error;
    }
};

/**
 * 새 환자를 등록합니다.
 * (apiClient 인자 제거)
 */
export const registerPatient = async (patientData) => {
    try {
        const response = await apiClient.post(`omrs/patients/create/`, patientData);
        return response.data;
    } catch (error) {
        console.error('Error registering patient via Django backend:', error);
        throw error;
    }
};

// --- LIS 관련 함수 ---
/**
 * LIS 검사 결과를 등록합니다.
 * (apiClient 인자 제거)
 */
export const registerLabResult = async (labResultData) => {
    try {
        const response = await apiClient.post(`lab-results/`, labResultData);
        return response.data;
    } catch (error) {
        console.error("Error registering lab result:", error.response || error);
        throw error;
    }
};

/**
 * 특정 환자의 LIS 검사 결과를 조회합니다.
 * (apiClient 인자 제거)
 */
export const fetchLabResultsForPatient = async (patientUuid) => {
    try {
        const response = await apiClient.get(`lab-results/by-patient/?patient_uuid=${patientUuid}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching lab results for patient ${patientUuid}:`, error.response || error);
        throw error;
    }
};

// --- 메시징 관련 함수 ---
export const fetchMedicalStaff = async () => {
    try {
        const response = await apiClient.get('chat/staff/');
        // 백엔드가 이제 순수한 배열을 보내주므로, .results 없이 그대로 반환합니다.
        return response.data; 
    } catch (error) {
        console.error("Error fetching medical staff:", error.response?.data || error.message);
        throw error;
    }
};

// frontend/src/services/djangoApiService.js

export const fetchChatMessages = async (otherUserEmployeeId) => {
    try {
        const response = await apiClient.get(`chat/messages/${otherUserEmployeeId}/`);
        return response.data.results; // <-- 실제 메시지 목록인 .results 배열만 반환
    } catch (error) {
        console.error("Error fetching chat messages:", error.response?.data || error.message);
        throw error;
    }
};

// djangoApiService.js

export const sendMessage = async (receiverId, messageContent) => {
    try {
        // 1. 주소를 `chat/messages/${상대방ID}/` 형태로 동적으로 만듭니다.
        // 2. 보내는 데이터를 { content: ... } 객체로 감싸줍니다.
        const response = await apiClient.post(`chat/messages/${receiverId}/`, { content: messageContent });
        return response.data;
    } catch (error) {
        console.error("Error sending message:", error.response?.data || error.message);
        throw error;
    }
};

// --- SOD2, 합병증 등 데이터 등록 함수 --- => 합병증 이주 완료
export const registerStrokeInfo = async (data) => {
    const response = await apiClient.post('lab-results/stroke-info/', data);
    return response.data;
};

export const registerComplicationsAndMedications = async (data) => {
    const response = await apiClient.post('lab-results/complications-medications/', data);
    return response.data;
};

export const predictComplications = async (patientData) => {
    try {
        const response = await apiClient.post('ml_models/predict/complications/', patientData);
        return response.data;
    } catch (error) {
        console.error("Error predicting complications:", error.response?.data || error.message);
        throw error;
    }
};

// 두 번째 파일에만 있는 사망률 예측 관련 함수들 추가
export const predictMortality = async (data) => {
    try {
        console.log('사망률 예측 실행:', data);
        const response = await apiClient.post('ml_models/predict/mortality/', data);
        console.log('사망률 예측 성공:', response.data);
        return response.data;
    } catch (error) {
        console.error('사망률 예측 실패:', error);
        throw error;
    }
};

export const submitMortalityPredictionData = async (predictionData) => {
    console.log("[djangoApiService] submitMortalityPredictionData called with data:", predictionData);
    
    try {
        const response = await apiClient.post('ml_models/predict_mortality/', predictionData);
        
        console.log("[djangoApiService] submitMortalityPredictionData success:", response.data);
        return response.data;
    } catch (error) {
        console.error("[djangoApiService] submitMortalityPredictionData error:", error);
        throw error;
    }
};

export const fetchStrokeInfoHistory = async (patientUuid) => {
    try {
        const response = await apiClient.get(`lab-results/stroke-info/?patient_uuid=${patientUuid}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching stroke info history for patient ${patientUuid}:`, error.response || error);
        throw error;
    }
};

// SOD2 평가 API 함수들
export const assessSOD2Status = async (assessmentData) => {
    try {
        const response = await apiClient.post('ml/sod2/assess/', assessmentData);
        return response.data;
    } catch (error) {
        console.error('SOD2 평가 API 오류:', error);
        throw error;
    }
};

export const fetchSOD2Assessments = async (patientUuid) => {
    try {
        const response = await apiClient.get(`ml/patients/${patientUuid}/sod2/assessments/`);
        return response.data.assessments || [];
    } catch (error) {
        console.error('SOD2 평가 이력 조회 API 오류:', error);
        throw error;
    }
};

export const fetchLatestSOD2Assessment = async (patientUuid) => {
    try {
        const response = await apiClient.get(`ml/patients/${patientUuid}/sod2/latest/`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            return null; // 평가 결과 없음
        }
        console.error('최신 SOD2 평가 조회 API 오류:', error);
        throw error;
    }
};

export const fetchComplicationsHistory = async (patientUuid) => {
    try {
        const response = await apiClient.get(`lab-results/complications-medications/?patient_uuid=${patientUuid}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching complications history for patient ${patientUuid}:`, error.response || error);
        throw error;
    }
};

// --- Vital 관련 함수 --- => 이주 완료
export const saveVitals = async (vitalData) => {
    try {
        const response = await apiClient.post('vitals/', vitalData);
        return response.data;
    } catch (error) {
        console.error('Error saving vitals:', error.response || error);
        throw error;
    }
};

export const fetchVitalsHistory = async (patientId, period = '1d') => {
    try {
        const response = await apiClient.get(`vitals/?patient_id=${patientId}&period=${period}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching vitals history:', error.response || error);
        throw error;
    }
};

// 사망률 데이터 등록 (기록입력 탭용)
export const registerMortalityData = async (data) => {
    try {
        console.log('사망률 데이터 등록:', data);
        const response = await apiClient.post('ml_models/register/mortality/', data);
        console.log('사망률 데이터 등록 성공:', response.data);
        return response.data;
    } catch (error) {
        console.error('사망률 데이터 등록 실패:', error);
        throw error;
    }
};

// 사망률 예측 이력 조회 (과거기록 탭용)
export const fetchMortalityHistory = async (patientUuid) => {
    try {
        console.log(`사망률 이력 조회: ${patientUuid}`);
        const response = await apiClient.get(`ml_models/history/mortality/${patientUuid}/`);
        console.log('사망률 이력 조회 성공:', response.data);
        return response.data;
    } catch (error) {
        console.error('사망률 이력 조회 실패:', error);
        throw error;
    }
};

// 기본 export 객체: 다른 파일에서 import djangoApiService from '...'으로 사용할 경우를 대비해 유지합니다.
const djangoApiService = {
    loginApi,
    fetchLocalPatients,
    fetchOpenMRSPatients,
    fetchAndSyncPatients,
    fetchPatientDetails,
    registerPatient,
    registerLabResult,
    fetchLabResultsForPatient,
    fetchMedicalStaff,
    fetchChatMessages,
    sendMessage,
    registerStrokeInfo,
    registerComplicationsAndMedications,
    fetchStrokeInfoHistory,
    fetchComplicationsHistory,
    saveVitals,
    fetchVitalsHistory,
    assessSOD2Status,
    fetchSOD2Assessments,
    fetchLatestSOD2Assessment,
    predictComplications,
    predictMortality,
    submitMortalityPredictionData,
    registerMortalityData,
    fetchMortalityHistory,
    ensureCsrfToken, // ensureCsrfToken도 객체에 포함시켜 export
};

export default djangoApiService;