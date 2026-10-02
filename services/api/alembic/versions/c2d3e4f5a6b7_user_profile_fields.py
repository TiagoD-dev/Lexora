"""campos de perfil profissional no utilizador

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2026-10-02 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c2d3e4f5a6b7'
down_revision: Union[str, Sequence[str], None] = 'b1c2d3e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COLUMNS = [('organization', 120), ('phone', 30), ('barNumber', 40), ('primaryLegalArea', 120), ('bio', 280)]


def upgrade() -> None:
    with op.batch_alter_table('users') as batch:
        for name, length in COLUMNS:
            batch.add_column(sa.Column(name, sa.String(length=length), nullable=False, server_default=''))


def downgrade() -> None:
    with op.batch_alter_table('users') as batch:
        for name, _ in reversed(COLUMNS):
            batch.drop_column(name)
