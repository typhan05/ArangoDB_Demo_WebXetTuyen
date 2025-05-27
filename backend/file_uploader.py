import os
from fastapi import File, UploadFile
from dotenv import load_dotenv
import boto3

load_dotenv()

s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)
bucket_name = 'vfx-uploads'
upload_folder = "uploads"

class FileUploader:
    async def upload_file(file: UploadFile = File(...)):
        file_path = os.path.join(upload_folder, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        s3.upload_file(file_path, bucket_name, file.filename)

        url = f"https://{bucket_name}.s3.us-east-1.amazonaws.com/{file.filename}"

        return url