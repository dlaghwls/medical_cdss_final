import axios from 'axios';

// apiClient를 파일의 최상단에 한번만 정의합니다.
export const apiClient = axios.create({
    baseURL: 'http://34.64.188.9:8000/api/', // GCP Django 백엔드 URL
    withCredentials: true, // CORS 요청 시 쿠키 전송을 위해 필수
    
    // CSRF 문제 해결을 위한 설정
    // Django의 기본 CSRF 쿠키 이름과 헤더 이름을 axios에 알려줍니다.
    xsrfCookieName: 'csrftoken', 
    xsrfHeaderName: 'X-CSRFToken',
});

// ★★★ 추가된 함수 ★★★
/**
 * 애플리케이션 시작 시 호출하여 Django로부터 CSRF 토큰 쿠키를 받아옵니다.
 * 이 함수는 Django에 간단한 GET 요청을 보내, 응답 헤더에 CSRF 토큰이 담긴 쿠키를
 * 브라우저에 설정하도록 유도하는 역할을 합니다.
 * * 사용법: App.js와 같은 최상위 컴포넌트의 useEffect에서 한 번만 호출해주세요.
 * * useEffect(() => {
 * ensureCsrfToken();
 * }, []);
 */
export const ensureCsrfToken = async () => {
    try {
        console.log('Ensuring CSRF token is set...');
        // apiClient의 baseURL (http://34.64.188.9:8000/api/accounts)을 사용하여
        // 최종적으로 http://34.64.188.9:8000/api/accounts/csrf/ 로 요청이 나갈 것입니다.
        await apiClient.get('/csrf/'); 
        console.log('CSRF setup finished.');
    } catch (error) {
        console.error('Failed to ensure CSRF token:', error);
        // 여기서의 에러는 로그인 전이라 401/403이 발생할 수 있으며, 이는 정상입니다.
        // 중요한 것은 요청을 보내 Django가 쿠키를 설정할 기회를 주는 것입니다.
    }
};

// 요청 인터셉터: 모든 요청에 JWT 토큰을 자동으로 추가합니다.
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
        const response = await apiClient.post('ml_models/predict_mortality/', data);
        return response.data;
    } catch (error) {
        console.error('사망률 예측 API 오류:', error);
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

// 기본 export 객체: 다른 파일에서 import djangoApiService from '...'으로 사용할 경우를 대비해 유지합니다.
const djangoApiService = {
    loginApi,
    fetchLocalPatients,
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
    ensureCsrfToken, // ensureCsrfToken도 객체에 포함시켜 export
};

export default djangoApiService;