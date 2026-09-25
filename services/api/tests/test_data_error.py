from sqlalchemy.exc import DataError

from app.main import app


def test_data_error_becomes_422(client):
    @app.get("/_test/data-error")
    def boom():
        raise DataError("INSERT", {}, Exception("value too long for type character varying(255)"))

    response = client.get("/_test/data-error")
    assert response.status_code == 422
    assert "tamanho máximo" in response.json()["detail"]
