# models.py
# This module defines the database models for the application using SQLAlchemy ORM.
# It includes the User, RecipeSearch, ChatLog, and PDFRecord classes, which represent
# Import necessary modules from SQLAlchemy
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
# Import the Base class from the local database module
from .database import Base
# Import datetime module to handle date and time operations
from datetime import datetime

# Define the User class, which maps to the 'users' table in the database
class User(Base):
    __tablename__ = "users"  # Specify the table name as 'users'
    
    # Define columns for the 'users' table
    id = Column(Integer, primary_key=True, index=True)  # Primary key column
    username = Column(String, unique=True, index=True)  # Unique username column
    email = Column(String, unique=True, index=True)  # Unique email column
    hashed_password = Column(String)  # Column to store hashed passwords
    created_at = Column(DateTime, default=datetime.utcnow)  # Timestamp of user creation, defaults to current UTC time

    # Define relationships to other tables
    searches = relationship("RecipeSearch", back_populates="user")  # One-to-many relationship with RecipeSearch
    chats = relationship("ChatLog", back_populates="user")  # One-to-many relationship with ChatLog
    pdfs = relationship("PDFRecord", back_populates="user")  # One-to-many relationship with PDFRecord

# Define the RecipeSearch class, which maps to the 'recipe_searches' table
class RecipeSearch(Base):
    __tablename__ = "recipe_searches"  # Specify the table name as 'recipe_searches'
    
    # Define columns for the 'recipe_searches' table
    id = Column(Integer, primary_key=True, index=True)  # Primary key column
    user_id = Column(Integer, ForeignKey("users.id"))  # Foreign key referencing 'users' table
    query = Column(String)  # Column to store the search query
    timestamp = Column(DateTime, default=datetime.utcnow)  # Timestamp of the search, defaults to current UTC time
    
    # Define relationship back to the User
    user = relationship("User", back_populates="searches")  # Many-to-one relationship with User

# Define the ChatLog class, which maps to the 'chat_logs' table
class ChatLog(Base):
    __tablename__ = "chat_logs"  # Specify the table name as 'chat_logs'
    
    # Define columns for the 'chat_logs' table
    id = Column(Integer, primary_key=True, index=True)  # Primary key column
    user_id = Column(Integer, ForeignKey("users.id"))  # Foreign key referencing 'users' table
    message = Column(Text)  # Column to store the chat message
    timestamp = Column(DateTime, default=datetime.utcnow)  # Timestamp of the message, defaults to current UTC time
    
    # Define relationship back to the User
    user = relationship("User", back_populates="chats")  # Many-to-one relationship with User

# Define the PDFRecord class, which maps to the 'pdf_records' table
class PDFRecord(Base):
    __tablename__ = "pdf_records"  # Specify the table name as 'pdf_records'
    
    # Define columns for the 'pdf_records' table
    id = Column(Integer, primary_key=True, index=True)  # Primary key column
    user_id = Column(Integer, ForeignKey("users.id"))  # Foreign key referencing 'users' table
    file_path = Column(String)  # Column to store the file path of the PDF
    created_at = Column(DateTime, default=datetime.utcnow)  # Timestamp of PDF record creation, defaults to current UTC time
    
    # Define relationship back to the User
    user = relationship("User", back_populates="pdfs")  # Many-to-one relationship with User
