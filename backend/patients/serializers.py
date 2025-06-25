from rest_framework import serializers
from .models import Patient, Doctor, NurseInitialAssessment

class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = '__all__'

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'

class NurseInitialAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = NurseInitialAssessment
        fields = '__all__'

# 6월 16일 Flutter 관련
# class PredictionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Prediction
#         fields = ['score', 'risk_level', 'predicted_at']

# class SegmentationSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Segmentation
#         fields = ['orthanc_instance_id', 'uploaded_at']


# class CommentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Comment
#         fields = ['author', 'content', 'created_at']

