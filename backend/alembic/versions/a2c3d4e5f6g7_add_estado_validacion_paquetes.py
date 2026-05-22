"""add_estado_validacion_paquetes

Revision ID: a2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-22 18:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a2c3d4e5f6g7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('paquetes_mentor', sa.Column('estado_validacion', sa.String(length=20), server_default=sa.text("'pendiente'"), nullable=False))
    op.execute("ALTER TABLE paquetes_mentor ADD CONSTRAINT paquetes_mentor_estado_validacion_check CHECK (estado_validacion IN ('pendiente', 'aprobado', 'rechazado'))")


def downgrade() -> None:
    op.execute("ALTER TABLE paquetes_mentor DROP CONSTRAINT IF EXISTS paquetes_mentor_estado_validacion_check")
    op.drop_column('paquetes_mentor', 'estado_validacion')