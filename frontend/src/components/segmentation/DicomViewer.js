// // /home/shared/medical_cdss/frontend/src/components/segmentation/DicomViewer.js

// import React, { useEffect, useRef, useState } from 'react';
// import { RenderingEngine, imageLoader, getRenderingEngine, metaData, Enums as csCoreEnums } from '@cornerstonejs/core';
// import { ToolGroupManager, Enums as csToolsEnums } from '@cornerstonejs/tools';
// import initCornerstone from '../../utils/cornerstone-init';

// // 반드시 prop/필드명, 외부 API 변경 금지!
// export default function DicomViewer({ imageIds, seriesInstanceUID, imageType }) {
//     const elementRef = useRef(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState(null);
    
//     // 고유 ID: seriesInstanceUID로
//     const renderingEngineId = `engine-${seriesInstanceUID}`;
//     const viewportId = `viewport-${seriesInstanceUID}`;
//     const toolGroupId = `toolgroup-${seriesInstanceUID}`;

//     useEffect(() => {
//         if (!elementRef.current || !imageIds?.length) return;

//         let isMounted = true;

//         const setupViewer = async () => {
//             setIsLoading(true);
//             setError(null);

//             try {
//                 console.log('imageLoader:', imageLoader);
//                 console.log('metaData:', metaData);
//                 // cornerstone (core + loader + tools) 완전초기화 보장
//                 await initCornerstone();

//                 const testImageId = imageIds[0];
//                 console.log('TEST imageId:', testImageId);
//                 const image = await imageLoader.loadImage(testImageId);
//                 console.log('image:', image);

//                 const pixelMeta = metaData.get('imagePixelModule', testImageId);
//                 console.log('imagePixelModule meta:', pixelMeta);

//                 // 기존 엔진 제거 후 새로 생성 (항상 클린)
//                 let renderingEngine = getRenderingEngine(renderingEngineId);
//                 if (renderingEngine) {
//                     try { renderingEngine.destroy(); } catch (e) {}
//                 }
//                 renderingEngine = new RenderingEngine(renderingEngineId);

//                 renderingEngine.enableElement({
//                     viewportId,
//                     element: elementRef.current,
//                     type: csCoreEnums.ViewportType.STACK,
//                 });

//                 // toolGroup 준비 및 viewport 연결 (항상 새로)
//                 let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
//                 if (toolGroup) {
//                     ToolGroupManager.destroyToolGroup(toolGroupId);
//                 }
//                 toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

//                 toolGroup.addTool('WindowLevel');
//                 toolGroup.addTool('Pan');
//                 toolGroup.addTool('Zoom');
//                 toolGroup.addTool('StackScroll');

//                 // Tool 활성화 (한 번만, 등록된 전역 tool 사용)
//                 toolGroup.setToolActive('WindowLevel', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }] });
//                 toolGroup.setToolActive('Pan', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Auxiliary }] });
//                 toolGroup.setToolActive('Zoom', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Secondary }] });
//                 toolGroup.setToolActive('StackScroll', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Wheel }] });

//                 toolGroup.addViewport(viewportId, renderingEngineId);

//                 // 이미지 표시
//                 const viewport = renderingEngine.getViewport(viewportId);
//                 await viewport.setStack(imageIds);
//                 viewport.resetCamera();

//                 // VOI LUT (윈도우/레벨)
//                 const firstImageId = imageIds[0];
//                 const voiLutModule = metaData.get('voiLutModule', firstImageId);
//                 if (voiLutModule?.windowCenter !== undefined && voiLutModule?.windowWidth !== undefined) {
//                     const { windowCenter, windowWidth } = voiLutModule;
//                     viewport.setProperties({ voi: { windowCenter, windowWidth } });
//                 }
//                 // SEG 타입이면 반전
//                 if (imageType?.toUpperCase() === 'SEG') {
//                     viewport.setProperties({ invert: true });
//                 }
//                 viewport.render();

//             } catch (e) {
//                 if (!isMounted) return;
//                 console.error('DicomViewer setup error:', e);
//                 setError('뷰어를 불러오는 중 오류가 발생했습니다.');
//             } finally {
//                 if (isMounted) setIsLoading(false);
//             }
//         };

//         setupViewer();

//         // 언마운트: 뷰포트, 엔진, 툴그룹 정리
//         return () => {
//             isMounted = false;
//             const re = getRenderingEngine(renderingEngineId);
//             if (re) {
//                 try { re.destroy(); } catch (e) {}
//             }
//             ToolGroupManager.destroyToolGroup(toolGroupId);
//         };

//     // 종속성 고정 (필드명 변경금지)
//     }, [imageIds, seriesInstanceUID, imageType, renderingEngineId, viewportId, toolGroupId]);

//     const loadingStyle = {
//         position: 'absolute', top: 0, left: 0,
//         width: '100%', height: '100%',
//         display: 'flex', justifyContent: 'center', alignItems: 'center',
//         color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)',
//         zIndex: 10,
//     };

//     return (
//         <div style={{ width: '100%', height: '500px', position: 'relative', background: 'black' }}>
//             <div ref={elementRef} style={{ width: '100%', height: '100%' }} />
//             {isLoading && <div style={loadingStyle}>이미지 로딩 중...</div>}
//             {error && <div style={loadingStyle}>{error}</div>}
//         </div>
//     );
// }


// DicomViewer.js (제어/비제어 모드를 모두 지원하는 최종 버전)

import React, { useEffect, useRef, useState } from 'react';
import { RenderingEngine, getRenderingEngine, Enums as csCoreEnums } from '@cornerstonejs/core';
import { ToolGroupManager, Enums as csToolsEnums } from '@cornerstonejs/tools';
import initCornerstone from '../../utils/cornerstone-init';

export default function DicomViewer({
  imageIds,
  seriesInstanceUID,
  imageType,
  // ✨ 아래 4개는 부모(GridDicomViewer)로부터 받을 수도, 안 받을 수도 있는 '선택적' props입니다.
  currentSlice: controlledSlice,
  totalSlices: controlledTotalSlices,
  onSliceChange: controlledOnSliceChange,
  setTotalSlices: controlledSetTotalSlices,
}) {
    // ✨ 1. props 수신 여부를 확인하여 '제어 모드'인지 판단합니다.
    const isControlled = controlledOnSliceChange !== undefined;

    // ✨ 2. '비제어 모드'(단독 사용)일 때를 대비한 자체 내부 상태를 만듭니다.
    const [internalSlice, setInternalSlice] = useState(1);
    const [internalTotalSlices, setInternalTotalSlices] = useState(1);

    // ✨ 3. 상황에 맞는 값과 함수를 선택합니다.
    // 제어 모드이면 props 값을, 비제어 모드이면 내부 상태 값을 사용합니다.
    const currentSlice = isControlled ? controlledSlice : internalSlice;
    const totalSlices = isControlled ? controlledTotalSlices : internalTotalSlices;
    const onSliceChange = isControlled ? controlledOnSliceChange : setInternalSlice;
    const setTotalSlices = isControlled ? controlledSetTotalSlices : setInternalTotalSlices;

    const elementRef = useRef(null);
    const viewportRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const renderingEngineId = `engine-${seriesInstanceUID}`;
    const viewportId = `viewport-${seriesInstanceUID}`;
    const toolGroupId = `toolgroup-${seriesInstanceUID}`;

    // ✨ 4. currentSlice(props 또는 state)가 변경될 때마다 Cornerstone 뷰포트를 업데이트합니다.
    // 이 로직 하나로 제어/비제어 모드 모두에서 뷰포트 동기화가 가능합니다.
    useEffect(() => {
        if (viewportRef.current && imageIds?.length > 0) {
            const newSliceIndex = currentSlice - 1;
            if (viewportRef.current.getCurrentImageIdIndex() !== newSliceIndex) {
                viewportRef.current.setImageIdIndex(newSliceIndex);
            }
        }
    }, [currentSlice, imageIds]);

    // Cornerstone 초기화 로직
    useEffect(() => {
        if (!elementRef.current || !imageIds?.length) return;
        
        let removeHandler = null;
        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                // ... (이전과 동일한 Cornerstone 초기화 로직)
                await initCornerstone();
                let renderingEngine = getRenderingEngine(renderingEngineId);
                if (renderingEngine) try { renderingEngine.destroy(); } catch(e) {}
                renderingEngine = new RenderingEngine(renderingEngineId);
                renderingEngine.enableElement({ viewportId, element: elementRef.current, type: csCoreEnums.ViewportType.STACK });
                let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
                if (toolGroup) ToolGroupManager.destroyToolGroup(toolGroupId);
                toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
                toolGroup.addTool('WindowLevel'); toolGroup.addTool('Pan'); toolGroup.addTool('Zoom'); toolGroup.addTool('StackScroll');
                toolGroup.setToolActive('WindowLevel', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }] });
                toolGroup.setToolActive('Pan', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Auxiliary }] });
                toolGroup.setToolActive('Zoom', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Secondary }] });
                toolGroup.setToolActive('StackScroll', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Wheel }] });
                toolGroup.addViewport(viewportId, renderingEngineId);
                const viewport = renderingEngine.getViewport(viewportId);
                viewportRef.current = viewport;
                await viewport.setStack(imageIds, 0); // 초기 인덱스는 0으로 시작
                viewport.resetCamera();
                if (imageType?.toUpperCase() === 'SEG') viewport.setProperties({ invert: true });
                viewport.render();
                
                // ✨ 5. 상황에 맞는 setTotalSlices 함수를 호출합니다.
                if (imageIds.length > 1) {
                  setTotalSlices(imageIds.length);
                }

                // 마우스 휠 이벤트 핸들러
                const handler = (e) => {
                    const newIndex = e.detail.newImageIdIndex;
                    const newIndexAsNumber = Number(newIndex);
                    if (!isNaN(newIndexAsNumber)) {
                        onSliceChange(newIndexAsNumber + 1);
                    }
                };
                
                elementRef.current.addEventListener(csCoreEnums.Events.STACK_NEW_IMAGE, handler);
                removeHandler = () => elementRef.current?.removeEventListener(csCoreEnums.Events.STACK_NEW_IMAGE, handler);

            } catch (e) {
                console.error("DicomViewer Error:", e);
                setError('뷰어를 불러오는 중 오류가 발생했습니다.');
            } finally {
                setIsLoading(false);
            }
        })();

        return () => {
            if (removeHandler) removeHandler();
            const re = getRenderingEngine(renderingEngineId);
            if (re) try { re.destroy(); } catch(e) {}
            ToolGroupManager.destroyToolGroup(toolGroupId);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageIds, seriesInstanceUID]);

    // 슬라이더 조작 핸들러
    const handleSliderChange = (e) => {
        onSliceChange(Number(e.target.value));
    };

    // ... (이전과 동일한 JSX return)
    const loadingStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 10 };
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: 'black' }}>
            <div ref={elementRef} style={{ width: '100%', height: '100%' }} />
            {isLoading && <div style={loadingStyle}>이미지 로딩 중...</div>}
            {error && <div style={loadingStyle}>{error}</div>}
            <input type="range" min={1} max={totalSlices} value={currentSlice} onChange={handleSliderChange} style={{ position: 'absolute', bottom: 12, left: '5%', width: '90%', zIndex: 10 }} />
            <div style={{ position: 'absolute', top: 10, right: 10, color: 'white', background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '2px 10px', zIndex: 10, fontSize: 16 }}>
                {currentSlice} / {totalSlices}
            </div>
        </div>
    );
}