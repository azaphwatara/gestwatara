import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse

from school.models import SchoolClass, Student, Subject, Teacher


class AuthenticationAndApiTests(TestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_user(
            username="school-admin",
            password="StrongTestPassword-984!",
            is_staff=True,
        )
        self.school_class = SchoolClass.objects.get(name="CP")

    def get_csrf_token(self):
        response = self.client.get(reverse("csrf-token"))
        self.assertEqual(response.status_code, 200)
        return response.json()["csrfToken"]

    def test_api_denies_anonymous_access(self):
        response = self.client.get("/api/students/")
        self.assertIn(response.status_code, [401, 403])
        self.assertEqual(self.client.get(reverse("api-current-user")).status_code, 401)

    def test_login_requires_csrf_and_authenticates_staff(self):
        csrf = self.get_csrf_token()
        response = self.client.post(
            reverse("api-login"),
            data=json.dumps({"username": "school-admin", "password": "StrongTestPassword-984!"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["username"], "school-admin")
        self.assertEqual(self.client.get(reverse("api-current-user")).status_code, 200)
        self.assertEqual(self.client.get("/api/classes/").status_code, 200)

    def test_login_rejects_missing_csrf_token(self):
        csrf_client = Client(enforce_csrf_checks=True)
        csrf_client.get(reverse("csrf-token"))
        response = csrf_client.post(
            reverse("api-login"),
            data=json.dumps({"username": "school-admin", "password": "StrongTestPassword-984!"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_login_rejects_non_staff_users(self):
        get_user_model().objects.create_user(
            username="regular-user",
            password="StrongTestPassword-984!",
            is_staff=False,
        )
        csrf = self.get_csrf_token()
        response = self.client.post(
            reverse("api-login"),
            data=json.dumps({"username": "regular-user", "password": "StrongTestPassword-984!"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 401)

    def test_admin_can_create_and_update_school_records(self):
        self.client.force_login(self.admin)
        student = Student.objects.create(
            last_name="NGUI",
            first_name="Amina",
            age=10,
            gender=Student.Gender.FEMALE,
            school_class=self.school_class,
        )
        teacher = Teacher.objects.create(
            last_name="MBOLO",
            first_name="Jeanne",
            experience=0,
            diploma="Licence",
            phone="0600000000",
            school_class=self.school_class,
        )
        subject = Subject.objects.create(name="Lecture", requirement=Subject.Requirement.OPTIONAL)

        response = self.client.patch(
            f"/api/students/{student.pk}/",
            data=json.dumps({"first_name": "Amina Sophie"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["first_name"], "Amina Sophie")
        self.assertEqual(self.client.get(f"/api/teachers/{teacher.pk}/").status_code, 200)
        self.assertEqual(self.client.get(f"/api/subjects/{subject.pk}/").json()["requirement"], "optional")
