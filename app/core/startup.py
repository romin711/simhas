import os
from app.core.config import DATA_DIR
from app.db.vector_store import vector_store


def startup():
    os.makedirs(DATA_DIR, exist_ok=True)
    vector_store.load()