import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from models import Base, Collection, SavedRequest, Environment, History

DATABASE_URL = "sqlite+aiosqlite:///./postman_clone.db"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_db()


async def seed_db():
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        result = await session.execute(select(Collection))
        if result.scalars().first():
            return  # already seeded

        # Collections
        col1 = Collection(name="JSONPlaceholder API", description="Sample requests for jsonplaceholder.typicode.com")
        col2 = Collection(name="HTTPBin Testing", description="Test various HTTP features with httpbin.org")
        session.add_all([col1, col2])
        await session.flush()

        # Saved requests for col1
        r1 = SavedRequest(
            collection_id=col1.id, name="Get All Posts", method="GET",
            url="https://jsonplaceholder.typicode.com/posts",
            headers=json.dumps([{"key": "Accept", "value": "application/json", "enabled": True}]),
            params=json.dumps([{"key": "_limit", "value": "10", "enabled": True}]),
        )
        r2 = SavedRequest(
            collection_id=col1.id, name="Get Single Post", method="GET",
            url="https://jsonplaceholder.typicode.com/posts/1",
            headers=json.dumps([{"key": "Accept", "value": "application/json", "enabled": True}]),
        )
        r3 = SavedRequest(
            collection_id=col1.id, name="Create Post", method="POST",
            url="https://jsonplaceholder.typicode.com/posts",
            headers=json.dumps([
                {"key": "Content-Type", "value": "application/json", "enabled": True},
                {"key": "Accept", "value": "application/json", "enabled": True},
            ]),
            body_type="raw",
            body_content=json.dumps({"title": "New Post", "body": "Hello world!", "userId": 1}, indent=2),
        )
        r4 = SavedRequest(
            collection_id=col1.id, name="Delete Post", method="DELETE",
            url="https://jsonplaceholder.typicode.com/posts/1",
        )
        r5 = SavedRequest(
            collection_id=col2.id, name="Inspect Headers", method="GET",
            url="https://httpbin.org/headers",
            headers=json.dumps([{"key": "X-Custom-Header", "value": "PostmanClone", "enabled": True}]),
        )
        r6 = SavedRequest(
            collection_id=col2.id, name="Echo POST Body", method="POST",
            url="https://httpbin.org/post",
            headers=json.dumps([{"key": "Content-Type", "value": "application/json", "enabled": True}]),
            body_type="raw",
            body_content=json.dumps({"message": "Hello from {{env}}", "timestamp": "2024-01-01"}, indent=2),
        )
        r7 = SavedRequest(
            collection_id=col2.id, name="Bearer Auth Test", method="GET",
            url="https://httpbin.org/bearer",
            auth_type="bearer",
            auth_data=json.dumps({"token": "my-secret-token"}),
        )
        session.add_all([r1, r2, r3, r4, r5, r6, r7])

        # Environments
        env1 = Environment(
            name="Development",
            variables=json.dumps([
                {"key": "baseUrl", "value": "https://jsonplaceholder.typicode.com", "enabled": True},
                {"key": "env", "value": "development", "enabled": True},
                {"key": "apiKey", "value": "dev-key-12345", "enabled": True},
            ])
        )
        env2 = Environment(
            name="Production",
            variables=json.dumps([
                {"key": "baseUrl", "value": "https://api.example.com", "enabled": True},
                {"key": "env", "value": "production", "enabled": True},
                {"key": "apiKey", "value": "prod-key-99999", "enabled": True},
            ])
        )
        env3 = Environment(
            name="HTTPBin",
            variables=json.dumps([
                {"key": "baseUrl", "value": "https://httpbin.org", "enabled": True},
                {"key": "env", "value": "testing", "enabled": True},
            ])
        )
        session.add_all([env1, env2, env3])

        # History entries
        h1 = History(
            method="GET", url="https://jsonplaceholder.typicode.com/posts",
            headers=json.dumps([{"key": "Accept", "value": "application/json", "enabled": True}]),
            params=json.dumps([{"key": "_limit", "value": "10", "enabled": True}]),
            response_status=200, response_time=142, response_size=2048,
        )
        h2 = History(
            method="POST", url="https://jsonplaceholder.typicode.com/posts",
            headers=json.dumps([{"key": "Content-Type", "value": "application/json", "enabled": True}]),
            body_type="raw",
            body_content=json.dumps({"title": "Test Post", "body": "Test body", "userId": 1}),
            response_status=201, response_time=98, response_size=256,
        )
        h3 = History(
            method="GET", url="https://httpbin.org/headers",
            response_status=200, response_time=234, response_size=512,
        )
        session.add_all([h1, h2, h3])

        await session.commit()
