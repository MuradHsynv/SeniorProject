from ultralytics import YOLO
import os


def main():

    model_path = r"C:\Users\murat\CMA_project\SeniorProject\ModelTraining\runs\detect\kahve_asistani\weights\best.pt"

    if not os.path.exists(model_path):
        print(f"❌ Model file not found!\nPath: {model_path}")
        return

    model = YOLO(model_path)

    output_files = model.export(
        format='tflite',
        int8=False,      # Quantization off
        nms=True
    )

    print(f"Your tflite file: {output_files}")


if __name__ == '__main__':
    main()
