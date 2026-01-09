import pandas as pd
import os

file_path = "GRADE ATUALIZADA EAGLES TRANSPORTES 04.09.xlsx"
try:
    # Read the first few rows to get headers
    df = pd.read_excel(file_path, nrows=5)
    print("Columns found:")
    for col in df.columns:
        print(f"- {col}")
    print("\nFirst row sample:")
    print(df.iloc[0].to_dict())
except Exception as e:
    print(f"Error reading excel: {e}")
