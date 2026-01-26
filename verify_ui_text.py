from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # 1. Signup Page
    print("Checking Signup Page...")
    page.goto("http://localhost:3000/signup")
    page.wait_for_load_state("networkidle")

    # Check H1
    h1 = page.locator("h1")
    expect(h1).to_contain_text("アカウント作成")
    print("Signup H1 verified.")
    page.screenshot(path="verification_signup.png")

    # 2. Login Page
    print("Checking Login Page...")
    page.goto("http://localhost:3000/login")
    page.wait_for_load_state("networkidle")

    # Check footer link
    # Using exact text match or containing
    link = page.get_by_role("link", name="初めての方は アカウント作成")
    expect(link).to_be_visible()
    print("Login footer link verified.")
    page.screenshot(path="verification_login.png")

    # 3. Kotodute Page
    print("Checking Kotodute Page...")
    page.goto("http://localhost:3000/kotodute")
    page.wait_for_load_state("networkidle")

    # Check titles
    # "メッセージを書く" section
    expect(page.get_by_text("メッセージを書く").first).to_be_visible()
    # "みんなのことづて" section
    expect(page.get_by_text("みんなのことづて").first).to_be_visible()
    # "メッセージを送る" button
    # The button is inside the form
    expect(page.get_by_role("button", name="メッセージを送る")).to_be_visible()

    print("Kotodute text verified.")
    page.screenshot(path="verification_kotodute.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
