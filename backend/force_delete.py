import sqlite3

def clean_cnpj():
    cnpj_to_delete = "60.863.708/0001-06"
    # Also clean raw digits version just in case
    cnpj_raw = "60863708000106"
    
    db = "eagles_v2.db"
    conn = sqlite3.connect(db)
    cursor = conn.cursor()
    
    print(f"Deleting client with CNPJ like {cnpj_to_delete}...")
    cursor.execute("DELETE FROM clients WHERE cnpj = ?", (cnpj_to_delete,))
    print(f"Deleted {cursor.rowcount} rows (formatted).")
    
    cursor.execute("DELETE FROM clients WHERE cnpj = ?", (cnpj_raw,))
    print(f"Deleted {cursor.rowcount} rows (raw).")
    
    # Also delete by name just to be nuclear if needed? User said "esse CNPJ".
    # Let's checking if there are duplicates with different formats
    cursor.execute("SELECT id, name, cnpj FROM clients WHERE name LIKE '%Kodrai%'")
    rows = cursor.fetchall()
    print("Remaining Kodrai clients:", rows)
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    clean_cnpj()
