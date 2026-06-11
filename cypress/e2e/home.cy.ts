const TEST_USER = {
  email: `e2e-${Date.now()}@test.com`,
  password: "password123",
  firstName: "E2E",
  lastName: "Test",
};

describe("Signed-out home page", () => {
  it("shows login prompt and no collection table", () => {
    cy.visit("/");
    cy.get("[data-testid=login-prompt]").should("be.visible");
    cy.get("[data-testid=collection-table]").should("not.exist");
    cy.get("[data-testid=drop-zone]").should("not.exist");
  });
});

describe("Registration", () => {
  it("fills form, submits, and lands on home with upload area visible", () => {
    cy.visit("/register");
    cy.get("[data-testid=first-name-input]").type(TEST_USER.firstName);
    cy.get("[data-testid=last-name-input]").type(TEST_USER.lastName);
    cy.get("[data-testid=email-input]").type(TEST_USER.email);
    cy.get("[data-testid=password-input]").type(TEST_USER.password);
    cy.get("[data-testid=submit-button]").click();

    cy.url().should("eq", Cypress.config("baseUrl") + "/");
    cy.get("[data-testid=drop-zone]").should("be.visible");
    cy.get("[data-testid=logout-button]").should("be.visible");
  });
});

describe("Login", () => {
  before(() => {
    cy.request("POST", "/api/user", TEST_USER).its("status").should("eq", 201);
  });

  it("fills login form, submits, and lands on home", () => {
    cy.visit("/login");
    cy.get("[data-testid=email-input]").type(TEST_USER.email);
    cy.get("[data-testid=password-input]").type(TEST_USER.password);
    cy.get("[data-testid=submit-button]").click();

    cy.url().should("eq", Cypress.config("baseUrl") + "/");
    cy.get("[data-testid=drop-zone]").should("be.visible");
  });

  it("shows error on invalid credentials and stays on login page", () => {
    cy.visit("/login");
    cy.get("[data-testid=email-input]").type(TEST_USER.email);
    cy.get("[data-testid=password-input]").type("wrongpassword");
    cy.get("[data-testid=submit-button]").click();

    cy.get("[data-testid=login-error]").should("be.visible");
    cy.url().should("include", "/login");
  });

  it("logs out and shows login prompt", () => {
    cy.login(TEST_USER.email, TEST_USER.password);
    cy.visit("/");
    cy.get("[data-testid=logout-button]").click();

    cy.get("[data-testid=login-prompt]").should("be.visible");
    cy.get("[data-testid=logout-button]").should("not.exist");
  });
});
