from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # 1. Verify Contact Page
        print("Visiting /contact...")
        page.goto("http://localhost:3000/contact")
        page.wait_for_load_state("networkidle")

        # Check for new button text
        content = page.content()
        if "メッセージを送る" in content:
            print("SUCCESS: Found 'メッセージを送る' on Contact page.")
        else:
            print("FAILURE: Did not find 'メッセージを送る' on Contact page.")

        page.screenshot(path="verification/contact_page.png")

        # 2. Verify Search Page
        print("Visiting /search...")
        page.goto("http://localhost:3000/search")
        page.wait_for_load_state("networkidle")

        content = page.content()
        if "キーワードやカテゴリーからお店を探せます" in content:
            print("SUCCESS: Found 'キーワードやカテゴリーからお店を探せます' on Search page.")
        else:
            print("FAILURE: Did not find 'キーワードやカテゴリーからお店を探せます' on Search page.")

        page.screenshot(path="verification/search_page.png")

        browser.close()

if __name__ == "__main__":
    run()
