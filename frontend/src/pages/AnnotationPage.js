// // frontend/src/pages/AnnotationPage.js
// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { useLocation, useParams } from 'react-router-dom';
// import * as cornerstone from '@cornerstonejs/core';
// import * as cornerstoneTools from '@cornerstonejs/tools'; // cornerstoneTools 임포트
// import { init as initDicomLoader, wadouri } from '@cornerstonejs/dicom-image-loader';

// const { RenderingEngine, cache, imageLoader, Enums } = cornerstone; // csUtilities 제거

// // 이 함수를 App.js의 최상위에서 한 번만 호출하도록 옮기는 것이 가장 좋습니다.
// // AnnotationPage 내부에 두면 계속 경고가 발생할 수 있습니다.
// const configureCornerstoneWadoLoader = () => {
//     initDicomLoader({
//         webWorkerPath: '/cornerstone-dicom-loader.worker.js',
//         taskConfiguration: {
//             'decodeTask': {
//                 codecsPath: '/codecs/cornerstoneWADOImageLoaderCodecs.js', 
//             },
//             'jpxDecodeTask': {
//                 codecsPath: '/codecs/openjphjs.js',
//             },
//             'jp2kDecodeTask': {
//                 codecsPath: '/codecs/openjpegwasm_decode.js',
//             },
//             'jpeglsDecodeTask': {
//                 codecsPath: '/codecs/charlswasm_decode.js',
//             },
//             'jpegDecodeTask': { 
//                 codecsPath: '/codecs/libjpegturbowasm_decode.js', 
//             }
//         },
//         maxWebWorkers: navigator.hardwareConcurrency || 1,
//     });
//     imageLoader.registerImageLoader('wadouri', wadouri.loadImage);
// };

// const AnnotationPage = () => {
//     console.log("AnnotationPage: 컴포넌트 렌더링 시작");
//     const location = useLocation();
//     const params = useParams(); 

//     const { imageIds, patientName, studyDescription, studyId, seriesId } = location.state || {};

//     const { patientId: paramPatientId, studyId: paramStudyId, seriesId: paramSeriesId } = params;

//     const viewportDivRef = useRef(null);
//     const toolGroupId = 'tool-group';
//     const [isViewerReady, setIsViewerReady] = useState(false);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState(null);

//     const loadImageDataAndRender = useCallback(async (renderingEngine, viewportId, idsToLoad, element) => {
//         setIsLoading(true);
//         setError(null);
//         try {
//             if (!idsToLoad || idsToLoad.length === 0) {
//                 throw new Error('표시할 이미지 목록이 없습니다.');
//             }
//             console.log(`${idsToLoad.length}개의 이미지 ID로 스택을 설정합니다.`);
//             const viewport = renderingEngine.getViewport(viewportId);
//             await viewport.setStack(idsToLoad);

//             // ★★★ 수정: cornerstoneTools.utilities.stackPrefetch 사용 ★★★
//             // csUtilities는 @cornerstonejs/core에서 가져오며 stackPrefetch를 포함하지 않을 수 있습니다.
//             // stackPrefetch는 @cornerstonejs/tools에 속합니다.
//             cornerstoneTools.utilities.stackPrefetch.enable(element); 
            
//             renderingEngine.render();
            
//             const toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
//             if (toolGroup) {
//                 toolGroup.setToolActive(cornerstoneTools.RectangleROITool.toolName, {
//                     bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Primary }],
//                 });
//                 console.log('모든 과정 완료. 뷰어가 준비되었습니다.');
//             }
//         } catch (err) {
//             console.error('이미지 로딩 및 렌더링 오류:', err);
//             setError(`이미지 로딩 오류: ${err.message}`);
//         } finally {
//             setIsLoading(false);
//         }
//     }, []);

//     // 뷰어 초기화 Effect
//     useEffect(() => {
//         const element = viewportDivRef.current;
//         const renderingEngineId = 'rendering-engine-default';
//         if (!element) return;

//         let renderingEngineInstance; 

//         const setupInitialViewer = async () => {
//             try {
//                 await cornerstone.init();
//                 await cornerstoneTools.init();
                
//                 // configureCornerstoneWadoLoader()를 App.js의 최상위 useEffect로 옮기는 것을 강력히 권장합니다.
//                 configureCornerstoneWadoLoader(); 

//                 cornerstoneTools.addTool(cornerstoneTools.RectangleROITool);
//                 cornerstoneTools.addTool(cornerstoneTools.LengthTool);
                
//                 let toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
//                 if (!toolGroup) {
//                     toolGroup = cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId);
//                 }
//                 toolGroup.addTool(cornerstoneTools.RectangleROITool.toolName);
//                 toolGroup.addTool(cornerstoneTools.LengthTool.toolName);
                
//                 renderingEngineInstance = new RenderingEngine(renderingEngineId);
//                 const viewportId = 'CT_VIEWPORT';
//                 renderingEngineInstance.enableElement({ viewportId, element, type: Enums.ViewportType.STACK });
//                 toolGroup.addViewport(viewportId, renderingEngineId);
                
//                 setIsViewerReady(true);
//             } catch (err) {
//                 console.error('뷰어 초기화 오류:', err);
//                 setError(`뷰어 초기화 중 오류 발생: ${err.message}`);
//                 setIsLoading(false);
//             }
//         };

//         setupInitialViewer();

//         return () => {
//             if (renderingEngineInstance) { 
//                 renderingEngineInstance.destroy();
//             }
//             cornerstoneTools.ToolGroupManager.destroyToolGroup(toolGroupId);
//             cache.purgeCache();
//             setIsViewerReady(false);
//         };
//     }, []); 

//     // 데이터 로딩 Effect
//     useEffect(() => {
//         console.log("AnnotationPage: useEffect (데이터 로딩) 실행"); 
//         console.log("AnnotationPage: location.state 데이터 (최신):", location.state); 
//         console.log("AnnotationPage: imageIds (최신):", imageIds); 
//         console.log("AnnotationPage: URL Params (최신):", params);

//         if (isViewerReady && imageIds && imageIds.length > 0) { 
//             console.log("AnnotationPage: 이미지 데이터 렌더링 시도. imageIds:", imageIds); 
//             const element = viewportDivRef.current;
//             const renderingEngine = cornerstone.getRenderingEngine('rendering-engine-default'); 
//             if (renderingEngine && element) {
//                 loadImageDataAndRender(renderingEngine, 'CT_VIEWPORT', imageIds, element);
//             } else {
//                 console.warn("AnnotationPage: 렌더링 엔진 또는 DOM 요소가 준비되지 않음"); 
//             }
//         } else if (isViewerReady && (!imageIds || imageIds.length === 0)) {
//             console.log("AnnotationPage: imageIds가 없거나 비어있습니다. 오류 메시지 표시."); 
//             setError("이미지 정보를 전달받지 못했습니다. 목록으로 돌아가 다시 시도해주세요.");
//             setIsLoading(false);
//         } else {
//             console.log("AnnotationPage: 뷰어가 아직 준비되지 않았거나 imageIds 없음. 대기 중..."); 
//         }
//     }, [isViewerReady, imageIds, loadImageDataAndRender, params]); 

//     return (
//         <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', position: 'relative' }}>
//             <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'white', zIndex: 20, pointerEvents: 'none', textShadow: '1px 1px 2px black' }}>
//                 <p style={{margin: '5px 0'}}>Patient: {patientName || 'N/A'}</p> 
//                 <p style={{margin: '5px 0'}}>Study: {studyDescription || studyId || 'N/A'}</p>
//                 <p style={{margin: '5px 0'}}>URL Patient ID: {paramPatientId || 'N/A'}</p>
//                 <p style={{margin: '5px 0'}}>URL Study ID: {paramStudyId || 'N/A'}</p>
//                 <p style={{margin: '5px 0'}}>URL Series ID: {paramSeriesId || 'N/A'}</p>
//             </div>
//             {(isLoading || error) && (
//                 <div style={{
//                     position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
//                     display: 'flex', justifyContent: 'center', alignItems: 'center',
//                     color: 'white', fontSize: '1.5rem', zIndex: 10,
//                     backgroundColor: 'rgba(0, 0, 0, 0.7)'
//                 }}>
//                     {error ? `오류: ${error}` : '이미지 로딩 중...'}
//                 </div>
//             )}
//             <div ref={viewportDivRef} style={{ width: '100%', height: '100%' }} />
//         </div>
//     );
// };

// export default AnnotationPage;

// 6월 23일 Frontend 작업
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
// import { init as initDicomLoader, wadouri } from '@cornerstonejs/dicom-image-loader';
// import * as dicomImageLoader from '@cornerstonejs/dicom-image-loader';
import styles from '../styles/pages/AnnotationPage.module.css';

const { RenderingEngine, cache, imageLoader, Enums } = cornerstone;

// 유정우가 cornerstone 3.25버전 이용 문제로 주석처리 
// const configureCornerstoneWadoLoader = () => {
//     dicomImageLoader.configure({
//         webWorkerPath: '/cornerstone-dicom-loader.worker.js',
//         taskConfiguration: {
//             'decodeTask': {
//                 codecsPath: '/codecs/cornerstoneWADOImageLoaderCodecs.js',
//             },
//             'jpxDecodeTask': {
//                 codecsPath: '/codecs/openjphjs.js',
//             },
//             'jp2kDecodeTask': {
//                 codecsPath: '/codecs/openjpegwasm_decode.js',
//             },
//             'jpeglsDecodeTask': {
//                 codecsPath: '/codecs/charlswasm_decode.js',
//             },
//             'jpegDecodeTask': {
//                 codecsPath: '/codecs/libjpegturbowasm_decode.js',
//             }
//         },
//         maxWebWorkers: navigator.hardwareConcurrency || 1,
//     });
// };



// 6월 23일 Frontend 작업
// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { useLocation, useParams } from 'react-router-dom';
// import * as cornerstone from '@cornerstonejs/core';
// import * as cornerstoneTools from '@cornerstonejs/tools';
// // 수정된 부분 1: init 대신 cornerstoneWADOImageLoader를 default로 가져옵니다.
// import cornerstoneWADOImageLoader from '@cornerstonejs/dicom-image-loader';
// import styles from '../styles/pages/AnnotationPage.module.css';

// const { RenderingEngine, cache, imageLoader, Enums } = cornerstone;

// // 수정된 부분 2: initDicomLoader() 대신 cornerstoneWADOImageLoader.webWorkerManager.initialize()를 사용합니다.
// const configureCornerstoneWadoLoader = () => {
//     cornerstoneWADOImageLoader.webWorkerManager.initialize({
//         webWorkerPath: '/cornerstone-dicom-loader.worker.js',
//         taskConfiguration: {
//             'decodeTask': {
//                 codecsPath: '/codecs/cornerstoneWADOImageLoaderCodecs.js',
//             },
//             'jpxDecodeTask': {
//                 codecsPath: '/codecs/openjphjs.js',
//             },
//             'jp2kDecodeTask': {
//                 codecsPath: '/codecs/openjpegwasm_decode.js',
//             },
//             'jpeglsDecodeTask': {
//                 codecsPath: '/codecs/charlswasm_decode.js',
//             },
//             'jpegDecodeTask': {
//                 codecsPath: '/codecs/libjpegturbowasm_decode.js',
//             }
//         },
//         maxWebWorkers: navigator.hardwareConcurrency || 1,
//     });
// };
const AnnotationPage = () => {
    console.log("AnnotationPage: 컴포넌트 렌더링 시작");
    const location = useLocation();
    const params = useParams();

    const { imageIds, patientName, studyDescription, studyId, seriesId } = location.state || {};
    const { patientId: paramPatientId, studyId: paramStudyId, seriesId: paramSeriesId } = params;

    const viewportDivRef = useRef(null);
    const toolGroupId = 'tool-group';
    const [isViewerReady, setIsViewerReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadImageDataAndRender = useCallback(async (renderingEngine, viewportId, idsToLoad, element) => {
        setIsLoading(true);
        setError(null);
        try {
            if (!idsToLoad || idsToLoad.length === 0) {
                throw new Error('표시할 이미지 목록이 없습니다.');
            }
            console.log(`${idsToLoad.length}개의 이미지 ID로 스택을 설정합니다.`);

            const viewport = renderingEngine.getViewport(viewportId);
            await viewport.setStack(idsToLoad);

            cornerstoneTools.utilities.stackPrefetch.enable(element);
            renderingEngine.render();

            const toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
            if (toolGroup) {
                toolGroup.setToolActive('RectangleROI', {
                    bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Primary }]
                });
                toolGroup.setToolActive('Length', {
                    bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Secondary }]
                });
            }
        } catch (err) {
            console.error('이미지 로딩 및 렌더링 오류:', err);
            setError(`이미지 로딩 오류: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const element = viewportDivRef.current;
        const renderingEngineId = 'rendering-engine-default';
        if (!element) return;

        let renderingEngineInstance;

        const setupInitialViewer = async () => {
            try {
                await cornerstoneTools.init();
                
                // 250628_21:29 유정우가 주석처리 해 놓음 (segmentation 오류의 원인인것 같아서)
                // cornerstoneTools.addTool(cornerstoneTools.RectangleROITool, { name: 'RectangleROI' });
                // cornerstoneTools.addTool(cornerstoneTools.LengthTool, { name: 'Length' });

                let toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
                if (!toolGroup) {
                    toolGroup = cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId);
                }

                toolGroup.addTool('RectangleROI');
                toolGroup.addTool('Length');
                
                renderingEngineInstance = new RenderingEngine(renderingEngineId);
                const viewportId = 'CT_VIEWPORT';
                renderingEngineInstance.enableElement({ viewportId, element, type: Enums.ViewportType.STACK });
                toolGroup.addViewport(viewportId, renderingEngineId);

                setIsViewerReady(true);
            } catch (err) {
                console.error('뷰어 초기화 오류:', err);
                setError(`뷰어 초기화 중 오류 발생: ${err.message}`);
                setIsLoading(false);
            }
        };
        setupInitialViewer();

        return () => {
            if (renderingEngineInstance) {
                renderingEngineInstance.destroy();
            }
            cornerstoneTools.ToolGroupManager.destroyToolGroup(toolGroupId);
            cache.purgeCache();
            setIsViewerReady(false);
        };
    }, []);

    useEffect(() => {
        console.log("AnnotationPage: useEffect (데이터 로딩) 실행"); 
        console.log("AnnotationPage: location.state 데이터:", location.state);
        console.log("AnnotationPage: imageIds:", imageIds);
        console.log("AnnotationPage: URL Params:", params);

        if (isViewerReady && imageIds && imageIds.length > 0) {
            const element = viewportDivRef.current;
            const renderingEngine = cornerstone.getRenderingEngine('rendering-engine-default');
            if (renderingEngine && element) {
                loadImageDataAndRender(renderingEngine, 'CT_VIEWPORT', imageIds, element);
            } else {
                console.warn("AnnotationPage: 렌더링 엔진 또는 DOM 요소가 준비되지 않음"); 
            }
        } else if (isViewerReady && (!imageIds || imageIds.length === 0)) {
            console.log("AnnotationPage: imageIds가 없거나 비어있음."); 
            setError("이미지 정보를 전달받지 못했습니다. 목록으로 돌아가 다시 시도해주세요.");
            setIsLoading(false);
        } else {
            console.log("AnnotationPage: 뷰어가 아직 준비되지 않거나 imageIds가 비어 있음."); 
        }
    }, [isViewerReady, imageIds, loadImageDataAndRender, params]);

    return (
        <div className={styles.annotationContainer}>
            <div className={styles.patientInfo}>
                <p>Patient: {patientName || 'N/A'}</p> 
                <p>Study: {studyDescription || studyId || 'N/A'}</p>
                <p>URL Patient ID: {paramPatientId || 'N/A'}</p>
                <p>URL Study ID: {paramStudyId || 'N/A'}</p>
                <p>URL Series ID: {paramSeriesId || 'N/A'}</p>
            </div>
            {(isLoading || error) && (
                <div className={styles.loadingOverlay}>
                    {error ? `오류: ${error}` : '이미지 로딩 중...'}
                </div>
            )}
            <div ref={viewportDivRef} className={styles.viewport} />
        </div>
    );
};
export default AnnotationPage;


// import React, { useEffect, useRef, useState } from 'react';
// import { useLocation } from 'react-router-dom';
// import * as cornerstone from '@cornerstonejs/core';
// import * as cornerstoneTools from '@cornerstonejs/tools';
// import cornerstoneWADOImageLoader from '@cornerstonejs/dicom-image-loader';
// import styles from '../styles/pages/AnnotationPage.module.css';

// // ✅ Enums를 cornerstone(core)가 아닌 cornerstoneTools에서 가져오므로, 여기서 Enums를 제거합니다.
// const { RenderingEngine, cache, imageLoader } = cornerstone; 
// const {
//     RectangleROITool,
//     LengthTool,
//     PanTool,
//     ZoomTool,
//     StackScrollMouseWheelTool,
//     ToolGroupManager,
// } = cornerstoneTools;

// const configureCornerstoneWadoLoader = () => {
//     const config = {
//         webWorkerPath: '/cornerstone-dicom-loader.worker.js',
//         taskConfiguration: {
//             decodeTask: {
//                 codecsPath: '/codecs/cornerstoneWADOImageLoaderCodecs.js',
//             },
//         },
//     };
//     cornerstoneWADOImageLoader.webWorkerManager.initialize(config);

//     const YOUR_AUTH_TOKEN = localStorage.getItem('accessToken');
//     if (YOUR_AUTH_TOKEN) {
//         cornerstoneWADOImageLoader.configure({
//             beforeSend: (xhr) => {
//                 xhr.setRequestHeader('Authorization', `Bearer ${YOUR_AUTH_TOKEN}`);
//             },
//         });
//     }
// };

// const AnnotationPage = () => {
//     const location = useLocation();
//     const { imageIds, patientName, studyDescription } = location.state || {};
    
//     const viewportDivRef = useRef(null);
//     const toolGroupId = 'ANNOTATION_TOOLGROUP';

//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState(null);

//     useEffect(() => {
//         const element = viewportDivRef.current;
//         if (!element || !imageIds || imageIds.length === 0) {
//             if (imageIds && imageIds.length === 0) {
//                 setError('표시할 이미지 정보가 없습니다.');
//                 setIsLoading(false);
//             }
//             return;
//         }

//         let renderingEngine;

//         const setupViewer = async () => {
//             try {
//                 await cornerstone.init();
//                 await cornerstoneTools.init();
//                 configureCornerstoneWadoLoader();
                
//                 imageLoader.registerImageLoader('wadouri', cornerstoneWADOImageLoader.loadImage);
                
//                 try {
//                     cornerstoneTools.addTool(StackScrollMouseWheelTool);
//                     cornerstoneTools.addTool(PanTool);
//                     cornerstoneTools.addTool(ZoomTool);
//                     cornerstoneTools.addTool(RectangleROITool);
//                     cornerstoneTools.addTool(LengthTool);
//                 } catch (err) {
//                     console.warn("하나 이상의 도구가 이미 등록되어 있습니다:", err.message);
//                 }
                
//                 let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
//                 if (!toolGroup) {
//                     toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
//                 }

//                 toolGroup.addTool(StackScrollMouseWheelTool.toolName);
//                 toolGroup.addTool(PanTool.toolName);
//                 toolGroup.addTool(ZoomTool.toolName);
//                 toolGroup.addTool(RectangleROITool.toolName);
//                 toolGroup.addTool(LengthTool.toolName);
                
//                 // ✅✅✅ 여기가 핵심 수정 부분입니다. ✅✅✅
//                 // Enums.MouseBindings -> cornerstoneTools.Enums.MouseBindings 로 전체 수정
//                 toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);
//                 toolGroup.setToolActive(PanTool.toolName, { bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Auxiliary }] });
//                 toolGroup.setToolActive(ZoomTool.toolName, { bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Secondary }] });
//                 toolGroup.setToolActive(RectangleROITool.toolName, { bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Primary }] });

//                 const renderingEngineId = 'myRenderingEngine';
//                 renderingEngine = new RenderingEngine(renderingEngineId);

//                 const viewportId = 'DICOM_VIEWPORT';
//                 renderingEngine.enableElement({ viewportId, element, type: cornerstone.Enums.ViewportType.STACK });
//                 toolGroup.addViewport(viewportId, renderingEngineId);
                
//                 const prefixedImageIds = imageIds.map(id => id.startsWith('wadouri:') ? id : `wadouri:${id}`);
//                 const viewport = renderingEngine.getViewport(viewportId);
//                 await viewport.setStack(prefixedImageIds, 0);

//                 renderingEngine.render();

//             } catch (err) {
//                 console.error('뷰어 설정 및 이미지 로딩 오류:', err);
//                 setError(`뷰어 설정 오류: ${err.message}`);
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         setupViewer();

//         return () => {
//             const re = cornerstone.getRenderingEngine('myRenderingEngine');
//             if (re) {
//                 re.destroy();
//             }
//             ToolGroupManager.destroyToolGroup(toolGroupId);
//             cache.purgeCache();
//         };
//     }, [imageIds]);

//     return (
//         <div className={styles.annotationContainer}>
//             <div className={styles.header}>
//                 <p>환자: {patientName || 'N/A'}</p> 
//                 <p>검사: {studyDescription || 'N/A'}</p>
//             </div>
//             {(isLoading || error) && (
//                 <div className={styles.loadingOverlay}>
//                     {error ? `오류: ${error}` : '이미지 로딩 중...'}
//                 </div>
//             )}
//             <div ref={viewportDivRef} className={styles.viewport} />
//         </div>
//     );
// };

// export default AnnotationPage;