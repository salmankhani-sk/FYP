import requests

headers = {
    "x-app-id": "7141a873",  # Replace with your app ID
    "x-app-key": "df8437bd14067b55a7ecd603b1ba6f41",  # Replace with your API key
}
data = {"query": "chicken breast"}  # Test food item
response = requests.post("https://trackapi.nutritionix.com/v2/natural/nutrients", headers=headers, json=data)
print(response.status_code)
print(response.json())
