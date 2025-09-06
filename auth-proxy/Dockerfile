FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi uvicorn httpx python-multipart
COPY app.py /app/app.py
EXPOSE 8008
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8008"]
