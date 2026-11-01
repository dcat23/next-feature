/**
 * [logging]
 * Both vars are optional overrides: the logging library defaults the beacon
 * path to `beaconPathValue` (the route the application generator creates)
 * and takes the service name from `createPinoOptions({ service })`. They are
 * documented in `.env.example` only.
 * next-feature@0.1.4-3
 * July 26th 2026, 9:45:48 pm
 */
export const LOGGING = {
    beaconPathKey: 'NEXT_PUBLIC_LOGGING_BEACON_PATH',
    beaconPathValue: '/api/log',
    serviceNameKey: 'LOGGING_SERVICE_NAME',
    optionalSchema: 'z.string().optional()',
} as const;
