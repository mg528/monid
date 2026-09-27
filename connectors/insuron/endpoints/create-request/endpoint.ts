import { z } from "zod";
import { defineEndpoint, type Json, UsageModelKind } from "@shared/core";

const stateValues = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "DC",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
] as const;

const zAge = z.number().int().min(0).max(120).optional();
const zDriverAge = z.number().int().min(16).max(120).optional();
const zCurrentlyInsured = z.boolean().optional();
const zVehicles = z.number().int().min(1).max(20).optional();
const zTobacco = z.boolean().optional();
const zPropertyType = z.enum([
    "single_family",
    "condo",
    "townhouse",
    "mobile_home",
    "apartment",
    "other",
]).optional();
const zHouseholdSize = z.number().int().min(1).max(20).optional();
const zEmployeeCount = z.number().int().min(0).max(100000).optional();
const zState = z.enum(stateValues).describe("US state or DC postal code.");

const zRequestBody = z.discriminatedUnion("product", [
    z.strictObject({
        product: z.literal("auto"),
        state: zState,
        details: z.strictObject({
            driverAge: zDriverAge,
            currentlyInsured: zCurrentlyInsured,
            vehicles: zVehicles,
        }).optional(),
    }),
    z.strictObject({
        product: z.literal("home"),
        state: zState,
        details: z.strictObject({
            currentlyInsured: zCurrentlyInsured,
            propertyType: zPropertyType,
        }).optional(),
    }),
    z.strictObject({
        product: z.literal("renters"),
        state: zState,
        details: z.strictObject({
            currentlyInsured: zCurrentlyInsured,
            propertyType: zPropertyType,
            householdSize: zHouseholdSize,
        }).optional(),
    }),
    z.strictObject({
        product: z.literal("life"),
        state: zState,
        details: z.strictObject({
            age: zAge,
            tobacco: zTobacco,
        }).optional(),
    }),
    z.strictObject({
        product: z.literal("health"),
        state: zState,
        details: z.strictObject({
            age: zAge,
            currentlyInsured: zCurrentlyInsured,
            tobacco: zTobacco,
            householdSize: zHouseholdSize,
        }).optional(),
    }),
    z.strictObject({
        product: z.literal("commercial"),
        state: zState,
        details: z.strictObject({
            employeeCount: zEmployeeCount,
        }).optional(),
    }),
]);

export default defineEndpoint({
    meta: {
        displayName: "Submit Insurance Request",
        summary: "Submit a contactless insurance request for matching.",
        description:
            "Submit only the insurance product, two-letter state, and optional " +
            "bounded structured details. No free text, contact details, or " +
            "consent attestation are accepted. Public submission is open access " +
            "and does not require application approval.",
        docsUrl: "https://insuron.io",
        categories: ["insurance-matching"],
        notes: [
            "A matched result means an agent offer is available; it does not " +
            "mean the offer was accepted or a connection was completed.",
        ],
    },
    request: { method: "POST", path: "/open/requests" },
    input: { schema: { body: zRequestBody } },
    lifecycle: {
        start: async ({ utils }) => {
            const response = await utils.request({});
            return {
                kind: "COMPLETED",
                httpStatus: response.status,
                output: response.body,
            };
        },
    },
    output: {
        fromResponse: ({ data, utils }) => {
            const id = utils.json.get(data.output, "$.id");
            const status = utils.json.get(data.output, "$.status");
            const product = utils.json.get(data.output, "$.product");
            const state = utils.json.get(data.output, "$.state");
            const createdAt = utils.json.get(data.output, "$.createdAt");
            if (
                typeof id !== "string" ||
                (status !== "awaiting_agent" && status !== "review_required") ||
                typeof product !== "string" || typeof state !== "string" ||
                typeof createdAt !== "string"
            ) {
                throw new Error(
                    "Insurance request response has invalid fields",
                );
            }
            const view: Record<string, Json> = {
                id,
                status,
                product,
                state,
                createdAt,
            };
            return view;
        },
    },
    usage: { model: { kind: UsageModelKind.FREE } },
});
