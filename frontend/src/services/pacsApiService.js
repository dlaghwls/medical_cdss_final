// services/pacsApiService.js

import axios from 'axios';

const API_BASE_URL = 'http://34.64.188.9:8000/api/pacs';

/** 환자의 Study 목록을 가져옵니다. (Orthanc 환자 ID 필요) */
export const fetchPatientStudies = (patientPacsId) => {
  if (!patientPacsId) {
    return Promise.reject(new Error('Patient PACs ID is required.'));
  }
  return axios.get(`${API_BASE_URL}/patients/${patientPacsId}/studies/`);
};

/** DICOM 파일을 업로드합니다. */
export const uploadDicomFile = (file) => {
  const formData = new FormData();
  formData.append('dicom_file', file);

  return axios.post(`${API_BASE_URL}/upload/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};