import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os
import shutil

# Paths
SOURCE_DIR = r"C:\Users\durva\Desktop\style\clothing-dataset-small"
REMAPPED_DIR = r"C:\Users\durva\Desktop\style\color-service\remapped_dataset"

# Mapping from dataset folder names to our app's categories
CATEGORY_MAP = {
    "dress": "dress",
    "hat": "accessory",
    "longsleeve": "shirt",
    "outwear": "shirt",
    "pants": "jeans",
    "shirt": "shirt",
    "shoes": "shoes",
    "shorts": "jeans",
    "skirt": "dress",
    "t-shirt": "tshirt",
}

OUR_CATEGORIES = ["shirt", "tshirt", "jeans", "dress", "shoes", "accessory"]

def remap_dataset():
    """Reorganize the dataset's train/validation/test folders into our 6 app categories."""
    print("Remapping dataset into app categories...")
    for split in ["train", "validation", "test"]:
        split_source = os.path.join(SOURCE_DIR, split)
        split_dest = os.path.join(REMAPPED_DIR, split)

        for our_cat in OUR_CATEGORIES:
            os.makedirs(os.path.join(split_dest, our_cat), exist_ok=True)

        for folder_name in os.listdir(split_source):
            if folder_name not in CATEGORY_MAP:
                continue
            our_cat = CATEGORY_MAP[folder_name]
            src_folder = os.path.join(split_source, folder_name)
            dest_folder = os.path.join(split_dest, our_cat)

            for filename in os.listdir(src_folder):
                src_file = os.path.join(src_folder, filename)
                # Prefix filename with original folder to avoid name collisions
                dest_file = os.path.join(dest_folder, f"{folder_name}_{filename}")
                if not os.path.exists(dest_file):
                    shutil.copy2(src_file, dest_file)

    print("Remapping complete.")

def build_model(num_classes):
    """Build MobileNetV2 with a frozen base and a new trainable classification head."""
    base_model = MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights="imagenet"
    )
    base_model.trainable = False  # Freeze the pretrained base

    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation="softmax")
    ])

    model.compile(
        optimizer="adam",
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model

def train():
    remap_dataset()

    train_dir = os.path.join(REMAPPED_DIR, "train")
    val_dir = os.path.join(REMAPPED_DIR, "validation")

    train_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input,
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        horizontal_flip=True,
        zoom_range=0.1,
    )
    val_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=(224, 224),
        batch_size=32,
        class_mode="categorical",
        classes=OUR_CATEGORIES,
    )
    val_generator = val_datagen.flow_from_directory(
        val_dir,
        target_size=(224, 224),
        batch_size=32,
        class_mode="categorical",
        classes=OUR_CATEGORIES,
    )

    print("Class indices (label order):", train_generator.class_indices)

    model = build_model(num_classes=len(OUR_CATEGORIES))

    print("Starting training...")
    model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=10,
    )

    model.save("clothing_classifier.h5")
    print("Model saved as clothing_classifier.h5")

if __name__ == "__main__":
    train()