
import pathway as pw
import json
from datetime import datetime

# Logic for Anomaly Detection
def detect_anomaly(electricity: float, water: float) -> str:
    if electricity > 20:
        return "Electricity Spike Detected"
    elif water > 250:
        return "Water Leakage Detected"
    return "Normal"

def run_engine():
    # Read the streaming input
    # schema_data defines the structure of input JSON
    sensor_stream = pw.io.fs.read(
        "input.json",
        format="json",
        schema=pw.schema_from_dict({
            "timestamp": str,
            "electricity": float,
            "water": float
        })
    )

    # Apply Anomaly detection logic
    # Note: pw.apply expects a function and column expressions
    enriched_stream = sensor_stream.select(
        *pw.this,
        anomaly=pw.apply(detect_anomaly, pw.this.electricity, pw.this.water)
    )

    # Write the processed stream to output.json
    pw.io.fs.write(enriched_stream, "output.json", format="json")

    # Start the streaming pipeline
    print("Pathway Engine started. Processing input.json -> output.json...")
    pw.run()

if __name__ == "__main__":
    run_engine()
