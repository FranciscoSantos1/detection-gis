import sys
import json
from ultralytics import YOLO
import cv2
import numpy as np
import os

# Model paths
POOL_MODEL_PATH = "./pool-best.pt"
SOLAR_PANEL_MODEL_PATH = "solar-panel-best.pt"

# Load models
pool_model = YOLO(POOL_MODEL_PATH)
solar_panel_model = YOLO(SOLAR_PANEL_MODEL_PATH)

def draw_detections(image_path, detections, output_path):
    # Ler a imagem
    image = cv2.imread(image_path)
    
    # Desenhar cada detecção
    for det in detections:
        bbox = det["bbox"]
        conf = det["confidence"]
        name = det["name"]
        
        # Converter coordenadas para inteiros
        x1, y1, x2, y2 = map(int, bbox)
        
        # Definir cor (vermelho para piscina, azul para painel solar)
        color = (0, 0, 255) if name == "pool" else (255, 0, 0)
        
        # Desenhar retângulo
        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
        
        # Adicionar texto
        label = f"{name} {conf:.2f}"
        cv2.putText(image, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    
    # Salvar imagem com detecções
    cv2.imwrite(output_path, image)
    return output_path

def run_detection(image_path, model, label, name, latitude, longitude):
    results = model.predict(image_path)
    
    detections = [
        {
            "class": label,
            "name": name,
            "confidence": float(box.conf[0]),
            "bbox": [int(x) for x in box.xyxy[0].tolist()],
            "latitude": latitude if latitude is not None else 0.0,
            "longitude": longitude if longitude is not None else 0.0
        }
        for box in results[0].boxes
        if float(box.conf[0]) > 0.5 
    ]
    
    return detections

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run-solar-panel-and-pool-detection.py <image_path> [latitude] [longitude]")
        sys.exit(1)

    image_path = sys.argv[1]
    latitude = float(sys.argv[2]) if len(sys.argv) > 2 else None
    longitude = float(sys.argv[3]) if len(sys.argv) > 3 else None

    # Run detections for both models
    pool_detections = run_detection(image_path, pool_model, 1, "pool", latitude, longitude)
    solar_panel_detections = run_detection(image_path, solar_panel_model, 2, "solar_panel", latitude, longitude)

    # Combine results
    combined_detections = pool_detections + solar_panel_detections

    # Criar o caminho para a imagem com detecções
    output_dir = os.path.dirname(image_path)
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    output_path = os.path.join(output_dir, f"{base_name}_detections.jpg")

    # Desenhar e salvar a imagem com detecções
    detection_image_path = draw_detections(image_path, combined_detections, output_path)

    # Output results as JSON
    output = {
        "detections": combined_detections,
        "location": {
            "latitude": latitude,
            "longitude": longitude
        },
        "detection_image": output_path
    }

    print(json.dumps(output))