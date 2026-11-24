import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from rest_framework import viewsets

from school.models import SchoolClass, Student, Subject, Teacher
from school.serializers import (
    SchoolClassSerializer,
    StudentSerializer,
    SubjectSerializer,
    TeacherSerializer,
)


@require_GET
@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_POST
@csrf_protect
def login_view(request):
    try:
        payload = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"detail": "Requête JSON invalide."}, status=400)

    username = payload.get("username") if isinstance(payload, dict) else None
    password = payload.get("password") if isinstance(payload, dict) else None
    if not isinstance(username, str) or not isinstance(password, str) or not username or not password:
        return JsonResponse({"detail": "Nom d’utilisateur et mot de passe requis."}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None or not user.is_active or not user.is_staff:
        return JsonResponse({"detail": "Identifiants invalides."}, status=401)

    login(request, user)
    return JsonResponse({"user": {"id": user.pk, "username": user.get_username()}})


@require_POST
@csrf_protect
def logout_view(request):
    logout(request)
    return JsonResponse({"detail": "Session fermée."})


@require_GET
def current_user(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({"detail": "Authentification requise."}, status=401)
    return JsonResponse({"user": {"id": request.user.pk, "username": request.user.get_username()}})


class SchoolClassViewSet(viewsets.ModelViewSet):
    queryset = SchoolClass.objects.all()
    serializer_class = SchoolClassSerializer


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related("school_class").all()
    serializer_class = StudentSerializer


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.select_related("school_class").all()
    serializer_class = TeacherSerializer


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
