# backend/lab_results/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import LabResult, StrokeInfo, Complications # 새로 정의한 LabResult 모델
from .serializers import LabResultSerializer,StrokeInfoSerializer, ComplicationsSerializer # 새로 정의한 LabResultSerializer
from openmrs_integration.models import OpenMRSPatient # OpenMRSPatient 모델 임포트
from django.utils import timezone
from rest_framework.views import APIView

class LabResultViewSet(viewsets.ModelViewSet):
    queryset = LabResult.objects.all()
    serializer_class = LabResultSerializer
    # permission_classes = [permissions.IsAuthenticated] # 인증 필요 시 추가

    def create(self, request, *args, **kwargs):
        patient_uuid = request.data.get('patient')
        test_name = request.data.get('test_name')
        test_value = request.data.get('test_value')
        unit = request.data.get('unit')
        notes = request.data.get('notes')
        
        if not patient_uuid or not test_name or test_value is None:
            return Response(
                {"error": "patient_uuid, test_name, and test_value are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            patient = OpenMRSPatient.objects.get(uuid=patient_uuid)
        except OpenMRSPatient.DoesNotExist:
            return Response(
                {"error": f"Patient with UUID {patient_uuid} not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(data={
            'patient': patient.uuid,
            'test_name': test_name,
            'test_value': test_value,
            'unit': unit,
            'notes': notes,
        })
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # 이 액션은 쿼리 파라미터 방식으로만 사용할 것이므로 URL 라우팅에서 Path 파라미터는 제거합니다.
    @action(detail=False, methods=['get'], url_path='by-patient') # url_path를 지정하여 URL 패턴 명확화
    def by_patient(self, request):
        """
        특정 환자의 모든 LIS 수치를 조회합니다.
        URL: /api/lab-results/by-patient/?patient_uuid=<UUID>
        """
        patient_uuid = request.query_params.get('patient_uuid')

        if not patient_uuid:
            return Response(
                {"error": "patient_uuid query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            patient = OpenMRSPatient.objects.get(uuid=patient_uuid)
        except OpenMRSPatient.DoesNotExist:
            return Response(
                {"error": f"Patient with UUID {patient_uuid} not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        lab_results = LabResult.objects.filter(patient=patient).order_by('test_name', '-recorded_at')
        serializer = self.get_serializer(lab_results, many=True)
        return Response(serializer.data)
    
class StrokeInfoHistoryView(APIView):
    """
    특정 환자의 SOD2 정보 이력을 조회(GET)하고, 새 정보를 등록(POST)합니다.
    """
    def get(self, request):
        patient_uuid = request.query_params.get('patient_uuid')
        if not patient_uuid:
            return Response({"error": "Patient UUID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        history = StrokeInfo.objects.filter(patient__uuid=patient_uuid).order_by('-recorded_at')
        serializer = StrokeInfoSerializer(history, many=True)
        return Response(serializer.data)
    
    # ★★★ 데이터를 저장하는 POST 메소드 추가 ★★★
    def post(self, request):
        patient_uuid = request.data.get('patient')
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)
        
        # 프론트엔드에서 받은 데이터를 serializer에 맞게 전달
        serializer = StrokeInfoSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            # patient 외래 키 관계를 직접 설정하여 저장
            serializer.save(patient=patient)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ComplicationsHistoryView(APIView):
    """
    특정 환자의 합병증/투약 정보 이력을 조회(GET)하고, 새 정보를 등록(POST)합니다.
    """
    def get(self, request):
        patient_uuid = request.query_params.get('patient_uuid')
        if not patient_uuid:
            return Response({"error": "Patient UUID is required"}, status=400)

        history = Complications.objects.filter(patient__uuid=patient_uuid).order_by('-recorded_at')
        serializer = ComplicationsSerializer(history, many=True)
        return Response(serializer.data)

    # ★★★ 데이터를 저장하는 POST 메소드 추가 ★★★
    def post(self, request):
        patient_uuid = request.data.get('patient')
        patient = get_object_or_404(OpenMRSPatient, uuid=patient_uuid)

        serializer = ComplicationsSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save(patient=patient)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)