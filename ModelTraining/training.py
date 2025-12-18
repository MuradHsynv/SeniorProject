import torch
from ultralytics import YOLO
from roboflow import Roboflow
import multiprocessing
import os
from dotenv import load_dotenv

load_dotenv()


def main():

    if torch.cuda.is_available():
        print(f"✅ GPU Found: {torch.cuda.get_device_name(0)}")
        device = 0
    else:
        print("❌ GPU Not Found, will resume with cpu.")
        device = 'cpu'

    api_key = os.environ.get("ROBOFLOW_API_KEY")

    if not api_key:
        raise ValueError("API Key not found.")

    rf = Roboflow(api_key=api_key)
    project = rf.workspace(
        "seniorproject-bmukm").project("modeltraining-m0qg2")
    version = project.version(13)
    dataset = version.download("yolov8")

    data_yaml_path = f"{dataset.location}/data.yaml"
    print(f"Dataset: {dataset.location}")

    model = YOLO('yolov8n.pt')

    results = model.train(
        data=data_yaml_path,  # İndirilen verinin ayar dosyasını otomatik bulur
        epochs=100,          # 100 rounds
        imgsz=640,           # Image size
        batch=32,            # Change based on your gpu vram
        device=device,       # GPU usage
        workers=4,
        patience=20,         # Stop early if no progress
        name='coffee_assistant_model',
        verbose=True
    )

    # int8=True for Quantization
    model.export(format='tflite', int8=False)


if __name__ == '__main__':
    multiprocessing.freeze_support()
    main()
