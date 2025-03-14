# Face Recognition Student Registration API

This API allows students to register by submitting their details and a face image. Before saving a new entry, the system checks whether the face already exists in the database.

## Features
- Detects and registers student faces.
- Checks for duplicate faces before adding a new student.
- Stores face encodings for comparison.
- Prevents multiple face registrations for the same person.

## Technologies Used
- **Django** (Backend Framework)
- **OpenCV** (Image Processing)
- **face_recognition** (Face Encoding & Matching)
- **NumPy** (Data Processing)
- **Base64** (Image Encoding & Decoding)
- **JSON** (Data Handling)

## Installation & Setup

### Prerequisites
- Python 3.x
- Django
- OpenCV (`opencv-python`)
- Face Recognition (`face-recognition`)
- NumPy

### Install Dependencies
```sh
pip install django opencv-python face-recognition numpy
```

### Run the Django Server
```sh
python manage.py runserver
```

## API Endpoints

### **1. Register Student**
**Endpoint:**
```http
POST /register
```

**Request Body (JSON):**
```json
{
    "name": "John Doe",
    "regNumber": "123456",
    "className": "CS101",
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
}
```

**Response:**
- **Success:**
  ```json
  { "message": "Student registered successfully" }
  ```
- **Face Already Exists:**
  ```json
  { "error": "Student already registered" }
  ```
- **No Face Detected:**
  ```json
  { "error": "No face detected" }
  ```
- **Multiple Faces Detected:**
  ```json
  { "error": "Multiple faces detected" }
  ```
- **Invalid Request:**
  ```json
  { "error": "Missing required fields" }
  ```

## How it Works
1. The user sends student details along with a **Base64-encoded image**.
2. The system decodes and converts the image to OpenCV format.
3. **Face Recognition** extracts facial encodings.
4. The API checks if the face encoding matches any stored encoding.
5. If no match is found, the student is registered; otherwise, it returns an error.

## Database Schema (Django Model)
```python
from django.db import models

class Student(models.Model):
    name = models.CharField(max_length=255)
    reg_number = models.CharField(max_length=20, unique=True)
    class_name = models.CharField(max_length=50)
    face_encoding = models.TextField()
```

## License
This project is open-source and available under the MIT License.

