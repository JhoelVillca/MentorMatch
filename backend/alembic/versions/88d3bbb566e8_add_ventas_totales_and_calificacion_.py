"""Add ventas_totales and calificacion_promedio to PaqueteMentor

Revision ID: 88d3bbb566e8
Revises: d4e5f6g7h8i9
Create Date: 2026-06-04 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '88d3bbb566e8'
down_revision: Union[str, None] = 'd4e5f6g7h8i9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('paquetes_mentor', sa.Column('ventas_totales', sa.Integer(), server_default='0', nullable=False))
    op.add_column('paquetes_mentor', sa.Column('calificacion_promedio', sa.Numeric(precision=3, scale=2), server_default='0.00', nullable=False))


def downgrade() -> None:
    op.drop_column('paquetes_mentor', 'calificacion_promedio')
    op.drop_column('paquetes_mentor', 'ventas_totales')
