# WebGIS with LLM Virtual Assistant for Pool and Solar Panel Detection

This project was developed as part of the "Aprendizagem Organizacional" course at the Polytechnic Institute of Viana do Castelo (IPVC), academic year 2024/2025. It builds upon [Project 3](https://github.com/FranciscoSantos1/detection-gis), whose main goal was to create a WebGIS system capable of automatically detecting swimming pools and solar panels in satellite images. The initial project provided an integrated technological solution to support geospatial analysis, with potential applications in urban planning, environmental monitoring, and resource management.

## What's New

- **LLM Virtual Assistant Integration:**  
  Users can now ask questions in natural language (e.g., "How many pools are in this image?" or "Where are the solar panels located?") and receive automatic answers based on the latest detections.
- **Privacy and Autonomy:**  
  The language model (LLM) runs locally via [Ollama](https://ollama.com/), ensuring data privacy and independence from cloud services.
- **New Backend Endpoint:**  
  The `/ask-llm` (POST) endpoint receives user questions, gathers the latest detections and annotated images, builds the context, and queries the LLM for a response.
- **New Frontend Component:**  
  The `LLMChat` component allows users to interact with the assistant, view the last five questions/answers, and export results as a PDF.

## How to Run

1. **Prerequisites:**  
   Make sure you have Docker and Docker Compose installed.
2. **Start the services:**  
   ```sh
   docker compose up
   ```
3. **Download the LLM model (e.g., llava):** 
   ```sh
   docker exec -it ollama ollama pull llava
   ```
4. **Acess the application:** 

    The frontend will be available at ``` http://localhost:3000```


## How the Virtual Assistant Works

1. The user enters a question in the chat (`LLMChat`).
2. The frontend generates a map image and sends it to the backend (`/detect`).
3. The backend processes the image, detects objects, and saves the results.
4. The frontend then sends the question and the annotated image filename to the `/ask-llm` endpoint.
5. The backend:
   - Validates the prompt.
   - Retrieves the latest detection with an annotated image.
   - Reads and encodes the image in base64.
   - Gathers associated detections and generates a summary.
   - Builds the context and sends it to the LLM (Ollama).
   - Returns the generated answer to the user.
6. The frontend displays the answer, keeps a history of the last five interactions, and allows exporting the results and annotated image as a PDF.

## Summary of Additions

- **Ollama integration** for local LLM inference.
- `/ask-llm` endpoint in the backend for LLM communication.
- `LLMChat` frontend component for natural interaction and result export.

## Developed by: 
**Francisco Santos**  and **João Araújo**