# Import asynchronous SQLAlchemy engine and session components
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

# Import sessionmaker to generate new session objects
# Import declarative_base to create ORM model base class
from sqlalchemy.orm import sessionmaker, declarative_base

# Define the database connection URL with async driver 'asyncpg'
# Format: "dialect+driver://username:password@host:port/database_name"
DATABASE_URL = "postgresql+asyncpg://postgres:khanss@localhost:5432/food_recipe_db"

# Create an asynchronous SQLAlchemy engine instance using the above database URL
# `echo=True` enables SQL logging (prints SQL queries in terminal for debugging)
engine = create_async_engine(DATABASE_URL, echo=True)

# Create a session factory that returns AsyncSession objects when called
# `expire_on_commit=False` ensures attributes remain available after commit
AsyncSessionLocal = sessionmaker(
    engine,                  # Bind the session to the async engine
    expire_on_commit=False, # Avoid expiring objects after commit
    class_=AsyncSession      # Use AsyncSession class for async DB operations
)

# Create a base class for our ORM models using SQLAlchemy's declarative system
# All model classes will inherit from this base
Base = declarative_base()

# Dependency function used for injecting the database session in FastAPI routes
# It ensures a new async DB session is created and closed cleanly
async def get_db():
    async with AsyncSessionLocal() as session:  # Open a new async session
        yield session  # Yield it to the route (dependency injection)
        # When the route function exits, the session is automatically closed
