from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('developer', 'Developer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    mobile = models.CharField(max_length=20, blank=True)
    specialization = models.CharField(max_length=100, blank=True)
    profile_pic = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
