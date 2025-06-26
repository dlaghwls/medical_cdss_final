// 유정우넌할수있어생성
// /home/shared/medical_cdss/frontend/src/components/segmentation/DicomViewer.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API 통신을 위한 axios 인스턴스
const api = axios.create({
    baseURL: 'http://34.64.188.9:8000/api/pacs',
});

// 이 컴포넌트는 Cornerstone.js를 사용하여 DICOM 이미지를 렌더링합니다.
const DicomViewer = ({ studyInstanceUID, seriesInstanceUID }) => {
    const [imageIds, setImageIds] = useState([]);
    const [error, setError] = useState(null);
    const elementId = `cornerstone-element-${seriesInstanceUID}`;

    useEffect(() => {
        if (studyInstanceUID && seriesInstanceUID) {
            // 백엔드에 이미지 ID 목록 요청
            api.get(`/series-instances/${studyInstanceUID}/${seriesInstanceUID}/`)
                .then(response => {
                    setImageIds(response.data);
                })
                .catch(err => {
                    console.error("Failed to fetch image IDs:", err);
                    setError("뷰어 이미지 목록을 불러오는 데 실패했습니다.");
                });
        }
    }, [studyInstanceUID, seriesInstanceUID]);

    useEffect(() => {
        if (imageIds.length > 0) {
            // TODO: 여기에 실제 Cornerstone.js 렌더링 로직 구현
            // const element = document.getElementById(elementId);
            // cornerstone.enable(element);
            // cornerstone.loadImage(imageIds[0]).then(image => {
            //     cornerstone.displayImage(element, image);
            // });
            console.log("Cornerstone에 로드할 이미지 ID 목록:", imageIds);
        }
    }, [imageIds, elementId]);

    if (error) {
        return <p style={{ color: 'red' }}>{error}</p>;
    }

    return (
        <div style={{ width: '100%', height: 'calc(100% - 50px)', backgroundColor: 'black' }}>
            <div id={elementId} style={{ width: '100%', height: '100%' }}>
                {/* Cornerstone 뷰포트가 여기에 렌더링됩니다. */}
                <p style={{color: 'white', padding: '10px'}}>
                    뷰어 로딩 완료. (렌더링은 Cornerstone.js 연동 필요)<br/>
                    Study: {studyInstanceUID}<br/>
                    Series: {seriesInstanceUID}
                </p>
            </div>
        </div>
    );
};

export default DicomViewer;
