import test from "node:test";
import assert from "node:assert/strict";
import { createAutoLockController, shouldSuppressAutoLock } from "../../src/lib/auto-lock.ts";

function createAutoLockAdapterMock() {
    const calls: Array<"suppress" | "allow"> = [];
    return {
        calls,
        adapter: {
            suppressAutoLock: async () => {
                calls.push("suppress");
            },
            allowAutoLock: async () => {
                calls.push("allow");
            },
        },
    };
}

test("ACTIVE + expanded suppresses auto-lock", () => {
    /*
     * What and why this test checks:
     * This test checks the core policy function used by the provider effect so we only suppress auto-lock
     * when the running pomodoro is in the expanded timer UI.
     *
     * Passing scenario:
     * The function returns true for an ACTIVE session with minimized=false.
     *
     * Failing scenario:
     * If this returns false, the phone can auto-lock during the active expanded timer and break the expected behavior.
     */
    assert.equal(shouldSuppressAutoLock("ACTIVE", false), true);
});

test("ACTIVE + minimized allows normal auto-lock", () => {
    /*
     * What and why this test checks:
     * This test checks that minimizing the timer explicitly opts out of keep-awake even when the session is still active.
     *
     * Passing scenario:
     * The function returns false for an ACTIVE session with minimized=true.
     *
     * Failing scenario:
     * If this returns true, the app keeps the screen awake in minimized mode and wastes battery.
     */
    assert.equal(shouldSuppressAutoLock("ACTIVE", true), false);
});

test("PAUSED or ended sessions allow normal auto-lock in expanded mode", () => {
    /*
     * What and why this test checks:
     * This test checks non-active statuses so only active countdowns can hold the wake lock.
     *
     * Passing scenario:
     * PAUSED and COMPLETED both return false, even when minimized=false.
     *
     * Failing scenario:
     * If either returns true, paused or completed timers would keep the display awake unexpectedly.
     */
    assert.equal(shouldSuppressAutoLock("PAUSED", false), false);
    assert.equal(shouldSuppressAutoLock("COMPLETED", false), false);
});

test("transition expanded -> minimized while ACTIVE calls allow once", async () => {
    const mock = createAutoLockAdapterMock();
    const controller = createAutoLockController(mock.adapter);

    await controller.setAutoLockSuppressed(true);
    await controller.setAutoLockSuppressed(false);
    await controller.setAutoLockSuppressed(false);

    /*
     * What and why this test checks:
     * This test checks transition deduping so repeated state updates do not spam native plugin calls.
     *
     * Passing scenario:
     * After switching from enabled to disabled and repeating disabled, allowAutoLock is called exactly once.
     *
     * Failing scenario:
     * If allowAutoLock is called multiple times for the same disabled state, native bridge traffic becomes noisy and brittle.
     */
    assert.equal(mock.calls.filter((call) => call === "allow").length, 1);
});

test("transition minimized -> expanded while ACTIVE calls suppress once", async () => {
    const mock = createAutoLockAdapterMock();
    const controller = createAutoLockController(mock.adapter);

    await controller.setAutoLockSuppressed(false);
    await controller.setAutoLockSuppressed(true);
    await controller.setAutoLockSuppressed(true);

    /*
     * What and why this test checks:
     * This test checks that moving into expanded active mode requests keep-awake exactly once even if the same state repeats.
     *
     * Passing scenario:
     * suppressAutoLock is called once when transitioning from disabled to enabled and not called again for duplicate enabled updates.
     *
     * Failing scenario:
     * If suppressAutoLock fires multiple times without a state change, the controller is not transition-aware.
     */
    assert.equal(mock.calls.filter((call) => call === "suppress").length, 1);
});

test("cleanup after enabled state always releases auto-lock", async () => {
    const mock = createAutoLockAdapterMock();
    const controller = createAutoLockController(mock.adapter);

    await controller.setAutoLockSuppressed(true);
    await controller.cleanup();

    /*
     * What and why this test checks:
     * This test checks unmount safety so app teardown cannot leave the device stuck in keep-awake mode.
     *
     * Passing scenario:
     * cleanup triggers allowAutoLock after an enabled state.
     *
     * Failing scenario:
     * If allowAutoLock is not called on cleanup, stale wake-lock behavior can persist after leaving the timer view.
     */
    assert.equal(mock.calls.includes("allow"), true);
});
