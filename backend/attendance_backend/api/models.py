from django.db import models

# Create your models here.

class Student(models.Model):
    name = models.CharField(max_length=100)
    reg_number = models.CharField(max_length=20, unique=True)
    class_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    face_encoding = models.TextField()  # Store face encoding as text

    def __str__(self):
        return self.name

class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.DateField(auto_now_add=True)
    time = models.TimeField(auto_now_add=True)

    def __str__(self):
        return self.student.name
# models.py (append)

from django.conf import settings

class WorkingDay(models.Model):
    date = models.DateField(unique=True)
    is_holiday = models.BooleanField(default=False)  # if True, not counted as working day
    created_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.date} ({'Holiday' if self.is_holiday else 'Working'})"


class LeaveRequest(models.Model):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    AUTO_APPROVED = "AUTO_APPROVED"

    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
        (AUTO_APPROVED, "Auto Approved"),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    admin_comment = models.TextField(blank=True, null=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.student.name} {self.start_date} to {self.end_date} ({self.status})"
