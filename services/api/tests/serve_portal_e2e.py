"""Serve a compiled portal against disposable data. Run from the repository root."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
from urllib.parse import urlsplit
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uvicorn

ROOT = Path(__file__).resolve().parents[3]
WEB = ROOT / 'work/portal-web'
sys.path.insert(0, str(ROOT / 'services/api'))


def main():
    if not (WEB / 'portal.html').is_file():
        raise SystemExit('Export the web app to work/portal-web before starting this server.')
    with TemporaryDirectory(prefix='lexora-portal-') as temporary:
        from app import db
        # Replace the engine before importing main, including its startup migrations.
        db.engine.dispose()
        db.engine = create_engine('sqlite:///' + str(Path(temporary) / 'test.db'), connect_args={'check_same_thread': False})
        db.SessionLocal = sessionmaker(bind=db.engine, autoflush=False, autocommit=False)
        from app.main import app
        from app.routers import portal
        portal.STORAGE = Path(temporary) / 'documents'

        @app.get('/__portal_e2e__', include_in_schema=False)
        def test_marker():
            return {'isolatedPortalTest': True}

        class Static(SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(WEB), **kwargs)

            def do_GET(self):
                url = urlsplit(self.path)
                if url.path != '/' and '.' not in url.path.rsplit('/', 1)[-1]:
                    self.path = url.path + '.html'
                super().do_GET()

            def log_message(self, *args):
                pass

        server = ThreadingHTTPServer(('127.0.0.1', 8765), Static)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            uvicorn.run(app, host='127.0.0.1', port=8000, log_level='warning')
        finally:
            server.shutdown()
            server.server_close()
            thread.join()
            db.engine.dispose()


if __name__ == '__main__':
    main()
