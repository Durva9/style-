import matplotlib
matplotlib.use("Agg")  # so it works even without a display
import matplotlib.pyplot as plt

# Real training history from the actual successful training run
# (clothing_classifier.h5, 6 categories, clothing-dataset-small dataset)
epochs = list(range(1, 11))

accuracy =     [0.7738, 0.8784, 0.9006, 0.9117, 0.9175, 0.9276, 0.9368, 0.9446, 0.9478, 0.9505]
val_accuracy = [0.8974, 0.9003, 0.9150, 0.9179, 0.9238, 0.9179, 0.9032, 0.9120, 0.9267, 0.9208]

loss =         [0.6475, 0.3398, 0.2687, 0.2529, 0.2186, 0.2000, 0.1796, 0.1481, 0.1404, 0.1347]
val_loss =     [0.3020, 0.2655, 0.2477, 0.2301, 0.2264, 0.2654, 0.2904, 0.2513, 0.2483, 0.2556]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

# --- Accuracy plot ---
ax1.plot(epochs, accuracy, marker="o", label="Training accuracy", color="#1D9E75")
ax1.plot(epochs, val_accuracy, marker="o", label="Validation accuracy", color="#378ADD")
ax1.set_title("Model accuracy over training epochs")
ax1.set_xlabel("Epoch")
ax1.set_ylabel("Accuracy")
ax1.set_ylim(0.7, 1.0)
ax1.legend(loc="lower right")
ax1.grid(True, alpha=0.3)

# --- Loss plot ---
ax2.plot(epochs, loss, marker="o", label="Training loss", color="#D85A30")
ax2.plot(epochs, val_loss, marker="o", label="Validation loss", color="#7F77DD")
ax2.set_title("Model loss over training epochs")
ax2.set_xlabel("Epoch")
ax2.set_ylabel("Loss")
ax2.legend(loc="upper right")
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig("training_curves.png", dpi=200, bbox_inches="tight")
print("Saved training_curves.png")

plt.show()