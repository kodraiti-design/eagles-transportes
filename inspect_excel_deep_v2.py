import pandas as pd
import sys

file_path = "GRADE ATUALIZADA EAGLES TRANSPORTES 04.09.xlsx"
output_path = "analysis_output.txt"

with open(output_path, "w", encoding="utf-8") as f:
    try:
        xl = pd.ExcelFile(file_path)
        f.write(f"Sheet names: {xl.sheet_names}\n")
        
        for sheet in xl.sheet_names:
            f.write(f"\n--- Sheet: {sheet} ---\n")
            df = pd.read_excel(file_path, sheet_name=sheet, header=None, nrows=20)
            f.write(df.to_string())
    except Exception as e:
        f.write(f"Error: {e}")
