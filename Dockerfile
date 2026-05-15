FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy the requirements file from the backend folder
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files (frontend and backend)
COPY . .

# Hugging Face Spaces requires apps to run on port 7860
ENV PORT=7860
EXPOSE 7860

# Start the server
CMD ["sh", "-c", "cd backend && uvicorn server:app --host 0.0.0.0 --port 7860"]
