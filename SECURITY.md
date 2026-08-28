# Security policy

## Reporting a vulnerability

Do not open a public issue. Use the repository's **Security → Report a vulnerability** flow to create a private GitHub Security Advisory.

Include the affected component/version, reproduction, impact, and suggested mitigation if known. Do not include real customer data or credentials. You should receive an acknowledgment within seven days.

## Supported versions

Security fixes are applied to the latest release and `main`. The project depends on beta/rapidly evolving agent infrastructure; adopters must pin versions, monitor advisories, and maintain their own production risk review.

## Scope reminder

The default simulator cannot send messages. A production deployment is not secure merely because this starter is used; adopters must implement and review account linking, durable bindings, authorization, data retention, vendor terms, secrets, incident response, and domain-specific action policies.
