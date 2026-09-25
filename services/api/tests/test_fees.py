from test_api import auth, register


def test_fees_crud_and_isolation(client):
    owner = auth(register(client, 'fees-owner@example.com'))
    other = auth(register(client, 'fees-other@example.com'))
    payload = {'kind': 'Tempo', 'client': 'Ana · Laboral', 'description': 'Análise · 2 h', 'amount': 221.4, 'hours': 2, 'vat': 'IVA 23%', 'dueDate': '2026-10-01'}
    created = client.post('/fees', json=payload, headers=owner)
    assert created.status_code == 201, created.text
    fee = created.json()
    assert fee['paid'] is False and fee['caseId'] is None

    assert [item['id'] for item in client.get('/fees', headers=owner).json()] == [fee['id']]
    assert client.get('/fees', headers=other).json() == []
    assert client.patch(f"/fees/{fee['id']}", json={'paid': True}, headers=other).status_code == 404
    assert client.delete(f"/fees/{fee['id']}", headers=other).status_code == 404

    assert client.patch(f"/fees/{fee['id']}", json={'paid': True}, headers=owner).json()['paid'] is True
    assert client.delete(f"/fees/{fee['id']}", headers=owner).status_code == 204
    assert client.get('/fees', headers=owner).json() == []
