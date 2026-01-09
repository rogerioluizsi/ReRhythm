"""
Test script for the journaling counseling endpoints.
"""
import requests

BASE_URL = "http://localhost:8000"

def test_counseling():
    # First, let's use an existing user (user_id=1 from previous tests)
    user_id = 1
    
    # Test 1: Start counseling
    print("=" * 50)
    print("TEST 1: Start Counseling Session")
    print("=" * 50)
    
    response = requests.post(
        f"{BASE_URL}/counseling/start",
        json={"user_id": user_id}
    )
    
    if response.status_code == 200:
        data = response.json()
        conversation_id = data["conversation_id"]
        print(f"✓ Conversation ID: {conversation_id}")
        print(f"✓ Initial Counseling:\n{data['counseling'][:500]}...")
        
        # Test 2: Follow-up
        print("\n" + "=" * 50)
        print("TEST 2: Follow-up Message")
        print("=" * 50)
        
        follow_response = requests.post(
            f"{BASE_URL}/counseling/followup",
            json={
                "conversation_id": conversation_id,
                "message": "I've been feeling anxious lately about work. Can you help me understand why?"
            }
        )
        
        if follow_response.status_code == 200:
            follow_data = follow_response.json()
            print(f"✓ Follow-up Response:\n{follow_data['counseling'][:500]}...")
        else:
            print(f"✗ Follow-up failed: {follow_response.status_code}")
            print(follow_response.json())
            
    elif response.status_code == 404:
        print(f"✗ Error: {response.json()['detail']}")
        print("  Note: Make sure user has journal entries. Run test_journaling.py first.")
    else:
        print(f"✗ Error: {response.status_code}")
        print(response.json())

if __name__ == "__main__":
    test_counseling()
