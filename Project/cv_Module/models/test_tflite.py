import tensorflow as tf
import os
import sys
import numpy as np
import cv2 # Import OpenCV
import time

print(f"Python executable: {sys.executable}") # See which python is running

# --- COCO Labels (Hardcoded, since not using tflite-support) ---
COCO_LABELS = {
    1: 'person', 2: 'bicycle', 3: 'car', 4: 'motorcycle', 5: 'airplane',
    6: 'bus', 7: 'train', 8: 'truck', 9: 'boat', 10: 'traffic light',
    11: 'fire hydrant', 13: 'stop sign', 14: 'parking meter', 15: 'bench',
    16: 'bird', 17: 'cat', 18: 'dog', 19: 'horse', 20: 'sheep', 21: 'cow',
    22: 'elephant', 23: 'bear', 24: 'zebra', 25: 'giraffe', 27: 'backpack',
    28: 'umbrella', 31: 'handbag', 32: 'tie', 33: 'suitcase', 34: 'frisbee',
    35: 'skis', 36: 'snowboard', 37: 'sports ball', 38: 'kite', 39: 'baseball bat',
    40: 'baseball glove', 41: 'skateboard', 42: 'surfboard', 43: 'tennis racket',
    44: 'bottle', 46: 'wine glass', 47: 'cup', 48: 'fork', 49: 'knife', 50: 'spoon',
    51: 'bowl', 52: 'banana', 53: 'apple', 54: 'sandwich', 55: 'orange',
    56: 'broccoli', 57: 'carrot', 58: 'hot dog', 59: 'pizza', 60: 'donut',
    61: 'cake', 62: 'chair', 63: 'couch', 64: 'potted plant', 65: 'bed',
    67: 'dining table', 70: 'toilet', 72: 'tv', 73: 'laptop', 74: 'mouse',
    75: 'remote', 76: 'keyboard', 77: 'cell phone', 78: 'microwave', 79: 'oven',
    80: 'toaster', 81: 'sink', 82: 'refrigerator', 84: 'book', 85: 'clock',
    86: 'vase', 87: 'scissors', 88: 'teddy bear', 89: 'hair drier', 90: 'toothbrush'
}

# --- Configuration ---
script_dir = os.path.dirname(os.path.abspath(__file__))
TFLITE_MODEL_PATH = os.path.join(script_dir, 'efficientdet_lite2_coco_metadata.tflite')
# --- IMPORTANT: Define path to the test image ---
# Assumes test_image.jpg is ONE level UP from the script (in cv_Module folder)
IMAGE_PATH = os.path.join(script_dir, '..', 'test_image.jpg')
CONFIDENCE_THRESHOLD = 0.5 # Minimum score to display

print(f"Looking for model at: {TFLITE_MODEL_PATH}")
print(f"Looking for image at: {IMAGE_PATH}")

# --- Load Model ---
try:
    print("Attempting to load TFLite model using tf.lite.Interpreter...")
    interpreter = tf.lite.Interpreter(model_path=TFLITE_MODEL_PATH)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    print("Model loaded successfully!")
    # Get expected input shape and type
    input_shape = input_details[0]['shape'] # e.g., [1, 448, 448, 3]
    input_height = input_shape[1]
    input_width = input_shape[2]
    input_type = input_details[0]['dtype'] # e.g., <class 'numpy.uint8'>
    print(f"Input details: Shape={input_shape}, Type={input_type}")

except Exception as e:
    print(f"ERROR: Could not load model: {e}")
    sys.exit(1) # Exit if model loading fails

# --- Load and Preprocess Image ---
try:
    print(f"Loading image: {IMAGE_PATH}")
    img_bgr = cv2.imread(IMAGE_PATH)
    if img_bgr is None:
        raise FileNotFoundError("Image not found or could not be read.")

    original_h, original_w = img_bgr.shape[:2] # Get original dimensions
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB) # Convert to RGB
    img_resized = cv2.resize(img_rgb, (input_width, input_height)) # Resize

    # Prepare input tensor - MUST match model's expected type
    input_data = np.expand_dims(img_resized, axis=0) # Add batch dimension
    if input_data.dtype != input_type:
         print(f"Casting input data to required type: {input_type}")
         input_data = input_data.astype(input_type) # Ensure correct type (e.g., uint8)
    print(f"Image loaded and preprocessed. Input shape: {input_data.shape}, Type: {input_data.dtype}")

except FileNotFoundError as e:
     print(f"ERROR: {e}. Please ensure 'test_image.jpg' exists at '{IMAGE_PATH}'.")
     sys.exit(1)
except Exception as e:
    print(f"ERROR: Could not load or preprocess image: {e}")
    sys.exit(1)


# --- Run Inference ---
try:
    print("Setting input tensor...")
    interpreter.set_tensor(input_details[0]['index'], input_data)

    print("Running inference...")
    start_time = time.time()
    interpreter.invoke()
    end_time = time.time()
    print(f"Inference time: {(end_time - start_time) * 1000:.2f} ms")

    # --- Process Output ---
    # Output tensor order might vary - check documentation or output_details if needed
    # Typical EfficientDet output order: boxes, classes, scores, num_detections
    boxes = interpreter.get_tensor(output_details[0]['index'])[0] # Shape: [N, 4] (ymin, xmin, ymax, xmax) normalized
    classes = interpreter.get_tensor(output_details[1]['index'])[0] # Shape: [N] (class IDs)
    scores = interpreter.get_tensor(output_details[2]['index'])[0] # Shape: [N] (confidence scores)
    # num_detections = int(interpreter.get_tensor(output_details[3]['index'])[0]) # Sometimes available

    print("\nDetections:")
    detection_count = 0
    img_to_draw_on = img_bgr.copy() # Draw on a copy of the original BGR image

    for i in range(len(scores)): # Iterate through all potential detections
        if scores[i] >= CONFIDENCE_THRESHOLD:
            detection_count += 1
            # EfficientDet class IDs are often 0-89, COCO labels dictionary is 1-90
            # Check if your model's class output needs +1 to match the dictionary
            # Let's assume for now the output class ID directly maps or needs +1. Test both.
            class_id_output = int(classes[i])
            class_id_lookup = class_id_output + 1 # Try adding 1 first

            class_name = COCO_LABELS.get(class_id_lookup, f"ID:{class_id_output}") # Use label dict
            ymin, xmin, ymax, xmax = boxes[i] # Normalized coordinates

            # Denormalize coordinates
            xmin = int(xmin * original_w)
            xmax = int(xmax * original_w)
            ymin = int(ymin * original_h)
            ymax = int(ymax * original_h)

            print(f"- {detection_count}. Class: {class_name} (ID_out:{class_id_output}), Score: {scores[i]:.2f}, Box: [{ymin}, {xmin}, {ymax}, {xmax}]")

            # Draw bounding box and label
            cv2.rectangle(img_to_draw_on, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2) # Green box
            label = f"{class_name}: {scores[i]:.2f}"
            cv2.putText(img_to_draw_on, label, (xmin, ymin - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    if detection_count == 0:
        print("No detections found above the threshold.")
    else:
         # --- Display Image with Detections ---
         print("\nDisplaying image with detections. Press any key to close.")
         cv2.imshow('Object Detection Result', img_to_draw_on)
         cv2.waitKey(0) # Wait indefinitely until a key is pressed
         cv2.destroyAllWindows()
         # Optionally save the result
         # save_path = os.path.join(script_dir, 'detection_result.jpg')
         # cv2.imwrite(save_path, img_to_draw_on)
         # print(f"Result saved to {save_path}")

except Exception as e:
    print(f"ERROR: An error occurred during inference or output processing: {e}")

print("\nScript finished.")