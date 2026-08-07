import os
import numpy as np
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report, confusion_matrix
import json

MODEL_PATH = "clothing_classifier.h5"
VAL_DIR = "remapped_dataset/validation"
CATEGORIES = ["shirt", "tshirt", "jeans", "dress", "shoes", "accessory"]

print("Loading model...")
model = load_model(MODEL_PATH)

val_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

val_generator = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=(224, 224),
    batch_size=32,
    class_mode="categorical",
    classes=CATEGORIES,
    shuffle=False,  # IMPORTANT: keep order so predictions line up with true labels
)

print(f"Evaluating on {val_generator.samples} validation images...")

# Get true labels
y_true = val_generator.classes

# Get predictions
predictions = model.predict(val_generator, verbose=1)
y_pred = np.argmax(predictions, axis=1)

# Compute precision, recall, F1 per class + overall
report = classification_report(
    y_true, y_pred, target_names=CATEGORIES, digits=4, output_dict=True
)

report_text = classification_report(y_true, y_pred, target_names=CATEGORIES, digits=4)
print("\n" + "=" * 60)
print("PRECISION / RECALL / F1-SCORE TABLE")
print("=" * 60)
print(report_text)

# Confusion matrix
cm = confusion_matrix(y_true, y_pred)
print("\nConfusion Matrix (rows=actual, columns=predicted):")
print("Categories order:", CATEGORIES)
print(cm)

# Save everything to a JSON file for later use (e.g. in your report)
output = {
    "classification_report": report,
    "confusion_matrix": cm.tolist(),
    "categories": CATEGORIES,
    "total_validation_images": int(val_generator.samples),
}

with open("evaluation_results.json", "w") as f:
    json.dump(output, f, indent=2)

print("\nSaved full results to evaluation_results.json")