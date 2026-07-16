import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=== Testing New Features ===")

    # 1. Register users (Admin and Auditor)
    print("\n1. Registering admin and auditor...")
    admin_payload = {
        "username": "super_admin_user",
        "email": "super_admin@example.com",
        "password": "SecurePassword123!",
        "role": "super_admin",
        "department": "Security"
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=admin_payload)
    print("Admin Reg:", r.status_code)
    admin_id = r.json().get("id")

    auditor_payload = {
        "username": "auditor_user_test",
        "email": "auditor_test@example.com",
        "password": "SecurePassword123!",
        "role": "auditor",
        "department": "Compliance"
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=auditor_payload)
    print("Auditor Reg:", r.status_code)

    # Login Auditor for later oversight calls
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "auditor_user_test",
        "password": "SecurePassword123!"
    })
    auditor_token = r.json().get("access_token")
    auditor_headers = {"Authorization": f"Bearer {auditor_token}"}

    # --- TEST 1: Kill-Chain Correlation (ACCOUNT_TAKEOVER_CHAIN) ---
    print("\n--- Test 1: Kill-Chain Correlation ---")
    
    # Login once from IP A to set last_known_ip
    print("Logging in first time from IP A...")
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "super_admin_user",
        "password": "SecurePassword123!"
    }, headers={"X-Forwarded-For": "10.0.0.1"})
    print("Login 1 Status:", r.status_code)

    # Perform 5 failed logins to trigger FAILED_LOGIN_VELOCITY on next attempt
    print("Generating 5 failed login attempts...")
    for i in range(5):
        requests.post(f"{BASE_URL}/auth/login", json={
            "username": "super_admin_user",
            "password": "WrongPassword!"
        })

    # Login from IP B (triggers NEW_SOURCE_IP and FAILED_LOGIN_VELOCITY)
    print("Logging in second time from IP B (triggers FAILED_LOGIN_VELOCITY + NEW_SOURCE_IP)...")
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "super_admin_user",
        "password": "SecurePassword123!"
    }, headers={"X-Forwarded-For": "10.0.0.2"})
    print("Login 2 Status:", r.status_code)
    admin_token = r.json().get("access_token")
    admin_headers = {
        "Authorization": f"Bearer {admin_token}",
        "X-Forwarded-For": "10.0.0.2"
    }

    # Perform privileged action (triggers SENSITIVE_ACTION_TYPE -> triggers Kill-Chain)
    print("Performing privileged action to trigger SENSITIVE_ACTION_TYPE & Kill-Chain...")
    action_payload = {
        "action": "EXPORT_DATA",
        "resource": "vault-db"
    }
    r = requests.post(f"{BASE_URL}/privileged/action", json=action_payload, headers=admin_headers)
    print("Privileged Action Status (Expected 423):", r.status_code)
    print("Privileged Action Response:", r.json())


    # --- TEST 2: Bulk Access / Duress Rule ---
    print("\n--- Test 2: Bulk Access / Duress Rule ---")
    
    # Register and login a clean admin
    print("Registering and logging in clean admin...")
    clean_admin_payload = {
        "username": "clean_admin",
        "email": "clean@example.com",
        "password": "SecurePassword123!",
        "role": "admin",
        "department": "Security"
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=clean_admin_payload)
    clean_admin_id = r.json().get("id")

    r = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "clean_admin",
        "password": "SecurePassword123!"
    })
    clean_token = r.json().get("access_token")
    clean_headers = {"Authorization": f"Bearer {clean_token}"}

    # Access 5 resources (limit is 5, 6 will breach)
    for i in range(1, 6):
        res = f"db-resource-{i}"
        print(f"Accessing resource: {res}")
        r = requests.post(f"{BASE_URL}/privileged/action", json={
            "action": "READ_RECORD",
            "resource": res
        }, headers=clean_headers)
        print(f"Access {i} status:", r.status_code)

    # 6th access should trigger BULK_ACCESS_BREACH and lock
    print("Accessing 6th distinct resource (should trigger BULK_ACCESS_BREACH)...")
    r = requests.post(f"{BASE_URL}/privileged/action", json={
        "action": "READ_RECORD",
        "resource": "db-resource-6"
    }, headers=clean_headers)
    print("Access 6 status (Expected 423):", r.status_code)
    print("Access 6 response:", r.json())


    # --- TEST 3: Oversight Endpoints ---
    print("\n--- Test 3: Oversight Endpoints ---")
    
    # GET /audit/locked-accounts (as auditor)
    print("Listing locked accounts (as auditor)...")
    r = requests.get(f"{BASE_URL}/audit/locked-accounts", headers=auditor_headers)
    print("Locked accounts status:", r.status_code)
    locked_users = r.json()
    print("Locked accounts list:")
    for user in locked_users:
        print(f"  - {user['username']}: Locked={user['is_locked']}, Reason='{user['lock_reason']}'")

    # POST /audit/locked-accounts/{user_id}/unlock (as super_admin)
    # Since super_admin_user is locked, let's login/re-register a clean super_admin to unlock
    print("Registering clean super_admin to unlock accounts...")
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "username": "clean_super",
        "email": "clean_super@example.com",
        "password": "SecurePassword123!",
        "role": "super_admin",
        "department": "Security"
    })
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "clean_super",
        "password": "SecurePassword123!"
    })
    super_token = r.json().get("access_token")
    super_headers = {"Authorization": f"Bearer {super_token}"}

    print(f"Unlocking user: {clean_admin_id} (clean_admin)...")
    r = requests.post(f"{BASE_URL}/audit/locked-accounts/{clean_admin_id}/unlock", headers=super_headers)
    print("Unlock status:", r.status_code)
    print("Unlock response:", r.json())

    # Verify user is unlocked
    print("Listing locked accounts again...")
    r = requests.get(f"{BASE_URL}/audit/locked-accounts", headers=auditor_headers)
    print("Locked accounts list:")
    for user in r.json():
        print(f"  - {user['username']}: Locked={user['is_locked']}, Reason='{user['lock_reason']}'")

    # GET /audit/last-access/{resource}
    print("Getting last accessor for db-resource-3...")
    r = requests.get(f"{BASE_URL}/audit/last-access/db-resource-3", headers=auditor_headers)
    print("Last access status:", r.status_code)
    print("Last access response:", r.json())

if __name__ == "__main__":
    run_tests()
