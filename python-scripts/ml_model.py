from flask import Flask, request, jsonify
from risk_predictor import RiskPredictor

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    predictor = RiskPredictor()
    result = predictor.predict(data)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
