from pydantic import BaseModel, Field

class PresignedUploadResponse(BaseModel):
    upload_url: str
    fields: dict
    object_key: str
    expires_in: int

class FotoPerfilUpdate(BaseModel):
    foto_url: str = Field(..., max_length=500, description="URL publica del objeto ya subido a S3")
