from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql+asyncpg://postgres:your_password@localhost:5432/food_recipe_db"

# Database Engine
engine = create_async_engine(DATABASE_URL, echo=True)

# Async session setup
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# Declarative Base
Base = declarative_base()

# Dependency for database session
async def get_db_session() -> AsyncSession:
    async with async_session() as session:
        yield session
