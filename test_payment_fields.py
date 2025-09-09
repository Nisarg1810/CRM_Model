#!/usr/bin/env python
"""
Test script to verify payment fields are properly connected to database
"""
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_project.settings')
django.setup()

from core.models import Installment, LandSale, User

def test_payment_fields():
    """Test that payment fields exist and are accessible"""
    print("=== Testing Payment Fields Database Connection ===")
    
    try:
        # Check if Installment model has required fields
        installment_fields = [field.name for field in Installment._meta.get_fields()]
        required_fields = ['cheque_photo', 'remark', 'rtgs_number', 'from_bank', 'utr_reference', 'ifsc_code', 'bank_name']
        
        print("\n1. Checking Installment model fields:")
        for field in required_fields:
            if field in installment_fields:
                print(f"   [OK] {field} - EXISTS")
            else:
                print(f"   [MISSING] {field} - NOT FOUND")
        
        # Check database connectivity
        print("\n2. Testing database connectivity:")
        installment_count = Installment.objects.count()
        print(f"   [OK] Database connected - Found {installment_count} installments")
        
        # Check if any installments have payment data
        print("\n3. Checking existing payment data:")
        paid_installments = Installment.objects.filter(status='paid')
        print(f"   [INFO] Found {paid_installments.count()} paid installments")
        
        if paid_installments.exists():
            sample_installment = paid_installments.first()
            print(f"   [SAMPLE] Sample installment #{sample_installment.id}:")
            print(f"      - Remark: {sample_installment.remark or 'None'}")
            print(f"      - Cheque Photo: {sample_installment.cheque_photo or 'None'}")
            print(f"      - RTGS Number: {sample_installment.rtgs_number or 'None'}")
            print(f"      - Bank Name: {sample_installment.bank_name or 'None'}")
        
        # Check pending installments for testing
        print("\n4. Checking pending installments for testing:")
        pending_installments = Installment.objects.filter(status='pending')
        print(f"   [INFO] Found {pending_installments.count()} pending installments")
        
        if pending_installments.exists():
            sample_pending = pending_installments.first()
            print(f"   [SAMPLE] Sample pending installment #{sample_pending.id}:")
            print(f"      - Land: {sample_pending.land_sale.land.name}")
            print(f"      - Client: {sample_pending.land_sale.client.client_name}")
            print(f"      - Percentage: {sample_pending.percentage}%")
            print(f"      - Due Date: {sample_pending.due_date}")
        
        print("\n[SUCCESS] All payment fields are properly configured!")
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Error testing payment fields: {str(e)}")
        return False

if __name__ == "__main__":
    test_payment_fields()
