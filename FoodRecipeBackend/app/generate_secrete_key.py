# Import the 'secrets' module, which is used to generate cryptographically secure random numbers and strings
import secrets

# Generate a random 32-byte (256-bit) hexadecimal string. This is suitable for use as a secret key.
secret_key = secrets.token_hex(32)

# Print the generated key to the console
print("Generated secret key: ", secret_key)
      