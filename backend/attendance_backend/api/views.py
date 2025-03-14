import os
from django.shortcuts import render
import json
# Create your views here.
import base64
import cv2
import face_recognition
import numpy as np
import pandas as pd
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view
from .models import Student, Attendance
from datetime import datetime
import io
import base64
import numpy as np
import cv2
import face_recognition
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
def register(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method"}, status=405)

    try:
        # Parse JSON data from request body
        data = json.loads(request.body)
        logger.info("Received data: %s", data)

        name = data.get('name')
        reg_number = data.get('regNumber')
        class_name = data.get('className')
        image_data = data.get('image')

        if not name or not reg_number or not class_name or not image_data:
            logger.error("Missing required fields")
            return JsonResponse({"error": "Missing required fields"}, status=400)

        # Remove "data:image/jpeg;base64," prefix
        if "," in image_data:
            image_data = image_data.split(",")[1]

        # Decode base64 image
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Detect face
        encodings = face_recognition.face_encodings(image, num_jitters=2, model="large")
        if not encodings:
            logger.error("No face detected in the image")
            return JsonResponse({"error": "No face detected"}, status=400)
        if len(encodings) > 1:
            logger.error("Multiple faces detected")
            return JsonResponse({"error": "Multiple faces detected"}, status=400)

        # Save student data
        encoding = encodings[0].tolist()
        Student.objects.create(name=name,reg_number=reg_number,class_name=class_name,face_encoding=encoding)
        # Save to database or perform other actions
        logger.info("Student registered successfully")
        return JsonResponse({"message": "Student registered successfully"})
    except json.JSONDecodeError:
        logger.error("Invalid JSON data")
        return JsonResponse({"error": "Invalid JSON data"}, status=400)
    except Exception as e:
        logger.error("Error during registration: %s", str(e))
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def mark_attendance(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method"}, status=405)

    try:
        # Parse JSON data from request body
        data = json.loads(request.body)
        logger.info("Received image data for attendance marking")

        image_data = data.get('image')
        if not image_data:
            return JsonResponse({"error": "No image data provided"}, status=400)

        # Remove "data:image/jpeg;base64," prefix
        if "," in image_data:
            image_data = image_data.split(",")[1]

        # Decode base64 image
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Detect face
        encodings = face_recognition.face_encodings(image, num_jitters=2, model="large")
        if not encodings:
            logger.error("No face detected in the image")
            return JsonResponse({"error": "No face detected"}, status=400)
        if len(encodings) > 1:
            logger.error("Multiple faces detected")
            return JsonResponse({"error": "Multiple faces detected"}, status=400)

        # Get the face encoding of the captured image
        captured_encoding = encodings[0]

        # Fetch all students from the database
        students = Student.objects.all()
        matched_student = None

        # Compare the captured face encoding with all stored face encodings
        for student in students:
            stored_encoding = json.loads(student.face_encoding)
            match = face_recognition.compare_faces([stored_encoding], captured_encoding, tolerance=0.6)
            if match[0]:
                matched_student = student
                break

        if not matched_student:
            logger.error("No matching student found")
            return JsonResponse({"error": "No matching student found"}, status=404)

        # Create an attendance record for the matched student
        Attendance.objects.create(student=matched_student)
        logger.info(f"Attendance marked successfully for {matched_student.name}")
        return JsonResponse({"message": f"Attendance marked successfully for {matched_student.name}"})
    except json.JSONDecodeError:
        logger.error("Invalid JSON data")
        return JsonResponse({"error": "Invalid JSON data"}, status=400)
    except Exception as e:
        logger.error("Error during attendance marking: %s", str(e))
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
def download_attendance(request):
    # For admin to download Excel
    if not os.path.exists('attendance.xlsx'):
        return JsonResponse({"error": "No attendance data"}, status=404)
    with open('attendance.xlsx', 'rb') as f:
        response = HttpResponse(f.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename=attendance.xlsx'
        return response