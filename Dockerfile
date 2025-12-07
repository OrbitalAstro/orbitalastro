FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt ./

RUN python -m pip install --upgrade pip \
 && python -m pip install -r requirements.txt

COPY . .

EXPOSE 10000
HEALTHCHECK CMD curl --fail http://localhost:10000/ || exit 0

CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "10000"]
