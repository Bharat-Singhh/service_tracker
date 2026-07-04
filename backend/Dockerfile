FROM python:3.12-slim

WORKDIR /app

# Install system dependencies needed for bcrypt/cryptography and timezone data
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && ln -snf /usr/share/zoneinfo/Asia/Kolkata /etc/localtime \
    && echo "Asia/Kolkata" > /etc/timezone
ENV TZ=Asia/Kolkata

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Persist SQLite database outside the container layer
VOLUME ["/app/data"]
ENV DATABASE_URL=sqlite:////app/data/domain_tracker.db

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
