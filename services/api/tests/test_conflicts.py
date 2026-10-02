from test_api import auth, case_payload, client_payload, register


def test_conflict_check_matches_opposing_parties_and_clients_of_own_user_only(client):
    token, other = register(client, "a@example.com"), register(client, "b@example.com")
    case = case_payload() | {"entities": [
        {"id": "e1", "name": "Cliente de teste", "role": "Cliente", "type": "Pessoa"},
        {"id": "e2", "name": "  José   Pereira, Lda. ", "role": "Parte contrária", "type": "Empresa", "nif": "PT 509 999 999"},
    ]}
    assert client.post("/cases", json=case, headers=auth(token)).status_code == 201
    assert client.post("/clients", json=client_payload(), headers=auth(token)).status_code == 201

    # nome com acentos/maiúsculas/espaços diferentes; e só o NIF
    for params in ({"name": "jose pereira, LDA."}, {"nif": "509999999"}):
        found = client.get("/conflicts/check", params=params, headers=auth(token)).json()
        assert [(c["id"], c["party"]) for c in found["cases"]] == [("case-1", "  José   Pereira, Lda. ")]

    # o cliente do caso não é parte contrária; mas coincide com um cliente existente (conflito inverso)
    found = client.get("/conflicts/check", params={"name": "CLIENTE DE TESTE"}, headers=auth(token)).json()
    assert found["cases"] == [] and [c["id"] for c in found["clients"]] == ["client-1"]

    # dados de outro utilizador nunca aparecem; pedido vazio não devolve nada
    assert client.get("/conflicts/check", params={"name": "José Pereira, Lda."}, headers=auth(other)).json() == {"cases": [], "clients": []}
    assert client.get("/conflicts/check", headers=auth(token)).json() == {"cases": [], "clients": []}
    assert client.get("/conflicts/check", params={"name": "x"}).status_code == 401
