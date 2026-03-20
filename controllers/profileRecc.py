from flask import Flask, request, jsonify
from deepface import DeepFace

app = Flask(__name__)

@app.route("/embed", methods=["POST"])
def embed():
    data = request.json
    image_path = data.get("imagePath")

    embedding = DeepFace.represent(img_path=image_path)

    return jsonify({
        "embedding": embedding[0]["embedding"]
    })

if __name__ == "__main__":
    app.run(port=5001)