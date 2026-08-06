import requests
import json

url = "https://hwvgcysmcexffuoywnol.supabase.co/functions/v1/challenge-login"
headers = {
    "Content-Type": "application/json",
    "apikey": "sb_publishable_bP5LEGE9oUdP7mLeTRIMUg_mPzsJE_O"
}
payload = {
    "method": "phone",
    "identifier": "+2349068225316",
    "phone": "+2349068225316",
    "password": "Empiremill10##"
}

print("Testing challenge-login edge function...")
res = requests.post(url, headers=headers, json=payload)
print("Status Code:", res.status_code)
print("Response Body:", res.text)
