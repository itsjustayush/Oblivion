# Security Policy & Vulnerability Disclosure

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

We take the security of **Oblivion** and our users' privacy very seriously. If you discover a potential security vulnerability in Oblivion, please report it to us immediately following our responsible disclosure policy.

### Disclosure Process

1. **Email Security Report**: Send an email detailing the vulnerability to `info.cometlabs@gmail.com` with the subject line `[SECURITY] Potential Vulnerability in Oblivion`.
2. **Include Details**:
   - Step-by-step reproduction instructions or Proof of Concept (PoC).
   - Affected components (e.g. Auth, Spotify OAuth, Firebase Rules, LocalStorage handlers).
   - Impact assessment (e.g. cross-site scripting, token leakage, unauthorized state access).
3. **Response SLA**:
   - **Acknowledgment**: Within 24 hours.
   - **Triage & Severity Assessment**: Within 48 hours.
   - **Patch & Release**: Priority hotfix within 7 business days for critical vulnerabilities.

### Responsible Disclosure Guidelines

- Please do **NOT** publicly disclose the vulnerability until we have had reasonable time to patch it and publish a release.
- Do **NOT** attempt to access or modify data belonging to other users during testing.
- Do **NOT** execute Denial of Service (DoS) attacks or automated scraping against live services.

## Security Controls Implemented

- **Local First Data Isolation**: User notes, tasks, and settings are preserved in isolated browser LocalStorage.
- **Firebase Security Rules**: Granular Firestore rules restricting document read/write strictly to authenticated `request.auth.uid`.
- **OAuth Key Protection**: Client secret tokens and API keys are stored on server-side proxies or environment secret variables.
- **Content Security & HTTPS**: Enforced HTTPS for all endpoints and secure cookie settings (`SameSite=Lax` / `Secure`).
