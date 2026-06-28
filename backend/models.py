from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class Collection(Base):
    __tablename__ = "collections"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    requests = relationship("SavedRequest", back_populates="collection", cascade="all, delete-orphan")


class SavedRequest(Base):
    __tablename__ = "saved_requests"
    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=False)
    name = Column(String, nullable=False)
    method = Column(String, default="GET")
    url = Column(Text, default="")
    headers = Column(Text, default="[]")       # JSON array of {key, value, enabled}
    params = Column(Text, default="[]")         # JSON array of {key, value, enabled}
    body_type = Column(String, default="none")  # none | raw | form-data | urlencoded
    body_content = Column(Text, default="")
    auth_type = Column(String, default="none")  # none | bearer | basic
    auth_data = Column(Text, default="{}")      # JSON object
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    collection = relationship("Collection", back_populates="requests")


class Environment(Base):
    __tablename__ = "environments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    variables = Column(Text, default="[]")  # JSON array of {key, value, enabled}
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class History(Base):
    __tablename__ = "history"
    id = Column(Integer, primary_key=True, index=True)
    method = Column(String, nullable=False)
    url = Column(Text, nullable=False)
    headers = Column(Text, default="[]")
    params = Column(Text, default="[]")
    body_type = Column(String, default="none")
    body_content = Column(Text, default="")
    auth_type = Column(String, default="none")
    auth_data = Column(Text, default="{}")
    response_status = Column(Integer, nullable=True)
    response_time = Column(Integer, nullable=True)   # ms
    response_size = Column(Integer, nullable=True)   # bytes
    created_at = Column(DateTime, default=datetime.utcnow)
