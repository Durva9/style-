import numpy as np
import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt

from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

from sklearn.metrics import roc_curve, auc
from sklearn.preprocessing import label_binarize


# =========================================================
# SETTINGS
# =========================================================

MODEL_PATH = "clothing_classifier.h5"

VAL_DIR = "remapped_dataset/validation"

CATEGORIES = [
    "shirt",
    "tshirt",
    "jeans",
    "dress",
    "shoes",
    "accessory"
]


# =========================================================
# LOAD MODEL
# =========================================================

print("Loading model...")

model = load_model(MODEL_PATH)

print("Model loaded successfully.")


# =========================================================
# LOAD VALIDATION DATA
# =========================================================

val_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input
)

val_generator = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=(224, 224),
    batch_size=32,
    class_mode="categorical",
    classes=CATEGORIES,
    shuffle=False
)

print(
    f"Evaluating {val_generator.samples} validation images..."
)


# =========================================================
# GET TRUE LABELS
# =========================================================

y_true = val_generator.classes


# =========================================================
# GET PREDICTION PROBABILITIES
# =========================================================

predictions = model.predict(
    val_generator,
    verbose=1
)


# =========================================================
# CONVERT TRUE LABELS TO ONE-HOT
# =========================================================

y_true_binarized = label_binarize(
    y_true,
    classes=list(range(len(CATEGORIES)))
)


# =========================================================
# CREATE ROC GRAPH
# =========================================================

plt.figure(figsize=(9, 7))


for i, category in enumerate(CATEGORIES):

    fpr, tpr, _ = roc_curve(
        y_true_binarized[:, i],
        predictions[:, i]
    )

    roc_auc = auc(
        fpr,
        tpr
    )

    plt.plot(
        fpr,
        tpr,
        linewidth=2,
        label=f"{category} (AUC = {roc_auc:.3f})"
    )


# Random classifier line

plt.plot(
    [0, 1],
    [0, 1],
    linestyle="--",
    linewidth=1.5,
    label="Random guess"
)


# =========================================================
# GRAPH FORMATTING
# =========================================================

plt.title(
    "ROC Curves for Clothing Classification",
    fontsize=14
)

plt.xlabel(
    "False Positive Rate",
    fontsize=12
)

plt.ylabel(
    "True Positive Rate",
    fontsize=12
)

plt.xlim(
    0.0,
    1.0
)

plt.ylim(
    0.0,
    1.05
)

plt.grid(
    True,
    alpha=0.3
)

plt.legend(
    loc="lower right",
    fontsize=9
)

plt.tight_layout()


# =========================================================
# SAVE GRAPH
# =========================================================

plt.savefig(
    "roc_curve.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()


print("\nROC curve generated successfully.")

print("Saved as: roc_curve.png")