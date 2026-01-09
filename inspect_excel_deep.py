import pandas as pd

file_path = "GRADE ATUALIZADA EAGLES TRANSPORTES 04.09.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    print(f"Sheet names: {xl.sheet_names}")
    
    for sheet in xl.sheet_names:
        print(f"\n--- Sheet: {sheet} ---")
        df = pd.read_excel(file_path, sheet_name=sheet, header=None, nrows=20)
        print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
