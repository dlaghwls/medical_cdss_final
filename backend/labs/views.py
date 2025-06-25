import logging
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import LabTestType, LabTestItem, LabOrder, LabResult
from .serializers import (
    LabTestTypeSerializer,
    LabTestItemSerializer,
    LabOrderSerializer,
    LabResultSerializer,
)

logger = logging.getLogger(__name__)


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

    def create(self, request, *args, **kwargs):
        logger.info("[LabResultViewSet] 검사 결과 생성 요청")
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"[LabResultViewSet.create] 결과 생성 실패: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        logger.info(f"[LabResultViewSet] 검사 결과 수정 요청 - ID: {kwargs.get('pk')}")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        logger.info(f"[LabResultViewSet] 검사 결과 삭제 요청 - ID: {kwargs.get('pk')}")
        return super().destroy(request, *args, **kwargs)
