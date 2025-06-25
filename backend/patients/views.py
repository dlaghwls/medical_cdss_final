from django.shortcuts import render
# Create your views here.
from rest_framework import viewsets
from .models import Doctor, NurseInitialAssessment  # Patient 제거
from .serializers import DoctorSerializer, NurseInitialAssessmentSerializer  # PatientSerializer 제거

# PatientViewSet 제거 - OpenMRS 통합으로 대체됨
# class PatientViewSet(viewsets.ModelViewSet):
#     queryset = Patient.objects.all()
#     serializer_class = PatientSerializer

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer

class NurseInitialAssessmentViewSet(viewsets.ModelViewSet):
    queryset = NurseInitialAssessment.objects.all()
    serializer_class = NurseInitialAssessmentSerializer
    


# 6월 16일 Flutter 관련
# @api_view(['GET'])
# def prediction_result_view(request, patient_id):
#     # 예: DB에서 Prediction 모델 가져와서 응답
#     return Response({'score': 0.87, 'risk_level': 'HIGH'})

# @api_view(['GET'])
# def segmentation_result_view(request, patient_id):
#     # 예: Segmentation 이미지 URL 반환
#     return Response({'image_url': f'/media/segmentations/{patient_id}.png'})

# @api_view(['GET', 'POST'])
# def comment_view(request, patient_id):
#     if request.method == 'GET':
#         return Response([
#             {'author': 'Dr. Kim', 'content': '중재 필요', 'created_at': '2025-06-16T10:00:00'},
#             {'author': 'Dr. Lee', 'content': '혈압 추적 필요', 'created_at': '2025-06-15T14:20:00'},
#         ])
#     elif request.method == 'POST':
#         return Response({'message': '등록 완료'})

# 6월 16일 Flutter 관련
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from rest_framework import status
# from .models import Prediction, Segmentation, Comment, Patient
# from .serializers import PredictionSerializer, SegmentationSerializer, CommentSerializer


# @api_view(['GET'])
# def prediction_result_view(request, patient_id):
#     """환자의 AI 예측 점수 조회"""
#     try:
#         prediction = Prediction.objects.filter(patient_id=patient_id).latest('predicted_at')
#         serializer = PredictionSerializer(prediction)
#         return Response(serializer.data)
#     except Prediction.DoesNotExist:
#         return Response({'error': 'Prediction not found'}, status=404)


# @api_view(['GET'])
# def segmentation_result_view(request, patient_id):
#     """환자의 CT Segmentation 결과 이미지 URL 반환"""
#     try:
#         segmentation = Segmentation.objects.filter(patient_id=patient_id).latest('uploaded_at')
#         image_url = segmentation.image.url  # MEDIA_URL 기반 경로
#         return Response({'image_url': request.build_absolute_uri(image_url)})
#     except Segmentation.DoesNotExist:
#         return Response({'error': 'Segmentation not found'}, status=404)
# ----------------------------------------------------------#
# @api_view(['GET']) # orthanc
# def segmentation_result_view(request, patient_id):
#     try:
#         segmentation = Segmentation.objects.filter(patient_id=patient_id).latest('uploaded_at')
#         orthanc_uid = segmentation.orthanc_instance_id
#         # 예시 URL: http://<orthanc-ip>:8042/instances/<UID>/preview
#         orthanc_url = f"http://34.46.244.222:8042/instances/{orthanc_uid}/preview"
#         return Response({'image_url': orthanc_url})
#     except Segmentation.DoesNotExist:
#         return Response({'error': 'Segmentation not found'}, status=404)
# ----------------------------------------------------------#

# @api_view(['GET', 'POST'])
# def comment_view(request, patient_id):
#     """환자별 코멘트 목록 조회 및 작성"""
#     if request.method == 'GET':
#         comments = Comment.objects.filter(patient_id=patient_id).order_by('-created_at')
#         serializer = CommentSerializer(comments, many=True)
#         return Response(serializer.data)

#     elif request.method == 'POST':
#         try:
#             patient = Patient.objects.get(id=patient_id)
#         except Patient.DoesNotExist:
#             return Response({'error': 'Patient not found'}, status=404)

#         data = request.data.copy()
#         data['patient'] = patient.id  # 명시적 연결
#         serializer = CommentSerializer(data=data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=201)
#         return Response(serializer.errors, status=400)

