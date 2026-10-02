from test_api import auth, case_payload, register


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


def test_time_entry_linked_to_case_keeps_work_date(client):
    owner = auth(register(client, 'fees-time@example.com'))
    assert client.post('/cases', json=case_payload(), headers=owner).status_code == 201
    payload = {'caseId': 'case-1', 'kind': 'Tempo', 'client': 'Ana · Laboral', 'description': 'Reunião · 1,5 h', 'amount': 184.5, 'hours': 1.5, 'workDate': '2026-09-30', 'vat': 'IVA 23%', 'dueDate': '2026-10-30'}
    created = client.post('/fees', json=payload, headers=owner)
    assert created.status_code == 201, created.text
    assert created.json()['caseId'] == 'case-1' and created.json()['workDate'] == '2026-09-30' and created.json()['hours'] == 1.5
    assert client.post('/fees', json={**payload, 'hours': 0}, headers=owner).status_code == 422
    assert client.post('/fees', json={**payload, 'workDate': '30/09/2026'}, headers=owner).status_code == 422
    # sem data de trabalho continua válido (honorários fixos, despesas)
    assert client.post('/fees', json={**payload, 'kind': 'Despesa', 'hours': None, 'workDate': None}, headers=owner).json()['workDate'] is None
