import os
import tempfile
import uuid
import numpy as np
import nibabel as nib
import highdicom as hd
from datetime import datetime
import logging
import requests
import pydicom

from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.sequence import Sequence
from pydicom.uid import generate_uid
from django.conf import settings
from highdicom.sr.coding import Code
from highdicom.seg.content import AlgorithmIdentificationSequence
# from highdicom.seg.content import SourceImageForSegmentation


logger = logging.getLogger(__name__)


ref_dicom_path = '/home/shared/medical_cdss/backend/pacs/a374402b-874d1007-1566e6fa-388eda0f-8945e79a.dcm'
ref_dicom = pydicom.dcmread(ref_dicom_path)
if not hasattr(ref_dicom, "PatientBirthDate"): ref_dicom.PatientBirthDate = "19000101" 
if not hasattr(ref_dicom, "PatientSex"): ref_dicom.PatientSex = "O"
if not hasattr(ref_dicom, "PatientID"): ref_dicom.PatientID = "DUMMYID"
if not hasattr(ref_dicom, "PatientName"): ref_dicom.PatientName = "Anonymous"
if not hasattr(ref_dicom, "AccessionNumber"): ref_dicom.AccessionNumber = "00000000"
if not hasattr(ref_dicom, "StudyID"): ref_dicom.StudyID = "1"
if not hasattr(ref_dicom, 'FrameOfReferenceUID'): ref_dicom.FrameOfReferenceUID = generate_uid()


import os
import tempfile
import uuid
import numpy as np
import nibabel as nib
import highdicom as hd
from datetime import datetime
import logging
import requests
import pydicom

from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.sequence import Sequence
from pydicom.uid import generate_uid
from django.conf import settings
from highdicom.sr.coding import Code
from highdicom.seg.content import AlgorithmIdentificationSequence

logger = logging.getLogger(__name__)


def create_enhanced_dicom_from_nifti(nifti_path: str, template_dicom_path: str, patient, study_uid: str) -> pydicom.Dataset:
    """
    NIfTI 파일, 클래식 DICOM 템플릿, patient/study 정보로 '가짜' 인핸스드 DICOM을 생성합니다.
    """
    # 1단계, 2단계는 이전과 동일
    nifti_img = nib.load(nifti_path)
    template_ds = pydicom.dcmread(template_dicom_path)
    pixel_data_for_shape = np.transpose(nifti_img.get_fdata(), (2, 1, 0))
    num_frames = pixel_data_for_shape.shape[0]
    affine = nifti_img.affine
    pixel_spacing = [np.linalg.norm(affine[:3, 1]), np.linalg.norm(affine[:3, 0])]
    slice_thickness = np.linalg.norm(affine[:3, 2])
    row_vec = affine[:3, 1] / pixel_spacing[0]
    col_vec = affine[:3, 0] / pixel_spacing[1]
    image_orientation_patient = [round(v, 8) for v in np.concatenate((row_vec, col_vec))]

    # --- 3단계: Functional Group Sequences 생성 (수정된 부분) ---
    
    # 3-1. 모든 프레임에 공통적인 정보 (Shared)
    shared_fg_sequence = Sequence()
    shared_ds = Dataset()

    # Pixel Measures (픽셀 간격, 슬라이스 두께)
    pixel_measures_sequence = Sequence([Dataset()])
    pixel_measures_sequence[0].PixelSpacing = pixel_spacing
    pixel_measures_sequence[0].SliceThickness = slice_thickness
    shared_ds.PixelMeasuresSequence = pixel_measures_sequence

    # --- ▼▼▼ PlaneOrientationSequence를 여기(공통정보)로 이동 ▼▼▼ ---
    # Plane Orientation (이미지 방향)
    plane_orientation_sequence = Sequence([Dataset()])
    plane_orientation_sequence[0].ImageOrientationPatient = image_orientation_patient
    shared_ds.PlaneOrientationSequence = plane_orientation_sequence
    # --- ▲▲▲ 여기까지 이동 ▲▲▲ ---

    shared_fg_sequence.append(shared_ds)

    # 3-2. 각 프레임별로 다른 정보 (Per-Frame)
    per_frame_fg_sequence = Sequence()
    for i in range(num_frames):
        position = affine[:3, 3] + affine[:3, 2] * i
        frame_ds = Dataset()
        
        # Plane Position (각 슬라이스 위치)
        plane_pos_sequence = Sequence([Dataset()])
        plane_pos_sequence[0].ImagePositionPatient = [round(p, 8) for p in position]
        frame_ds.PlanePositionSequence = plane_pos_sequence
        
        # --- ▼▼▼ 여기서 PlaneOrientationSequence 생성 코드 삭제 ▼▼▼ ---
        per_frame_fg_sequence.append(frame_ds)

    # --- 4단계: 템플릿 DICOM에 모든 정보 주입 (이전과 동일) ---
    ds = template_ds.copy()
    
    # 필수 태그 채워 넣기
    ds.PatientID = getattr(patient, 'identifier', 'DUMMY_ID')
    ds.PatientName = getattr(patient, 'display_name', 'Anonymous').replace(" ", "^")
    birth_date_obj = getattr(patient, 'birth_date', None)
    ds.PatientBirthDate = birth_date_obj.strftime('%Y%m%d') if birth_date_obj else "19000101"
    ds.PatientSex = getattr(patient, 'sex', 'O')
    ds.AccessionNumber = getattr(template_ds, 'AccessionNumber', '00000000')
    ds.StudyID = getattr(template_ds, 'StudyID', '1')
    ds.StudyInstanceUID = study_uid
    if 'FrameOfReferenceUID' not in ds:
        ds.FrameOfReferenceUID = generate_uid()

    # 인핸스드 멀티프레임 속성 설정
    ds.SOPClassUID = '1.2.840.10008.5.1.4.1.1.4.1'
    ds.SOPInstanceUID = generate_uid()
    ds.NumberOfFrames = num_frames
    
    if 'PixelData' in ds:
        del ds.PixelData

    # 생성한 시퀀스 주입
    ds.SharedFunctionalGroupsSequence = shared_fg_sequence
    ds.PerFrameFunctionalGroupsSequence = per_frame_fg_sequence

    for tag_name in ['ImagePositionPatient', 'ImageOrientationPatient', 'PixelSpacing', 'SliceThickness']:
        if tag_name in ds:
            delattr(ds, tag_name)

    ds.file_meta = FileMetaDataset()
    ds.file_meta.TransferSyntaxUID = pydicom.uid.ImplicitVRLittleEndian
    ds.is_little_endian = True
    ds.is_implicit_VR = True

    return ds


class SegDicomConverterMixin:
    def convert_nifti_to_dicom_seg(self, gcs_path, patient, study_uid, request, referenced_series_uid=None):
        logger.info(f"SEG DICOM 변환 시작: {gcs_path}")
        safe_temp_dir = os.path.join(settings.BASE_DIR, 'temp_files')
        os.makedirs(safe_temp_dir, exist_ok=True)
        temp_nifti_path = os.path.join(safe_temp_dir, f"{uuid.uuid4()}.nii.gz")
        temp_seg_path = os.path.join(safe_temp_dir, f"{uuid.uuid4()}_seg.dcm")

        try:
            from google.cloud import storage
            storage_client = storage.Client()
            bucket_name, blob_name = gcs_path.replace("gs://", "").split("/", 1)
            bucket = storage_client.bucket(bucket_name)
            bucket.blob(blob_name).download_to_filename(temp_nifti_path)

            template_dicom_path = '/home/shared/medical_cdss/backend/pacs/a374402b-874d1007-1566e6fa-388eda0f-8945e79a.dcm'

            fake_enhanced_dicom = create_enhanced_dicom_from_nifti(
                nifti_path=temp_nifti_path,
                template_dicom_path=template_dicom_path,
                patient=patient,
                study_uid=study_uid
            )

            nifti_img = nib.load(temp_nifti_path)
            mask_data = (nifti_img.get_fdata(dtype=np.float32) > 0.5).astype(np.uint8)
            pixel_array = np.transpose(mask_data, (2, 0, 1))
            
            if referenced_series_uid is None:
                referenced_series_uid = hd.UID()

            seg = hd.seg.Segmentation(
                source_images=[fake_enhanced_dicom],
                pixel_array=pixel_array,
                segmentation_type=hd.seg.SegmentationTypeValues.BINARY,
                segment_descriptions=[
                    hd.seg.SegmentDescription(
                        segment_number=1,
                        segment_label="Lesion",
                        segmented_property_category=Code('T-D0050', 'SRT', 'Tissue'),
                        segmented_property_type=Code('M-01010', 'SRT', 'Lesion'),
                        algorithm_type=hd.seg.SegmentAlgorithmTypeValues.AUTOMATIC,
                        algorithm_identification=AlgorithmIdentificationSequence(
                            name='nnUNet',
                            version='1.0',
                            family=Code("111023", "DCM", "Deep Learning")
                        )
                    )
                ],
                series_instance_uid=referenced_series_uid,
                sop_instance_uid=hd.UID(),
                series_number=999,
                instance_number=1,
                manufacturer="Your-Company-Name",
                manufacturer_model_name='NIfTI-to-DICOM-SEG-Converter',
                software_versions='1.0.0',
                device_serial_number='NotApplicable',
            )

            seg.save_as(temp_seg_path)
            logger.info(f"DICOM SEG 저장 완료: {temp_seg_path}")

            with open(temp_seg_path, "rb") as f:
                resp = requests.post(
                    f"{settings.ORTHANC_URL}/instances",
                    data=f.read(),
                    auth=(settings.ORTHANC_USERNAME, settings.ORTHANC_PASSWORD),
                    headers={'Content-Type': 'application/dicom'}
                )
                resp.raise_for_status()
                instance_id = resp.json().get("ID")

            image_ids = [f"wadouri:{request.build_absolute_uri(f'/api/pacs/dicom-instance-data/{instance_id}/')}"]
            return {"seriesInstanceUID": referenced_series_uid, "imageIds": image_ids}

        except Exception as e:
            logger.error(f"DICOM SEG 변환 실패: {e}", exc_info=True)
            return None
        finally:
            try:
                if os.path.exists(temp_nifti_path):
                    os.remove(temp_nifti_path)
                if os.path.exists(temp_seg_path):
                    os.remove(temp_seg_path)
            except Exception:
                pass