
import json
import time
import random
from datetime import datetime

INPUT_FILE = "input.json"

def generate_sensor_data():
    """Generates random sensor data and writes it to input.json in line-delimited JSON format."""
    print(f"Sensor Simulator started. Writing to {INPUT_FILE}...")
    while True:
        # Generate data
        # Normal ranges: Electricity 0-15, Water 0-200
        # Spikes occur randomly
        electricity = random.uniform(5, 12)
        water = random.uniform(50, 180)
        
        # Randomly introduce anomalies (5% chance)
        if random.random() < 0.05:
            electricity = random.uniform(21, 35) # Spike
        if random.random() < 0.05:
            water = random.uniform(251, 500) # Leak
            
        data = {
            "timestamp": datetime.now().isoformat(),
            "electricity": round(electricity, 2),
            "water": round(water, 2)
        }
        
        # Append to line-delimited JSON file
        with open(INPUT_FILE, "a") as f:
            f.write(json.dumps(data) + "\n")
            
        print(f"Sent: {data}")
        time.sleep(2)

if __name__ == "__main__":
    generate_sensor_data()
