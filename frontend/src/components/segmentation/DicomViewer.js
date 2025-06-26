// import React, { useEffect, useRef, useState } from 'react';
// import { RenderingEngine, Enums, getRenderingEngine } from '@cornerstonejs/core';
// import {
//   ToolGroupManager,
//   StackScrollTool,
//   PanTool,
//   ZoomTool,
//   Enums as csToolsEnums,
// } from '@cornerstonejs/tools';
// import { init as cornerstoneCoreInit } from '@cornerstonejs/core';
// import { init as cornerstoneToolsInit } from '@cornerstonejs/tools';
// import * as cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
// import dicomParser from 'dicom-parser';

// // Cornerstone.js가 한번만 초기화되도록 전역 플래그를 사용합니다.
// let isCornerstoneInitialized = false;

// async function initCornerstone() {
//   if (isCornerstoneInitialized) {
//     return;
//   }
  
//   // [수정] import된 모듈의 'default' 속성에 실제 로더 객체가 있습니다.
//   const cornerstoneWADOImageLoader = cornerstoneDICOMImageLoader.default;
  
//   if (!cornerstoneWADOImageLoader || !cornerstoneWADOImageLoader.webWorkerManager) {
//       console.error("WADOImageLoader or its webWorkerManager is not available. Check the package import and structure.");
//       throw new Error("DICOM Image Loader failed to initialize.");
//   }

//   const { webWorkerManager, configure, external } = cornerstoneWADOImageLoader;

//   webWorkerManager.initialize({
//     maxWebWorkers: navigator.hardwareConcurrency || 1,
//     startWebWorkersOnDemand: true,
//     taskConfiguration: {
//         'decodeTask': {
//             initializeCodecsOnStartup: false,
//             usePDFJS: false,
//             strict: false,
//         },
//     },
//   });

//   // dicomParser를 외부 의존성으로 설정합니다.
//   external.dicomParser = dicomParser;
  
//   configure({
//     useWebWorkers: true,
//     decodeConfig: { convertFloatPixelDataToInt: false },
//   });
  
//   await cornerstoneCoreInit();
//   await cornerstoneToolsInit();
  
//   isCornerstoneInitialized = true;
//   console.log('Cornerstone.js Initialized correctly.');
// }


// const DicomViewer = ({ imageIds, seriesInstanceUID }) => {
//     const elementRef = useRef(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState(null);

//     const renderingEngineId = `engine-${seriesInstanceUID}`;
//     const viewportId = `viewport-${seriesInstanceUID}`;
//     const toolGroupId = `toolgroup-${seriesInstanceUID}`;

//     useEffect(() => {
//         const element = elementRef.current;
        
//         const setupViewer = async () => {
//             if (!element || !imageIds || imageIds.length === 0) {
//                 setIsLoading(false);
//                 return;
//             }

//             try {
//                 setIsLoading(true);
//                 setError(null);
                
//                 await initCornerstone();

//                 const prevRenderingEngine = getRenderingEngine(renderingEngineId);
//                 if (prevRenderingEngine) {
//                     prevRenderingEngine.destroy();
//                 }

//                 const renderingEngine = new RenderingEngine(renderingEngineId);
                
//                 const viewportInput = {
//                     viewportId,
//                     element,
//                     type: Enums.ViewportType.STACK,
//                 };
//                 renderingEngine.enableElement(viewportInput);
                
//                 ToolGroupManager.destroyToolGroup(toolGroupId); 
//                 const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
                
//                 if (toolGroup) {
//                     toolGroup.addTool(StackScrollTool.toolName);
//                     toolGroup.addTool(PanTool.toolName);
//                     toolGroup.addTool(ZoomTool.toolName);
//                     toolGroup.addViewport(viewportId, renderingEngineId);
//                     toolGroup.setToolActive(StackScrollTool.toolName, {});
//                     toolGroup.setToolActive(PanTool.toolName, { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Auxiliary }] });
//                     toolGroup.setToolActive(ZoomTool.toolName, { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Secondary }] });
//                 }

//                 const viewport = renderingEngine.getViewport(viewportId);
                
//                 // [수정] imageIds를 직접 사용합니다. 백엔드에서 이미 'wadouri:'를 붙여서 보내줍니다.
//                 await viewport.setStack(imageIds);
                
//                 viewport.render();
//                 console.log('DICOM 스택 렌더링 완료');

//             } catch (err) {
//                 console.error('Cornerstone 뷰어 설정 중 오류 발생:', err);
//                 setError('뷰어를 로드하는 중 오류가 발생했습니다.');
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         setupViewer();

//         return () => {
//             const re = getRenderingEngine(renderingEngineId);
//             if (re) {
//                 re.destroy();
//             }
//             ToolGroupManager.destroyToolGroup(toolGroupId);
//         };
//     }, [imageIds, seriesInstanceUID, renderingEngineId, toolGroupId, viewportId]);

//     return (
//         <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: 'black' }}>
//             <div ref={elementRef} style={{ width: '100%', height: '100%' }}></div>
//             {isLoading && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>이미지 로딩 중...</div>}
//             {error && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'red' }}>{error}</div>}
//         </div>
//     );
// };

// export default DicomViewer;


import React, { useEffect, useRef, useState } from 'react';
import * as csCore from '@cornerstonejs/core';
import { RenderingEngine, Enums, getRenderingEngine, init as cornerstoneCoreInit } from '@cornerstonejs/core';
// @cornerstonejs/tools를 네임스페이스로 import하여 안정적으로 접근합니다.
import * as csTools from '@cornerstonejs/tools';
// csTools에서 필요한 함수와 툴들 가져오기
const {
  init: cornerstoneToolsInit,
  ToolGroupManager,
  Enums: csToolsEnums,
  registerTool,
  StackScrollTool,
  PanTool,
  ZoomTool,
} = csTools;

// DICOM Image Loader 초기화 함수 import
import { init as initDICOMImageLoader } from '@cornerstonejs/dicom-image-loader';

let isCornerstoneInitialized = false;

async function initCornerstone() {
  if (isCornerstoneInitialized) return;

  // DICOM Image Loader 초기화
  await initDICOMImageLoader({
    maxWebWorkers: navigator.hardwareConcurrency || 1,
    taskConfiguration: {
      decodeTask: { initializeCodecsOnStartup: false, usePDFJS: false, strict: false },
    },
  });

  // Cornerstone core 및 tools 초기화
  await cornerstoneCoreInit();
  cornerstoneToolsInit();

  isCornerstoneInitialized = true;
  console.log('Cornerstone & DICOM Image Loader initialized');
}

const DicomViewer = ({ imageIds, seriesInstanceUID }) => {
  const elementRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const renderingEngineId = `engine-${seriesInstanceUID}`;
  const viewportId = `viewport-${seriesInstanceUID}`;
  const toolGroupId = `toolgroup-${seriesInstanceUID}`;

  useEffect(() => {
    const element = elementRef.current;

    const setupViewer = async () => {
      if (!element || !imageIds?.length) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);

        // 초기화
        await initCornerstone();

        // 기존 엔진 제거
        const prevEngine = getRenderingEngine(renderingEngineId);
        if (prevEngine) prevEngine.destroy();

        // 렌더링 엔진 생성 및 엘리먼트 활성화
        const renderingEngine = new RenderingEngine(renderingEngineId);
        renderingEngine.enableElement({ viewportId, element, type: Enums.ViewportType.STACK });

        // 도구 그룹 초기화
        ToolGroupManager.destroyToolGroup(toolGroupId);
        // 도구를 글로벌에 등록 (v1.x API)
        csTools.addTool(csTools.StackScrollMouseWheelTool);
        csTools.addTool(csTools.PanTool);
        csTools.addTool(csTools.ZoomTool);

        const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
        if (toolGroup) {
          // 툴 그룹에 툴 추가
          toolGroup.addTool(StackScrollTool.toolName);
          toolGroup.addTool(PanTool.toolName);
          toolGroup.addTool(ZoomTool.toolName);

          // 뷰포트 연결 및 툴 활성화
          toolGroup.addViewport(viewportId, renderingEngineId);
          toolGroup.setToolActive(StackScrollTool.toolName, {
            bindings: [{ mouseButton: csToolsEnums.MouseBindings.Wheel }],
          });
          toolGroup.setToolActive(PanTool.toolName, {
            bindings: [{ mouseButton: csToolsEnums.MouseBindings.Auxiliary }],
          });
          toolGroup.setToolActive(ZoomTool.toolName, {
            bindings: [{ mouseButton: csToolsEnums.MouseBindings.Secondary }],
          });
        }

        // 스택 데이터 설정 및 렌더링
        const viewport = renderingEngine.getViewport(viewportId);
        await viewport.setStack(imageIds);
        viewport.render();
        console.log('DICOM stack rendered');
      } catch (err) {
        console.error('Viewer setup error:', err);
        setError('Error loading viewer');
      } finally {
        setIsLoading(false);
      }
    };

    setupViewer();
    return () => {
      const re = getRenderingEngine(renderingEngineId);
      if (re) re.destroy();
      ToolGroupManager.destroyToolGroup(toolGroupId);
    };
  }, [imageIds, seriesInstanceUID]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: 'black' }}>
      <div ref={elementRef} style={{ width: '100%', height: '100%' }} />
      {isLoading && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
          이미지 로딩 중...
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'red' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default DicomViewer;
