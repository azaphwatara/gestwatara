from django.contrib import admin

from school.models import SchoolClass, Student, Subject, Teacher


@admin.register(SchoolClass)
class SchoolClassAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ["last_name", "first_name", "school_class", "enrollment_status"]
    list_filter = ["school_class", "enrollment_status", "gender"]
    search_fields = ["last_name", "first_name", "responsible", "responsible_phone"]


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ["last_name", "first_name", "school_class", "experience"]
    list_filter = ["school_class"]
    search_fields = ["last_name", "first_name", "diploma", "phone"]


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ["name", "requirement"]
    list_filter = ["requirement"]
    search_fields = ["name"]
