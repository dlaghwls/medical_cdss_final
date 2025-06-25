# from django.http import JsonResponse

# def test_view(request):
#     return JsonResponse({'message': 'Hello from analyze!'})
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def run_prediction(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # 여기에 추론 모델 호출 코드가 들어갈 수 있어
            result = {"status": "success", "message": "Prediction processed", "input": data}
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
    else:
        return JsonResponse({"status": "error", "message": "POST method only"}, status=405)


@csrf_exempt
def run_segmentation(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # 여기에 segmentation 모델 호출 코드가 들어갈 수 있어
            result = {"status": "success", "message": "Segmentation processed", "input": data}
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
    else:
        return JsonResponse({"status": "error", "message": "POST method only"}, status=405)
