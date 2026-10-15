const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "pages", "contact.html"), "utf8");
const script = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .find(match => match[1].includes("const serviceSelections"))?.[1];
assert.ok(script, "Contact form script must be present");

function setup({ token = "synthetic-hcaptcha-token", success = true, networkError = false } = {}) {
    const elements = {
        service_detail: { value: "" },
        enquiry_source: { value: "contact-page" },
        service: { value: "ai" }
    };
    const button = { disabled: false };
    const message = { textContent: "", className: "", classList: { remove() {} } };
    const requests = [];
    const events = [];
    let submit;
    let formResets = 0;
    let captchaResets = 0;
    const fields = new FormData();
    fields.set("name", "Synthetic test");
    fields.set("email", "test@example.com");
    fields.set("message", "Synthetic form regression test");
    fields.set("service", "ai");
    fields.set("h-captcha-response", token);
    fields.set("g-recaptcha-response", token);
    const form = {
        elements,
        addEventListener(name, listener) {
            assert.equal(name, "submit");
            submit = listener;
        },
        querySelector(selector) {
            if (selector === 'button[type="submit"]') return button;
            if (selector === 'textarea[name="h-captcha-response"]') return { value: token };
            throw new Error(`Unexpected selector: ${selector}`);
        },
        reset() { formResets += 1; }
    };
    const window = {
        location: { search: "?service=ai-mcp-security&source=service-page" },
        dataLayer: [],
        dispatchEvent(event) { events.push(event); },
        hcaptcha: { reset() { captchaResets += 1; } }
    };
    vm.runInNewContext(script, {
        window,
        hcaptcha: window.hcaptcha,
        document: {
            getElementById(id) {
                if (id === "contactForm") return form;
                if (id === "formMessage") return message;
                assert.ok(elements[id], `Unexpected element: ${id}`);
                return elements[id];
            }
        },
        URLSearchParams,
        FormData: function (submittedForm) {
            assert.equal(submittedForm, form);
            return fields;
        },
        CustomEvent: class {
            constructor(type, options) { this.type = type; this.detail = options.detail; }
        },
        setTimeout() {},
        async fetch(url, options) {
            requests.push({ url, options });
            if (networkError) throw new Error("Synthetic network failure");
            return {
                ok: success,
                async json() {
                    return { success, message: success ? "Accepted" : "Synthetic provider rejection" };
                }
            };
        }
    });
    return {
        async submit() {
            let prevented = false;
            await submit.call(form, { preventDefault() { prevented = true; } });
            assert.ok(prevented);
        },
        requests, events, window, button, message, elements,
        get formResets() { return formResets; },
        get captchaResets() { return captchaResets; }
    };
}

test("hCaptcha disables reCAPTCHA compatibility without removing the challenge or honeypot", () => {
    assert.match(source, /src="https:\/\/js\.hcaptcha\.com\/1\/api\.js\?recaptchacompat=off"/);
    assert.match(source, /class="h-captcha"[^>]*data-sitekey="50b2fe65-b00b-4b9e-ad62-3ba471098be2"/);
    assert.match(source, /name="botcheck"/);
});

test("incomplete hCaptcha blocks submissions", async () => {
    const app = setup({ token: "" });
    await app.submit();
    assert.equal(app.requests.length, 0);
    assert.match(app.message.textContent, /complete the captcha/);
    assert.equal(app.button.disabled, false);
});

test("submission preserves hCaptcha but excludes the paid reCAPTCHA field", async () => {
    const app = setup();
    await app.submit();
    assert.equal(app.requests.length, 1);
    const { url, options } = app.requests[0];
    assert.equal(url, "https://api.web3forms.com/submit");
    assert.equal(options.method, "POST");
    assert.equal(options.body.get("h-captcha-response"), "synthetic-hcaptcha-token");
    assert.equal(options.body.has("g-recaptcha-response"), false);
    assert.equal(options.body.get("email"), "test@example.com");
    assert.equal(app.elements.service_detail.value, "ai-mcp-security");
    assert.equal(app.elements.enquiry_source.value, "service-page");
    assert.equal(app.events[0].detail.service, "ai-mcp-security");
    assert.equal(app.window.dataLayer[0].event, "contact_form_submitted");
    assert.match(app.message.className, /success/);
    assert.equal(app.formResets, 1);
    assert.equal(app.captchaResets, 1);
    assert.equal(app.button.disabled, false);
});

test("provider rejection is visible and does not clear the form or record a conversion", async () => {
    const app = setup({ success: false });
    await app.submit();
    assert.match(app.message.textContent, /Synthetic provider rejection/);
    assert.match(app.message.className, /error/);
    assert.equal(app.formResets, 0);
    assert.equal(app.events.length, 0);
    assert.equal(app.captchaResets, 1);
    assert.equal(app.button.disabled, false);
});

test("network failure shows the direct email option and allows retry", async () => {
    const app = setup({ networkError: true });
    await app.submit();
    assert.match(app.message.textContent, /Network error.*info@preemptivecybersec\.com/);
    assert.equal(app.formResets, 0);
    assert.equal(app.events.length, 0);
    assert.equal(app.captchaResets, 1);
    assert.equal(app.button.disabled, false);
});
