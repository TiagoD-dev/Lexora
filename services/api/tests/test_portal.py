from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.routers import portal
from app.security import JWT_ALGORITHM, JWT_SECRET
from test_api import auth, case_payload, client_payload, register


@pytest.fixture()
def setup_portal(client, tmp_path, monkeypatch):
    monkeypatch.setattr(portal, 'STORAGE', tmp_path / 'portal-files')
    owner = auth(register(client, 'office@example.com'))
    other = auth(register(client, 'other-office@example.com'))
    for identifier in ['client-1', 'client-2']:
        payload = client_payload(identifier)
        payload['email'] = f'{identifier}@example.com'
        assert client.post('/clients', json=payload, headers=owner).status_code == 201
    for identifier, client_id in [('case-1', 'client-1'), ('case-2', 'client-2'), ('private-case', 'client-1')]:
        payload = case_payload(identifier)
        payload.update(clientId=client_id, notes=[{'text': 'SECRET NOTE'}], description='SECRET STRATEGY', facts=[{'statement': 'SECRET FACT'}])
        assert client.post('/cases', json=payload, headers=owner).status_code == 201
    invitation = client.post('/portal/manage/clients/client-1/invite', headers=owner).json()
    credentials = {'accessId': invitation['accessId'], 'email': 'client-1@example.com', 'password': 'PortalPassword123!'}
    activation = client.post('/portal/activate', json={**credentials, 'code': invitation['code']})
    assert activation.status_code == 200, activation.text
    guest = auth(activation.json()['accessToken'])
    assert client.put('/portal/cases/case-1/publication', json={'published': True, 'summary': 'Public update'}, headers=owner).status_code == 200
    return owner, other, guest, invitation, credentials


def test_portal_separates_sessions_and_exposes_only_public_fields(client, setup_portal):
    owner, other, guest, _, _ = setup_portal
    overview = client.get('/portal/me', headers=guest)
    assert overview.status_code == 200
    assert [item['id'] for item in overview.json()['cases']] == ['case-1']
    detail = client.get('/portal/cases/case-1', headers=guest)
    assert 'SECRET' not in detail.text
    assert detail.json()['case']['summary'] == 'Public update'
    assert client.get('/portal/cases/case-2', headers=guest).status_code == 404
    assert client.get('/portal/cases/private-case', headers=guest).status_code == 404
    for path in ['/clients', '/cases', '/auth/me', '/portal/manage/clients/client-1']:
        assert client.get(path, headers=guest).status_code == 401
    assert client.get('/portal/me', headers=owner).status_code == 403
    assert client.get('/portal/manage/clients/client-1', headers=other).status_code == 404
    assert client.get('/portal/cases/case-1', headers=other).status_code == 404
    assert client.put('/portal/cases/case-1/publication', json={'published': True, 'summary': 'hack'}, headers=guest).status_code == 401
    assert client.get('/portal/me').status_code == 401


def test_invitation_is_single_use_and_revocation_invalidates_sessions(client, setup_portal):
    owner, _, guest, invitation, credentials = setup_portal
    assert client.post('/portal/activate', json={**credentials, 'code': invitation['code']}).status_code == 401
    assert client.post('/portal/login', json=credentials).status_code == 200
    assert client.delete('/portal/manage/clients/client-1/access', headers=owner).status_code == 204
    assert client.get('/portal/me', headers=guest).status_code == 401
    assert client.post('/portal/login', json=credentials).status_code == 401
    new = client.post('/portal/manage/clients/client-1/invite', headers=owner).json()
    assert new['code'] != invitation['code']
    assert client.post('/portal/login', json=credentials).status_code == 401
    assert client.post('/portal/activate', json={**credentials, 'code': new['code']}).status_code == 200


def test_messages_requests_files_and_receivables_persist(client, setup_portal):
    owner, other, guest, _, _ = setup_portal
    message = client.post('/portal/cases/case-1/items', headers=guest, json={'kind': 'message', 'text': 'Olá, envio o documento.'})
    assert message.status_code == 201
    assert message.json()['author'] == 'client'
    assert client.post('/portal/cases/case-1/items', headers=guest, json={'kind': 'request', 'text': 'forged'}).status_code == 403
    request = client.post('/portal/cases/case-1/items', headers=owner, json={'kind': 'request', 'text': 'Contrato'}).json()
    uploaded = client.post('/portal/cases/case-1/documents', headers=guest, data={'requestId': request['id']}, files={'file': ('contrato.txt', b'Confidential content', 'text/plain')})
    assert uploaded.status_code == 201, uploaded.text
    document = uploaded.json()
    assert 'storedName' not in document['data']
    assert document['data']['requestId'] == request['id']
    for who in [owner, guest]:
        response = client.get(f"/portal/documents/{document['id']}", headers=who)
        assert response.status_code == 200
        assert response.content == b'Confidential content'
        assert response.headers['cache-control'] == 'no-store'
        assert 'attachment' in response.headers['content-disposition']
    assert client.get(f"/portal/documents/{document['id']}", headers=other).status_code == 404
    assert client.get(f"/portal/documents/{document['id']}").status_code == 401
    charge = client.post('/portal/cases/case-1/items', headers=owner, json={'kind': 'charge', 'text': 'Consulta', 'amountCents': 12345, 'dueDate': '2026-12-01', 'instructions': 'Referência acordada'}).json()
    assert client.patch(f"/portal/charges/{charge['id']}", json={'paid': True}, headers=guest).status_code == 401
    assert client.patch(f"/portal/charges/{charge['id']}", json={'paid': True}, headers=other).status_code == 404
    assert client.patch(f"/portal/charges/{charge['id']}", json={'paid': True}, headers=owner).status_code == 200
    items = client.get('/portal/cases/case-1', headers=guest).json()['items']
    assert len(items) == 4
    assert next(item for item in items if item['kind'] == 'charge')['data']['paid'] is True
    assert next(item for item in items if item['kind'] == 'charge')['data']['amountCents'] == 12345
    # Re-fetching through a new request proves the writes survived the request session.
    assert client.get('/portal/cases/case-1', headers=owner).json()['items'] == items


def test_unpublish_and_reassign_do_not_leak_previous_client_data(client, setup_portal):
    owner, _, guest, _, _ = setup_portal
    doc = client.post('/portal/cases/case-1/documents', headers=owner, files={'file': ('private.txt', b'old client', 'text/plain')}).json()
    client.put('/portal/cases/case-1/publication', headers=owner, json={'published': False, 'summary': 'Private'})
    assert client.get('/portal/me', headers=guest).json()['cases'] == []
    assert client.get(f"/portal/documents/{doc['id']}", headers=guest).status_code == 404
    client.put('/portal/cases/case-1/publication', headers=owner, json={'published': True, 'summary': 'Public'})
    assert client.patch('/cases/case-1', headers=owner, json={'clientId': 'client-2'}).status_code == 200
    assert client.get('/portal/cases/case-1', headers=guest).status_code == 404
    assert client.get('/portal/cases/case-1', headers=owner).json()['items'] == []
    assert client.get('/portal/cases/case-1', headers=owner).json()['case']['published'] is False
    assert client.get(f"/portal/documents/{doc['id']}", headers=owner).status_code == 404


def test_validation_and_login_throttling(client, setup_portal, monkeypatch):
    owner, _, guest, _, credentials = setup_portal
    for text in ['', '    ']:
        assert client.post('/portal/cases/case-1/items', headers=guest, json={'kind': 'message', 'text': text}).status_code == 422
    for amount in [0, -1, 1.5]:
        assert client.post('/portal/cases/case-1/items', headers=owner, json={'kind': 'charge', 'text': 'Fee', 'amountCents': amount}).status_code == 422
    assert client.post('/portal/cases/case-1/documents', headers=guest, files={'file': ('bad.html', b'<script>bad</script>', 'text/html')}).status_code == 415
    monkeypatch.setattr(portal, 'MAX_SIZE', 10)
    assert client.post('/portal/cases/case-1/documents', headers=guest, files={'file': ('large.txt', b'x' * 11, 'text/plain')}).status_code == 413
    assert client.post('/portal/cases/case-1/documents', headers=guest, data={'requestId': 'unknown'}, files={'file': ('small.txt', b'ok', 'text/plain')}).status_code == 404
    for _ in range(10):
        assert client.post('/portal/login', json={**credentials, 'password': 'wrongPassword1!'}).status_code == 401
    assert client.post('/portal/login', json=credentials).status_code == 429


def test_logout_email_change_and_expiry(client, setup_portal):
    owner, _, guest, invitation, credentials = setup_portal
    claims = jwt.decode(guest['Authorization'].split()[1], JWT_SECRET, algorithms=[JWT_ALGORITHM], audience='lexora-portal')
    claims['exp'] = datetime.now(timezone.utc) - timedelta(seconds=1)
    expired = auth(jwt.encode(claims, JWT_SECRET, algorithm=JWT_ALGORITHM))
    assert client.get('/portal/me', headers=expired).status_code == 401
    assert client.post('/portal/logout', headers=guest).status_code == 204
    assert client.get('/portal/me', headers=guest).status_code == 401
    new_session = client.post('/portal/login', json=credentials).json()['accessToken']
    assert client.patch('/clients/client-1', headers=owner, json={'email': 'changed@example.com'}).status_code == 200
    assert client.get('/portal/me', headers=auth(new_session)).status_code == 401


def test_expired_invite(client, setup_portal, monkeypatch):
    owner, _, _, _, credentials = setup_portal
    new = client.post('/portal/manage/clients/client-1/invite', headers=owner).json()
    monkeypatch.setattr(portal, 'now', lambda: (datetime.now(timezone.utc) + timedelta(days=3)).isoformat())
    assert client.post('/portal/activate', json={**credentials, 'code': new['code']}).status_code == 401
