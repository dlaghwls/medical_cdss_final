import apiClient from './apiClient'; // 다른 API 파일들이 사용하는 apiClient를 임포트한다고 가정합니다.

/**
 * 특정 시리즈에 대한 모든 어노테이션을 가져옵니다.
 * @param {string} seriesInstanceUID - 어노테이션을 조회할 시리즈의 UID
 * @returns {Promise<Array>} 어노테이션 객체들의 배열
 */
export const fetchAnnotations = async (seriesInstanceUID) => {
    try {
        // Django 백엔드의 어노테이션 조회 API 엔드포인트
        // 실제 API 경로에 맞게 수정해야 할 수 있습니다.
        const response = await apiClient.get(`/annotations/?series_uid=${seriesInstanceUID}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching annotations for series ${seriesInstanceUID}:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || '어노테이션을 불러오는 데 실패했습니다.');
    }
};

/**
 * 새로운 어노테이션 데이터를 서버에 저장합니다.
 * @param {object} annotationData - 저장할 어노테이션 데이터
 * @returns {Promise<object>} 저장된 어노테이션 객체
 */
export const saveAnnotation = async (annotationData) => {
    if (!annotationData) {
        throw new Error("저장할 어노테이션 데이터가 없습니다.");
    }
    try {
        // Django 백엔드의 어노테이션 생성/수정 API 엔드포인트
        // 만약 생성과 수정을 구분한다면, annotationData에 id 유무에 따라 POST 또는 PUT을 사용해야 합니다.
        // 여기서는 간단하게 POST로 새 어노테이션을 생성하는 예시를 보여줍니다.
        const response = await apiClient.post('/annotations/', annotationData);
        return response.data;
    } catch (error) {
        console.error("Error saving annotation:", error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || '어노테이션 저장에 실패했습니다.');
    }
};

/**
 * 특정 ID의 어노테이션을 삭제합니다.
 * @param {string} annotationId - 삭제할 어노테이션의 고유 ID
 * @returns {Promise<void>}
 */
export const deleteAnnotation = async (annotationId) => {
    if (!annotationId) {
        throw new Error("삭제할 어노테이션의 ID가 없습니다.");
    }
    try {
        // Django 백엔드의 어노테이션 삭제 API 엔드포인트
        await apiClient.delete(`/annotations/${annotationId}/`);
        // 성공적으로 삭제되면 응답이 없을 수 있으므로, 반환값 없이 처리합니다.
    } catch (error) {
        console.error(`Error deleting annotation ${annotationId}:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || '어노테이션 삭제에 실패했습니다.');
    }
};

const annotationApiService = {
    fetchAnnotations,
    saveAnnotation,
    deleteAnnotation,
};

export default annotationApiService;