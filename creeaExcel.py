import pandas as pd

# Crear los datos de ejemplo basados en el formato solicitado
data = {
    "No.": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "Carné": ["202300123", "202300456", "202201789", "202105111", "202300999", 
              "202208222", "202004333", "202300555", "202109666", "202203777"],
    "Estudiante": ["Carlos Roberto Gomez", "Maria Jimena Lopez", "Juan Pablo Duarte", 
                   "Ana Lucia Mendez", "Luis Fernando Perez", "Elena Sofia Rodriguez", 
                   "Ricardo Antonio Sosa", "Claudia Maria Fuentes", "Jorge Mario Rivas", 
                   "Paola Andrea Herrera"],
    "Correo Electrónico": ["carlos.gomez@universidad.edu", "maria.lopez@universidad.edu", 
                           "juan.duarte@universidad.edu", "ana.mendez@universidad.edu", 
                           "luis.perez@universidad.edu", "elena.rodriguez@universidad.edu", 
                           "ricardo.sosa@universidad.edu", "claudia.fuentes@universidad.edu", 
                           "jorge.rivas@universidad.edu", "paola.herrera@universidad.edu"]
}

# Crear el DataFrame
df = pd.DataFrame(data)

# Guardar a Excel
file_path = "datos_estudiantes_classassist.xlsx"
df.to_excel(file_path, index=False)