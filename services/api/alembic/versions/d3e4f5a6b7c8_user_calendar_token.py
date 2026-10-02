"""token secreto para subscrever o calendário de prazos

Revision ID: d3e4f5a6b7c8
Revises: c2d3e4f5a6b7
Create Date: 2026-10-02 18:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd3e4f5a6b7c8'
down_revision: Union[str, Sequence[str], None] = 'c2d3e4f5a6b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('users') as batch:
        batch.add_column(sa.Column('calendarToken', sa.String(length=64), nullable=True))
    op.create_index(op.f('ix_users_calendarToken'), 'users', ['calendarToken'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_calendarToken'), table_name='users')
    with op.batch_alter_table('users') as batch:
        batch.drop_column('calendarToken')
