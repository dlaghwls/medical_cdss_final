from rest_framework import viewsets
from .models import VitalSession
from .serializers import VitalSessionSerializer, VitalSessionReadSerializer
from django.utils import timezone
from datetime import timedelta
from rest_framework.response import Response

class VitalSessionViewSet(viewsets.ModelViewSet):
    queryset = VitalSession.objects.all().order_by('-recorded_at')

    def get_serializer_class(self):
        if self.action == 'list' or self.action == 'retrieve':
            return VitalSessionReadSerializer
        return VitalSessionSerializer

    def list(self, request, *args, **kwargs):
        # *** 이 줄을 수정해야 합니다: patient_uuid로 쿼리 파라미터를 가져옵니다. ***
        patient_uuid_param = request.query_params.get('patient_uuid') # <--- 'patient_id'를 'patient_uuid'로 변경

        period = request.query_params.get('period', '1d')

        # patient_uuid_param이 제공되지 않으면 (예: URL에 ?patient_uuid= 가 없는 경우)
        if not patient_uuid_param:
            # 이 경우 어떻게 할지는 요구사항에 따라 다릅니다.
            # 1. 모든 VitalSession을 반환 (현재 동작)
            # return super().list(request, *args, **kwargs)
            # 2. 아무것도 반환하지 않음 (빈 리스트)
            # return Response([])
            # 3. 에러 메시지 반환
            # return Response({"detail": "patient_uuid query parameter is required."}, status=400)
            # 여기서는 편의상 모든 세션을 반환하는 기존 동작을 유지하되, 필요에 따라 조정하세요.
            return super().list(request, *args, **kwargs)


        # *** 이 줄을 수정해야 합니다: patient__uuid 필터링에 올바른 변수를 사용합니다. ***
        try:
            # UUID 문자열을 실제 UUID 객체로 변환하여 필터링하는 것이 안전합니다.
            # 그러나 Django ORM은 문자열 UUID도 자동으로 변환하여 필터링해주는 경우가 많으므로
            # 여기서는 일단 문자열 그대로 사용하고, 문제가 발생하면 uuid.UUID(patient_uuid_param)으로 변경 고려
            queryset = self.get_queryset().filter(patient__uuid=patient_uuid_param)
        except ValueError:
            return Response({"detail": "Invalid patient_uuid format."}, status=400)


        # period 값에 따라 시간 필터링 (기존 로직 유지)
        end_date = timezone.now()
        start_date = None # 초기화

        if period == '1d':
            start_date = end_date - timedelta(days=1)
        elif period == '1w':
            start_date = end_date - timedelta(weeks=1)
        elif period == '1m':
            start_date = end_date - timedelta(days=30) # 1개월을 30일로 가정
        elif period == '1y':
            start_date = end_date - timedelta(days=365) # 1년을 365일로 가정
        # else: 'all' 또는 유효하지 않은 period 값 -> start_date는 None 유지되어 필터링 안됨

        if start_date:
            queryset = queryset.filter(recorded_at__range=(start_date, end_date))

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)