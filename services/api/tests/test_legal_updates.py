import httpx

from app import legal_updates

DR_XML = b"""<?xml version="1.0"?>
<rss version="2.0"><channel>
  <item><title>Decreto-Lei n.o 1/2026</title><link>https://files.diariodarepublica.pt/1s/2026/1.pdf</link>
  <pubDate>Thu, 03 Sep 2026 00:00:00 +0100</pubDate><description>Novo regime.</description></item>
</channel></rss>"""

EURLEX_XML = """<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel>
  <item><title>CELEX:32026R1167: Commission Delegated Regulation</title><link>https://eur-lex.europa.eu/x</link>
  <pubDate>Thu, 03 Sep 2026 00:00:00 +0200</pubDate><description></description></item>
  <item><title>CELEX:32015R0757R(03)</title><link>https://eur-lex.europa.eu/y</link>
  <pubDate>Thu, 03 Sep 2026 00:00:00 +0200</pubDate><description></description></item>
  <item><title>CELEX:32021L0338R(02)</title><link>https://eur-lex.europa.eu/z</link>
  <pubDate>Thu, 03 Sep 2026 00:00:00 +0200</pubDate><description>A retificação não diz respeito à versão portuguesa.</description></item>
</channel></rss>""".encode()


def fake_transport(request: httpx.Request) -> httpx.Response:
    if "diariodarepublica" in str(request.url):
        return httpx.Response(200, content=DR_XML)
    return httpx.Response(200, content=EURLEX_XML)


def test_get_legal_updates_parses_feeds_and_filters_bare_celex(monkeypatch):
    legal_updates._cache.clear()
    client = httpx.Client(transport=httpx.MockTransport(fake_transport))

    results = legal_updates.get_legal_updates(client=client)

    dr_items = [item for item in results if item["source"] == "Diário da República"]
    eurlex_items = [item for item in results if item["source"] == "EUR-Lex"]
    static_ids = {item["id"] for item in legal_updates.STATIC_UPDATES}

    assert len(dr_items) == 1
    assert dr_items[0]["publishedAt"] == "2026-09-03"
    assert dr_items[0]["url"].startswith("https://files.diariodarepublica.pt")

    assert len(eurlex_items) == 1  # o item CELEX sem descrição e o irrelevante para PT são filtrados
    assert eurlex_items[0]["title"].startswith("CELEX:32026R1167")

    assert static_ids.issubset({item["id"] for item in results})


def test_get_legal_updates_falls_back_to_cache_when_source_fails():
    legal_updates._cache.clear()
    working_client = httpx.Client(transport=httpx.MockTransport(fake_transport))
    legal_updates.get_legal_updates(client=working_client)

    def broken_transport(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("indisponível", request=request)

    broken_client = httpx.Client(transport=httpx.MockTransport(broken_transport))
    results = legal_updates.get_legal_updates(client=broken_client)

    assert any(item["source"] == "Diário da República" for item in results)
