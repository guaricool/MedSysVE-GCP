# SECURITY AUDIT REPORT: MedSysVE

* **Date:** 2026-07-20
* **Scope:** 100% full scan of local directory and repository files (773 source files).
* **Compliance Standards:** OWASP 2025 Top 10, CWE Top 25 (2025), HIPAA Security Rule, and Venezuelan LOPDP.

---

## 1. Executive Summary

| Severity | Count | Status / Action Needed |
| :--- | :---: | :--- |
| **Critical** | 1 | Exposed active Google App Password in committed configuration file |
| **High** | 1 | Outdated `nodemailer` dependency vulnerable to SMTP Command Injection & SSRF |
| **Medium** | 2 | Moderate vulnerabilities in `postcss` and `@hono/node-server` |
| **Low / Hardening** | 1 | Unrestricted permissions in GitHub Actions workflow |
| **Informational** | 0 | None |

---

## 2. Detailed Findings

### [CRITICAL] [CN-001] Exposed Credentials in `msmtprc`
* **Severity:** Critical (CVSS: 9.8)
* **CWE:** CWE-522 (Insufficiently Protected Credentials)
* **OWASP:** A02:2025-Cryptographic Failures
* **File:** [config/msmtprc](file:///c:/Proyectos/MedSysVE-GCP/config/msmtprc#L16)
* **Description:** The configuration file `config/msmtprc` contains a hardcoded, active Google App Password:
  ```
  password       hvdifzxziuozxnoc
  ```
  Although the file header notes `# File mode 600. NEVER commit to git`, this file was committed and is part of the repository history.
* **Remediation:**
  1. Revoke the Google App Password `hvdifzxziuozxnoc` immediately in the Google Account settings.
  2. Remove the file from git tracking (`git rm --cached config/msmtprc`), rewrite git history using `git-filter-repo` if it has been pushed to a remote public/private repository, and add the file to `.gitignore`.
  3. Load the SMTP password from an environment variable (e.g. `SMTP_PASSWORD`) at runtime rather than hardcoding it in a configuration file.

---

### [HIGH] [CN-002] Outdated `nodemailer` Dependency (SMTP Injection & SSRF)
* **Severity:** High (CVSS: 8.1)
* **CWE:** CWE-74 (Improper Neutralization of Special Elements)
* **OWASP:** A06:2025-Vulnerable and Outdated Components
* **File:** [package.json](file:///c:/Proyectos/MedSysVE-GCP/package.json)
* **Description:** The `nodemailer` dependency is vulnerable to multiple high-severity issues, including:
  * **SMTP Command Injection** via unsanitized `envelope.size` parameter and CRLF injection in the Transport name Option.
  * **SSRF & Arbitrary File Read** via the raw option and jsonTransport disabling bypasses.
* **Remediation:**
  * Update `nodemailer` to the latest secure version (>= 6.9.10 or newer) or run:
    ```bash
    npm install nodemailer@latest
    ```
    *Note: NextAuth v5 depends on nodemailer/core; verify the update does not introduce breaking changes to authentication flow.*

---

### [MEDIUM] [CN-003] Outdated `postcss` Dependency (XSS via Stringify Output)
* **Severity:** Medium (CVSS: 6.1)
* **CWE:** CWE-79 (Cross-Site Scripting / XSS)
* **OWASP:** A06:2025-Vulnerable and Outdated Components
* **File:** [package.json](file:///c:/Proyectos/MedSysVE-GCP/package.json)
* **Description:** `postcss` is vulnerable to Cross-Site Scripting (XSS) due to unescaped `</style>` in its CSS stringify output.
* **Remediation:**
  * Update postcss or verify next.js compiles it with the latest security patch.

---

### [MEDIUM] [CN-004] Outdated `@hono/node-server` Dependency (Static Server Bypass)
* **Severity:** Medium (CVSS: 5.3)
* **CWE:** CWE-22 (Path Traversal / Bypass)
* **OWASP:** A01:2025-Broken Access Control
* **File:** [package.json](file:///c:/Proyectos/MedSysVE-GCP/package.json)
* **Description:** `@hono/node-server` allows middleware bypass via repeated slashes in `serveStatic`.
* **Remediation:**
  * Update dev dependencies to resolve this (it is imported as a transitive dependency of `@prisma/dev`).

---

### [LOW / HARDENING] [CN-005] Missing Explicit GitHub Workflow Permissions
* **Severity:** Low / Hardening (CVSS: 3.7)
* **CWE:** CWE-732 (Incorrect Permission Assignment)
* **OWASP:** A05:2025-Security Misconfiguration
* **File:** [.github/workflows/ci.yml](file:///c:/Proyectos/MedSysVE-GCP/.github/workflows/ci.yml)
* **Description:** The GitHub Actions workflow does not explicitly limit the permissions of the `GITHUB_TOKEN`. By default, it might inherit write permissions which presents a security risk if a dependency is compromised.
* **Remediation:**
  * Declare explicit read-only permissions at the top of [.github/workflows/ci.yml](file:///c:/Proyectos/MedSysVE-GCP/.github/workflows/ci.yml):
    ```yaml
    permissions:
      contents: read
    ```

---

## 3. Verified Security Strengths

The audit confirmed several robust security controls already in place:
1. **Tenant Isolation:** All database transactions and tRPC endpoints (e.g., patient lookup, editing, record management) strictly enforce `workspaceId` queries derived directly from validated JWT sessions.
2. **Timing-Safe Authentication:** `lib/auth.ts` implements timing-equalized comparison against fake hashes to prevent timing-based user enumeration attacks.
3. **PHI Encryption:** `lib/field-crypto.ts` securely encrypts clinical and demographic fields with AES-256-GCM using unique random IVs per record and verifies message integrity. Searchable attributes use deterministic HMAC indexes.
4. **Log Sanitization:** `lib/log-sanitizer.ts` provides rigorous automatic redaction of patient credentials, PHI, and token parameters, preventing secondary logging leaks.
5. **Non-Root Container Execution:** `Dockerfile` configures a dedicated `nextjs:nodejs` system user to prevent container compromise from gaining root access on the host.
