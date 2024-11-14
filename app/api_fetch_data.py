import requests
import psycopg2
import json
# Fetch data from the API

with open('env.json') as f:
    config = json.load(f)

api_key = config['api_key']
url = f"https://mc-api.marketcheck.com/v2/search/car/active?api_key={api_key}&car_type=new&zip=08002&include_relevant_links=true"

# used The Field, KOP, CherryHill, mixture of used and new
response = requests.get(url)
data = response.json()

connection = psycopg2.connect(
    host=config['host'],
    database=config['database'],
    user=config['user'],
    password=config['password']
)
cursor = connection.cursor()

# Extract and insert data for each vehicle
for listing in data["listings"]:
    # Check and extract Vehicle fields
    vin = listing.get("vin")
    make = listing["build"].get("make")
    model = listing["build"].get("model")
    year = listing["build"].get("year")
    price = listing.get("price")
    mileage = listing.get("miles")
    body_type = listing["build"].get("body_type")
    drivetrain = listing["build"].get("drivetrain")
    condition = listing.get("inventory_type")
    status = listing.get("status", "active")  # Default to 'active' if missing

    # Check if all required Vehicle fields are present
    if all([vin, make, model, year, price, mileage, body_type, drivetrain, condition]):
        # Insert data into Vehicle table
        cursor.execute("""
            INSERT INTO Vehicle (vin, make, model, bodytype, drivetrain, price, mileage, condition, yearofmanufacture, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (vin) DO NOTHING;
        """, (vin, make, model, body_type, drivetrain, price, mileage, condition, year, status))

    # Check and extract Specs fields
    exterior_color = listing.get("exterior_color")
    interior_color = listing.get("interior_color")
    engine_type = listing["build"].get("engine")
    num_seats = listing["build"].get("std_seating")
    transmission = listing["build"].get("transmission")
    fuel_type = listing["build"].get("fuel_type")

    # Check if all required Specs fields are present
    if all([vin, exterior_color, interior_color, engine_type, num_seats, transmission, fuel_type]):
        # Insert data into Specs table
        cursor.execute("""
            INSERT INTO Specs (vin, exteriorcolor, interiorcolor, enginetype, numberofseats, transmission, fueltype)
            VALUES (%s, %s, %s, %s, %s, %s, %s);
        """, (vin, exterior_color, interior_color, engine_type, num_seats, transmission, fuel_type))

# Commit and close the database connection
connection.commit()
cursor.close()
connection.close()

print("Data has been inserted into the database.")
