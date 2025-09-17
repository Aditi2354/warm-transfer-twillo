from dotenv import load_dotenv
import os
load_dotenv(".env", override=True)
print("LK_API_KEY =", os.getenv("LK_API_KEY"))
print("LK_API_SECRET set? ", bool(os.getenv("LK_API_SECRET")))
