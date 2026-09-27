import { defineProvider } from "@shared/core";

/**
 * Contactless public request submission for insurance matching.
 */
export default defineProvider({
    name: "insuron",
    meta: {
        displayName: "Insuron",
        summary:
            "Submit contactless insurance requests for licensed-agent matching.",
        description:
            "Submit a structured insurance request using a product, state, " +
            "and optional bounded coverage details.",
        homepageUrl: "https://insuron.io",
        docsUrl: "https://insuron.io",
        categories: ["insurance-matching"],
        notes: [
            "This is an open-access submission endpoint. It does not require " +
            "approval or attest that consent has been obtained.",
            "The response indicates a matching/review outcome only. An agent " +
            "offer is not an accepted connection.",
        ],
    },
    // The Monid compiler requires an auth hook for every endpoint. This
    // pass-through deliberately injects no credentials or headers.
    auth: { inject: ({ data }) => data.request },
    request: {
        baseUrl: "https://insuron.io/api",
        headers: { Accept: "application/json" },
    },
});
