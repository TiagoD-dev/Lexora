from test_api import auth, register


def test_workflows_crud_is_scoped_to_owner(client):
    owner = auth(register(client, 'wf-owner@example.com'))
    other = auth(register(client, 'wf-other@example.com'))
    created = client.post('/workflows', json={'name': 'Ana · Laboral', 'area': 'Laboral'}, headers=owner)
    assert created.status_code == 201, created.text
    workflow_id = created.json()['id']
    assert created.json()['completed'] == []

    updated = client.patch(f'/workflows/{workflow_id}', json={'completed': [2, 0, 2]}, headers=owner)
    assert updated.json()['completed'] == [0, 2]
    assert [item['id'] for item in client.get('/workflows', headers=owner).json()] == [workflow_id]

    assert client.get('/workflows', headers=other).json() == []
    assert client.patch(f'/workflows/{workflow_id}', json={'completed': [1]}, headers=other).status_code == 404
    assert client.delete(f'/workflows/{workflow_id}', headers=other).status_code == 404
    assert client.get('/workflows').status_code == 401

    assert client.delete(f'/workflows/{workflow_id}', headers=owner).status_code == 204
    assert client.get('/workflows', headers=owner).json() == []
