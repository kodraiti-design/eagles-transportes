import sqlite3
import pandas as pd

conn = sqlite3.connect('eagles_v2.db')
df = pd.read_sql_query("SELECT * FROM clients", conn)
print(df)
conn.close()
