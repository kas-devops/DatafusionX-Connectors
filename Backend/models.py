from sqlalchemy import Column, Integer, String, Text
from database import Base


class ConfluenceCredential(Base):
    __tablename__ = "confluence_credentials"
    id           = Column(Integer, primary_key=True, index=True)
    domain       = Column(String, nullable=False)
    email        = Column(String, nullable=False)
    api_token    = Column(String, nullable=False)
    display_name = Column(String, nullable=True)


class DatabricksCredential(Base):
    __tablename__ = "databricks_credentials"
    id            = Column(Integer, primary_key=True, index=True)
    workspace_url = Column(String, nullable=False)
    access_token  = Column(String, nullable=False)
    display_name  = Column(String, nullable=True)


class GoogleDriveCredential(Base):
    __tablename__ = "googledrive_credentials"
    id           = Column(Integer, primary_key=True)
    sa_json      = Column(Text, nullable=False)
    display_name = Column(String, nullable=True)    