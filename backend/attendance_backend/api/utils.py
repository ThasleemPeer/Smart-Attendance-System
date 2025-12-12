
from datetime import date
from django.db.models import Count
from .models import Attendance, WorkingDay, LeaveRequest

def get_working_days(start_date, end_date):
    # Count WorkingDay rows in range where is_holiday=False
    return WorkingDay.objects.filter(date__gte=start_date, date__lte=end_date, is_holiday=False).count()

def get_present_days(student, start_date, end_date):
    return Attendance.objects.filter(student=student, date__gte=start_date, date__lte=end_date).values('date').distinct().count()

def get_leave_days_approved(student, start_date, end_date):
    approved = LeaveRequest.objects.filter(student=student, status=LeaveRequest.APPROVED,
                                           end_date__gte=start_date, start_date__lte=end_date)
    # Sum overlapping days
    total = 0
    for lr in approved:
        overlap_start = max(lr.start_date, start_date)
        overlap_end = min(lr.end_date, end_date)
        delta = (overlap_end - overlap_start).days + 1
        if delta > 0:
            total += delta
    return total

def calculate_attendance_percentage(student, start_date, end_date):
    total_working = get_working_days(start_date, end_date)
    if total_working == 0:
        return {"percentage": 0.0, "working_days": 0, "present": 0, "absent": 0, "leave_days": 0}

    present = get_present_days(student, start_date, end_date)
    leave_days = get_leave_days_approved(student, start_date, end_date)
    # Absent days = working - (present + leave_days)
    absent = total_working - (present + leave_days)
    if absent < 0: absent = 0

    percentage = (present + leave_days) / total_working * 100
    return {
        "percentage": round(percentage, 2),
        "working_days": total_working,
        "present": present,
        "absent": absent,
        "leave_days": leave_days
    }
