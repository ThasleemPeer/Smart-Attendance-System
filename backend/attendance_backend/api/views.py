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
from django.http import HttpResponse
from xml.etree.ElementTree import Element, SubElement, tostring
from django.utils.encoding import smart_str
from rest_framework.decorators import api_view
from .models import Attendance

from xml.etree.ElementTree import Element, SubElement, tostring
from django.http import HttpResponse
from .models import Attendance
logger = logging.getLogger(__name__)
from django.views.decorators.csrf import csrf_exempt
@csrf_exempt
def register(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method"}, status=405)

    try:
        data = json.loads(request.body)
        logger.info("Received data: %s", data)

        name = data.get('name')
        reg_number = data.get('regNumber')
        class_name = data.get('className')
        image_data = data.get('image')

        if not name or not reg_number or not class_name or not image_data:
            return JsonResponse({"error": "Missing required fields"}, status=400)

        # Remove base64 prefix
        if "," in image_data:
            image_data = image_data.split(",")[1]

        # Decode base64 image
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Detect face
        encodings = face_recognition.face_encodings(image, num_jitters=2, model="large")
        if not encodings:
            return JsonResponse({"error": "No face detected"}, status=400)
        if len(encodings) > 1:
            return JsonResponse({"error": "Multiple faces detected"}, status=400)

        new_encoding = encodings[0]

        # Check if the face already exists
        students = Student.objects.all()
        for student in students:
            stored_encoding = json.loads(student.face_encoding)
            match = face_recognition.compare_faces([stored_encoding], new_encoding, tolerance=0.5)
            if match[0]:  
                return JsonResponse({"error": "Student already registered"}, status=400)

        # Save student
        encoding_list = new_encoding.tolist()
        Student.objects.create(name=name, reg_number=reg_number, class_name=class_name, face_encoding=json.dumps(encoding_list))

        return JsonResponse({"message": "Student registered successfully"})
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON data"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def mark_attendance(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method"}, status=405)

    try:
        data = json.loads(request.body)
        image_data = data.get('image')
        if not image_data:
            return JsonResponse({"error": "No image data provided"}, status=400)

        # Remove base64 prefix
        if "," in image_data:
            image_data = image_data.split(",")[1]

        # Decode base64 image
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Detect face
        encodings = face_recognition.face_encodings(image, num_jitters=2, model="large")
        if not encodings:
            return JsonResponse({"error": "No face detected"}, status=400)
        if len(encodings) > 1:
            return JsonResponse({"error": "Multiple faces detected"}, status=400)

        captured_encoding = encodings[0]

        # Fetch all students
        students = Student.objects.all()
        matched_student = None
        best_match_distance = float('inf')

        # Compare face encoding with stored encodings
        for student in students:
            stored_encoding = json.loads(student.face_encoding)
            match = face_recognition.compare_faces([stored_encoding], captured_encoding, tolerance=0.5)
            distance = face_recognition.face_distance([stored_encoding], captured_encoding)[0]

            logger.info(f"Comparing with {student.name}, Match: {match[0]}, Distance: {distance}")

            if match[0] and distance < best_match_distance:
                best_match_distance = distance
                matched_student = student

        if not matched_student:
            return JsonResponse({"error": "No matching student found"}, status=404)

        today = datetime.now().date()
        existing_attendance = Attendance.objects.filter(student=matched_student, date=today).exists()

        if existing_attendance:
            return JsonResponse({"message": f"Attendance already marked for {matched_student.name}"})

        Attendance.objects.create(student=matched_student, date=today, time=datetime.now().time())

        return JsonResponse({"message": f"Attendance marked successfully for {matched_student.name}"})
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON data"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

import pandas as pd
from django.http import HttpResponse
import io

@api_view(['GET'])
def download_attendance(request):
    try:
        attendance_records = Attendance.objects.all().select_related('student')

        # Create a list of dictionaries for DataFrame
        data = []
        for record in attendance_records:
            data.append({
                "Student Name": record.student.name,
                "Registration Number": record.student.reg_number,
                "Class": record.student.class_name,
                "Attendance Date": f"{record.date.strftime('%d-%m-%y')} {record.time.strftime('%H:%M:%S')}"
            })

        # Convert data to Pandas DataFrame
        df = pd.DataFrame(data)

        # Create an Excel file in memory
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Attendance")

        excel_buffer.seek(0)

        # Prepare response
        response = HttpResponse(excel_buffer.read(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response["Content-Disposition"] = 'attachment; filename="attendance_data.xlsx"'

        return response

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
