# Use a base image with Python 3.9 or higher
FROM python:3.9-slim-buster

# Set the working directory
WORKDIR /app

# Copy the application code
COPY . .

# Update the package list and install necessary system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-pip \
    python3-setuptools \
    python3-dev \
    curl \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash - \
    && apt-get install -y nodejs

# Upgrade pip to the latest version
RUN pip3 install --upgrade pip

# Install ultralytics and other Python dependencies
RUN pip3 install --no-cache-dir ultralytics

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["npm", "start"]