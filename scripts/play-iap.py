#!/usr/bin/env python3
"""Metsäinfon hinta-arvio Google Playn kertaostotuotteeksi (app-store-release-skillin
play-iap.py, mukautettu).

    python3 scripts/play-iap.py --dry-run     # tulostaa sisällön; ei avainta, ei verkkoa
    python3 scripts/play-iap.py --live        # luo/päivittää ja aktivoi
    python3 scripts/play-iap.py --dry-run --today 2027-02-01

Tuote fi.inetor.metsainfo.hintaarvio, sama tunnus kuin App Storessa. Hinta asetetaan
Suomeen euroina; Play muuntaa muut alueet (sovellus on jaossa vain Suomessa).
Ostovaihtoehto on legacy-yhteensopiva, joten Billingin
getOneTimePurchaseOfferDetailsList() näkee sen (PurchasesPlugin.java).

Launch price: Play has no scheduled price change for one-time products, and the
launch price is a price change, not an offer (spec §10.2). So the script sets
the launch price while today <= LAUNCH_PRICE_UNTIL and the base price after it:
run it again (--live) on the first day after LAUNCH_PRICE_UNTIL.

Palvelutilin avain: PLAY_SERVICE_ACCOUNT_JSON tai HEARTH_PLAY_JSON
(source ~/code/googleplay.env); tilillä pitää olla tuotteiden hallintaoikeus. The Google client
libraries (google-auth, google-api-python-client) are only needed without
--dry-run.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date, datetime, timezone
from pathlib import Path

PACKAGE = "fi.inetor.metsainfo"
DEFAULT_JSON = os.environ.get("HEARTH_PLAY_JSON", "")
PRODUCT = {
    "productId": "fi.inetor.metsainfo.hintaarvio",
    "localizations": {
        "fi": {"name": "Puukaupan hinta-arvio", "description": "Hakkuiden arvo tuoreilla kantohinnoilla"},
    },
}
OPTION_ID = "buy"
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]

# The launch price runs to the end of this day (spec §10.2, §11); Tero can move it.
LAUNCH_PRICE_UNTIL = "2027-01-31"
# Play laskee verottomasta perushinnasta. Suomen alv 25,5 %:
#   EUR 10.35 * 1.255 = 12.9892 -> 12.99 (perushinta)
#   EUR  7.96 * 1.255 =  9.9898 ->  9.99 (aloitushinta, sama kuin App Storessa)
BASE_PRICE = {"label": "12.99", "base": {"currencyCode": "EUR", "units": "10", "nanos": 350_000_000}}
LAUNCH_PRICE = {"label": "9.99", "base": {"currencyCode": "EUR", "units": "7", "nanos": 960_000_000}}

# Sovelluksen kieli -> Playn kielikoodit.
PLAY_LANGUAGES = {"fi": ["fi-FI"]}


def read_product() -> dict:
    return PRODUCT


def price_for(today: str) -> dict:
    """The price to set today: the launch price up to and including LAUNCH_PRICE_UNTIL."""
    return LAUNCH_PRICE if today <= LAUNCH_PRICE_UNTIL else BASE_PRICE


def listings(product: dict | None = None) -> list[dict[str, str]]:
    product = product or read_product()
    out = []
    for lang, codes in PLAY_LANGUAGES.items():
        loc = product["localizations"][lang]
        for code in codes:
            out.append({"languageCode": code, "title": loc["name"], "description": loc["description"]})
    return out


def regions(converted: dict) -> list[dict]:
    return [
        {"regionCode": code, "price": entry["price"], "availability": "AVAILABLE"}
        for code, entry in sorted(converted["convertedRegionPrices"].items())
    ]


def product(region_configs: list[dict], product_data: dict | None = None) -> dict:
    product_data = product_data or read_product()
    return {
        "packageName": PACKAGE,
        "productId": product_data["productId"],
        "listings": listings(product_data),
        "purchaseOptions": [
            {
                "purchaseOptionId": OPTION_ID,
                "buyOption": {"legacyCompatible": True, "multiQuantityEnabled": False},
                "regionalPricingAndAvailabilityConfigs": region_configs,
            }
        ],
    }


def valid_date(s: str) -> str:
    try:
        date.fromisoformat(s)
    except ValueError:
        raise argparse.ArgumentTypeError(f"expected YYYY-MM-DD, got {s}")
    if len(s) != 10:
        raise argparse.ArgumentTypeError(f"expected YYYY-MM-DD, got {s}")
    return s


def describe(price: dict) -> dict:
    launch = price is LAUNCH_PRICE
    return {
        "label": price["label"],
        "base": price["base"],
        "until": LAUNCH_PRICE_UNTIL if launch else None,
        "note": (f"launch price; run this again with --live on the day after {LAUNCH_PRICE_UNTIL} to set "
                 f"{BASE_PRICE['label']} EUR") if launch else "base price",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true", help="print the payload; no key, no network")
    mode.add_argument("--live", action="store_true", help="create/update the product in Google Play")
    parser.add_argument("--today", type=valid_date, default=datetime.now(timezone.utc).date().isoformat())
    parser.add_argument("--converted", type=Path, help="dry-run only: a saved convertRegionPrices response")
    parser.add_argument("--json", type=Path, default=Path(os.environ.get("PLAY_SERVICE_ACCOUNT_JSON") or DEFAULT_JSON))
    args = parser.parse_args()
    if args.converted and not args.dry_run:
        parser.error("--converted is for --dry-run only")

    price = price_for(args.today)

    if args.dry_run:
        out = {"today": args.today, "price": describe(price)}
        if args.converted:
            converted = json.loads(args.converted.read_text(encoding="utf-8"))
            out["regions"] = f"from {args.converted.name}"
            out["regionsVersion"] = converted["regionVersion"]["version"]
            out["product"] = product(regions(converted))
        else:
            out["regions"] = (f"converted at run time: monetization.convertRegionPrices(packageName={PACKAGE}, "
                              f"price={json.dumps(price['base'])})")
            out["product"] = product([])
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 0

    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    creds = service_account.Credentials.from_service_account_file(str(args.json), scopes=SCOPES)
    monetization = build("androidpublisher", "v3", credentials=creds, cache_discovery=False).monetization()

    converted = monetization.convertRegionPrices(
        packageName=PACKAGE, body={"price": price["base"]}).execute(num_retries=3)
    region_configs = regions(converted)
    body = product(region_configs)
    product_id = body["productId"]
    print(f"{len(body['listings'])} listings, {len(region_configs)} regions "
          f"(regions version {converted['regionVersion']['version']}); "
          f"FI {next((r['price'] for r in region_configs if r['regionCode'] == 'FI'), None)}; "
          f"{describe(price)['note']}")

    saved = monetization.onetimeproducts().patch(
        packageName=PACKAGE,
        productId=product_id,
        updateMask="listings,purchaseOptions",
        allowMissing=True,
        # The regions version the conversion priced against, so the two agree.
        regionsVersion_version=converted["regionVersion"]["version"],
        body=body,
    ).execute(num_retries=3)
    state = saved["purchaseOptions"][0].get("state")
    print(f"saved {product_id}; purchase option {OPTION_ID} is {state}")
    if state != "ACTIVE":
        monetization.onetimeproducts().purchaseOptions().batchUpdateStates(
            packageName=PACKAGE,
            productId=product_id,
            body={"requests": [{"activatePurchaseOptionRequest": {
                "packageName": PACKAGE, "productId": product_id, "purchaseOptionId": OPTION_ID,
            }}]},
        ).execute(num_retries=3)
        print("activated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
