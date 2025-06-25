# ===== 기존 VitalSessionViewSet을 아래 코드로 교체하세요 =====

from rest_framework import viewsets
from .models import VitalSession
# [수정] 우리가 만든 읽기/쓰기 Serializer를 모두 가져옵니다.
from .serializers import VitalSessionSerializer, VitalSessionReadSerializer 
from django.utils import timezone
from datetime import timedelta
from rest_framework.response import Response  

class VitalSessionViewSet(viewsets.ModelViewSet):
    queryset = VitalSession.objects.all().order_by('-recorded_at')

    # 요청(GET, POST 등)에 따라 다른 Serializer를 사용하도록 설정
    def get_serializer_class(self):
        if self.action == 'list' or self.action == 'retrieve':
            return VitalSessionReadSerializer # 조회 요청 시
        return VitalSessionSerializer # 생성(POST) 요청 시

    def list(self, request, *args, **kwargs):
        # URL 쿼리 파라미터에서 patient_id와 period를 가져옵니다.
        patient_id = request.query_params.get('patient_id')
        period = request.query_params.get('period', '1d') # 기본값은 1일

        if not patient_id:
            return super().list(request, *args, **kwargs) # patient_id가 없으면 전체 목록 반환

        # patient_id로 환자 필터링
        # queryset = self.get_queryset().filter(patient_id=patient_id)
        queryset = self.get_queryset().filter(patient__uuid=patient_id)

        # period 값에 따라 시간 필터링
        end_date = timezone.now()
        if period == '1d':
            start_date = end_date - timedelta(days=1)
        elif period == '1w':
            start_date = end_date - timedelta(weeks=1)
        elif period == '1m':
            start_date = end_date - timedelta(days=30)
        elif period == '1y':
            start_date = end_date - timedelta(days=365)
        else: # 'all' 또는 다른 값일 경우 전체 기간
            start_date = None

        if start_date:
            queryset = queryset.filter(recorded_at__range=(start_date, end_date))

        # 필터링된 데이터를 Serializer로 변환하여 반환
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)