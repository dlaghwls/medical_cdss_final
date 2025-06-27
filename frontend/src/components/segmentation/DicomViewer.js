// import React, { useEffect, useRef, useState } from 'react';
// import {
//   init as cornerstoneCoreInit,
//   RenderingEngine,
//   Enums as csCoreEnums,
//   getRenderingEngine,
//   metaData,
// } from '@cornerstonejs/core';
// import {
//   init as cornerstoneToolsInit,
//   addTool,
//   ToolGroupManager,
//   StackScrollTool,
//   PanTool,
//   ZoomTool,
//   WindowLevelTool,
//   Enums as csToolsEnums,
// } from '@cornerstonejs/tools';
// // v3 DICOM loader
// import WADOImageLoader from '@cornerstonejs/dicom-image-loader';

// let isCornerstoneInitialized = false;

// async function initCornerstone() {
//   if (isCornerstoneInitialized) return;

//   await cornerstoneCoreInit();
//   cornerstoneToolsInit();
//   await WADOImageLoader.init({
//     maxWebWorkers: navigator.hardwareConcurrency || 1,
//   });
//   addTool(StackScrollTool);
//   addTool(PanTool);
//   addTool(ZoomTool);
//   addTool(WindowLevelTool);

//   isCornerstoneInitialized = true;
// }

// export default function DicomViewer({ imageIds, seriesInstanceUID }) {
//   const elementRef = useRef(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const renderingEngineId = `engine-${seriesInstanceUID}`;
//   const viewportId = `viewport-${seriesInstanceUID}`;
//   const toolGroupId = `toolgroup-${seriesInstanceUID}`;

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       const re = getRenderingEngine(renderingEngineId);
//       if (re) re.destroy();
//       ToolGroupManager.destroyToolGroup(toolGroupId);
//     };
//   }, []);

//   // Setup viewer when imageIds or seriesInstanceUID change
//   useEffect(() => {
//     async function setupViewer() {
//       if (!elementRef.current || !imageIds?.length) {
//         setIsLoading(false);
//         return;
//       }

//       try {
//         setIsLoading(true);
//         setError(null);

//         await initCornerstone();

//         // Destroy previous engine & tool group
//         const prev = getRenderingEngine(renderingEngineId);
//         if (prev) {
//           prev.destroy();
//           ToolGroupManager.destroyToolGroup(toolGroupId);
//         }

//         // Create engine & enable element
//         const renderingEngine = new RenderingEngine(renderingEngineId);
//         renderingEngine.enableElement({
//           viewportId,
//           element: elementRef.current,
//           type: csCoreEnums.ViewportType.STACK,
//         });

//         const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
//         toolGroup.addViewport(viewportId, renderingEngineId);

//         toolGroup.addTool(StackScrollTool.toolName);
//         toolGroup.setToolActive(StackScrollTool.toolName, {
//           bindings: [{ mouseButton: csToolsEnums.MouseBindings.Wheel }],
//         });
//         toolGroup.addTool(PanTool.toolName);
//         toolGroup.setToolActive(PanTool.toolName, {
//           bindings: [{ mouseButton: csToolsEnums.MouseBindings.Auxiliary }],
//         });
//         toolGroup.addTool(ZoomTool.toolName);
//         toolGroup.setToolActive(ZoomTool.toolName, {
//           bindings: [{ mouseButton: csToolsEnums.MouseBindings.Secondary }],
//         });
//         toolGroup.addTool(WindowLevelTool.toolName);
//         toolGroup.setToolActive(WindowLevelTool.toolName, {
//           bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }],
//         });

//         const viewport = renderingEngine.getViewport(viewportId);
//         await viewport.setStack(imageIds);

//         // Safe resize
//         try {
//           renderingEngine.resize();
//         } catch (e) {
//           console.warn('Skipping resize on destroyed engine:', e.message);
//         }

//         // Wait next frame for DOM to size
//         await new Promise(requestAnimationFrame);

//         // Calculate scale to fit full image
//         const { width: winW, height: winH } =
//           elementRef.current.getBoundingClientRect();
//         const firstImageId = imageIds[0];
//         const imgW = Number(metaData.get('columns', firstImageId, 0));
//         const imgH = Number(metaData.get('rows', firstImageId, 0));
//         if (winW > 0 && winH > 0 && imgW > 0 && imgH > 0) {
//           const scale = Math.min(winW / imgW, winH / imgH);
//           viewport.setProperties({ scale });
//         }

//         // Apply window/level
//         const wc = Number(metaData.get('windowCenter', firstImageId, 0));
//         const ww = Number(metaData.get('windowWidth', firstImageId, 0));
//         if (!isNaN(wc) && !isNaN(ww)) {
//           viewport.setProperties({ voi: { windowCenter: wc, windowWidth: ww } });
//         }

//         viewport.render();
//       } catch (e) {
//         console.error('Viewer setup error:', e);
//         setError('Error loading viewer');
//       } finally {
//         setIsLoading(false);
//       }
//     }

//     setupViewer();
//   }, [imageIds, seriesInstanceUID]);

//   const loadingStyle = {
//     position: 'absolute', top: 0, left: 0,
//     width: '100%', height: '100%',
//     display: 'flex', justifyContent: 'center', alignItems: 'center',
//     color: 'white',
//   };

//   return (
//     <div style={{ width: '100%', height: '100%', position: 'relative', background: 'black' }}>
//       <div ref={elementRef} style={{ width: '100%', height: '100%' }} />
//       {isLoading && <div style={loadingStyle}>이미지 로딩 중...</div>}
//       {error     && <div style={loadingStyle}>{error}</div>}
//     </div>
//   );
// }



import React, { useEffect, useRef, useState } from 'react';
import {
  init as cornerstoneCoreInit,
  RenderingEngine,
  Enums as csCoreEnums,
  getRenderingEngine,
} from '@cornerstonejs/core';
import {
  init as cornerstoneToolsInit,
  addTool,
  ToolGroupManager,
  StackScrollTool,
  PanTool,
  ZoomTool,
  WindowLevelTool,
  Enums as csToolsEnums,
} from '@cornerstonejs/tools';
// v3 DICOM loader
import WADOImageLoader from '@cornerstonejs/dicom-image-loader';

let isCornerstoneInitialized = false;

async function initCornerstone() {
  if (isCornerstoneInitialized) return;

  await cornerstoneCoreInit();
  cornerstoneToolsInit();
  await WADOImageLoader.init({
    maxWebWorkers: navigator.hardwareConcurrency || 1,
    // 로더가 메타데이터를 파싱하도록 설정 (중요)
    decodeConfig: {
      convertFloatPixelDataToInt: false,
    },
  });
  addTool(StackScrollTool);
  addTool(PanTool);
  addTool(ZoomTool);
  addTool(WindowLevelTool);

  isCornerstoneInitialized = true;
}

export default function DicomViewer({ imageIds, seriesInstanceUID }) {
  const elementRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const renderingEngineId = `engine-${seriesInstanceUID}`;
  const viewportId = `viewport-${seriesInstanceUID}`;
  const toolGroupId = `toolgroup-${seriesInstanceUID}`;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const re = getRenderingEngine(renderingEngineId);
      if (re) re.destroy();
      ToolGroupManager.destroyToolGroup(toolGroupId);
    };
  }, [renderingEngineId, toolGroupId]);

  // Setup viewer when imageIds or seriesInstanceUID change
  useEffect(() => {
    async function setupViewer() {
      if (!elementRef.current || !imageIds?.length) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        await initCornerstone();

        const prev = getRenderingEngine(renderingEngineId);
        if (prev) {
          prev.destroy();
          ToolGroupManager.destroyToolGroup(toolGroupId);
        }

        const renderingEngine = new RenderingEngine(renderingEngineId);
        renderingEngine.enableElement({
          viewportId,
          element: elementRef.current,
          type: csCoreEnums.ViewportType.STACK,
        });

        const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
        if (!toolGroup) {
          throw new Error('Failed to create tool group');
        }
        toolGroup.addViewport(viewportId, renderingEngineId);

        toolGroup.addTool(StackScrollTool.toolName);
        toolGroup.setToolActive(StackScrollTool.toolName, {
          bindings: [{ mouseButton: csToolsEnums.MouseBindings.Wheel }],
        });
        toolGroup.addTool(PanTool.toolName);
        toolGroup.setToolActive(PanTool.toolName, {
          bindings: [{ mouseButton: csToolsEnums.MouseBindings.Auxiliary }],
        });
        toolGroup.addTool(ZoomTool.toolName);
        toolGroup.setToolActive(ZoomTool.toolName, {
          bindings: [{ mouseButton: csToolsEnums.MouseBindings.Secondary }],
        });
        toolGroup.addTool(WindowLevelTool.toolName);
        toolGroup.setToolActive(WindowLevelTool.toolName, {
          bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }],
        });

        const viewport = renderingEngine.getViewport(viewportId);
        await viewport.setStack(imageIds);

        // ======================= [핵심 수정 부분] =======================
        // 수동으로 배율을 계산하는 대신, resetCamera()를 호출하여
        // 이미지의 확대/축소 및 위치를 뷰포트에 자동으로 맞춥니다.
        // 이 방법이 훨씬 간단하고 안정적입니다.
        viewport.resetCamera();
        // =============================================================

        // DICOM 파일에 저장된 Window/Level 값으로 뷰어의 밝기/대조를 설정합니다.
        // 이 부분은 그대로 두는 것이 좋습니다. resetCamera() 후에 실행해도 괜찮습니다.
        viewport.setProperties({ voiRange: { lower: 0, upper: 1 } });
        
        viewport.render();

      } catch (e) {
        console.error('Viewer setup error:', e);
        setError('Error loading viewer');
      } finally {
        setIsLoading(false);
      }
    }

    setupViewer();
  }, [imageIds, seriesInstanceUID, renderingEngineId, viewportId, toolGroupId]);

  const loadingStyle = {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)',
  };

  return (
    <div style={{ width: '100%', height: '500px', position: 'relative', background: 'black' }}>
      <div ref={elementRef} style={{ width: '100%', height: '100%' }} />
      {isLoading && <div style={loadingStyle}>이미지 로딩 중...</div>}
      {error     && <div style={loadingStyle}>{error}</div>}
    </div>
  );
}