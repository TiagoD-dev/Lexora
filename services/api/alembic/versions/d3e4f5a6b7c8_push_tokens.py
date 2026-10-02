"""tokens de notificações push (Expo)

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
    op.create_table('push_tokens',
    sa.Column('token', sa.String(length=255), nullable=False),
    sa.Column('userId', sa.String(length=36), nullable=False),
    sa.Column('createdAt', sa.String(length=40), nullable=False),
    sa.ForeignKeyConstraint(['userId'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('token')
    )
    op.create_index(op.f('ix_push_tokens_userId'), 'push_tokens', ['userId'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_push_tokens_userId'), table_name='push_tokens')
    op.drop_table('push_tokens')
