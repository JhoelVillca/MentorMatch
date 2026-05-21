"""add inactivo estado and audit support

Revision ID: a1b2c3d4e5f6
Revises: 2381b61d3b24
Create Date: 2026-05-20 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "2381b61d3b24"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_estado_cuenta_check")
    op.execute(
        "ALTER TABLE usuarios ADD CONSTRAINT usuarios_estado_cuenta_check "
        "CHECK (estado_cuenta IN ('activo', 'suspendido', 'baneado', 'inactivo'))"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_estado_cuenta_check")
    op.execute(
        "ALTER TABLE usuarios ADD CONSTRAINT usuarios_estado_cuenta_check "
        "CHECK (estado_cuenta IN ('activo', 'suspendido', 'baneado'))"
    )
