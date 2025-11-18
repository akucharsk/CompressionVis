# 📹 Vicom – Compression Visualization

A guide to running the project locally.

## ✅ Prerequisites

Make sure you have installed:

- **Docker**
- **Docker Compose**

🔗 Download Docker Desktop:  
https://www.docker.com/products/docker-desktop/

---

## 🚀 Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/akucharsk/CompressionVis.git
cd CompressionVis
```

---

### 2️⃣ Download the video resources

📌 **Note:** The entire project with videos requires approximately **16 GB** of free disk space.

Download the files from Google Drive:

```
https://drive.google.com/drive/folders/1OR3iby_OVX7wfpjg6arrbFoZvVkJDyX6?usp=sharing
```

Place the files in the following directories:

- `exampleX.mp4` → in the `videos` directory  
- `exampleX.y4m` → in the `original_videos` directory

Directory structure:

```
backend/
└── static/
    ├── original_videos/   ← .y4m files
    ├── videos/            ← .mp4 files
    └── ...
```

⚠️ **Do not rename the files!**

---

### 3️⃣ Build and run the application

This single command will:

- build the frontend and backend images,
- start all containers,
- set up the necessary network.

```bash
docker-compose up --build
```

Once the containers are running, the application will be available at:

👉 **http://localhost:3000**
