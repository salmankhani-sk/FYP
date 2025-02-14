from sqlalchemy import Column, Integer, String, Boolean
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable
from db import Base

# User Model
class User(SQLAlchemyBaseUserTable[int], Base):
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

# Recipe Search History Model
class UserRecipeHistory(Base):
    __tablename__ = "user_recipe_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    recipe = Column(String, nullable=False)
