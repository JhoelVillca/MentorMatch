import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
try:
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    print("Success")
except Exception as e:
    print("Error type:", type(e))
    # Do not print `e` directly as it raises UnicodeDecodeError
    # The message is in e.pgerror or str(e) but we must handle decoding
    import traceback
    traceback.print_exc()
