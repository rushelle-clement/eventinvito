// Guest phone and email checks (utils/contactChecks.js)
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { checkPhone, checkEmail } = require("../src/utils/contactChecks");

describe("Guest phone and email checks", () => {
    it("accepts Sri Lankan mobiles in every common form", () => {
        assert.equal(checkPhone("077 123 4567").phone, "0771234567");
        assert.equal(checkPhone("077-123-4567").phone, "0771234567");
        assert.equal(checkPhone("771234567").phone, "0771234567"); // Excel dropped the 0
        assert.equal(checkPhone("+94 77 123 4567").phone, "+94771234567");
        assert.equal(checkPhone("+94 077 123 4567").phone, "+94771234567");
        assert.equal(checkPhone("94771234567").phone, "94771234567");
        assert.equal(checkPhone("0701234567").phone, "0701234567");
    });

    it("accepts a foreign number with its country code", () => {
        assert.equal(checkPhone("+44 7700 900123").phone, "+447700900123");
        assert.equal(checkPhone("+61 412 345 678").phone, "+61412345678");
    });

    it("explains what's wrong with a bad phone number", () => {
        assert.match(checkPhone("077 123 456").error, /10 digits/); // one digit short
        assert.match(checkPhone("07712345678").error, /10 digits/); // one too many
        assert.match(checkPhone("0112345678").error, /mobile/); // a landline can't get WhatsApp
        assert.match(checkPhone("+94 11 234 5678").error, /mobile/);
        assert.match(checkPhone("+94 77 123 456").error, /9 digits/);
        assert.match(checkPhone("0777777777").error, /real phone/);
        assert.match(checkPhone("12345").error, /Start with 0/);
        assert.match(checkPhone("abc").error, /digits/);
        assert.match(checkPhone("+123").error, /country code/);
    });

    it("accepts real-looking email addresses, in lower case", () => {
        assert.equal(checkEmail("Amal.Perera@Gmail.com").email, "amal.perera@gmail.com");
        assert.equal(checkEmail("nimal+wedding@company.lk").email, "nimal+wedding@company.lk");
        assert.equal(checkEmail("kamala@mail.example.co.uk").email, "kamala@mail.example.co.uk");
    });

    it("refuses broken emails and suggests the right spelling for common typos", () => {
        for (const bad of ["amal", "amal@", "amal@gmail", "amal@gmail.c", "amal..perera@gmail.com", "amal@@gmail.com", "amal perera@gmail.com", ".amal@gmail.com", "amal@-gmail.com"]) {
            assert.ok(checkEmail(bad).error, bad);
        }
        assert.equal(checkEmail("amal@gmial.com").error, "Did you mean amal@gmail.com?");
        assert.equal(checkEmail("amal@yahooo.com").error, "Did you mean amal@yahoo.com?");
        assert.equal(checkEmail("amal@hotmail.co").error, "Did you mean amal@hotmail.com?");
    });
});
