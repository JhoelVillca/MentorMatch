from sqlalchemy import Integer, String, Table, Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base

usuario_roles = Table(
    "usuario_roles",
    Base.metadata,
    Column("id_usuario", UUID(as_uuid=True), ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), primary_key=True),
    Column("id_rol", UUID(as_uuid=True), ForeignKey("roles.id_rol", ondelete="CASCADE"), primary_key=True),
)

