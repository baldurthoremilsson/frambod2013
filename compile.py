#!/usr/bin/env python3

import json


def get_info(filename):
    with open(filename, 'r') as f:
        return json.load(f)

if __name__ == "__main__":
    with open('partylist.json', 'r') as f:
        partylist = json.load(f)

    parties = []
    for filename in partylist['parties']:
        print(filename)
        parties.append(get_info(filename))

    with open('parties.json', 'w') as f:
        json.dump({'parties': parties}, f, indent=2, ensure_ascii=False)
