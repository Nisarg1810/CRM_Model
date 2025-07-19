from django.db import models
from users.models import User

class Task(models.Model):
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('completed', 'Completed'),
        ('approved', 'Approved'),
    ]
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    assign_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    attachment = models.FileField(upload_to='task_attachments/', blank=True, null=True)
    feedback = models.TextField(blank=True)
    rating = models.PositiveSmallIntegerField(blank=True, null=True)
    deadline = models.DateField(null=True, blank=True)
    timeline = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.name

class Feedback(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='feedbacks')
    developer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for {self.task.name} by {self.developer.username}"
