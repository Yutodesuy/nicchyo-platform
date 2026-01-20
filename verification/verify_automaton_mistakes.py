
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_automaton_page(page: Page):
    # Enable console log capture
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

    # 1. Arrange: Go to the Automaton page.
    print("Navigating to /automaton...")
    page.goto("http://localhost:3000/automaton")

    # Wait for the page to load content
    print("Waiting for content to load...")
    try:
        page.wait_for_selector("text=計算理論とオートマトン", timeout=10000)
    except Exception as e:
        print("Timeout waiting for header. Checking page content...")
        print(page.content())
        raise e

    # 2. Assert: Check for Section Headers
    print("Verifying Section 3 Header...")
    section3_header = page.get_by_role("button", name="Section 3: Computability Theory")
    expect(section3_header).to_be_visible()

    # Section 3 is open by default in my code (openSectionId="3")
    # So questions should be visible.

    print("Verifying Question 3.1...")
    # Use exact match to avoid matching 3.10, 3.11, etc.
    q31 = page.get_by_text("Q3.1", exact=True)
    expect(q31).to_be_visible()

    # Section 4 should be closed or visible as a header
    print("Verifying Section 4 Header...")
    section4_header = page.get_by_role("button", name="Section 4: Complexity Theory")
    expect(section4_header).to_be_visible()

    # 3. Act: Open Section 4
    print("Opening Section 4...")
    section4_header.click()
    time.sleep(0.5) # Wait for animation

    print("Verifying Question 4.3...")
    q43 = page.get_by_text("Q4.3", exact=True)
    expect(q43).to_be_visible()

    # 4. Act: Open Question 4.7
    print("Clicking Q4.7...")
    # Looking for a button that starts with Q4.7 or contains it uniquely
    # Using text locator with some context usually safer
    q47_button = page.locator("button").filter(has_text="Q4.7").first
    q47_button.click()

    # 5. Assert: Check answer
    print("Waiting for answer to appear...")
    answer_text = page.get_by_text("充足不可能")
    expect(answer_text).to_be_visible()

    # Verify Common Mistakes section exists
    print("Verifying Common Mistakes section...")
    common_mistakes_label = page.get_by_text("Common Mistakes")
    expect(common_mistakes_label).to_be_visible()

    # Verify Formal Proof section exists
    print("Verifying Formal Proof section...")
    formal_proof_label = page.get_by_text("Formal Proof")
    expect(formal_proof_label).to_be_visible()

    # Wait for animation
    time.sleep(1.0)

    # 6. Screenshot
    print("Taking expanded screenshot...")
    page.screenshot(path="verification/automaton_mistakes.png")

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
