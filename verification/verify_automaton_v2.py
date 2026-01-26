
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_automaton_page(page: Page):
    # 1. Arrange: Go to the Automaton page.
    print("Navigating to /automaton...")
    page.goto("http://localhost:3000/automaton")

    # Wait for the page to load content
    print("Waiting for content to load...")
    page.wait_for_selector("text=計算理論とオートマトン", timeout=10000)

    # 2. Assert: Check for header and at least one question
    print("Verifying header...")
    expect(page.get_by_role("heading", name="計算理論とオートマトン")).to_be_visible()

    print("Verifying Question 4.3...")
    q43 = page.get_by_text("Q4.3")
    expect(q43).to_be_visible()

    # Take initial screenshot
    print("Taking initial screenshot...")
    page.screenshot(path="verification/automaton_initial.png")

    # 3. Act: Click on Question 4.7 to expand it
    print("Clicking Q4.7...")
    q47_button = page.get_by_role("button", name="Q4.7")
    q47_button.click()

    # 4. Assert: Check if answer is visible
    # We look for "Answer" label first to ensure we are looking at the answer block
    print("Waiting for answer to appear...")

    # The answer "充足不可能である。" appears in the answer field.
    # To avoid strict mode violation (if it appears in explanation too), we scope it or use exact match.
    # The error showed:
    # 1) <p ...>充足不可能である。</p>
    # 2) <p ...>...充足不可能である。</p> (in explanation)
    # We target the specific answer paragraph.

    # Use first=True or constrain by layout.
    # The answer is in a p tag following the "Answer" label.

    answer_text = page.get_by_text("充足不可能である。", exact=True)
    expect(answer_text).to_be_visible()

    # Wait for animation
    time.sleep(0.5)

    # 5. Screenshot: Capture the expanded result
    print("Taking expanded screenshot...")
    page.screenshot(path="verification/automaton_expanded.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_automaton_page(page)
            print("Verification script completed successfully.")
        except Exception as e:
            print(f"Verification failed: {e}")
            try:
                page.screenshot(path="verification/failure.png")
            except:
                pass
        finally:
            browser.close()
