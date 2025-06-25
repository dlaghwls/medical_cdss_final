// /home/shared/medical_cdss/frontend/src/services/niftiApiService.js
// 유정우넌할수있어
import axios from 'axios';

// 기존 LabResultsView.js에 있던 baseURL을 가져와서 사용합니다.
const api = axios.create({
    baseURL: 'http://34.64.188.9/api', // 실제 GCP Django 백엔드 URL
});

/**
 * 다중 NIfTI 파일 업로드
 * @param {FormData} formData - files[]와 modalities[]를 포함한 FormData
 */
export const uploadNiftiFiles = async (formData) => {
    try {
        const response = await api.post('/pacs/upload-nifti/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Failed to upload NIfTI files:', error);
        throw error;
    }
};
