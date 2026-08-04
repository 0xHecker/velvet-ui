import puppeteer from "puppeteer";

const missingBrowser = (error) =>
  /could not find (chrome|browser)|browser was not found|executable.*(?:does not exist|not found)/i.test(
    String(error?.message || error)
  );

/**
 * Launch the browser used by Velvet's real-gesture harnesses.
 *
 * Puppeteer intentionally does not download Chrome during every test run. A
 * fresh checkout gets one actionable setup command instead of its opaque
 * cache/version error.
 */
export async function launchBrowser(options = {}) {
  try {
    return await puppeteer.launch(options);
  } catch (error) {
    if (!missingBrowser(error)) throw error;

    throw new Error(
      [
        "Velvet's browser tests need the Chrome build matched to Puppeteer.",
        "Run `npm run browsers:install` once from the repository root, then rerun the test.",
        "CI should run the same command after `npm ci`.",
        "You can instead set PUPPETEER_EXECUTABLE_PATH to a compatible Chrome executable.",
      ].join("\n"),
      { cause: error }
    );
  }
}
