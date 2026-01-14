import requests
import sys
import json
from datetime import datetime

class MicroloanBotAPITester:
    def __init__(self, base_url="https://microloan-bot.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_mfo_id = None
        self.created_app_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 200:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_register(self):
        """Test admin registration"""
        test_email = f"admin_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "name": "Test Admin"
            },
            auth_required=False
        )
        if success and 'token' in response:
            self.token = response['token']
            self.admin_id = response['admin']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_auth_login(self):
        """Test admin login with existing credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST", 
            "auth/login",
            200,
            data={
                "email": f"admin_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!"
            },
            auth_required=False
        )
        return success

    def test_auth_me(self):
        """Test getting current admin info"""
        success, response = self.run_test(
            "Get Current Admin",
            "GET",
            "auth/me", 
            200
        )
        return success

    def test_create_mfo(self):
        """Test creating an MFO"""
        success, response = self.run_test(
            "Create MFO",
            "POST",
            "mfos",
            200,
            data={
                "name": "Test MFO",
                "description": "Test microloan organization",
                "logo_url": "https://example.com/logo.png",
                "website_url": "https://testmfo.com",
                "min_amount": 1000,
                "max_amount": 50000,
                "min_term": 1,
                "max_term": 30,
                "interest_rate": 1.5,
                "approval_rate": 85,
                "is_active": True
            }
        )
        if success and 'id' in response:
            self.created_mfo_id = response['id']
            print(f"   Created MFO ID: {self.created_mfo_id}")
        return success

    def test_get_mfos(self):
        """Test getting all MFOs"""
        success, response = self.run_test(
            "Get MFOs",
            "GET",
            "mfos",
            200
        )
        return success

    def test_get_public_mfos(self):
        """Test getting public MFOs"""
        success, response = self.run_test(
            "Get Public MFOs",
            "GET",
            "mfos/public",
            200,
            auth_required=False
        )
        return success

    def test_update_mfo(self):
        """Test updating an MFO"""
        if not self.created_mfo_id:
            print("❌ Skipping MFO update - no MFO created")
            return False
            
        success, response = self.run_test(
            "Update MFO",
            "PUT",
            f"mfos/{self.created_mfo_id}",
            200,
            data={
                "name": "Updated Test MFO",
                "interest_rate": 2.0
            }
        )
        return success

    def test_create_application(self):
        """Test creating a loan application"""
        if not self.created_mfo_id:
            print("❌ Skipping application creation - no MFO available")
            return False
            
        success, response = self.run_test(
            "Create Application",
            "POST",
            "applications",
            200,
            data={
                "mfo_id": self.created_mfo_id,
                "user_telegram_id": 123456789,
                "user_name": "Test User",
                "amount": 15000,
                "term": 14,
                "phone": "+79001234567"
            },
            auth_required=False
        )
        if success and 'id' in response:
            self.created_app_id = response['id']
            print(f"   Created Application ID: {self.created_app_id}")
        return success

    def test_get_applications(self):
        """Test getting all applications"""
        success, response = self.run_test(
            "Get Applications",
            "GET",
            "applications",
            200
        )
        return success

    def test_update_application_status(self):
        """Test updating application status"""
        if not self.created_app_id:
            print("❌ Skipping application status update - no application created")
            return False
            
        success, response = self.run_test(
            "Update Application Status",
            "PUT",
            f"applications/{self.created_app_id}/status?status=approved",
            200
        )
        return success

    def test_get_stats(self):
        """Test getting statistics"""
        success, response = self.run_test(
            "Get Statistics",
            "GET",
            "stats",
            200
        )
        return success

    def test_get_analytics(self):
        """Test getting analytics"""
        success, response = self.run_test(
            "Get Analytics",
            "GET",
            "analytics",
            200
        )
        return success

    def test_get_users(self):
        """Test getting bot users"""
        success, response = self.run_test(
            "Get Bot Users",
            "GET",
            "users",
            200
        )
        return success

    def test_track_mfo_click(self):
        """Test tracking MFO click"""
        if not self.created_mfo_id:
            print("❌ Skipping click tracking - no MFO available")
            return False
            
        success, response = self.run_test(
            "Track MFO Click",
            "POST",
            f"mfos/{self.created_mfo_id}/click?telegram_id=123456789",
            200,
            auth_required=False
        )
        return success

    def test_delete_mfo(self):
        """Test deleting an MFO"""
        if not self.created_mfo_id:
            print("❌ Skipping MFO deletion - no MFO created")
            return False
            
        success, response = self.run_test(
            "Delete MFO",
            "DELETE",
            f"mfos/{self.created_mfo_id}",
            200
        )
        return success

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200,
            auth_required=False
        )
        return success

def main():
    print("🚀 Starting Microloan Bot API Tests")
    print("=" * 50)
    
    tester = MicroloanBotAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Admin Registration", tester.test_auth_register),
        ("Get Current Admin", tester.test_auth_me),
        ("Create MFO", tester.test_create_mfo),
        ("Get MFOs", tester.test_get_mfos),
        ("Get Public MFOs", tester.test_get_public_mfos),
        ("Update MFO", tester.test_update_mfo),
        ("Track MFO Click", tester.test_track_mfo_click),
        ("Create Application", tester.test_create_application),
        ("Get Applications", tester.test_get_applications),
        ("Update Application Status", tester.test_update_application_status),
        ("Get Statistics", tester.test_get_stats),
        ("Get Analytics", tester.test_get_analytics),
        ("Get Bot Users", tester.test_get_users),
        ("Delete MFO", tester.test_delete_mfo),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            if not success:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n✅ All tests passed!")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())