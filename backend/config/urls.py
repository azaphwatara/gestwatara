from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from school.views import (
    SchoolClassViewSet,
    StudentViewSet,
    SubjectViewSet,
    TeacherViewSet,
    csrf_token,
    current_user,
    login_view,
    logout_view,
)


router = DefaultRouter()
router.register("classes", SchoolClassViewSet)
router.register("students", StudentViewSet)
router.register("teachers", TeacherViewSet)
router.register("subjects", SubjectViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/csrf/", csrf_token, name="csrf-token"),
    path("api/auth/login/", login_view, name="api-login"),
    path("api/auth/logout/", logout_view, name="api-logout"),
    path("api/auth/me/", current_user, name="api-current-user"),
    path("api/auth/", include("rest_framework.urls")),
    path("api/", include(router.urls)),
]
