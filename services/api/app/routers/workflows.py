from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..db import get_db
from ..security import get_current_user
from ..workflows_models import Workflow

router = APIRouter(prefix="/workflows", tags=["workflows"])


class WorkflowCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    area: str = Field(min_length=1, max_length=40)


class WorkflowUpdate(BaseModel):
    completed: list[int]


class WorkflowPayload(WorkflowCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    completed: list[int]
    createdAt: str


def _get_owned(db: Session, current_user: models.User, workflow_id: str) -> Workflow:
    workflow = db.get(Workflow, workflow_id)
    if workflow is None or workflow.ownerId != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Fluxo não encontrado.")
    return workflow


@router.get("", response_model=list[WorkflowPayload])
def list_workflows(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.execute(select(Workflow).where(Workflow.ownerId == current_user.id).order_by(Workflow.createdAt.desc())).scalars().all()


@router.post("", response_model=WorkflowPayload, status_code=status.HTTP_201_CREATED)
def create_workflow(payload: WorkflowCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workflow = Workflow(id=str(uuid4()), ownerId=current_user.id, completed=[], createdAt=datetime.now(timezone.utc).isoformat(), **payload.model_dump())
    db.add(workflow)
    db.commit()
    return workflow


@router.patch("/{workflow_id}", response_model=WorkflowPayload)
def update_workflow(workflow_id: str, payload: WorkflowUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workflow = _get_owned(db, current_user, workflow_id)
    workflow.completed = sorted(set(payload.completed))
    db.commit()
    return workflow


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(workflow_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.delete(_get_owned(db, current_user, workflow_id))
    db.commit()
