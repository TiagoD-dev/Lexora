"""data do trabalho nos registos de honorários (tempo)

Revision ID: f5a6b7c8d9e0
Revises: e4f5a6b7c8d9
Create Date: 2026-10-02 15:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f5a6b7c8d9e0'
down_revision: Union[str, Sequence[str], None] = 'e4f5a6b7c8d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('fee_entries') as batch:
        batch.add_column(sa.Column('workDate', sa.String(length=10), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('fee_entries') as batch:
        batch.drop_column('workDate')
