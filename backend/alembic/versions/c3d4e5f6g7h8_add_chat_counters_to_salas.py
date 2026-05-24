"""add_chat_counters_to_salas

Revision ID: c3d4e5f6g7h8
Revises: a2c3d4e5f6g7
Create Date: 2026-05-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6g7h8'
down_revision: Union[str, Sequence[str], None] = 'a2c3d4e5f6g7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE salas_chat ADD COLUMN IF NOT EXISTS no_leidos_mentee INTEGER DEFAULT 0 NOT NULL")
    op.execute("ALTER TABLE salas_chat ADD COLUMN IF NOT EXISTS no_leidos_mentor INTEGER DEFAULT 0 NOT NULL")
    op.execute("ALTER TABLE salas_chat ADD COLUMN IF NOT EXISTS ultima_actividad TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL")


def downgrade() -> None:
    op.drop_column('salas_chat', 'ultima_actividad')
    op.drop_column('salas_chat', 'no_leidos_mentor')
    op.drop_column('salas_chat', 'no_leidos_mentee')