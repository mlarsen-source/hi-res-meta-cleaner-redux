export {};

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("login", (email: string, password: string) => {
  cy.request({
    method: "POST",
    url: "/api/login",
    body: { email, password },
    failOnStatusCode: false,
  });
});
