// 6월 26일 오후 작업 전 원본 코드
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import NiftiUploadManager from './NiftiUploadManager'; // 경로가 맞는지 확인해주세요.
// import StudiesModal from './StudiesModal'; // 경로가 맞는지 확인해주세요.

// // PACS API 통신을 위한 axios 인스턴스
// const api = axios.create({
//     baseURL: 'http://34.64.188.9:8000/api', // 실제 운영 환경에 맞는 URL로 설정
//     headers: {
//         'Content-Type': 'application/json',
//     },
// });

// // DICOM 파일 업로드 함수
// const uploadDicomFile = async (formData) => {
//     try {
//         const response = await api.post('/pacs/upload/', formData, {
//             headers: {
//                 'Content-Type': 'multipart/form-data',
//             },
//         });
//         return response.data;
//     } catch (error) {
//         console.error('Failed to upload DICOM file:', error);
//         throw error;
//     }
// };


// // 이 컴포넌트는 DICOM 업로드 및 뷰어 실행을 담당합니다.
// const PatientDicomManager = ({ patient, onPatientDetailsUpdated }) => {
//     const [selectedFile, setSelectedFile] = useState(null);
//     const [studies, setStudies] = useState([]);
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [uploadLoading, setUploadLoading] = useState(false);
//     const [uploadError, setUploadError] = useState(null);
//     const [uploadSuccess, setUploadSuccess] = useState(false);
//     const [modalMode, setModalMode] = useState('viewer');

//     const patientIdentifierToUse = patient?.identifier;

//     useEffect(() => {
//         if (uploadSuccess && patient?.uuid && onPatientDetailsUpdated) {
//             console.log("[PatientDicomManager] Upload success, refreshing patient data");
//             onPatientDetailsUpdated(patient.uuid);
//             setUploadSuccess(false);
//         }
//     }, [uploadSuccess, patient?.uuid, onPatientDetailsUpdated]);

//     const handleFileChange = (event) => {
//         setSelectedFile(event.target.files[0]);
//     };

//     const handleUpload = async () => {
//         if (!selectedFile || !patient?.uuid) {
//             setUploadError('파일과 환자를 모두 선택해주세요.');
//             return;
//         }
//         setUploadLoading(true);
//         setUploadError(null);
//         try {
//             const formData = new FormData();
//             formData.append('dicom_file', selectedFile);
//             formData.append('patient_identifier', patient.identifier);
//             await uploadDicomFile(formData);
//             setUploadSuccess(true);
//             alert('DICOM 업로드 및 동기화 성공!');
//             setSelectedFile(null);
//         } catch (error) {
//             const errorMessage = error.response?.data?.error || error.message || '알 수 없는 오류';
//             setUploadError(`업로드 실패: ${errorMessage}`);
//         } finally {
//             setUploadLoading(false);
//         }
//     };

//     const handleViewImages = async (mode) => {
//         if (!patientIdentifierToUse) {
//             setUploadError('환자 식별자(Identifier)가 없습니다. 먼저 DICOM 파일을 업로드하세요.');
//             return;
//         }
//         setUploadError(null);
//         try {
//             const response = await api.get(`/pacs/patients/${encodeURIComponent(patientIdentifierToUse)}/studies/`);
//             if (response.data && response.data.studies && response.data.studies.length > 0) {
//                 setStudies(response.data.studies);
//                 setModalMode(mode);
//                 setIsModalOpen(true);
//             } else {
//                 setUploadError(response.data.message || '조회된 영상이 없습니다.');
//             }
//         } catch (error) {
//             console.error('Failed to fetch patient studies:', error);
//             setUploadError('영상 조회에 실패했습니다.');
//         }
//     };

//     return (
//         <div style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
//             <h4>PACS 이미지 관리</h4>
//             <div>
//                 <p><strong>환자 식별 정보:</strong></p>
//                 <ul>
//                     <li>환자명: {patient?.display_name || 'N/A'}</li>
//                     <li>Identifier: {patient?.identifier || 'N/A'}</li>
//                     <li>UUID: {patient?.uuid || 'N/A'}</li>
//                     <li>PACS ID: {patient?.pacs_id || 'N/A'}</li>
//                 </ul>
//             </div>
//             <div>
//                 <input type="file" onChange={handleFileChange} accept=".dcm,.dicom" disabled={uploadLoading} />
//                 <button onClick={handleUpload} disabled={!selectedFile || uploadLoading} style={{ marginLeft: '10px' }}>
//                     {uploadLoading ? '업로드 중...' : '업로드'}
//                 </button>
//                 {uploadError && <p style={{ color: 'red', marginTop: '10px' }}>{uploadError}</p>}
//             </div>
//             <hr style={{ margin: '20px 0' }} />
//             <div>
//                 <button onClick={() => handleViewImages('viewer')} disabled={!patientIdentifierToUse}>
//                     영상의학 이미지 보기 (기본 뷰어)
//                 </button>
//                 <button onClick={() => handleViewImages('annotation')} disabled={!patientIdentifierToUse} style={{ marginLeft: '10px' }}>
//                     병변 부위 찾기 (어노테이션)
//                 </button>
//             </div>
//             {isModalOpen && (
//                 <StudiesModal
//                     studies={studies}
//                     onClose={() => setIsModalOpen(false)}
//                     patient={patient}
//                     mode={modalMode}
//                 />
//             )}
//         </div>
//     );
// };


// // 이 컴포넌트가 PACS 관련 기능 전체를 감싸는 컨테이너 역할을 합니다.
// const PacsViewer = ({ selectedPatient, onSelectedPatientUpdated }) => {
//     if (!selectedPatient) {
//         return (
//             <div style={{ padding: '20px' }}>
//                 <h3>PACS 이미지 뷰어</h3>
//                 <p>환자를 선택해야 PACS 관련 기능을 사용할 수 있습니다.</p>
//             </div>
//         );
//     }

//     return (
//         <div className="pacs-viewer-container" style={{ padding: '20px', backgroundColor: '#f9f9f9' }}>
//             <h2 style={{marginBottom: '20px'}}>PACS / 이미지 관리 - {selectedPatient.display}</h2>
            
//             {/* 1. NIFTI 업로드 관리자 */}
//             <NiftiUploadManager patient={selectedPatient} />

//             {/* 2. DICOM 업로드 및 뷰어 관리자 */}
//             <PatientDicomManager 
//                 patient={selectedPatient} 
//                 onPatientDetailsUpdated={onSelectedPatientUpdated}
//             />
//         </div>
//     );
// };


// export default PacsViewer;
/////////////////////////////////////////////////////

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import NiftiUploadManager from './NiftiUploadManager';
// import StudiesModal from './StudiesModal';

// const api = axios.create({
//     baseURL: 'http://34.64.188.9:8000/api',
//     headers: {
//         'Content-Type': 'application/json',
//     },
// });

// const uploadDicomFile = async (formData) => {
//     try {
//         const response = await api.post('/pacs/upload/', formData, {
//             headers: {
//                 'Content-Type': 'multipart/form-data',
//             },
//         });
//         return response.data;
//     } catch (error) {
//         console.error('Failed to upload DICOM file:', error);
//         throw error;
//     }
// };

// const PatientDicomManager = ({ patient, onPatientDetailsUpdated }) => {
//     const [selectedFile, setSelectedFile] = useState(null);
//     const [studies, setStudies] = useState([]);
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [uploadLoading, setUploadLoading] = useState(false);
//     const [uploadError, setUploadError] = useState(null);
//     const [uploadSuccess, setUploadSuccess] = useState(false);
//     const [modalMode, setModalMode] = useState('viewer');

//     const patientIdentifierToUse = patient?.identifier;

//     useEffect(() => {
//         if (uploadSuccess && patient?.uuid && onPatientDetailsUpdated) {
//             onPatientDetailsUpdated(patient.uuid);
//             setUploadSuccess(false);
//         }
//     }, [uploadSuccess, patient?.uuid, onPatientDetailsUpdated]);

//     const handleFileChange = (event) => {
//         setSelectedFile(event.target.files[0]);
//     };
//     const handleUpload = async () => {
//         if (!selectedFile || !patient?.uuid) {
//             setUploadError('파일과 환자를 모두 선택해주세요.');
//             return;
//         }
//         setUploadLoading(true);
//         setUploadError(null);
//         try {
//             const formData = new FormData();
//             formData.append('dicom_file', selectedFile);
//             formData.append('patient_identifier', patient.identifier);
//             await uploadDicomFile(formData);
//             setUploadSuccess(true);
//             alert('DICOM 업로드 및 동기화 성공!');
//             setSelectedFile(null);
//         } catch (error) {
//             const errorMessage = error.response?.data?.error || error.message || '알 수 없는 오류';
//             setUploadError(`업로드 실패: ${errorMessage}`);
//         } finally {
//             setUploadLoading(false);
//         }
//     };
//     const handleViewImages = async (mode) => {
//         if (!patientIdentifierToUse) {
//             setUploadError('환자 식별자(Identifier)가 없습니다. 먼저 DICOM 파일을 업로드하세요.');
//             return;
//         }
//         setUploadError(null);
//         try {
//             const response = await api.get(`/pacs/patients/${encodeURIComponent(patientIdentifierToUse)}/studies/`);
//             if (response.data && response.data.studies && response.data.studies.length > 0) {
//                 setStudies(response.data.studies);
//                 setModalMode(mode);
//                 setIsModalOpen(true);
//             } else {
//                 setUploadError(response.data.message || '조회된 영상이 없습니다.');
//             }
//         } catch (error) {
//             console.error('Failed to fetch patient studies:', error);
//             setUploadError('영상 조회에 실패했습니다.');
//         }
//     };
//     const commonButtonStyle = {
//         padding: '8px 20px',
//         fontWeight: 'bold',
//         fontSize: '1rem',
//         color: 'white',
//         backgroundColor: '#007BFF',
//         borderRadius: '8px',
//         border: 'none',
//         cursor: 'pointer',
//         boxShadow: '0px 2px 6px rgba(0,0,0,.1)',
//         transition: 'all .3s',
//     };
//     return (
//         <div style={{ border: '1px solid #e0e0e0', padding: '20px', marginTop: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(0,0,0,.1)' }}>
//             <h4 style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>PACS 이미지 관리</h4>
//             <div style={{ marginBottom: '15px' }}>
//                 <p><strong>환자 식별 정보:</strong></p>
//                 <ul>
//                     <li>환자명: {patient?.display_name || 'N/A'}</li>
//                     <li>Identifier: {patient?.identifier || 'N/A'}</li>
//                     <li>UUID: {patient?.uuid || 'N/A'}</li>
//                     <li>PACS ID: {patient?.pacs_id || 'N/A'}</li>
//                 </ul>
//             </div>
//             <div>
//                 <input 
//                     type="file"
//                     onChange={handleFileChange}
//                     accept=".dcm,.dicom"
//                     disabled={uploadLoading}
//                     style={{ padding: '5px', fontSize: '1rem' }}
//                 />
//                 <button
//                     onClick={handleUpload}
//                     disabled={!selectedFile || uploadLoading}
//                     style={{ ...commonButtonStyle, marginLeft: '10px' }}
//                     onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'} 
//                     onMouseLeave={(e) => e.currentTarget.style.opacity = '1'} 
//                 >
//                     {uploadLoading ? '업로드 중...' : '업로드'}
//                 </button>
//                 {uploadError && <p style={{ color: 'red', marginTop: '10px' }}>{uploadError}</p>}
//             </div>
//             <hr style={{ margin: '20px 0' }} />
//             <div>
//                 <button
//                     onClick={() => handleViewImages('viewer')}
//                     disabled={!patientIdentifierToUse}
//                     style={commonButtonStyle}
//                     onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'} 
//                     onMouseLeave={(e) => e.currentTarget.style.opacity = '1'} 
//                 >
//                     영상의학 이미지 보기 (기본 뷰어)
//                 </button>
//                 <button
//                     onClick={() => handleViewImages('annotation')}
//                     disabled={!patientIdentifierToUse}
//                     style={{ ...commonButtonStyle, marginLeft: '10px' }}
//                     onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'} 
//                     onMouseLeave={(e) => e.currentTarget.style.opacity = '1'} 
//                 >
//                     병변 부위 찾기 (어노테이션)
//                 </button>
//             </div>
//             {isModalOpen && (
//                 <StudiesModal
//                     studies={studies}
//                     onClose={() => setIsModalOpen(false)}
//                     patient={patient}
//                     mode={modalMode}
//                 />
//             )}
//         </div>
//     );
// };

// const PacsViewer = ({ selectedPatient, onSelectedPatientUpdated }) => {
//     if (!selectedPatient) {
//         return (
//             <div style={{ padding: '20px' }}>
//                 <h3>PACS 이미지 뷰어</h3>
//                 <p>환자를 선택해야 PACS 관련 기능을 사용할 수 있습니다.</p>
//             </div>
//         );
//     }
//     return (
//         <div className="pacs-viewer-container" style={{ padding: '20px', backgroundColor: '#f9f9f9' }}>
//             <h2 style={{ marginBottom: '20px', fontWeight: 'bold' }}>PACS / 이미지 관리 - {selectedPatient.display}</h2>
//             <div style={{
//                 padding: '20px',
//                 backgroundColor: 'white',
//                 borderRadius: '12px',
//                 border: '1px solid #e0e0e0',
//                 boxShadow: '0px 2px 12px rgba(0,0,0,.1)',
//                 marginBottom: '20px'
//             }}>
//                 <NiftiUploadManager patient={selectedPatient} />
//             </div>
//             <div style={{
//                 padding: '20px',
//                 backgroundColor: 'white',
//                 borderRadius: '12px',
//                 border: '1px solid #e0e0e0',
//                 boxShadow: '0px 2px 12px rgba(0,0,0,.1)',
//             }}>
//                 <PatientDicomManager patient={selectedPatient} onPatientDetailsUpdated={onSelectedPatientUpdated} />
//             </div>
//         </div>
//     );
// };

// export default PacsViewer;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NiftiUploadManager from './NiftiUploadManager';
import StudiesModal from './StudiesModal';

const api = axios.create({
    baseURL: 'http://34.64.188.9:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

const uploadDicomFile = async (formData) => {
    try {
        const response = await api.post('/pacs/upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Failed to upload DICOM file:', error);
        throw error;
    }
};

const PatientDicomManager = ({ patient, onPatientDetailsUpdated }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [studies, setStudies] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [modalMode, setModalMode] = useState('viewer');

    const patientIdentifierToUse = patient?.identifier;

    useEffect(() => {
        if (uploadSuccess && patient?.uuid && onPatientDetailsUpdated) {
            onPatientDetailsUpdated(patient.uuid);
            setUploadSuccess(false);
        }
    }, [uploadSuccess, patient?.uuid, onPatientDetailsUpdated]);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };
    const handleUpload = async () => {
        if (!selectedFile || !patient?.uuid) {
            setUploadError('파일과 환자를 모두 선택해주세요.');
            return;
        }
        setUploadLoading(true);
        setUploadError(null);
        try {
            const formData = new FormData();
            formData.append('dicom_file', selectedFile);
            formData.append('patient_identifier', patient.identifier);
            await uploadDicomFile(formData);
            setUploadSuccess(true);
            alert('DICOM 업로드 및 동기화 성공!');
            setSelectedFile(null);
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || '알 수 없는 오류';
            setUploadError(`업로드 실패: ${errorMessage}`);
        } finally {
            setUploadLoading(false);
        }
    };
    const handleViewImages = async (mode) => {
        if (!patientIdentifierToUse) {
            setUploadError('환자 식별자(Identifier)가 없습니다. 먼저 DICOM 파일을 업로드하세요.');
            return;
        }
        setUploadError(null);
        try {
            const response = await api.get(`/pacs/patients/${encodeURIComponent(patientIdentifierToUse)}/studies/`);
            if (response.data && response.data.studies && response.data.studies.length > 0) {
                setStudies(response.data.studies);
                setModalMode(mode);
                setIsModalOpen(true);
            } else {
                setUploadError(response.data.message || '조회된 영상이 없습니다.');
            }
        } catch (error) {
            console.error('Failed to fetch patient studies:', error);
            setUploadError('영상 조회에 실패했습니다.');
        }
    };
    const commonButtonStyle = {
        padding: '8px 18px',
        fontWeight: 'bold',
        fontSize: '1rem',
        color: 'white',
        backgroundColor: '#007BFF',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        flexShrink: 0,
        minWidth: '180px',
        textAlign: 'center',
        boxShadow: '0px 2px 6px rgba(0,0,0,.1)',
        transition: 'all .3s',
    };
    return (
        <div style={{ border: '1px solid #e0e0e0', padding: '20px', marginTop: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0px 2px 12px rgba(0,0,0,.1)' }}>
            <h4 style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>PACS 이미지 관리</h4>
            <div style={{ 
                marginBottom: '15px' ,             
                padding: '15px',
                border: '1px solid #009688',
                borderRadius: '8px',
                backgroundColor: '#fafafa',
                }}>
                <p><strong>환자 식별 정보:</strong></p>
                <ul>
                    <li>환자명: {patient?.display_name || 'N/A'}</li>
                    <li>Identifier: {patient?.identifier || 'N/A'}</li>
                    <li>UUID: {patient?.uuid || 'N/A'}</li>
                    <li>PACS ID: {patient?.pacs_id || 'N/A'}</li>
                </ul>
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',

                
                gap: '12px',
                marginTop: '15px',
                flexWrap: 'wrap',
            }}>
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".dcm,.dicom"
                    disabled={uploadLoading}
                    style={{
                        padding: '5px',
                        fontSize: '1rem',
                        flex: '1',
                        maxWidth: '250px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                    }}
                />
                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadLoading}
                    style={commonButtonStyle}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} 
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'} 
                >
                    {uploadLoading ? '업로드 중...' : '업로드'}
                </button>
            </div>
            {uploadError && <p style={{ color: 'red', marginTop: '10px' }}>{uploadError}</p>}
            <hr style={{ margin: '20px 0' }} />
            <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: '12px',
                marginTop: '20px',
                flexWrap: 'wrap',
            }}>
                <button
                    onClick={() => handleViewImages('viewer')}
                    disabled={!patientIdentifierToUse}
                    style={commonButtonStyle}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} 
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'} 
                >
                    영상의학 이미지 보기
                </button>
                <button
                    onClick={() => handleViewImages('annotation')}
                    disabled={!patientIdentifierToUse}
                    style={commonButtonStyle}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} 
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'} 
                >
                    병변 부위 찾기
                </button>
            </div>
            {isModalOpen && (
                <StudiesModal
                    studies={studies}
                    onClose={() => setIsModalOpen(false)}
                    patient={patient}
                    mode={modalMode}
                />
            )}
        </div>
    );
};

const PacsViewer = ({ selectedPatient, onSelectedPatientUpdated }) => {
    if (!selectedPatient) {
        return (
            <div style={{ padding: '20px' }}>
                <h3>PACS 이미지 뷰어</h3>
                <p>환자를 선택해야 PACS 관련 기능을 사용할 수 있습니다.</p>
            </div>
        );
    }
    return (
        <div className="pacs-viewer-container" style={{ padding: '20px', backgroundColor: '#f9f9f9' }}>
            <h2 style={{ marginBottom: '20px', fontWeight: 'bold' }}>PACS / 이미지 관리 - {selectedPatient.display}</h2>     
         <div
    style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        boxShadow: '0px 2px 12px rgba(0,0,0,.1)',
        marginBottom: '20px',
        transition: 'all 0.3s',
    }}
    onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0px 4px 20px rgba(0,0,0,.15)';
        e.currentTarget.style.transform = 'translateY(-3px)';
    }}
    onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0px 2px 12px rgba(0,0,0,.1)';
        e.currentTarget.style.transform = 'translateY(0)';
    }}
>
    <NiftiUploadManager patient={selectedPatient} />
</div>
           <div
    style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        boxShadow: '0px 2px 12px rgba(0,0,0,.1)',
        transition: 'all 0.3s',
    }}
    onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0px 4px 20px rgba(0,0,0,.15)';
        e.currentTarget.style.transform = 'translateY(-3px)';
    }}
    onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0px 2px 12px rgba(0,0,0,.1)';
        e.currentTarget.style.transform = 'translateY(0)';
    }}
>
    <PatientDicomManager patient={selectedPatient} onPatientDetailsUpdated={onSelectedPatientUpdated} />
</div>
</div>
    );
};

export default PacsViewer;