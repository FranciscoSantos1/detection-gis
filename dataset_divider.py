import os
import numpy as np
from sklearn.model_selection import train_test_split
import shutil

root = os.listdir("pool-detection-dataset/dataset")
images  = os.listdir("pool-detection-dataset/dataset/images")
labels = os.listdir("pool-detection-dataset/dataset/labels")

# Split the dataset (images + labels) into train and val in different folders
train_images, val_images = train_test_split(images, test_size=0.2, random_state=42)

train_dir = "pool-detection-dataset/train"
val_dir = "pool-detection-dataset/val"

os.makedirs(train_dir, exist_ok=True)
os.makedirs(val_dir, exist_ok=True)


for img in train_images:
    # Copy image
    shutil.copy(f"pool-detection-dataset/dataset/images/{img}", f"{train_dir}/{img}")
    
    # try to get the label

    try:
        label_file = img.replace('.PNG', '.xml')
        shutil.copy(f"pool-detection-dataset/dataset/labels/{label_file}", f"{train_dir}/{label_file}")
    except:
        print(f"Label not found for {img}")
        # remove image
        os.remove(f"{train_dir}/{img}")
    
for img in val_images:
    # Copy image
    shutil.copy(f"pool-detection-dataset/dataset/images/{img}", f"{val_dir}/{img}")
    
    try:
        label_file = img.replace('.PNG', '.xml')
        shutil.copy(f"pool-detection-dataset/dataset/labels/{label_file}", f"{val_dir}/{label_file}")
    except:
        print(f"Label not found for {img}")
        # remove image
        os.remove(f"{val_dir}/{img}")