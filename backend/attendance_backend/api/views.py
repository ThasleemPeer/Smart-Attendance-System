import os
import json
import base64
import cv2
import face_recognition
import numpy as np
import pandas as pd
import io
import logging
from datetime import datetime
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from .models import Student, Attendance
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


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
        email = data.get('email')

        if not name or not reg_number or not class_name or not image_data or not email:
            return JsonResponse({"error": "Missing required fields"}, status=400)

        if "," in image_data:
            image_data = image_data.split(",")[1]

        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        bgr_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)

        encodings = face_recognition.face_encodings(rgb_image, num_jitters=2, model="large")
        if not encodings:
            return JsonResponse({"error": "No face detected"}, status=400)
        if len(encodings) > 1:
            return JsonResponse({"error": "Multiple faces detected"}, status=400)

        new_encoding = encodings[0]

        # Duplicate check
        students = Student.objects.all()
        for student in students:
            stored_encoding = json.loads(student.face_encoding)
            match = face_recognition.compare_faces([stored_encoding], new_encoding, tolerance=0.5)
            if match[0]:
                return JsonResponse({"error": "Student already registered"}, status=400)

        # Save student
        Student.objects.create(
            name=name,
            reg_number=reg_number,
            class_name=class_name,
            email=email,
            face_encoding=json.dumps(new_encoding.tolist())
        )

        return JsonResponse({"message": "Student registered successfully"})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON data"}, status=400)
    except Exception as e:
        logger.error("Registration error: %s", e)
        return JsonResponse({"error": str(e)}, status=500)


import random
from django.core.mail import EmailMultiAlternatives
from django.core.mail import EmailMultiAlternatives
import random

# ... keep your other imports ...

@csrf_exempt
def mark_attendance(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method"}, status=405)

    try:
        data = json.loads(request.body)
        image_data = data.get('image')
        if not image_data:
            return JsonResponse({"error": "No image data provided"}, status=400)

        if "," in image_data:
            image_data = image_data.split(",")[1]

        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        bgr_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)

        cv2.imwrite("live_input_debug.jpg", bgr_image)

        encodings = face_recognition.face_encodings(rgb_image, num_jitters=2, model="large")
        if not encodings:
            return JsonResponse({"error": "No face detected"}, status=400)
        if len(encodings) > 1:
            return JsonResponse({"error": "Multiple faces detected"}, status=400)

        captured_encoding = encodings[0]

        students = Student.objects.all()
        matched_student = None
        best_match_distance = float('inf')

        for student in students:
            stored_encoding = json.loads(student.face_encoding)
            match = face_recognition.compare_faces([stored_encoding], captured_encoding, tolerance=0.5)
            distance = face_recognition.face_distance([stored_encoding], captured_encoding)[0]

            if match[0] and distance < best_match_distance:
                best_match_distance = distance
                matched_student = student

        if not matched_student:
            return JsonResponse({"error": "No matching student found"}, status=404)

        today = datetime.now().date()
        existing_attendance = Attendance.objects.filter(student=matched_student, date=today).exists()

        if not existing_attendance:
            Attendance.objects.create(
                student=matched_student,
                date=today,
                time=datetime.now().time()
            )

        # --- EMAIL SECTION STARTS HERE ---

        # 1. Random Cool Quotes
        quotes = [
            "🔥 You are crushing it today!",
            "🚀 Consistency is key, and you have it!",
            "💎 Another day, another step towards success.",
            "🌟 Your future self will thank you for showing up.",
            "⚡ The grind never stops, keep shining!"
        ]
        quote = random.choice(quotes)

        # 2. Animated "Dancing" GIF URL (Confetti/Celebration)
        # This GIF simulates emojis/confetti falling down
        animation_url = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3RxeXJ5MXl5b3Z5dGZ5eXJ5MXl5b3Z5dGZ5eXJ5MXl5b3Z5dH/HuVCpmfKheI2Q/giphy.gif"

        # 3. HTML Content
        html_content = f"""
        <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#1a1a2e; padding:0; margin:0;">
                <div style="max-width:500px; margin:20px auto; background-color:#ffffff; border-radius:15px; overflow:hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                    
                    <div style="background-color:#4f46e5; padding:0; text-align:center; position:relative;">
                        <img src="{animation_url}" style="width:100%; height:150px; object-fit:cover; opacity:0.8;" alt="Celebration">
                        <h1 style="color:white; margin:-40px 0 20px 0; position:relative; z-index:10; font-size:24px;">Attendance Marked! ✅</h1>
                    </div>

                    <div style="padding:30px; text-align:center;">
                        <p style="font-size:18px; color:#333; margin-bottom:5px;">Hey <strong>{matched_student.name}</strong>! 👋</p>
                        <p style="color:#666; font-size:14px;">We captured your presence.</p>
                        
                        <div style="background-color:#f3f4f6; padding:15px; border-radius:10px; margin:20px 0;">
                            <p style="margin:5px 0; color:#333;"><strong>📅 Date:</strong> {today.strftime('%A, %d %B %Y')}</p>
                            <p style="margin:5px 0; color:#333;"><strong>⏰ Time:</strong> {datetime.now().strftime('%H:%M:%S')}</p>
                        <p style="margin:5px 0 0 0; font-weight:bold;">Sathyabama Attendance Team</p>
                        </div>

                        <p style="font-style:italic; color:#4f46e5; font-weight:bold;">"{quote}"</p>
                    </div>

                    <div style="background-color:#eee; padding:15px; text-align:center; font-size:12px; color:#888;">
                        <p style="margin:0;">Stay Awesome! ✨</p>
                        <p style="margin:5px 0 0 0; font-weight:bold;">Sathyabama Attendance Team</p>
                    </div>
                </div>
            </body>
        </html>
        """

        subject = "✨ Attendance Confirmed!"
        
        # 4. CUSTOM SENDER NAME CONFIGURATION
        # Format: "Display Name <email@address.com>"
        sender_email = settings.EMAIL_HOST_USER
        from_email = f"Sathyabama Attendance Team <{sender_email}>"
        
        recipient_list = [matched_student.email]

        try:
            msg = EmailMultiAlternatives(subject, f"Attendance marked for {matched_student.name}", from_email, recipient_list)
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            logger.info(f"Cool email sent to {matched_student.email}")
        except Exception as e:
            logger.error(f"Failed to send email to {matched_student.email}: {e}")

        return JsonResponse({"message": f"Attendance marked successfully for {matched_student.name}"})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON data"}, status=400)
    except Exception as e:
        logger.error("Attendance error: %s", e)
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
def download_attendance(request):
    try:
        attendance_records = Attendance.objects.all().select_related('student')

        data = [{
            "Student Name": record.student.name,
            "Registration Number": record.student.reg_number,
            "Class": record.student.class_name,
            "Attendance Date": f"{record.date.strftime('%d-%m-%y')} {record.time.strftime('%H:%M:%S')}"
        } for record in attendance_records]

        df = pd.DataFrame(data)
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Attendance")

        excel_buffer.seek(0)
        response = HttpResponse(
            excel_buffer.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="attendance_data.xlsx"'
        return response

    except Exception as e:
        logger.error("Download error: %s", e)
        return JsonResponse({"error": str(e)}, status=500)


def sending(request):
    return HttpResponse("hello")
