// // /home/shared/medical_cdss/frontend/src/components/segmentation/OverlayDicomViewer.js
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   RenderingEngine,
//   Enums as csCoreEnums,
// } from '@cornerstonejs/core';
// import {
//   ToolGroupManager,
//   Enums as csToolsEnums,
//   segmentation,
// } from '@cornerstonejs/tools';

// import initCornerstone from '../../utils/cornerstone-init';
// import dcmjs from 'dcmjs';

// console.log('[[GLOBAL]] dcmjs:', dcmjs);
// console.log('[[GLOBAL]] dcmjs.adapters:', dcmjs.adapters);

// const Segmentation = dcmjs.derivations?.Segmentation;

// console.log('[[GLOBAL]] Segmentation:', Segmentation);

// const LoadingSpinner = () => (
//   <div style={{
//     position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
//     display: 'flex', alignItems: 'center', justifyContent: 'center',
//     backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', zIndex: 10,
//   }}>
//     Loading...
//   </div>
// );


// export default function OverlayDicomViewer({ baseIds, maskIds, seriesId }) {
//   const elementRef = useRef(null);
//   const [error, setError] = useState(null);
//   // --- ▼▼▼ 1. 로딩 상태 추가 ▼▼▼ ---
//   const [isLoading, setIsLoading] = useState(true);

//   const renderingEngineId = `engine-overlay-${seriesId}`;
//   const viewportId = `viewport-overlay-${seriesId}`;
//   const toolGroupId = `toolgroup-overlay-${seriesId}`;
//   const segmentationId = `seg-${seriesId}`;
//   console.log('[[COMPONENT FUNC]] dcmjs:', dcmjs);
//   console.log('[[COMPONENT FUNC]] dcmjs.adapters:', dcmjs.adapters);
//   useEffect(() => {
//     console.log('[[useEffect 진입]] dcmjs:', dcmjs);
//     let isEffectActive = true;
//     let renderingEngine;
//     let toolGroup;
    
//     // --- ▼▼▼ 2. 로딩 상태 제어 ▼▼▼ ---
//     setIsLoading(true);
//     setError(null);

//     if (!elementRef.current || !Array.isArray(baseIds) || !Array.isArray(maskIds) || !baseIds.length || !maskIds.length) {
//       setError('표시할 이미지 데이터가 올바르지 않습니다.');
//       setIsLoading(false);
//       return;
//     }

//     const setup = async () => {
//       console.log('[[setup함수 진입]] dcmjs:', dcmjs);
//       console.log('[[setup함수 진입]] dcmjs.adapters:', dcmjs.adapters);
//       try {
//         await initCornerstone();
//         renderingEngine = new RenderingEngine(renderingEngineId);

//         renderingEngine.enableElement({
//           viewportId,
//           element: elementRef.current,
//           type: csCoreEnums.ViewportType.STACK,
//         });

//         toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
//         if (!toolGroup) return;
        
//         toolGroup.addTool('WindowLevel');
//         toolGroup.addTool('Pan');
//         toolGroup.addTool('Zoom');
//         toolGroup.addTool('StackScroll');
//         toolGroup.addTool('SegmentationDisplay');

//         toolGroup.setToolActive('WindowLevel', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }] });
//         toolGroup.setToolActive('Pan', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Auxiliary }] });
//         toolGroup.setToolActive('Zoom', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Secondary }] });
//         toolGroup.setToolActive('StackScroll', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Wheel }] });
//         toolGroup.addViewport(viewportId, renderingEngineId);

//         const viewport = renderingEngine.getViewport(viewportId);
//         await viewport.setStack(baseIds);

//         console.log("maskIds", maskIds);
//         const segUrl = maskIds[0].replace('wadouri:', '');
//         const res = await fetch(segUrl);
//         console.log("Fetched SEG DICOM: ", res.status, segUrl);
//         const buffer = await res.arrayBuffer();
//         console.log("typeof buffer:", typeof buffer);
//         console.log("buffer instanceof ArrayBuffer:", buffer instanceof ArrayBuffer);
//         console.log("buffer.constructor.name:", buffer.constructor.name);
//         console.log("buffer:", buffer);

//         try {
//           const view = new DataView(buffer);
//           console.log("DataView 생성 성공");
//         } catch (e) {
//           console.error("DataView 생성 실패:", e);
//         }

//         // 혹시 buffer가 Uint8Array나 뭔가 래핑된 객체라면
//         if (!(buffer instanceof ArrayBuffer) && buffer.buffer instanceof ArrayBuffer) {
//           console.warn('buffer is NOT ArrayBuffer, but buffer.buffer is:', buffer.buffer);
//         }


//         const dicomData = dcmjs.data.DicomMessage.readFile(buffer);
//         console.log("typeof dicomData:", typeof dicomData, dicomData);
//         const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);
//         console.log("typeof dataset:", typeof dataset, dataset);
        
//         console.log("Array.isArray(baseIds):", Array.isArray(baseIds), baseIds);

//         let labelmap3D;
//         try {
//           const csAdapter = dcmjs.adapters.Cornerstone;
//           if (!csAdapter) throw new Error("dcmjs.adapters.Cornerstone이 없습니다.");
//           if (!csAdapter.Segmentation) throw new Error("dcmjs.adapters.Cornerstone.Segmentation이 없습니다.");
//           if (!csAdapter.Segmentation.generateToolState) throw new Error("generateToolState 함수가 없습니다.");

//           // 반드시 dataset을 첫번째 인자로!
//           const segResult = csAdapter.Segmentation.generateToolState(buffer, baseIds);

//           console.log("generateToolState result:", segResult);
//           if (!segResult.labelmaps3D || !segResult.labelmaps3D.length)
//             throw new Error("labelmaps3D 없음");
//           labelmap3D = segResult.labelmaps3D[0];
//           if (!labelmap3D) throw new Error("labelmap3D 생성 실패");
//           console.log("labelmap3D:", labelmap3D);
//         } catch (err) {
//           console.error("generateToolState() 에러:", err);
//           setError("generateToolState() 에러: " + (err?.stack ?? err?.message ?? err));
//           setIsLoading(false);
//           return;
//         }

//         if (!isEffectActive) return;

//         await segmentation.addSegmentations([{
//           segmentationId,
//           representation: {
//             type: csToolsEnums.SegmentationRepresentations.Labelmap,
//             data: { labelmap3D },
//           },
//         }]);
//         if (!isEffectActive) return;

//         await segmentation.addSegmentationRepresentations(toolGroupId, [{
//           segmentationId,
//           representationType: csToolsEnums.SegmentationRepresentations.Labelmap,
//         }]);
//         if (!isEffectActive) return;
        
//         viewport.resetCamera();
//         renderingEngine.renderViewports([viewportId]);
        
//         // 모든 작업이 끝난 후 로딩 상태 해제
//         if (isEffectActive) {
//             setIsLoading(false);
//         }

//       } catch (e) {
//         if (isEffectActive) {
//           console.error('OverlayDicomViewer setup error:', e);
//           setError("오버레이 뷰어 오류: " + (e?.message ?? e));
//           setIsLoading(false);
//         }
//       }
//     };

//     setup();

//     return () => {
//       isEffectActive = false;
//       try {
//         if (toolGroup) ToolGroupManager.destroyToolGroup(toolGroupId);
//         if (renderingEngine) renderingEngine.destroy();
//         // 등록되어 있든 아니든 에러 안 나게
//         segmentation.removeAllSegmentationRepresentations(toolGroupId);
//       } catch (e) {
//         console.error('Cleanup error:', e);
//       }
//     };
//   }, [baseIds, maskIds, seriesId]);

//   return (
//     <div style={{ position: 'relative', width: '100%', height: '100%' }}>
//       {/* --- ▼▼▼ 3. UI에 로딩 상태 반영 ▼▼▼ --- */}
//       {isLoading && <LoadingSpinner />}
//       {error && (
//         <div style={{
//           position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           backgroundColor: 'rgba(0,0,0,0.7)', color: 'red', zIndex: 10,
//           padding: '10px', boxSizing: 'border-box', textAlign: 'center',
//         }}>
//           {error}
//         </div>
//       )}
//        {/* 로딩 중일 때 마우스 이벤트를 막기 위해 포인터 이벤트를 none으로 설정 */}
//       <div ref={elementRef} style={{ width: '100%', height: '100%', pointerEvents: isLoading ? 'none' : 'auto' }} />
//     </div>
//   );
// }


import React, { useEffect, useRef, useState } from 'react';
import {
  RenderingEngine,
  Enums as csCoreEnums,
} from '@cornerstonejs/core';
import {
  ToolGroupManager,
  Enums as csToolsEnums,
  segmentation,
} from '@cornerstonejs/tools';

import initCornerstone from '../../utils/cornerstone-init';

const LoadingSpinner = () => (
  <div style={{
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', zIndex: 10,
  }}>
    Loading...
  </div>
);

export default function OverlayDicomViewer({ baseIds, maskIds, seriesId }) {
  const elementRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const renderingEngineId = `engine-overlay-${seriesId}`;
  const viewportId = `viewport-overlay-${seriesId}`;
  const toolGroupId = `toolgroup-overlay-${seriesId}`;
  const segmentationId = `seg-${seriesId}`;

  useEffect(() => {
    let isEffectActive = true;
    let renderingEngine;
    let toolGroup;

    setIsLoading(true);
    setError(null);

    if (
      !elementRef.current ||
      !Array.isArray(baseIds) ||
      !baseIds.length ||
      !Array.isArray(maskIds) ||
      !maskIds.length
    ) {
      setError('표시할 이미지 데이터가 올바르지 않습니다.');
      setIsLoading(false);
      return;
    }

    const setup = async () => {
      try {
        await initCornerstone();
        renderingEngine = new RenderingEngine(renderingEngineId);

        renderingEngine.enableElement({
          viewportId,
          element: elementRef.current,
          type: csCoreEnums.ViewportType.STACK,
        });

        toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
        if (!toolGroup) return;

        toolGroup.addTool('WindowLevel');
        toolGroup.addTool('Pan');
        toolGroup.addTool('Zoom');
        toolGroup.addTool('StackScroll');
        toolGroup.addTool('SegmentationDisplay');

        toolGroup.setToolActive('WindowLevel', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }] });
        toolGroup.setToolActive('Pan', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Auxiliary }] });
        toolGroup.setToolActive('Zoom', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Secondary }] });
        toolGroup.setToolActive('StackScroll', { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Wheel }] });
        toolGroup.addViewport(viewportId, renderingEngineId);

        const viewport = renderingEngine.getViewport(viewportId);
        await viewport.setStack(baseIds);

        // ★★★ 핵심: maskIds를 직접 사용 (dcmjs 등 필요 없음) ★★★
        await segmentation.addSegmentations([
          {
            segmentationId,
            representation: {
              type: csToolsEnums.SegmentationRepresentations.Labelmap,
              data: { imageIds: maskIds },
            },
          },
        ]);
        if (!isEffectActive) return;

        await segmentation.addSegmentationRepresentations(toolGroupId, [
          {
            segmentationId,
            representationType: csToolsEnums.SegmentationRepresentations.Labelmap,
          },
        ]);
        if (!isEffectActive) return;

        viewport.resetCamera();
        renderingEngine.renderViewports([viewportId]);

        if (isEffectActive) setIsLoading(false);
      } catch (e) {
        if (isEffectActive) {
          console.error('OverlayDicomViewer setup error:', e);
          setError('오버레이 뷰어 오류: ' + (e?.message ?? e));
          setIsLoading(false);
        }
      }
    };

    setup();

    return () => {
      isEffectActive = false;
      try {
        if (toolGroup) ToolGroupManager.destroyToolGroup(toolGroupId);
        if (renderingEngine) renderingEngine.destroy();
        segmentation.removeAllSegmentationRepresentations(toolGroupId);
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    };
  }, [baseIds, maskIds, seriesId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {isLoading && <LoadingSpinner />}
      {error && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)', color: 'red', zIndex: 10,
          padding: '10px', boxSizing: 'border-box', textAlign: 'center',
        }}>
          {error}
        </div>
      )}
      <div ref={elementRef} style={{ width: '100%', height: '100%', pointerEvents: isLoading ? 'none' : 'auto' }} />
    </div>
  );
}
