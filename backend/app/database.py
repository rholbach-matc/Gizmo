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


def migrate_food_entries_finished_at():
    if engine.dialect.name != "sqlite":
        return

    with engine.connect() as connection:
        food_entries_exists = connection.exec_driver_sql(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'food_entries'"
        ).fetchone()
        if food_entries_exists is None:
            return

        columns = {
            column[1]
            for column in connection.exec_driver_sql(
                "PRAGMA table_info(food_entries)"
            ).fetchall()
        }
        if "finished_at" not in columns:
            connection.exec_driver_sql("ALTER TABLE food_entries ADD COLUMN finished_at DATETIME")
            connection.commit()


def migrate_remaining_tracker_references():
    if engine.dialect.name != "sqlite":
        return

    with engine.connect() as connection:
        connection.exec_driver_sql(
            """
            CREATE TABLE IF NOT EXISTS medications (
                id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                notes TEXT,
                created_at DATETIME NOT NULL,
                PRIMARY KEY (id),
                UNIQUE (name)
            )
            """
        )
        connection.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS ix_medications_id ON medications (id)"
        )

        medication_entries_exists = connection.exec_driver_sql(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'medication_entries'"
        ).fetchone()
        if medication_entries_exists is not None:
            medication_columns = {
                column[1]
                for column in connection.exec_driver_sql(
                    "PRAGMA table_info(medication_entries)"
                ).fetchall()
            }
            if "medication_id" not in medication_columns:
                connection.exec_driver_sql(
                    "ALTER TABLE medication_entries ADD COLUMN medication_id INTEGER"
                )

            connection.exec_driver_sql(
                """
                INSERT OR IGNORE INTO medications (name, notes, created_at)
                SELECT DISTINCT medication_name, NULL, CURRENT_TIMESTAMP
                FROM medication_entries
                WHERE medication_name IS NOT NULL AND TRIM(medication_name) != ''
                """
            )
            connection.exec_driver_sql(
                """
                UPDATE medication_entries
                SET medication_id = (
                    SELECT medications.id
                    FROM medications
                    WHERE medications.name = medication_entries.medication_name
                )
                WHERE medication_id IS NULL
                """
            )

        water_entries_exists = connection.exec_driver_sql(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'water_entries'"
        ).fetchone()
        if water_entries_exists is not None:
            water_columns = {
                column[1]
                for column in connection.exec_driver_sql(
                    "PRAGMA table_info(water_entries)"
                ).fetchall()
            }
            if "observation_type" not in water_columns:
                connection.exec_driver_sql(
                    """
                    ALTER TABLE water_entries
                    ADD COLUMN observation_type VARCHAR NOT NULL DEFAULT 'drank_water'
                    """
                )
            if "bowl_id" not in water_columns:
                connection.exec_driver_sql(
                    "ALTER TABLE water_entries ADD COLUMN bowl_id INTEGER"
                )

        connection.commit()
