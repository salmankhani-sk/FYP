# Import the requests library, which is used to make HTTP requests in Python
import requests

# Define the headers required by the Nutritionix API for authentication
headers = {
    "x-app-id": "7141a873",  # Replace with your app ID
    "x-app-key": "df8437bd14067b55a7ecd603b1ba6f41",  # Replace with your API key
}

# Define the food item you want to query nutritional data for
data = {"query": "chicken breast"}   # This can be anything like "banana", "1 cup rice", etc.

# Send a POST request to Nutritionix's "natural/nutrients" endpoint
response = requests.post("https://trackapi.nutritionix.com/v2/natural/nutrients", headers=headers, json=data)
# Print the HTTP status code returned by the API (200 = OK, 401 = Unauthorized, etc.)
# Print the status code and the JSON response from the API
print(response.status_code)

# Print the actual nutritional data in JSON format
print(response.json())
