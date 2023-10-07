"""Handle the API endpoints for the API requests. Only returns data, no html."""
from flask import (
    Blueprint
)
from ..db import read, write
from flask_cors import CORS

api = Blueprint('api', __name__, url_prefix='/api/v1')
CORS(api)


@api.route('/<data_id>', methods=('GET',))
def get_data(index_of_data):
    data = read(index_of_data)
    return data

@api.route('/measurement', methods=('POST',))
def post_data():
    write(request.)