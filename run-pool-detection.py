import sys
import json
from ultralytics import YOLO


model = YOLO("best.pt")

def run_detection(image_path):
    results = model.predict(image_path)

    detections = [
        {
            "class": box.cls[0].item(),
            "confidence": box.conf[0].item(),
            "bbox": box.xyxy[0].tolist()
        }
        for box in results[0].boxes
    ]

    return detections

if __name__ == "__main__":
    image_path = sys.argv[1]
    detections = run_detection(image_path)
    print(json.dumps(detections))