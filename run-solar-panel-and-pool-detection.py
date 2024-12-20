import sys
import json
from ultralytics import YOLO

# Model paths
POOL_MODEL_PATH = "/Users/joqui/OneDrive/Desktop/IPVC/3ano/1semestre/PROJETO_3/pool-detection-gis/pool-best.pt"
SOLAR_PANEL_MODEL_PATH = "/Users/joqui/OneDrive/Desktop/IPVC/3ano/1semestre/PROJETO_3/pool-detection-gis/solar-panel-best.pt"

# Load models
pool_model = YOLO(POOL_MODEL_PATH)
solar_panel_model = YOLO(SOLAR_PANEL_MODEL_PATH)

def run_detection(image_path, model, label):
    results = model.predict(image_path)

    detections = [
        {
            "class": label,
            "confidence": box.conf[0].item(),
            "bbox": box.xyxy[0].tolist()
        }
        for box in results[0].boxes
    ]

    return detections

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run-detection.py <image_path> [latitude] [longitude]")
        sys.exit(1)

    image_path = sys.argv[1]
    latitude = sys.argv[2] if len(sys.argv) > 2 else None
    longitude = sys.argv[3] if len(sys.argv) > 3 else None

    # Log latitude and longitude if provided
    if latitude and longitude:
        print(f"Latitude: {latitude}, Longitude: {longitude}")

    # Run detections for both models
    pool_detections = run_detection(image_path, pool_model, 1)  # Class 1 for pool
    solar_panel_detections = run_detection(image_path, solar_panel_model, 2)  # Class 2 for solar panel

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
