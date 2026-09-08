# Business Outreach

MERLIN V7 uses a two-stage prospecting pipeline:

1. Nominatim geocodes one owner-supplied place/postcode.
2. Overpass returns named public business/POI records within the radius.
3. A limited number are enriched from public websites after the main scan returns.
4. Optional Companies House matching can verify a UK limited company.

The scanner does not send email. It creates an owner-reviewable prospect queue.

## Compliance states
- `corporate_confirmed`: Companies House or owner verification indicates a corporate entity.
- `unknown_review`: UK legal form not established; review before cold email.
- `legal_review_required`: non-UK prospect; local rules require separate review.
- `do_not_contact`: suppress further outreach.

MERLIN should prefer public generic business mailboxes such as info@ / hello@ / sales@ when available and should not treat a named personal address as equivalent to a generic corporate address.

## Companies House
Set `COMPANIES_HOUSE_API_KEY` in the server environment. The API key is sent using HTTP Basic authentication as the username with a blank password.

## Scaling beyond public OSM
Free Nominatim and public Overpass instances are excellent for initial/local discovery but are community infrastructure. If the business begins scanning the whole UK continuously, replace or supplement these connectors with a commercial business-data provider or self-hosted OSM infrastructure.
