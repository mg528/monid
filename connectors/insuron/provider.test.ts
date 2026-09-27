import { assertEquals, assertRejects } from "@std/assert";
import { fromFileUrl } from "@std/path";
import type { Json } from "@shared/core";
import { loadFixture, runEndpoint, testSealedUnit } from "@shared/testing";

const MATCHED_FIXTURE = fromFileUrl(
    new URL(
        "./endpoints/create-request/fixtures/synthetic-matched.json",
        import.meta.url,
    ),
);
const NO_MATCH_FIXTURE = fromFileUrl(
    new URL(
        "./endpoints/create-request/fixtures/synthetic-no-match.json",
        import.meta.url,
    ),
);

const validBody = {
    product: "auto",
    state: "CA",
    details: {
        driverAge: 37,
        currentlyInsured: true,
        vehicles: 2,
    },
};

Deno.test("open insurance submission returns only safe matched fields", async () => {
    const result = await runEndpoint({
        unit: await testSealedUnit("insuron#open/requests"),
        input: { body: validBody },
        mode: "replay",
        fixture: await loadFixture(MATCHED_FIXTURE),
    });
    assertEquals(result.httpStatus, 201);
    assertEquals(result.isProviderError, false);
    assertEquals(result.output, {
        id: "89f2833d-6f0d-4ae0-8fb2-33b02ca03eb9",
        status: "awaiting_agent",
        product: "auto",
        state: "CA",
        createdAt: "2026-01-01T00:00:00.000Z",
    });
    const output = result.output as Record<string, Json>;
    assertEquals(
        Object.keys(output).sort(),
        ["createdAt", "id", "product", "state", "status"],
    );
    assertEquals(result.usage.credits, {});
});

Deno.test("open insurance submission returns review_required when unmatched", async () => {
    const result = await runEndpoint({
        unit: await testSealedUnit("insuron#open/requests"),
        input: { body: { product: "home", state: "NY" } },
        mode: "replay",
        fixture: await loadFixture(NO_MATCH_FIXTURE),
    });
    assertEquals(result.httpStatus, 201);
    assertEquals(result.output, {
        id: "a6c15f74-3b1f-4f56-a4ed-ef142b578c33",
        status: "review_required",
        product: "home",
        state: "NY",
        createdAt: "2026-01-02T00:00:00.000Z",
    });
});

Deno.test("open insurance submission rejects PII and unknown fields", async () => {
    const unit = await testSealedUnit("insuron#open/requests");
    for (
        const body of [
            { ...validBody, phone: "+15555550100" },
            { ...validBody, consumerName: "Example Consumer" },
            { ...validBody, email: "consumer@example.test" },
            { ...validBody, objective: "Please help me find coverage." },
            { ...validBody, consent: true },
            { ...validBody, unknown: "not allowed" },
            {
                ...validBody,
                details: { ...validBody.details, sourceAgent: "agent" },
            },
        ]
    ) {
        await assertRejects(
            () =>
                runEndpoint({
                    unit,
                    input: { body: body as never },
                    mode: "replay",
                }),
            Error,
            "INVALID_INPUT",
        );
    }
});

Deno.test("open insurance submission enforces product, state, and detail bounds", async () => {
    const unit = await testSealedUnit("insuron#open/requests");
    for (
        const body of [
            { product: "pet", state: "CA" },
            { product: "auto", state: "California" },
            { product: "auto", state: "ca" },
            { product: "auto", state: "CA", details: { driverAge: 15 } },
            { product: "auto", state: "CA", details: { vehicles: 0 } },
            { product: "home", state: "CA", details: { propertyType: "farm" } },
            {
                product: "commercial",
                state: "CA",
                details: { employeeCount: 100001 },
            },
            {
                product: "auto",
                state: "CA",
                details: { propertyType: "condo" },
            },
        ]
    ) {
        await assertRejects(
            () =>
                runEndpoint({
                    unit,
                    input: { body: body as never },
                    mode: "replay",
                }),
            Error,
            "INVALID_INPUT",
        );
    }
});