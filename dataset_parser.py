# python package for parsing XML and HTML documents
from bs4 import BeautifulSoup
import os
import torch
from torch.utils.data import Dataset
from PIL import Image
import torchvision.transforms as transforms
from torch.utils.data import DataLoader


class PoolDataset(Dataset):

    
    def __init__(self, img_dir, label_dir, transform=None):
        self.img_dir = img_dir
        self.label_dir = label_dir
        self.transform = transform

        self.images_files = []
        for img_file in os.listdir(img_dir):
            if img_file.endswith(".png"):
                xml_file = img_file.replace(".png", ".xml")

                if xml_file in os.listdir(label_dir):
                    self.images_files.append(img_file)

    def __len__(self):
        return len(self.images_files)

    def __getitem__(self, idx):
        img_name = self.images_files[idx]
        img_path = os.path.join(self.img_dir, img_name)
        label_path = os.path.join(self.label_dir, img_name.replace(".png", ".xml"))

        image = Image.open(img_path)

        boxes, labels = self.generate_target(label_path)

        if self.transform:
            image = self.transform(image)

        return image, {"boxes": torch.tensor(boxes), "labels": torch.tensor(labels)}

    def generate_target(self, file):
        with open(file) as f:
            data = f.read()

            soup = BeautifulSoup(data, "xml")
            objects = soup.find_all("object")

            boxes = []
            labels = []

            for i in objects:
                boxes.append(self.generate_box(i))
                labels.append(self.generate_label(i))

            return boxes, labels

    def generate_box(self, obj):
        """Generate bounding box from object"""
        x_min = int(obj.find("xmin").text)
        y_min = int(obj.find("ymin").text)
        x_max = int(obj.find("xmax").text)
        y_max = int(obj.find("ymax").text)

        return [x_min, y_min, x_max, y_max]

    def generate_label(self, obj):
        """Generate label from object"""

        if obj.find("name").text == "pool":
            return 1
        else:
            return 0

    def clean_dataset(self):
        """Remove images without labels"""
        for img_file in os.listdir(self.img_dir):
            if img_file.endswith(".png"):
                xml_file = img_file.replace(".png", ".xml")

                if xml_file not in os.listdir(self.label_dir):
                    os.remove(os.path.join(self.img_dir, img_file))

        self.__init__(self.img_dir, self.label_dir, self.transform)


transform = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)

dataset = PoolDataset("dataset/images", "dataset/labels", transform=transform)
dataset.clean_dataset()
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)


for image, label in dataloader:
    print(image.shape)
    print(label)
    break
