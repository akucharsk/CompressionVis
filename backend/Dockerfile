FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    python3-pip \
    meson \
    ninja-build \
    doxygen \
    nasm \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /vmaf
RUN git clone --depth 1 https://github.com/Netflix/vmaf.git . \
    && pip install -r python/requirements.txt \
    && cd libvmaf && meson setup --buildtype=release build \
    && ninja -C build && ninja -C build install

WORKDIR /app
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . /app

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]