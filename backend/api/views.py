from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from django.utils import timezone


def hello(request):
    return JsonResponse({
        "message": "Hello World!",
        "application": "DevOps Assessment",
        "backend": "Django",
        "status": "success",
        "timestamp": timezone.now().isoformat()
    })


def health(request):
    return JsonResponse({
        "status": "healthy"
    })
