import sqlite3

def clear_all_data(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    for table_name in tables:
        table = table_name[0]
        if table != 'sqlite_sequence':  # Skip autoincrement counter table
            cursor.execute(f"DELETE FROM {table};")
            print(f"Cleared table: {table}")

    conn.commit()
    conn.close()

# Example usage
clear_all_data("questions.db")
