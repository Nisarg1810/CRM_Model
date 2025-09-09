from django import template
from datetime import datetime, timedelta, date

register = template.Library()

@register.filter
def add_days(value, days):
    """
    Add a number of days to a date
    Usage: {{ date|add_days:5 }}
    """
    if value and days:
        try:
            if isinstance(value, str):
                value = datetime.strptime(value, '%Y-%m-%d').date()
            return value + timedelta(days=int(days))
        except (ValueError, TypeError):
            return value
    return value

@register.filter
def add_completion_date(completion_days):
    """
    Calculate completion date based on completion days from today
    Usage: {{ task.completion_days|add_completion_date }}
    """
    if completion_days:
        try:
            today = date.today()
            completion_date = today + timedelta(days=int(completion_days))
            return completion_date.strftime('%d/%m/%Y')
        except (ValueError, TypeError):
            return "Invalid days"
    return "Not set"
