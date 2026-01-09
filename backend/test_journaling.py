import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_journal_create():
    """Test creating journal entries"""
    print("\n=== Testing Journal Creation ===")
    
    # Test with 7_days expiration
    payload = {
        "user_id": 1,
        "journal_description": "Today was a challenging day. I practiced my breathing exercises and felt more centered.",
        "expiration_type": "7_days"
    }
    
    response = requests.post(f"{BASE_URL}/journal/create", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Test with 30_days expiration
    payload2 = {
        "user_id": 1,
        "journal_description": "Feeling grateful for the progress I've made. The grounding techniques are really helping.",
        "expiration_type": "30_days"
    }
    
    response2 = requests.post(f"{BASE_URL}/journal/create", json=payload2)
    print(f"\nStatus Code: {response2.status_code}")
    print(f"Response: {json.dumps(response2.json(), indent=2)}")
    
    # Test with delete_manually
    payload3 = {
        "user_id": 1,
        "journal_description": "Important milestone: completed my first week of interventions consistently.",
        "expiration_type": "delete_manually"
    }
    
    response3 = requests.post(f"{BASE_URL}/journal/create", json=payload3)
    print(f"\nStatus Code: {response3.status_code}")
    print(f"Response: {json.dumps(response3.json(), indent=2)}")


def test_journal_history():
    """Test retrieving journal history"""
    print("\n=== Testing Journal History ===")
    
    response = requests.get(f"{BASE_URL}/journal/history", params={"user_id": 1})
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        entries = response.json()
        print(f"Found {len(entries)} journal entries:")
        for entry in entries:
            print(f"\n  ID: {entry['id']}")
            print(f"  Date: {entry['date']}")
            print(f"  Journal: {entry['journal'][:50]}...")
            print(f"  Expires At: {entry['expires_at']}")
    else:
        print(f"Error: {response.json()}")


def test_journal_delete():
    """Test deleting a journal entry"""
    print("\n=== Testing Journal Deletion ===")
    
    # First, get all entries
    response = requests.get(f"{BASE_URL}/journal/history", params={"user_id": 1})
    
    if response.status_code == 200 and len(response.json()) > 0:
        entry_id = response.json()[0]['id']
        print(f"Deleting entry with ID: {entry_id}")
        
        delete_response = requests.delete(f"{BASE_URL}/journal/entry/{entry_id}")
        print(f"Status Code: {delete_response.status_code}")
        print(f"Response: {json.dumps(delete_response.json(), indent=2)}")
        
        # Verify it's deleted
        print("\nVerifying deletion...")
        verify_response = requests.get(f"{BASE_URL}/journal/history", params={"user_id": 1})
        print(f"Remaining entries: {len(verify_response.json())}")
    else:
        print("No entries found to delete")


def test_invalid_expiration_type():
    """Test with invalid expiration type"""
    print("\n=== Testing Invalid Expiration Type ===")
    
    payload = {
        "user_id": 1,
        "journal_description": "This should fail",
        "expiration_type": "invalid_type"
    }
    
    response = requests.post(f"{BASE_URL}/journal/create", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def test_nonexistent_user():
    """Test with non-existent user"""
    print("\n=== Testing Non-Existent User ===")
    
    payload = {
        "user_id": 99999,
        "journal_description": "This should fail",
        "expiration_type": "7_days"
    }
    
    response = requests.post(f"{BASE_URL}/journal/create", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


if __name__ == "__main__":
    try:
        print("Starting Journal API Tests...")
        print(f"Base URL: {BASE_URL}")
        
        # Run tests
        test_journal_create()
        test_journal_history()
        test_journal_delete()
        test_invalid_expiration_type()
        test_nonexistent_user()
        
        print("\n=== All Tests Complete ===")
        
    except requests.exceptions.ConnectionError:
        print(f"\nError: Could not connect to {BASE_URL}")
        print("Make sure the server is running with: uvicorn app.main:app --reload")
    except Exception as e:
        print(f"\nError occurred: {str(e)}")
