from django.db import models


class SchoolClass(models.Model):
    name = models.CharField(max_length=80, unique=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "classe"
        verbose_name_plural = "classes"

    def __str__(self):
        return self.name


class Teacher(models.Model):
    last_name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100)
    experience = models.PositiveSmallIntegerField(default=0)
    diploma = models.CharField(max_length=200)
    phone = models.CharField(max_length=30)
    school_class = models.ForeignKey(
        SchoolClass,
        on_delete=models.PROTECT,
        related_name="teachers",
    )

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Student(models.Model):
    class Gender(models.TextChoices):
        FEMALE = "F", "Féminin"
        MALE = "M", "Masculin"

    class EnrollmentStatus(models.TextChoices):
        PENDING = "pending", "En attente"
        VALID = "valid", "Inscrit"

    last_name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100)
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=Gender.choices, blank=True)
    enrollment_status = models.CharField(
        max_length=10,
        choices=EnrollmentStatus.choices,
        default=EnrollmentStatus.PENDING,
    )
    responsible = models.CharField(max_length=200, blank=True)
    responsible_phone = models.CharField(max_length=30, blank=True)
    school_class = models.ForeignKey(
        SchoolClass,
        on_delete=models.PROTECT,
        related_name="students",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Subject(models.Model):
    class Requirement(models.TextChoices):
        REQUIRED = "required", "Obligatoire"
        OPTIONAL = "optional", "Facultative"

    name = models.CharField(max_length=120, unique=True)
    requirement = models.CharField(
        max_length=10,
        choices=Requirement.choices,
        default=Requirement.REQUIRED,
    )

    class Meta:
        ordering = ["name"]
        verbose_name = "matière"
        verbose_name_plural = "matières"

    def __str__(self):
        return self.name
