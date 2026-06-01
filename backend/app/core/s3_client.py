import os
import boto3
from botocore.exceptions import ClientError

_endpoint_url = os.getenv("AWS_ENDPOINT_URL")
if _endpoint_url and os.getenv("ENVIRONMENT") == "production":
    raise RuntimeError("AWS_ENDPOINT_URL no debe estar configurada en produccion")

def generate_presigned_post(user_id: str, file_extension: str = "jpg") -> dict:
    bucket_name = os.getenv("AWS_S3_BUCKET_NAME")
    if not bucket_name:
        raise RuntimeError("AWS_S3_BUCKET_NAME no configurada")

    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    aws_region = os.getenv("AWS_REGION", "us-east-1")
    endpoint_url = os.getenv("AWS_ENDPOINT_URL")

    client = boto3.client(
        "s3",
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=aws_region,
        endpoint_url=endpoint_url
    )

    key = f"perfiles/{user_id}/foto.{file_extension}"

    try:
        data = client.generate_presigned_post(
            Bucket=bucket_name,
            Key=key,
            Fields={"Content-Type": "image/*"},
            Conditions=[
                ["content-length-range", 1024, 5 * 1024 * 1024],
                ["starts-with", "$Content-Type", "image/"],
            ],
            ExpiresIn=60
        )
    except ClientError as e:
        raise RuntimeError(f"S3 error: {str(e)}")

    return {
        "upload_url": data["url"],
        "fields": data["fields"],
        "object_key": key,
        "expires_in": 60
    }

def get_public_url(object_key: str) -> str:
    bucket_name = os.getenv("AWS_S3_BUCKET_NAME")
    aws_region = os.getenv("AWS_REGION", "us-east-1")
    endpoint_url = os.getenv("AWS_ENDPOINT_URL")
    if endpoint_url:
        return f"{endpoint_url}/{bucket_name}/{object_key}"
    return f"https://{bucket_name}.s3.{aws_region}.amazonaws.com/{object_key}"
