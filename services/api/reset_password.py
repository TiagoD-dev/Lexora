"""Define uma nova palavra-passe para um utilizador local. Uso: python reset_password.py email@exemplo.pt"""
import sys
from getpass import getpass

from app import models
from app.db import SessionLocal
from app.security import hash_password

if len(sys.argv) != 2:
    sys.exit("Uso: python reset_password.py <email>")
email = sys.argv[1].strip().lower()
with SessionLocal() as db:
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        emails = [row.email for row in db.query(models.User.email).all()]
        sys.exit(f"Utilizador não encontrado. Emails existentes: {', '.join(emails) or 'nenhum'}")
    password = getpass("Nova palavra-passe: ")
    if len(password) < 8 or password != getpass("Repetir: "):
        sys.exit("As palavras-passe não coincidem ou têm menos de 8 caracteres.")
    user.passwordHash = hash_password(password)
    db.commit()
    print(f"Palavra-passe atualizada para {email}.")
