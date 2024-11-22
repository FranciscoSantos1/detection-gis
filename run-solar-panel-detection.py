import sys
import json
from ultralytics import YOLO

# model = YOLO("/home/franciscosantos/workspace/IPVC/PROJECT_III/pool-detection-gis/solar-panel-best.pt")
model = YOLO("/Users/joqui/OneDrive/Desktop/IPVC/3ano/1semestre/PROJETO_3/pool-detection-gis/solar-panel-best.pt")

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
    if len(sys.argv) < 2:
        print("Usage: python run-solar-panel-detection.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    detections = run_detection(image_path)
    print(json.dumps(detections)) 