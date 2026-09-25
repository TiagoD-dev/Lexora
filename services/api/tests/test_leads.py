from test_api import auth, register


def test_leads_crud_is_scoped_to_owner(client):
    owner = auth(register(client, 'leads-owner@example.com'))
    other = auth(register(client, 'leads-other@example.com'))
    created = client.post('/leads', json={'name': 'Inês', 'email': 'ines@example.com', 'area': 'Laboral', 'source': 'Website', 'notes': 'Despedimento'}, headers=owner)
    assert created.status_code == 201, created.text
    lead = created.json()
    assert lead['stage'] == 'Novo contacto' and lead['value'] == 0 and lead['clientId'] == ''

    updated = client.patch(f"/leads/{lead['id']}", json={'stage': 'Proposta', 'value': 750.5}, headers=owner)
    assert updated.status_code == 200 and updated.json()['value'] == 750.5
    assert client.patch(f"/leads/{lead['id']}", json={'stage': 'Perdido'}, headers=owner).status_code == 422

    assert [item['id'] for item in client.get('/leads', headers=owner).json()] == [lead['id']]
    assert client.get('/leads', headers=other).json() == []
    assert client.patch(f"/leads/{lead['id']}", json={'stage': 'Consulta'}, headers=other).status_code == 404
    assert client.delete(f"/leads/{lead['id']}", headers=other).status_code == 404
    assert client.get('/leads').status_code == 401

    assert client.delete(f"/leads/{lead['id']}", headers=owner).status_code == 204
    assert client.get('/leads', headers=owner).json() == []
