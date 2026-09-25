"""fees, leads e workflows

Revision ID: b1c2d3e4f5a6
Revises: 8ead4ba3d3c4
Create Date: 2026-09-25 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, Sequence[str], None] = '8ead4ba3d3c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('fee_entries',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('ownerId', sa.String(length=36), nullable=False),
    sa.Column('caseId', sa.String(length=64), nullable=True),
    sa.Column('kind', sa.String(length=30), nullable=False),
    sa.Column('client', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('amount', sa.Float(), nullable=False),
    sa.Column('hours', sa.Float(), nullable=True),
    sa.Column('vat', sa.String(length=20), nullable=False),
    sa.Column('dueDate', sa.String(length=10), nullable=False),
    sa.Column('paid', sa.Boolean(), nullable=False),
    sa.Column('createdAt', sa.String(length=40), nullable=False),
    sa.ForeignKeyConstraint(['ownerId'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['caseId'], ['cases.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fee_entries_ownerId'), 'fee_entries', ['ownerId'], unique=False)

    op.create_table('leads',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('ownerId', sa.String(length=36), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('area', sa.String(length=60), nullable=False),
    sa.Column('source', sa.String(length=60), nullable=False),
    sa.Column('stage', sa.String(length=40), nullable=False),
    sa.Column('value', sa.Float(), nullable=False),
    sa.Column('notes', sa.Text(), nullable=False),
    sa.Column('clientId', sa.String(length=64), nullable=False),
    sa.Column('createdAt', sa.String(length=40), nullable=False),
    sa.ForeignKeyConstraint(['ownerId'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_leads_ownerId'), 'leads', ['ownerId'], unique=False)

    op.create_table('workflows',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('ownerId', sa.String(length=36), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('area', sa.String(length=40), nullable=False),
    sa.Column('completed', sa.JSON(), nullable=False),
    sa.Column('createdAt', sa.String(length=40), nullable=False),
    sa.ForeignKeyConstraint(['ownerId'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workflows_ownerId'), 'workflows', ['ownerId'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_workflows_ownerId'), table_name='workflows')
    op.drop_table('workflows')
    op.drop_index(op.f('ix_leads_ownerId'), table_name='leads')
    op.drop_table('leads')
    op.drop_index(op.f('ix_fee_entries_ownerId'), table_name='fee_entries')
    op.drop_table('fee_entries')
