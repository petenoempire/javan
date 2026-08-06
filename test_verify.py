import requests

url = "https://hwvgcysmcexffuoywnol.supabase.co/functions/v1/challenge-login"
headers = {
    "Content-Type": "application/json",
    "apikey": "sb_publishable_bP5LEGE9oUdP7mLeTRIMUg_mPzsJE_O"
}
payload = {
    "step": "verify",
    "method": "phone",
    "identifier": "+2349068225316",
    "code": "12345"
}

res = requests.post(url, headers=headers, json=payload)
print("Verify Status Code:", res.status_code)
print("Verify Response Body:", res.text)
