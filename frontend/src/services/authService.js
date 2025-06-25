// /frontend/src/services/authService.js (최종 수정 완료)

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
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/token/refresh/') {
      originalRequest._retry = true; // 재시도 플래그 설정
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const newAccessToken = response.data.access;
          const newRefreshToken = response.data.refresh;

          localStorage.setItem('accessToken', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error("Refresh token failed", refreshError);
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
 * 실제 회원가입 API (백엔드와 통신)
 */
export async function signupApi(userData) {
  try {
    const response = await apiClient.post('/register/', userData);
    return response.data;
  } catch (error) {
    console.error("Signup API error:", error.response ? error.response.data : error.message);
    let errorMessage = '회원가입 중 오류가 발생했습니다.';
    if (error.response && error.response.data) {
      if (error.response.data.employee_id) {
        errorMessage = '사원번호: ' + error.response.data.employee_id.join(' ');
      } else if (error.response.data.password) {
        errorMessage = '비밀번호: ' + error.response.data.password.join(' ');
      } else {
        errorMessage = JSON.stringify(error.response.data);
      }
    }
    throw new Error(errorMessage);
  }
}


/**
 * 실제 로그인 API (백엔드와 통신, JWT 토큰 반환)
 */
export async function loginApi(employeeId, password) {
  try {
    const response = await apiClient.post('/token/', {
      employee_id: employeeId,
      password: password,
    });

    const { access, refresh } = response.data;

    console.log("👉 [authService.js] loginApi - 네트워크 응답 데이터:", response.data);
    console.log("👉 [authService.js] loginApi - 수신된 Access Token (RAW):", access);

    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    
    const decodedUser = jwtDecode(access);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    
    console.log("👉 [authService.js] loginApi - 디코딩된 Access Token (Payload):", decodedUser);
    
    return decodedUser;

  } catch (error) {
    console.error("Login API error:", error.response ? error.response.data : error.message);
    let errorMessage = '로그인에 실패했습니다. 사원번호 또는 비밀번호를 확인해주세요.';
    if (error.response && error.response.data && error.response.data.detail) {
      errorMessage = error.response.data.detail;
    }
    throw new Error(errorMessage);
  }
}