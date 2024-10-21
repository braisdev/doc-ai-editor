from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Welcome to Doc AI Editor!"}


def start():
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
