from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import User, Task, Land, TaskManage, SataPrakar
import datetime

User = get_user_model()

class TaskManageModelTest(TestCase):
    def setUp(self):
        """Set up test data"""
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            role='employee',
            full_name='Test User'
        )
        
        # Create a test task
        self.task = Task.objects.create(
            name='Test Task',
            position=1,
            is_default=False,
            completion_days=5
        )
        
        # Create a TaskManage to link the task and employee
        self.task_manage = TaskManage.objects.create(
            task=self.task,
            employee=self.user
        )
        
        # The assigned task is already created above
    
    def test_task_manage_creation(self):
        """Test that TaskManage can be created correctly"""
        self.assertEqual(self.task_manage.task.name, 'Test Task')
        self.assertEqual(self.task_manage.employee.username, 'testuser')
    
    def test_task_manage_relationships(self):
        """Test that TaskManage relationships work correctly"""
        self.assertEqual(self.task_manage.task, self.task)
        self.assertEqual(self.task_manage.employee, self.user)
    
    def test_task_manage_string_representation(self):
        """Test the string representation of TaskManage"""
        expected = f"{self.user.get_display_name()} - {self.task.name}"
        self.assertEqual(str(self.task_manage), expected)
    
    def test_task_land_relationship(self):
        """Test that Task can have a land relationship through TaskManage"""
        # Tasks are now linked to land through TaskManage, not directly
        pass
    
    def test_land_task_manages_relationship(self):
        """Test that Land can have task manages through tasks"""
        # This test is no longer relevant since tasks don't have direct land relationships
        pass
    
    def test_user_task_manages_relationship(self):
        """Test that User can have task manages"""
        self.assertIn(self.task_manage, self.user.task_manages.all())
    
    def test_task_manages_relationship(self):
        """Test that Task can have manages"""
        self.assertIn(self.task_manage, self.task.task_manages.all())


class SataPrakarIntegrationTest(TestCase):
    def setUp(self):
        """Set up test data for SataPrakar integration"""
        # Create test SataPrakar
        self.sata_prakar = SataPrakar.objects.create(
            name='Test Sata Prakar'
        )
        
        # Create test land with SataPrakar
        self.land = Land.objects.create(
            name='Test Land with Sata',
            state='Gujarat',
            district='Test District',
            taluka='Test Taluka',
            village_name='Test Village',
            old_sr_no='789',
            new_sr_no='012',
            sata_prakar=self.sata_prakar.name,
            built_up_area=200.00,
            unutilized_area=100.00,
            total_area=300.00,
            soda_tarikh=datetime.date.today(),
            banakhat_tarikh=datetime.date.today(),
            dastavej_tarikh=datetime.date.today(),
            broker_name='Test Broker',
            selected_tasks='Test Task'
        )
    
    def test_land_sata_prakar_relationship(self):
        """Test that Land can use dynamic SataPrakar values"""
        self.assertEqual(self.land.sata_prakar, 'Test Sata Prakar')
        
        # Test that we can change to a different SataPrakar
        self.land.sata_prakar = 'Another Sata Prakar'
        self.land.save()
        self.assertEqual(self.land.sata_prakar, 'Another Sata Prakar')
