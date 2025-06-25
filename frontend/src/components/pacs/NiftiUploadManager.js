// /home/shared/medical_cdss/frontend/src/components/pacs/NiftiUploadManager.js
// 유정우넌할수있어 다중 업로드 버전 구현중 
import React, { useState } from 'react';
import { uploadNiftiFiles } from '../../services/niftiApiService'; // 다중 업로드용 API 서비스

const MODALITIES = ['FLAIR', 'DWI', 'ADC'];

const NiftiUploadManager = ({ patient }) => {
  const [selectedFiles, setSelectedFiles] = useState([]); // File[]
  const [modalities, setModalities]   = useState([]);     // string[]
  const [uploading, setUploading]     = useState(false);
  const [result, setResult]           = useState(null);

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setSelectedFiles(files);
    setModalities(files.map((_, i) => MODALITIES[i])); // 기본 순서대로 설정
    setResult(null);
  };

  // 모달리티 선택 핸들러
  const handleModChange = (idx, val) => {
    setModalities(ms => {
      const copy = [...ms];
      copy[idx] = val;
      return copy;
    });
  };

  // 업로드 핸들러
  const handleUpload = async () => {
    if (!patient?.uuid) {
      alert('환자를 먼저 선택해주세요.');
      return;
    }
    if (selectedFiles.length === 0) {
      alert('파일을 하나 이상 선택하세요.');
      return;
    }

    const form = new FormData();
    form.append('patient_uuid', patient.uuid);
    selectedFiles.forEach((file, i) => {
      form.append('files', file);
      form.append('modalities', modalities[i]);
    });

    setUploading(true);
    try {
      const res = await uploadNiftiFiles(form);
      setResult(res.data); // { results: [...] }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      border: '1px solid #17a2b8',
      padding: '20px',
      marginTop: '20px',
      backgroundColor: 'white',
      borderRadius: '8px'
    }}>
      <h4>다중 NIfTI 업로드</h4>
      <p>FLAIR, DWI, ADC 등 NIfTI(.nii, .nii.gz) 파일을 최대 3개까지 선택하여 업로드하세요.</p>

      <input
        type="file"
        multiple
        accept=".nii,.nii.gz"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {selectedFiles.map((file, idx) => (
        <div key={idx} style={{ marginTop: '10px' }}>
          <strong>{file.name}</strong>
          <select
            value={modalities[idx]}
            onChange={e => handleModChange(idx, e.target.value)}
            disabled={uploading}
            style={{ marginLeft: '8px' }}
          >
            {MODALITIES.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      ))}

      <div style={{ marginTop: '15px' }}>
        <button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: uploading ? '#6c757d' : '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {uploading ? '업로드 중...' : '업로드 시작'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h5>업로드 결과</h5>
          <ul>
            {result.results.map((r, i) => (
              <li key={i} style={{ color: r.status === 'error' ? 'red' : 'green' }}>
                {r.modality}: {r.status}
                {r.error && ` (오류: ${r.error})`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NiftiUploadManager;
