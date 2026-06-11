import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./gizmo.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def migrate_food_entries_for_open_feedings():
    if engine.dialect.name != "sqlite":
        return

    with engine.connect() as connection:
        food_entries_exists = connection.exec_driver_sql(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'food_entries'"
        ).fetchone()
        if food_entries_exists is None:
            return

        columns = connection.exec_driver_sql("PRAGMA table_info(food_entries)").fetchall()
        nullable_columns = {
            "ending_total_weight_grams",
            "leftover_food_weight_grams",
            "food_eaten_grams",
            "calories_eaten",
            "protein_consumed_grams",
            "fat_consumed_grams",
            "phosphorus_consumed_mg",
            "sodium_consumed_mg",
            "moisture_consumed_grams",
            "dry_matter_consumed_grams",
        }
        needs_migration = any(
            column[1] in nullable_columns and column[3] == 1 for column in columns
        )

        if not needs_migration:
            return

        connection.exec_driver_sql("PRAGMA foreign_keys=OFF")
        connection.exec_driver_sql(
            """
            CREATE TABLE food_entries_new (
                id INTEGER NOT NULL,
                entry_time DATETIME NOT NULL,
                bowl_id INTEGER NOT NULL,
                food_id INTEGER NOT NULL,
                starting_total_weight_grams FLOAT NOT NULL,
                ending_total_weight_grams FLOAT,
                starting_food_weight_grams FLOAT NOT NULL,
                leftover_food_weight_grams FLOAT,
                food_eaten_grams FLOAT,
                calories_eaten FLOAT,
                protein_consumed_grams FLOAT,
                fat_consumed_grams FLOAT,
                phosphorus_consumed_mg FLOAT,
                sodium_consumed_mg FLOAT,
                moisture_consumed_grams FLOAT,
                dry_matter_consumed_grams FLOAT,
                notes TEXT,
                created_at DATETIME NOT NULL,
                PRIMARY KEY (id),
                FOREIGN KEY(bowl_id) REFERENCES bowls (id),
                FOREIGN KEY(food_id) REFERENCES foods (id)
            )
            """
        )
        connection.exec_driver_sql(
            """
            INSERT INTO food_entries_new (
                id,
                entry_time,
                bowl_id,
                food_id,
                starting_total_weight_grams,
                ending_total_weight_grams,
                starting_food_weight_grams,
                leftover_food_weight_grams,
                food_eaten_grams,
                calories_eaten,
                protein_consumed_grams,
                fat_consumed_grams,
                phosphorus_consumed_mg,
                sodium_consumed_mg,
                moisture_consumed_grams,
                dry_matter_consumed_grams,
                notes,
                created_at
            )
            SELECT
                id,
                entry_time,
                bowl_id,
                food_id,
                starting_total_weight_grams,
                ending_total_weight_grams,
                starting_food_weight_grams,
                leftover_food_weight_grams,
                food_eaten_grams,
                calories_eaten,
                protein_consumed_grams,
                fat_consumed_grams,
                phosphorus_consumed_mg,
                sodium_consumed_mg,
                moisture_consumed_grams,
                dry_matter_consumed_grams,
                notes,
                created_at
            FROM food_entries
            """
        )
        connection.exec_driver_sql("DROP TABLE food_entries")
        connection.exec_driver_sql("ALTER TABLE food_entries_new RENAME TO food_entries")
        connection.exec_driver_sql(
            "CREATE INDEX ix_food_entries_id ON food_entries (id)"
        )
        connection.commit()
        connection.exec_driver_sql("PRAGMA foreign_keys=ON")
