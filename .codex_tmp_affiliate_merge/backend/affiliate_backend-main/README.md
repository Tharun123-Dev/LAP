# Affiliate Dashboard Backend API

This is the backend API for the Affiliate Dashboard application, built with Python, FastAPI, and SQLAlchemy.

## Technologies Used

*   **Python 3.11+**
*   **FastAPI**: Modern, fast web framework for building APIs.
*   **SQLAlchemy**: SQL toolkit and Object-Relational Mapper (ORM).
*   **PostgreSQL**: Database for storing application data.
*   **Uvicorn**: Lightning-fast ASGI server.
*   **Pydantic**: Data validation and settings management.
*   **Python-Jose**: For JWT token handling.
*   **Passlib**: For password hashing.

## Project Structure

```text
backend/
├── app/
│   ├── api/            # API endpoints
│   ├── core/           # Configuration, database, security
│   ├── models/         # SQLAlchemy database models
│   ├── schemas/        # Pydantic schemas for data validation
│   └── main.py         # Application entry point
├── .env                # Environment variables (do not commit!)
├── init_db.py          # Database initialization script
├── seed.py             # Script to seed the database with initial data
├── refresh_db.py       # Script to drop, recreate, and re-seed the database
├── fix_data.py         # Script to fix missing fields in existing data
└── requirements.txt    # Project dependencies
```

## Getting Started

### Prerequisites

*   Python 3.11+
*   PostgreSQL installed and running

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd backend
    ```

2.  **Create a virtual environment**:
    ```bash
    python -m venv venv
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```

3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure environment variables**:
    Create a `.env` file in the root directory based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Update the values in `.env` to match your local environment (especially `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`).

### Database Setup

1.  **Initialize the database**:
    ```bash
    python init_db.py
    ```

2.  **Seed the database** (optional):
    ```bash
    python seed.py
    ```

### Running the Server

Start the development server using Uvicorn:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## API Documentation

Once the server is running, you can access the interactive API documentation at `http://127.0.0.1:8000/docs` (Swagger UI).
