import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000"

# Test user (using anonymous user 1)
TEST_DEVICE_ID = "test_device_anon"

def get_user_id():
    """Login to get user ID"""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"device_id": TEST_DEVICE_ID}
    )
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Logged in as user_id: {data['user_id']}")
        return data['user_id']
    else:
        print(f"✗ Login failed: {response.text}")
        return None

def add_wearable_data(user_id):
    """Add mock wearable data for the user"""
    wearable_data = {
        "heart_rate": {
            "average": 78,
            "resting": 65,
            "max": 142
        },
        "sleep": {
            "hours": 5.5,
            "quality": "poor",
            "deep_sleep_minutes": 45
        },
        "activity": {
            "steps": 3200,
            "active_minutes": 15
        },
        "hrv": {
            "value": 35,
            "status": "below_normal"
        }
    }
    
    # Direct database insert (create endpoint helper)
    print(f"\n📊 Mock wearable data to be synced:")
    print(json.dumps(wearable_data, indent=2))
    return json.dumps(wearable_data)

def test_checkin_analyze(user_id, wearable_data_str):
    """Test the /check-in/analyze endpoint"""
    
    # Mock check-in data based on the example
    checkin_data = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "checkInType": "stress_assessment",
        "data": {
            "stressLevel": {
                "value": 8,
                "scaleMax": 10,
                "label": "High"
            },
            "currentCapacity": {
                "value": 3,
                "scaleMax": 10,
                "label": "Low"
            },
            "sleepDebt": {
                "value": 7,
                "scaleMax": 10,
                "label": "Significant debt"
            },
            "illnessSymptoms": {
                "value": 0,
                "scaleMax": 10,
                "label": "None"
            },
            "userNotes": "Had a really tough shift yesterday at Memorial Hospital. Patient John Doe coded unexpectedly and I froze for a moment. Barely slept last night, keeps replaying in my head. Meeting with Dr. Sarah Smith tomorrow about it."
        }
    }
    
    print(f"\n📝 Check-in data being sent:")
    print(json.dumps(checkin_data, indent=2))
    
    # Prepare request payload
    payload = {
        "user_id": user_id,
        "check_in_data": json.dumps(checkin_data)
    }
    
    print(f"\n🔄 Calling POST /check-in/analyze...")
    
    # Call the endpoint
    response = requests.post(
        f"{BASE_URL}/check-in/analyze",
        json=payload
    )
    
    print(f"\n📡 Response Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ SUCCESS! Check-in analyzed\n")
        print("=" * 60)
        print("SANITIZED TEXT (sensitive data removed):")
        print("=" * 60)
        print(result['sanitized_text'])
        print("\n" + "=" * 60)
        print("RECOMMENDED INTERVENTIONS:")
        print("=" * 60)
        print(f"IDs: {result['recommended_intervention_ids']}")
        print("\n" + "=" * 60)
        print("AI REASONING:")
        print("=" * 60)
        print(result['ai_reasoning'])
        print("\n" + "=" * 60)
    else:
        print(f"\n✗ FAILED!")
        print(f"Error: {response.text}")

def insert_wearable_data_db(user_id, wearable_data_str):
    """Insert wearable data directly into database using SQLAlchemy"""
    import sys
    sys.path.insert(0, '/root/vscodeprojects/doraproject/backend')
    
    from app.database import SessionLocal
    from app.models import WearableData
    from datetime import datetime
    
    db = SessionLocal()
    try:
        wearable = WearableData(
            user_id=user_id,
            wearable_data=wearable_data_str,
            created_at=datetime.utcnow()
        )
        db.add(wearable)
        db.commit()
        print(f"✓ Wearable data inserted into database for user {user_id}")
    except Exception as e:
        print(f"✗ Failed to insert wearable data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("TESTING CHECK-IN ANALYZE ENDPOINT")
    print("=" * 60)
    
    # Step 1: Get user ID
    user_id = get_user_id()
    if not user_id:
        print("Cannot proceed without user_id")
        exit(1)
    
    # Step 2: Add wearable data
    wearable_data_str = add_wearable_data(user_id)
    insert_wearable_data_db(user_id, wearable_data_str)
    
    # Step 3: Test check-in analyze
    test_checkin_analyze(user_id, wearable_data_str)
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
