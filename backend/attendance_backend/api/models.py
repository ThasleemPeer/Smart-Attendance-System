from django.db import models

# Create your models here.

class Student(models.Model):
    name = models.CharField(max_length=100)
    reg_number = models.CharField(max_length=20, unique=True)
    class_name = models.CharField(max_length=50)
    face_encoding = models.TextField()  # Store face encoding as text

    def __str__(self):
        return self.name

class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.DateField(auto_now_add=True)
    time = models.TimeField(auto_now_add=True)

    def __str__(self):
        return self.student.name