import uuid
from django.db import models
from openmrs_integration.models import OpenMRSPatient 

STATUS_CHOICES = [
    ('pending', 'Pending Input'),       # 결과 입력 대기 중
    ('completed', 'Completed'),         # 결과 입력 완료
    ('cancelled', 'Cancelled'),         # 취소됨
]

class LabTestType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name}"


class LabTestItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test_type = models.ForeignKey(LabTestType, on_delete=models.CASCADE, related_name="items")
    name = models.CharField(max_length=50)
    unit = models.CharField(max_length=20, blank=True)
    ref_low = models.CharField(max_length=20, blank=True)
    ref_high = models.CharField(max_length=20, blank=True)
    gender_ref = models.CharField(max_length=30, blank=True)
    sort_order = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.test_type.name} - {self.name}"


class LabOrder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(OpenMRSPatient, on_delete=models.CASCADE)
    test_type = models.ForeignKey(LabTestType, on_delete=models.CASCADE)
    collected_at = models.DateTimeField()
    reported_at = models.DateTimeField(null=True, blank=True)
    performed_by = models.CharField(max_length=100)
    lab_location = models.CharField(max_length=100)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending', # 기본값은 'pending'
        help_text="Lab order status"
    )

    created_at = models.DateTimeField(auto_now_add=True, help_text="주문 생성 시간")
    

    def __str__(self):
        collected_date = self.collected_at.date() if self.collected_at else '날짜 미정'
        return f"{self.patient.display_name} - {self.test_type.name} ({self.collected_at.date()})"

    class Meta:
        verbose_name = "Lab Order"
        verbose_name_plural = "Lab Orders"
        ordering = ['-created_at']


class LabResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lab_order = models.ForeignKey(LabOrder, on_delete=models.CASCADE, related_name="results")
    test_item = models.ForeignKey(LabTestItem, on_delete=models.CASCADE)
    result_value = models.CharField(max_length=50)
    note = models.TextField(blank=True)

    def __str__(self):
        return f"{self.lab_order.patient.display_name} - {self.test_item.name}: {self.result_value}"

