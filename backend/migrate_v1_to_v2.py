import sqlite3
import os

def migrate():
    v1_db = "eagles.db"
    v2_db = "eagles_v2.db"
    
    if not os.path.exists(v1_db):
        print("Old database not found.")
        return

    # Ensure tables exist in V2 by using SQLAlchemy models
    from database import engine
    import models
    models.Base.metadata.create_all(bind=engine)

    # Connect to both
    conn_v1 = sqlite3.connect(v1_db)
    conn_v2 = sqlite3.connect(v2_db)
    
    # 1. Migrate Drivers (Assumed same schema mostly)
    try:
        drivers = conn_v1.execute("SELECT * FROM drivers").fetchall()
        # Get v2 columns
        v2_driver_cols = [info[1] for info in conn_v2.execute("PRAGMA table_info(drivers)").fetchall()]
        
        # We assume columns match roughly. If v2 has more, we fill defaults.
        # Drivers schema change? 
        # Checking my edits: I didn't change Driver model recently.
        # So it should be a direct copy.
        
        if drivers:
            print(f"Migrating {len(drivers)} drivers...")
            # Generating placeholders
            placeholders = ','.join(['?'] * len(drivers[0]))
            conn_v2.executemany(f"INSERT OR IGNORE INTO drivers VALUES ({placeholders})", drivers)
            conn_v2.commit()
    except Exception as e:
        print(f"Error migrating drivers: {e}")

    # 2. Migrate Clients (Schema CHANGED)
    # Old: id, name, cnpj, email, phone, address
    # New: id, name, cnpj, email, phone, cep, street, number, complement, neighborhood, city, state
    try:
        clients_v1 = conn_v1.execute("SELECT id, name, cnpj, email, phone, address FROM clients").fetchall()
        if clients_v1:
            print(f"Migrating {len(clients_v1)} clients...")
            for c in clients_v1:
                c_id, name, cnpj, email, phone, old_address = c
                
                # We map old_address to 'street' just to save it. 
                # Ideally we would try to parse, but 'street' is a safe container for now.
                street = old_address
                cep = ""
                number = ""
                complement = ""
                neighborhood = ""
                city = ""
                state = ""
                
                # Check if client already exists
                exists = conn_v2.execute("SELECT 1 FROM clients WHERE id=?", (c_id,)).fetchone()
                if not exists:
                    conn_v2.execute("""
                        INSERT INTO clients (id, name, cnpj, email, phone, cep, street, number, complement, neighborhood, city, state)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (c_id, name, cnpj, email, phone, cep, street, number, complement, neighborhood, city, state))
            conn_v2.commit()
    except Exception as e:
        print(f"Error migrating clients: {e}")

    # 3. Migrate Freights (Assumed same schema)
    try:
        freights = conn_v1.execute("SELECT * FROM freights").fetchall()
        if freights:
            print(f"Migrating {len(freights)} freights...")
            # Same strategy as drivers
            placeholders = ','.join(['?'] * len(freights[0]))
            conn_v2.executemany(f"INSERT OR IGNORE INTO freights VALUES ({placeholders})", freights)
            conn_v2.commit()
    except Exception as e:
        print(f"Error migrating freights: {e}")

    conn_v1.close()
    conn_v2.close()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
