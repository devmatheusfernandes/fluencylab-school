Based on the analysis of your folder structure and file contents, I have audited the usage of `next-intl` in your `page.tsx` files.

### 📊 Audit Findings
*   **Total Pages**: 74
*   **Verified Usage**: 32 pages (using `useTranslations` or `getTranslations`)
*   **Potential Issues**: 42 pages

**Issues Identified:**
1.  **Hardcoded Content (Critical)**: Pages like `app/[locale]/goodbye/page.tsx` contain hardcoded text without any translation hooks.
2.  **Untranslated Metadata**: Many "wrapper" pages (e.g., `app/[locale]/hub/student/my-chat/page.tsx`) define `export const metadata` with hardcoded strings instead of using `generateMetadata` with translations.
3.  **Wrappers**: Some pages are simple wrappers around components (e.g., `app/[locale]/hub/admin/users/page.tsx`). These rely on the child component for translations, which is generally acceptable but might miss page-level metadata translation.

### 🛠 Proposed Implementation Plan
I propose to fix the identified issues, starting with the most critical ones:

#### 1. Fix Hardcoded Content in `goodbye/page.tsx`
*   **Action**: Refactor the page to use `useTranslations`.
*   **Details**:
    *   Add keys to `messages/pt.json` and `messages/en.json` under a `Goodbye` namespace.
    *   Replace hardcoded text ("Até logo!", "Sua assinatura foi encerrada...", etc.) with the `t()` function.

#### 2. Fix Metadata in `my-chat/page.tsx` (as a template)
*   **Action**: Convert static `metadata` to dynamic `generateMetadata`.
*   **Details**:
    *   Use `getTranslations` to fetch localized titles and descriptions.
    *   Add corresponding keys to the translation files.
    *   This will serve as a pattern for fixing other wrapper pages.

#### 3. Full Report
*   I will provide the complete list of pages that need attention so you can decide on further actions.
