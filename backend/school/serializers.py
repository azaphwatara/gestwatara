from rest_framework import serializers

from school.models import SchoolClass, Student, Subject, Teacher


class SchoolClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolClass
        fields = ["id", "name"]


class TeacherSerializer(serializers.ModelSerializer):
    school_class_name = serializers.CharField(source="school_class.name", read_only=True)

    class Meta:
        model = Teacher
        fields = [
            "id",
            "last_name",
            "first_name",
            "experience",
            "diploma",
            "phone",
            "school_class",
            "school_class_name",
        ]


class StudentSerializer(serializers.ModelSerializer):
    school_class_name = serializers.CharField(source="school_class.name", read_only=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "last_name",
            "first_name",
            "age",
            "gender",
            "enrollment_status",
            "responsible",
            "responsible_phone",
            "school_class",
            "school_class_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name", "requirement"]
