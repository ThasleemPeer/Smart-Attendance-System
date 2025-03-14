from django.urls import path
from .views import register, mark_attendance, download_attendance

urlpatterns = [
    path('register/', register, name='register'),
    path('mark-attendance/', mark_attendance, name='mark_attendance'),
    path('download_attendance/', download_attendance, name='download_attendance'),
]