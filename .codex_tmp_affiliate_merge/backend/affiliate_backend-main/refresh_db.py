from app.core.database import engine, Base
from app.models.all_models import *
from seed import seed_data

def refresh_db():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Seeding data...")
    seed_data()
    print("Database refreshed and seeded successfully.")

if __name__ == "__main__":
    refresh_db()
