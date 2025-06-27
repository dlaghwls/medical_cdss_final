# labapp/views.py

import logging
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action

from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as filter_
from django.utils import timezone

from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import PageNumberPagination

# 모델 임포트 (확인 완료)
from .models import LabTestType, LabTestItem, LabOrder, LabResult

from .serializers import (
    LabTestTypeSerializer,
    LabTestItemSerializer,
    LabOrderSerializer,
    LabResultSerializer,
)

logger = logging.getLogger(__name__)

# LabOrder 모델에 대한 필터셋 정의 (이 부분은 현재 문제와 직접 관련 없지만, 이전 제안에서 살려두었으므로 유지)
class LabOrderFilter(filter_.FilterSet):
    patient_uuid = filter_.UUIDFilter(field_name='patient__uuid')

    class Meta:
        model = LabOrder
        fields = ['patient_uuid', 'status'] # status 필터도 필요할 수 있으니 추가해둠


# LabResult 모델에 대한 필터셋 정의
class LabResultFilter(filter_.FilterSet):
    # LabResult의 lab_order (ForeignKey)를 통해 patient의 uuid를 필터링합니다.
    patient_uuid = filter_.UUIDFilter(field_name='lab_order__patient__uuid')

    class Meta:
        model = LabResult
        # ✨ 여기 'patient_uuid' 필드를 명시적으로 추가합니다.
        fields = ['patient_uuid'] # 이 필터셋이 patient_uuid 쿼리 파라미터를 처리하도록 설정


class LabTestTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LabTestType.objects.all()
    serializer_class = LabTestTypeSerializer

    def list(self, request, *args, **kwargs):
        logger.info("[LabTestTypeViewSet] 검사 종류 리스트 조회")
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=["get"])
    def items(self, request, pk=None):
        logger.info(f"[LabTestTypeViewSet] 검사 항목 조회 요청 - 검사 ID: {pk}")
        try:
            test_type = self.get_object()
            items = LabTestItem.objects.filter(test_type=test_type).order_by("sort_order")
            serializer = LabTestItemSerializer(items, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"[LabTestTypeViewSet.items] 에러 발생: {e}")
            return Response({"error": str(e)}, status=500)


class LabOrderViewSet(viewsets.ModelViewSet):
    queryset = LabOrder.objects.all()
    serializer_class = LabOrderSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_class = LabOrderFilter

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status', None)
        if status_param:
            statuses = [s.strip() for s in status_param.split(',')]
            queryset = queryset.filter(status__in=statuses)

        # logger.debug(f"LabOrderViewSet queryset: {queryset.query}") # 디버깅용
        return queryset

    def create(self, request, *args, **kwargs):
        logger.info("[LabOrderViewSet] 검사 주문 생성 요청")
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"[LabOrderViewSet.create] 주문 생성 실패: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        logger.info(f"[LabOrderViewSet] 검사 주문 수정 요청 - ID: {kwargs.get('pk')}")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        logger.info(f"[LabOrderViewSet] 검사 주문 삭제 요청 - ID: {kwargs.get('pk')}")
        return super().destroy(request, *args, **kwargs)

class LabResultViewSet(viewsets.ModelViewSet):
    queryset = LabResult.objects.all()
    serializer_class = LabResultSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_class = LabResultFilter

    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        # LabResult 모델에는 reported_at, created_at 필드가 직접 없으므로
        # LabOrder 관계를 통해 접근합니다.
        return queryset.order_by('-lab_order__reported_at', '-lab_order__created_at')

    def create(self, request, *args, **kwargs):
        logger.info("[LabResultViewSet] 검사 결과 생성 요청")
        # request.data의 타입과 내용 확인 로그는 진단에 유용하므로 유지합니다.
        logger.info(f"Request data type: {type(request.data)}")
        logger.info(f"Request data: {request.data}")

        # many=True로 serializer 초기화
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True) # 유효성 검사 실패 시 400 에러 발생

        try:
            self.perform_create(serializer) # 실제 객체 생성

            # LabOrder 상태 업데이트 로직 (이전에 추가된 것)
            if serializer.data:
                # many=True일 때 serializer.data는 리스트이므로, 첫 번째 항목을 참조합니다.
                first_result_data = serializer.data[0]
                lab_order_id = first_result_data.get('lab_order')

                if lab_order_id:
                    try:
                        lab_order = LabOrder.objects.get(id=lab_order_id)
                        lab_order.status = 'completed'
                        lab_order.reported_at = timezone.now()
                        lab_order.save()
                        logger.info(f"LabOrder {lab_order_id} 상태 'completed'로 업데이트 성공.")
                    except LabOrder.DoesNotExist:
                        logger.error(f"LabOrder {lab_order_id}를 찾을 수 없습니다: DB에 해당 LabOrder 없음.")
                    except Exception as e:
                        logger.error(f"LabOrder {lab_order_id} 상태 업데이트 중 오류 발생: {e}", exc_info=True)

            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=self.get_success_headers(serializer.data))

        except Exception as e:
            # perform_create 또는 LabOrder 업데이트 중 발생하는 예외를 잡습니다.
            logger.error(f"[LabResultViewSet.create] 결과 생성 중 예상치 못한 오류: {e}", exc_info=True)
            return Response({"detail": "결과 생성 중 서버 오류 발생"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def update(self, request, *args, **kwargs):
        logger.info(f"[LabResultViewSet] 검사 결과 수정 요청 - ID: {kwargs.get('pk')}")
        # ModelViewSet의 기본 update 로직을 사용합니다.
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        logger.info(f"[LabResultViewSet] 검사 결과 삭제 요청 - ID: {kwargs.get('pk')}")
        # ModelViewSet의 기본 destroy 로직을 사용합니다.
        return super().destroy(request, *args, **kwargs)
