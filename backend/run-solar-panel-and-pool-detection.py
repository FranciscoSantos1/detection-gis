import sys
import json
from ultralytics import YOLO

# Model paths
POOL_MODEL_PATH = "./pool-best.pt"
SOLAR_PANEL_MODEL_PATH = "solar-panel-best.pt"

# Load models
pool_model = YOLO(POOL_MODEL_PATH)
solar_panel_model = YOLO(SOLAR_PANEL_MODEL_PATH)

def run_detection(image_path, model, label, name, latitude, longitude):
    results = model.predict(image_path)

    detections = [
        {
            "class": label,
            "name": name,
            "confidence": box.conf[0].item(),
            "bbox": box.xyxy[0].tolist(),
            "latitude": latitude if latitude is not None else 0.0,
            "longitude": longitude if longitude is not None else 0.0
        }
        for box in results[0].boxes
    ]

    return detections

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run-solar-panel-and-pool-detection.py <image_path> [latitude] [longitude]")
        sys.exit(1)

    image_path = sys.argv[1]
    latitude = float(sys.argv[2]) if len(sys.argv) > 2 else None
    longitude = float(sys.argv[3]) if len(sys.argv) > 3 else None

    # Log latitude and longitude if provided
    if latitude is not None and longitude is not None:
        print(f"Latitude: {latitude}, Longitude: {longitude}")

    # Run detections for both models
    pool_detections = run_detection(image_path, pool_model, 1, "pool", latitude, longitude)  # Class 1 for pool
    solar_panel_detections = run_detection(image_path, solar_panel_model, 2, "solar_panel", latitude, longitude)  # Class 2 for solar panel

    # Combine results
    combined_detections = pool_detections + solar_panel_detections

    # Output results as JSON
    output = {
        "detections": combined_detections,
        "location": {
            "latitude": latitude,
            "longitude": longitude
        }
    }

    print(json.dumps(output))