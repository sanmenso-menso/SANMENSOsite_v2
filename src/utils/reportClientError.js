export const reportClientError = (error, context = {}) => {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    const report = {
        message: normalizedError.message,
        name: normalizedError.name,
        context,
        occurredAt: new Date().toISOString(),
        release: import.meta.env.VITE_APP_RELEASE || 'unversioned',
    };

    console.error('[SANMENSO client error]', normalizedError, context);

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sanmenso:client-error', { detail: report }));

        const configuredEndpoint = import.meta.env.VITE_ERROR_REPORTING_ENDPOINT;
        if (!configuredEndpoint) return;

        let endpoint;
        try {
            endpoint = new URL(configuredEndpoint, window.location.origin);
        } catch {
            console.warn('[SANMENSO client error] Invalid reporting endpoint.');
            return;
        }

        if (endpoint.origin !== window.location.origin) {
            console.warn('[SANMENSO client error] Reporting endpoint must be same-origin.');
            return;
        }

        const body = JSON.stringify(report);
        const beaconSent = typeof navigator.sendBeacon === 'function'
            && navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));

        if (!beaconSent) {
            void fetch(endpoint, {
                method: 'POST',
                body,
                credentials: 'omit',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
            }).catch((reportingError) => {
                console.warn('[SANMENSO client error] Report delivery failed.', reportingError);
            });
        }
    }
};
