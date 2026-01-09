#!/usr/bin/env python3
"""Test script for the interventions library endpoint"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_get_all_interventions():
    """Test getting all interventions"""
    print("Testing: Get all interventions")
    response = requests.get(f"{BASE_URL}/library/interventions")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Count: {data['count']}")
    print(f"First intervention: {data['interventions'][0]['name']}")
    print("✓ Passed\n")


def test_get_specific_intervention():
    """Test getting a specific intervention by ID"""
    print("Testing: Get specific intervention (ID=1)")
    response = requests.get(f"{BASE_URL}/library/interventions?intervention_ids=1")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Count: {data['count']}")
    print(f"Intervention: {data['interventions'][0]['name']}")
    print("✓ Passed\n")


def test_get_multiple_interventions():
    """Test getting multiple interventions by IDs"""
    print("Testing: Get multiple interventions (IDs=1,3,5)")
    response = requests.get(f"{BASE_URL}/library/interventions?intervention_ids=1&intervention_ids=3&intervention_ids=5")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Count: {data['count']}")
    print(f"Interventions: {[i['name'] for i in data['interventions']]}")
    print("✓ Passed\n")


def test_get_user_interventions():
    """Test getting interventions filtered by user_id"""
    print("Testing: Get interventions for user_id=1")
    response = requests.get(f"{BASE_URL}/library/interventions?user_id=1")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Count: {data['count']}")
    if data['count'] > 0:
        print(f"User interventions: {[i['name'] for i in data['interventions']]}")
    else:
        print("No interventions completed by this user yet")
    print("✓ Passed\n")


def test_user_with_specific_ids():
    """Test getting specific interventions for a user"""
    print("Testing: Get interventions for user_id=1 with IDs=1,2")
    response = requests.get(f"{BASE_URL}/library/interventions?user_id=1&intervention_ids=1&intervention_ids=2")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Count: {data['count']}")
    if data['count'] > 0:
        print(f"Filtered interventions: {[i['name'] for i in data['interventions']]}")
    else:
        print("No matching interventions for this user")
    print("✓ Passed\n")


if __name__ == "__main__":
    print("=" * 60)
    print("INTERVENTIONS LIBRARY ENDPOINT TESTS")
    print("=" * 60 + "\n")
    
    try:
        test_get_all_interventions()
        test_get_specific_intervention()
        test_get_multiple_interventions()
        test_get_user_interventions()
        test_user_with_specific_ids()
        
        print("=" * 60)
        print("ALL TESTS PASSED!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
