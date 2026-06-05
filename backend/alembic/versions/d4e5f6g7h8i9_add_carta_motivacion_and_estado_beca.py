"""add_carta_motivacion_and_estado_beca

Revision ID: d4e5f6g7h8i9
Revises: c3d4e5f6g7h8
Create Date: 2026-06-04 20:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4e5f6g7h8i9'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6g7h8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE contratos_mentoria ADD COLUMN IF NOT EXISTS carta_motivacion TEXT")
    op.execute("ALTER TABLE contratos_mentoria DROP CONSTRAINT IF EXISTS contratos_mentoria_estado_contrato_check")
    op.execute("ALTER TABLE contratos_mentoria ADD CONSTRAINT contratos_mentoria_estado_contrato_check CHECK (estado_contrato IN ('pendiente_pago', 'activo', 'completado', 'cancelado', 'pendiente_aprobacion', 'rechazado'))")


def downgrade() -> None:
    op.execute("ALTER TABLE contratos_mentoria DROP CONSTRAINT IF EXISTS contratos_mentoria_estado_contrato_check")
    op.execute("ALTER TABLE contratos_mentoria ADD CONSTRAINT contratos_mentoria_estado_contrato_check CHECK (estado_contrato IN ('pendiente_pago', 'activo', 'completado', 'cancelado'))")
    op.drop_column('contratos_mentoria', 'carta_motivacion')
