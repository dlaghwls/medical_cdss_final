import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // JWT 토큰 해독용

// 백엔드 API 기본 URL 설정 (GCP 배포 시 실제 URL로 변경 필요)
const API_BASE_URL = 'http://34.64.188.9:8000/api/accounts'; 

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // CORS 요청 시 쿠키 전송을 위해 필수
  withCredentials: true,
  // CSRF 문제 해결을 위한 설정 (Django의 기본 CSRF 쿠키 이름과 헤더 이름)
  xsrfCookieName: 'csrftoken', 
  xsrfHeaderName: 'X-CSRFToken',
});

// ⭐⭐⭐ Interceptor 설정: 모든 요청에 Access Token 추가 ⭐⭐⭐
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ⭐⭐⭐ Interceptor 설정: Access Token 만료 시 Refresh Token으로 갱신 ⭐⭐⭐
apiClient.interceptors.response.use(
  (response) => response, // 성공적인 응답은 그대로 전달
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized 에러이고, 아직 재시도하지 않았으며, 토큰 갱신 요청이 아닌 경우
    if (error.response.status === 401 && !originalRequest._retry && originalRequest.url !== '/token/refresh/') {
      originalRequest._retry = true; // 재시도 플래그 설정
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const newAccessToken = response.data.access;
          const newRefreshToken = response.data.refresh; // 새로운 refresh 토큰도 받을 수 있음

          localStorage.setItem('accessToken', newAccessToken);
          if (newRefreshToken) { // 새로운 refresh 토큰이 있다면 업데이트
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`; // axios 인스턴스 헤더 업데이트
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`; // 원래 요청의 헤더 업데이트

          return apiClient(originalRequest); // 원래 요청을 새로운 토큰으로 재시도
        } catch (refreshError) {
          console.error("Refresh token failed", refreshError);
          // Refresh Token 갱신 실패 시 (refresh 토큰도 만료되었거나 유효하지 않은 경우)
          // 강제 로그아웃 처리
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          delete apiClient.defaults.headers.common['Authorization'];
          // 로그인 페이지로 리다이렉트 (필요시)
          window.location.href = '/login'; 
          return Promise.reject(refreshError);
        }
      } else {
        // Refresh Token이 없는 경우 (첫 로그인 필요)
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete apiClient.defaults.headers.common['Authorization'];
        // 로그인 페이지로 리다이렉트 (필요시)
        window.location.href = '/login'; 
      }
    }
    return Promise.reject(error); // 401 외의 에러는 그대로 전달
  }
);


/**
 * 실제 회원가입 API (백엔드와 통신)
 * @param {{ employeeId: string, password: string, name?: string, department?: string }} userData
 * @returns {Promise<object>} 생성된 사용자 정보
 */
export async function signupApi(userData) {
  try {
    const response = await apiClient.post('/register/', userData);
    // 백엔드 응답에서 필요한 정보를 추출하여 반환 (예: message, user data)
    return response.data;
  } catch (error) {
    console.error("Signup API error:", error.response ? error.response.data : error.message);
    let errorMessage = '회원가입 중 오류가 발생했습니다.';
    if (error.response && error.response.data) {
      // 백엔드에서 보낸 구체적인 에러 메시지가 있다면 사용
      if (error.response.data.employee_id) {
        errorMessage = '사원번호: ' + error.response.data.employee_id.join(' ');
      } else if (error.response.data.password) {
        errorMessage = '비밀번호: ' + error.response.data.password.join(' ');
      } else if (error.response.data.non_field_errors) {
        errorMessage = error.response.data.non_field_errors.join(' ');
      } else {
         errorMessage = JSON.stringify(error.response.data);
      }
    }
    throw new Error(errorMessage);
  }
}

/**
 * 실제 로그인 API (백엔드와 통신, JWT 토큰 반환)
 * @param {string} employeeId
 * @param {string} password
 * @returns {Promise<object>} 로그인된 사용자 정보 (토큰 포함)
 */
export async function loginApi(employeeId, password) {
  try {
    const response = await apiClient.post('/token/', {
      employee_id: employeeId, // 백엔드 필드명에 맞춤
      password: password,
    });

    const { access, refresh } = response.data;

    // ⭐⭐⭐ 디버그 로그 추가 ⭐⭐⭐
    console.log("👉 [authService.js] loginApi - 네트워크 응답 데이터:", response.data);
    console.log("👉 [authService.js] loginApi - 수신된 Access Token (RAW):", access);

    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    
    const decodedUser = jwtDecode(access);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`; // 모든 후속 요청에 새 토큰 사용
    
    console.log("👉 [authService.js] loginApi - 디코딩된 Access Token (Payload):", decodedUser);
    
    return decodedUser; // employee_id, name, role 등이 담겨있음

  } catch (error) {
    console.error("Login API error:", error.response ? error.response.data : error.message);
    let errorMessage = '로그인에 실패했습니다. 사원번호 또는 비밀번호를 확인해주세요.';
    if (error.response && error.response.data && error.response.data.detail) {
      errorMessage = error.response.data.detail;
    }
    throw new Error(errorMessage);
  }
}