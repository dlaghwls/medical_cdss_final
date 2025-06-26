// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// // [수정] Material-UI import를 제거합니다.
// // import { Modal, Box, Typography, CircularProgress } from '@mui/material';
// import DicomViewer from './DicomViewer';

// // --- API 설정 ---
// const api = axios.create({
//     baseURL: 'http://34.64.188.9:8000/api/pacs',
//     headers: { 'Content-Type': 'application/json' },
// });

// // [신규 추가] Material-UI Modal을 대체하는 커스텀 모달 컴포넌트
// const CustomModal = ({ isOpen, onClose, children }) => {
//     if (!isOpen) {
//         return null;
//     }

//     const modalStyle = {
//         position: 'fixed',
//         top: 0,
//         left: 0,
//         width: '100%',
//         height: '100%',
//         backgroundColor: 'rgba(0, 0, 0, 0.5)',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         zIndex: 1000,
//     };

//     const contentStyle = {
//         position: 'relative',
//         width: '80vw',
//         height: '90vh',
//         backgroundColor: 'white',
//         padding: '2rem',
//         borderRadius: '8px',
//         boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
//         display: 'flex',
//         flexDirection: 'column',
//     };

//     const closeButtonStyle = {
//         position: 'absolute',
//         top: '10px',
//         right: '15px',
//         background: 'none',
//         border: 'none',
//         fontSize: '1.5rem',
//         cursor: 'pointer',
//     };

//     return (
//         <div style={modalStyle} onClick={onClose}>
//             <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
//                 <button style={closeButtonStyle} onClick={onClose}>&times;</button>
//                 {children}
//             </div>
//         </div>
//     );
// };


// // --- 메인 컴포넌트 ---
// const SegmentationBrowser = ({ selectedPatient }) => {
//     const [sessions, setSessions] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(null);
//     const [openSessions, setOpenSessions] = useState({});
    
//     // 뷰어 모달 상태
//     const [isViewerOpen, setIsViewerOpen] = useState(false);
//     const [viewerData, setViewerData] = useState(null);
//     const [viewerLoading, setViewerLoading] = useState(false);
//     const [viewerError, setViewerError] = useState(null);

//     const patientId = selectedPatient?.uuid;

//     // GCS 파일 목록 가져오기
//     useEffect(() => {
//         if (patientId) {
//             setLoading(true);
//             setError(null);
//             api.get(`/patient-sessions/${patientId}/`)
//                 .then(response => {
//                     setSessions(response.data);
//                 })
//                 .catch(err => {
//                     setError("파일 목록을 불러오는 중 오류가 발생했습니다.");
//                     console.error("GCS 목록 조회 API 오류:", err);
//                 })
//                 .finally(() => setLoading(false));
//         } else {
//             setSessions([]);
//         }
//     }, [patientId]);

//     // NIFTI 파일 클릭 핸들러
//     const handleFileClick = async (file) => {
//         setViewerData(null);
//         setViewerLoading(true);
//         setViewerError(null);
//         setIsViewerOpen(true);

//         try {
//             const response = await api.post('/view-nifti-as-dicom/', {
//                 gcs_path: file.gcs_path,
//                 patient_uuid: patientId,
//             });
//             setViewerData(response.data);
//         } catch (err) {
//             setViewerError("DICOM 변환 또는 뷰어 로딩에 실패했습니다.");
//             console.error("NIfTI->DICOM API 오류:", err);
//         } finally {
//             setViewerLoading(false);
//         }
//     };
    
//     const handleCloseViewer = () => {
//         setIsViewerOpen(false);
//         setViewerData(null);
//     };

//     const toggleSession = (sessionId) => {
//         setOpenSessions(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
//     };

//     if (loading) return <div className="p-4 text-center"><span>🌀</span> 목록 로딩 중...</div>;
//     if (error) return <div className="p-4 text-center text-red-500"><span>⚠️</span> {error}</div>;

//     return (
//         <div className="p-4 font-sans h-full">
//             <h2 className="text-2xl font-bold mb-4">영상 분할 및 분석</h2>
//             <div className="bg-white p-4 border rounded-lg shadow-sm">
//                 <h3 className="text-lg font-semibold mb-3">GCS 저장소 브라우저</h3>
//                 {sessions.length === 0 ? (
//                     <p className="text-gray-500">이 환자에 대한 분석 세션이 없습니다.</p>
//                 ) : (
//                     <div className="space-y-2">
//                         {sessions.map(({ sessionId, modalities }) => (
//                             <div key={sessionId} className="border rounded-md">
//                                 <div 
//                                     className="flex items-center p-3 cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-t-md"
//                                     onClick={() => toggleSession(sessionId)}
//                                 >
//                                     <span className="mr-2 w-5 text-center">{openSessions[sessionId] ? '▼' : '▶'}</span>
//                                     <span className="mr-2">📁</span>
//                                     <span className="font-bold text-gray-800">{sessionId}</span>
//                                     <span className="ml-auto mr-1">🕒</span>
//                                     <span className="text-sm text-gray-500">
//                                         {sessionId.split('_')[0].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
//                                     </span>
//                                 </div>
//                                 {openSessions[sessionId] && (
//                                     <div className="p-4 pl-10 border-t">
//                                         {Object.entries(modalities).map(([modality, files]) => (
//                                             <div key={modality} className="mb-2">
//                                                 <div className="flex items-center mb-1">
//                                                     <span className="mr-2">📁</span>
//                                                     <span className="font-semibold text-gray-700">{modality}</span>
//                                                 </div>
//                                                 <ul className="pl-6 space-y-1">
//                                                     {files.map(file => (
//                                                         <li key={file.name} className="flex items-center">
//                                                             <span className="mr-2">📄</span>
//                                                             <button 
//                                                                 onClick={() => handleFileClick(file)}
//                                                                 className="text-blue-700 hover:underline text-left"
//                                                             >
//                                                                 {file.name}
//                                                             </button>
//                                                         </li>
//                                                     ))}
//                                                 </ul>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </div>

//             {/* [수정] DICOM 뷰어 모달을 커스텀 모달로 교체 */}
//             <CustomModal isOpen={isViewerOpen} onClose={handleCloseViewer}>
//                 <h2 className="text-xl font-bold mb-4">DICOM Viewer</h2>
//                 <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
//                     {viewerLoading && <p><span>⏳</span> DICOM 변환 및 로딩 중...</p>}
//                     {viewerError && <p className="text-red-500">{viewerError}</p>}
//                     {viewerData && !viewerLoading && (
//                         <DicomViewer
//                             studyInstanceUID={viewerData.studyInstanceUID}
//                             seriesInstanceUID={viewerData.seriesInstanceUID}
//                         />
//                     )}
//                 </div>
//             </CustomModal>
//         </div>
//     );
// };

// export default SegmentationBrowser;


import React, { useState, useEffect } from 'react';
import axios from 'axios';

// DicomViewer 컴포넌트를 별도 파일에서 import 합니다.
import DicomViewer from './DicomViewer'; 

// --- API 설정 ---
const api = axios.create({
    baseURL: 'http://34.64.188.9:8000/api/pacs',
    headers: { 'Content-Type': 'application/json' },
});

// --- UI 컴포넌트 ---

// 라이브러리 없이 직접 만든 커스텀 모달
const CustomModal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 1000,
    };
    const modalContentStyle = {
        position: 'relative', width: '85vw', height: '90vh',
        backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'column',
    };
    const closeButtonStyle = {
        position: 'absolute', top: '10px', right: '15px', background: 'transparent',
        border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#555',
    };

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <button style={closeButtonStyle} onClick={onClose}>&times;</button>
                {children}
            </div>
        </div>
    );
};

// --- 메인 컴포넌트 ---
const SegmentationBrowser = ({ selectedPatient }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openSessions, setOpenSessions] = useState({});
    
    // 뷰어 모달 관련 상태
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewerData, setViewerData] = useState(null);
    const [viewerLoading, setViewerLoading] = useState(false);
    const [viewerError, setViewerError] = useState(null);

    const patientId = selectedPatient?.uuid;

    // 1. GCS 파일 목록 가져오기
    useEffect(() => {
        if (patientId) {
            setLoading(true);
            setError(null);
            api.get(`/patient-sessions/${patientId}/`)
                .then(response => { setSessions(response.data); })
                .catch(err => {
                    setError("파일 목록을 불러오는 중 오류가 발생했습니다.");
                    console.error("GCS 목록 조회 API 오류:", err);
                })
                .finally(() => setLoading(false));
        } else {
            setSessions([]);
        }
    }, [patientId]);

    // 2. NIFTI 파일 클릭 시 -> DICOM 변환 및 뷰어 정보 요청
    const handleFileClick = async (file) => {
        setViewerData(null);
        setViewerLoading(true);
        setViewerError(null);
        setIsViewerOpen(true);

        try {
            // 이 API 호출 한 번으로 imageIds까지 모두 받아옵니다 (타이밍 문제 해결).
            const response = await api.post('/view-nifti-as-dicom/', {
                gcs_path: file.gcs_path,
                patient_uuid: patientId,
            });
            setViewerData(response.data);
        } catch (err) {
            setViewerError("DICOM 변환 또는 뷰어 로딩에 실패했습니다.");
            console.error("NIfTI->DICOM API 오류:", err);
        } finally {
            setViewerLoading(false);
        }
    };
    
    const handleCloseViewer = () => {
        setIsViewerOpen(false);
        setViewerData(null);
    };

    const toggleSession = (sessionId) => {
        setOpenSessions(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
    };

    if (loading) return <div className="p-4 text-center"><span>🌀</span> 목록 로딩 중...</div>;
    if (error) return <div className="p-4 text-center text-red-500"><span>⚠️</span> {error}</div>;

    return (
        <div className="p-4 font-sans h-full">
            <h2 className="text-2xl font-bold mb-4">영상 분할 및 분석</h2>
            <div className="bg-white p-4 border rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-3">GCS 저장소 브라우저</h3>
                {sessions.length === 0 ? (
                    <p className="text-gray-500">이 환자에 대한 분석 세션이 없습니다.</p>
                ) : (
                    <div className="space-y-2">
                        {sessions.map(({ sessionId, modalities }) => (
                            <div key={sessionId} className="border rounded-md">
                                <div 
                                    className="flex items-center p-3 cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-t-md"
                                    onClick={() => toggleSession(sessionId)}
                                >
                                    <span className="mr-2 w-5 text-center">{openSessions[sessionId] ? '▼' : '▶'}</span>
                                    <span className="mr-2">📁</span>
                                    <span className="font-bold text-gray-800">{sessionId}</span>
                                </div>
                                {openSessions[sessionId] && (
                                    <div className="p-4 pl-10 border-t">
                                        {Object.entries(modalities).map(([modality, files]) => (
                                            <div key={modality} className="mb-2">
                                                <div className="flex items-center mb-1">
                                                    <span className="mr-2">📁</span>
                                                    <span className="font-semibold text-gray-700">{modality}</span>
                                                </div>
                                                <ul className="pl-6 space-y-1">
                                                    {files.map(file => (
                                                        <li key={file.name} className="flex items-center">
                                                            <span className="mr-2">📄</span>
                                                            <button 
                                                                onClick={() => handleFileClick(file)}
                                                                className="text-blue-700 hover:underline text-left"
                                                            >
                                                                {file.name}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* DICOM 뷰어 모달 */}
            <CustomModal isOpen={isViewerOpen} onClose={handleCloseViewer}>
                <h2 className="text-xl font-bold mb-4">DICOM Viewer</h2>
                <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {viewerLoading && <p><span>⏳</span> DICOM 변환 및 로딩 중...</p>}
                    {viewerError && <p className="text-red-500">{viewerError}</p>}
                    {viewerData && !viewerLoading && (
                        <DicomViewer
                            imageIds={viewerData.imageIds}
                            seriesInstanceUID={viewerData.seriesInstanceUID}
                        />
                    )}
                </div>
            </CustomModal>
        </div>
    );
};

export default SegmentationBrowser;
