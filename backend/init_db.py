from app.database import engine, SessionLocal
from app.models import Base, User

# Create all tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")

# Insert test users
print("\nInserting test users...")
db = SessionLocal()

# Check if users already exist
existing_users = db.query(User).count()

if existing_users == 0:
    # Anonymous User 1
    user1 = User(
        device_id="test_device_anon",
        email=None,
        hashed_password=None,
        is_anonymous=True
    )
    
    # Anonymous User 2
    user2 = User(
        device_id="test_device_anon2",
        email=None,
        hashed_password=None,
        is_anonymous=True
    )
    
    # Registered User 3
    user3 = User(
        device_id="test_device_1",
        email="test@example.com",
        hashed_password="$2b$12$roD8ABF3vemTBVWz7g4XvuK8F4dmlmYXfoyw1jMVT2i3hBB/LR7AC",
        is_anonymous=False
    )
    
    db.add(user1)
    db.add(user2)
    db.add(user3)
    db.commit()
    print("✓ Inserted 3 test users (2 anonymous, 1 registered)")
else:
    print(f"✓ Database already has {existing_users} users")

db.close()

print("\nDatabase initialization complete!")
print("Note: Intervention details are stored in interventions_library.json")
