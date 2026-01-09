"""
Test script for wearable endpoints
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_wearable_endpoints():
    print("=" * 60)
    print("Testing Wearable Endpoints")
    print("=" * 60)
    
    # First, let's create a test user (or use existing)
    # Assuming user_id 1 exists from previous tests
    test_user_id = 1
    
    # Test 1: POST /user/wearable - Save wearable data
    print("\n1. Testing POST /user/wearable")
    print("-" * 60)
    
    wearable_payload = {
        "user_id": test_user_id,
        "wearable_data": json.dumps({
            "date": "2026-01-08",
            "steps": 8500,
            "heart_rate": {
                "average": 72,
                "resting": 65,
                "max": 145
            },
            "sleep": {
                "total_hours": 7.5,
                "deep_sleep_hours": 2.0,
                "rem_sleep_hours": 1.5
            },
            "active_minutes": 45,
            "calories_burned": 2100
        })
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/user/wearable",
            json=wearable_payload
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Successfully saved wearable data")
        else:
            print("❌ Failed to save wearable data")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Add another wearable data entry for testing
    print("\n2. Adding another wearable data entry")
    print("-" * 60)
    
    wearable_payload_2 = {
        "user_id": test_user_id,
        "wearable_data": json.dumps({
            "date": "2026-01-07",
            "steps": 12000,
            "heart_rate": {
                "average": 70,
                "resting": 63,
                "max": 150
            },
            "sleep": {
                "total_hours": 8.0,
                "deep_sleep_hours": 2.5,
                "rem_sleep_hours": 2.0
            },
            "active_minutes": 60,
            "calories_burned": 2300
        })
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/user/wearable",
            json=wearable_payload_2
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Successfully saved second wearable data")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 2: GET /user/wearable/view - Get summarized wearable data
    print("\n3. Testing GET /user/wearable/view")
    print("-" * 60)
    
    try:
        response = requests.get(
            f"{BASE_URL}/user/wearable/view",
            params={"user_id": test_user_id}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Successfully retrieved and summarized wearable data")
        else:
            print("❌ Failed to retrieve wearable data")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    # Test 3: Test with non-existent user
    print("\n4. Testing with non-existent user (should fail)")
    print("-" * 60)
    
    try:
        response = requests.get(
            f"{BASE_URL}/user/wearable/view",
            params={"user_id": 99999}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 404:
            print("✅ Correctly returned 404 for non-existent user")
        else:
            print("❌ Unexpected response for non-existent user")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    print("\n" + "=" * 60)
    print("Testing Complete!")
    print("=" * 60)


if __name__ == "__main__":
    test_wearable_endpoints()
