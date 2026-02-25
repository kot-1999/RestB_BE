import { Address } from '@prisma/client';

import { IError } from '../utils/IError';

interface NominatimPlace {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    boundingbox: [string, string, string, string];
    lat: string;
    lon: string;
    display_name: string;
    class: string;
    type: string;
    importance: number;
    address: Record<string, string>;
}

export class OpenStreetMapService {
    private static BASE_URL
        = 'https://nominatim.openstreetmap.org/search';

    static async search(search: string) {
        const url
            = `${this.BASE_URL}?`
            + new URLSearchParams({
                q: search,
                format: 'json',
                addressdetails: '1',
                limit: '1'
            });

        const response = await fetch(url, {
            headers: {
                // REQUIRED by Nominatim policy
                'User-Agent': 'restaurant-app/1.0 (dev@app.com)'
            }
        });

        if (!response.ok) {
            throw new IError(400, `Could not find: ${search}`);
        }

        const data = (await response.json()) as NominatimPlace[];

        if (!data.length) {
            return null
        }

        return data[0]
    }

    static async searchAddress(address: Pick<Address, 'country' | 'street' | 'building' | 'postcode' | 'city'>) {
        const params = new URLSearchParams({
            format: 'json',
            addressdetails: '1',
            limit: '1',
            street: `${address.building} ${address.street}`,
            city: address.city,
            postalcode: address.postcode,
            country: address.country
        });

        const url = `${this.BASE_URL}?${params.toString()}`;

        const response = await fetch(url, {
            headers: { 'User-Agent': 'restaurant-app/1.0 (dev@app.com)' } // REQUIRED by Nominatim
        });

        if (!response.ok) {
            throw new IError(400, 'Could not find address')
        }

        const data = (await response.json()) as NominatimPlace[];

        if (!data.length) {
            return null
        }

        return data[0]
    }
}