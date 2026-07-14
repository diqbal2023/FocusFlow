import sqlite3
import sys

DB = r"C:\Users\catsr\AppData\Local\Packages\FocusFlow_wk8nzwejgnza6\LocalState\focusflow.db"

def main(action: str) -> None:
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    if action == "inspect":
        print("tables", cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall())
        print("tasks", cur.execute("SELECT id, title, status, labels FROM tasks").fetchall())
        print("deleted", cur.execute("SELECT id, title FROM deleted_tasks").fetchall())
    elif action == "insert":
        cur.execute(
            """
            INSERT OR REPLACE INTO tasks (
              id, title, description, priority, status, due_date,
              estimated_duration_minutes, labels, parent_task_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "persist-1",
                "SQLite Persistence Test",
                "Created for Stage 9 restart verification",
                "High",
                "Pending",
                "07-20-26",
                "15",
                "sqlite, persistence",
                None,
            ),
        )
        conn.commit()
        print("inserted")
    elif action == "update":
        cur.execute(
            "UPDATE tasks SET title = ?, description = ?, priority = ? WHERE id = ?",
            (
                "SQLite Persistence Test Edited",
                "Edited values must survive restart",
                "Critical",
                "persist-1",
            ),
        )
        conn.commit()
        print("updated", cur.rowcount)
    elif action == "delete":
        cur.execute("DELETE FROM tasks WHERE id = ?", ("persist-1",))
        conn.commit()
        print("deleted", cur.rowcount)
    elif action == "has":
        title = sys.argv[2]
        rows = cur.execute(
            "SELECT id, title FROM tasks WHERE title = ?",
            (title,),
        ).fetchall()
        print(rows)
    else:
        raise SystemExit(f"Unknown action: {action}")
    conn.close()


if __name__ == "__main__":
    main(sys.argv[1])
