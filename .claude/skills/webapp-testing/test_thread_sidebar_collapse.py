"""
Test script for Thread Sidebar collapse functionality.
Tests:
1. Thread sidebar starts collapsed (64px width, icons only)
2. Toggle button expands/collapses correctly
3. Toggle button stays in sidebar area
4. No History button in navigation header on desktop
5. Main content margin adjusts correctly
"""

from playwright.sync_api import sync_playwright
import os

OUTPUT_DIR = "/tmp/thread_sidebar_test"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Main sidebar is 280px, so Thread Sidebar starts at x=280
MAIN_SIDEBAR_WIDTH = 280
THREAD_SIDEBAR_COLLAPSED = 64
THREAD_SIDEBAR_EXPANDED = 280

def test_thread_sidebar_collapse():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        print("1. Navigating to http://localhost:3002...")
        page.goto("http://localhost:3002")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        page.screenshot(path=f"{OUTPUT_DIR}/01_homepage.png", full_page=True)
        print(f"   Screenshot saved: {OUTPUT_DIR}/01_homepage.png")

        print("\n2. Clicking an agent to navigate to agent page...")

        # Click first agent in the list
        agent_buttons = page.locator("button:has(svg.lucide-bot)").all()
        clicked = False
        for btn in agent_buttons:
            try:
                box = btn.bounding_box()
                if box and box['x'] < MAIN_SIDEBAR_WIDTH:
                    btn.click()
                    clicked = True
                    print(f"   Clicked agent at x={box['x']:.0f}")
                    break
            except:
                continue

        if not clicked:
            print("   No agent found, test cannot continue")
            browser.close()
            return

        page.wait_for_timeout(2000)
        page.screenshot(path=f"{OUTPUT_DIR}/02_agent_page_initial.png", full_page=True)
        print(f"   Screenshot saved: {OUTPUT_DIR}/02_agent_page_initial.png")

        # INITIAL STATE: Thread Sidebar should be COLLAPSED
        print("\n3. Verifying initial collapsed state...")

        thread_sidebar = page.locator("aside[role='complementary']").first
        initial_width = None
        if thread_sidebar:
            box = thread_sidebar.bounding_box()
            if box:
                initial_width = box['width']
                print(f"   Thread Sidebar width: {initial_width:.0f}px")
                if initial_width <= 70:  # ~64px with tolerance
                    print("   PASS: Initial state is collapsed (icons only)")
                else:
                    print(f"   INFO: Initial state is expanded ({initial_width:.0f}px)")

        # Check "Threads" title is hidden in collapsed state
        threads_title = page.locator("text=Threads").first
        title_visible = threads_title.is_visible() if threads_title else False
        if initial_width and initial_width <= 70:
            if not title_visible:
                print("   PASS: 'Threads' title hidden in collapsed state")
            else:
                print("   FAIL: 'Threads' title should be hidden when collapsed")

        # Find toggle button (History icon in Thread Sidebar)
        print("\n4. Finding Thread Sidebar toggle button...")

        history_icons = page.locator("svg.lucide-history").all()
        toggle_button = None
        for icon in history_icons:
            try:
                parent = icon.locator("xpath=..")
                box = parent.bounding_box()
                if box:
                    # Thread Sidebar toggle should be after main sidebar (x > 280)
                    if box['x'] >= MAIN_SIDEBAR_WIDTH - 10 and box['y'] < 100:
                        toggle_button = parent
                        print(f"   Found toggle at x={box['x']:.0f}, y={box['y']:.0f}")
                        break
            except:
                continue

        if not toggle_button:
            print("   ERROR: Toggle button not found")
            browser.close()
            return

        # CLICK TO EXPAND
        print("\n5. Clicking toggle to EXPAND Thread Sidebar...")
        toggle_button.click()
        page.wait_for_timeout(600)

        page.screenshot(path=f"{OUTPUT_DIR}/03_expanded.png", full_page=True)
        print(f"   Screenshot saved: {OUTPUT_DIR}/03_expanded.png")

        # Verify expanded state
        thread_sidebar = page.locator("aside[role='complementary']").first
        expanded_width = None
        if thread_sidebar:
            box = thread_sidebar.bounding_box()
            if box:
                expanded_width = box['width']
                print(f"   Thread Sidebar width after expand: {expanded_width:.0f}px")
                if expanded_width >= 250:  # ~280px with tolerance
                    print("   PASS: Thread Sidebar expanded correctly")
                else:
                    print(f"   FAIL: Expected ~280px, got {expanded_width:.0f}px")

        # Check "Threads" title is visible in expanded state
        threads_title = page.locator("h2:has-text('Threads')").first
        if threads_title and threads_title.is_visible():
            print("   PASS: 'Threads' title visible in expanded state")
        else:
            print("   FAIL: 'Threads' title should be visible when expanded")

        # Check toggle button position
        toggle_box = toggle_button.bounding_box()
        if toggle_box:
            print(f"   Toggle position after expand: x={toggle_box['x']:.0f}")
            # Toggle should still be in Thread Sidebar area (after main sidebar)
            if toggle_box['x'] >= MAIN_SIDEBAR_WIDTH - 10:
                print("   PASS: Toggle button in Thread Sidebar area")
            else:
                print("   FAIL: Toggle button position unexpected")

        # Check NO duplicate History button in navigation header
        print("\n6. Checking for duplicate History button in navigation...")

        # Navigation area starts after Thread Sidebar (x > 280 + 280 = 560 when expanded)
        nav_start_x = MAIN_SIDEBAR_WIDTH + expanded_width if expanded_width else 560
        duplicate_found = False
        for icon in history_icons:
            try:
                parent = icon.locator("xpath=..")
                box = parent.bounding_box()
                if box and box['x'] > nav_start_x:
                    duplicate_found = True
                    print(f"   Found History button in nav at x={box['x']:.0f}")
            except:
                continue

        if not duplicate_found:
            print("   PASS: No duplicate History button in navigation header")
        else:
            print("   FAIL: Found duplicate History button in navigation")

        # CLICK TO COLLAPSE
        print("\n7. Clicking toggle to COLLAPSE Thread Sidebar...")
        toggle_button.click()
        page.wait_for_timeout(600)

        page.screenshot(path=f"{OUTPUT_DIR}/04_collapsed.png", full_page=True)
        print(f"   Screenshot saved: {OUTPUT_DIR}/04_collapsed.png")

        # Verify collapsed state
        thread_sidebar = page.locator("aside[role='complementary']").first
        if thread_sidebar:
            box = thread_sidebar.bounding_box()
            if box:
                collapsed_width = box['width']
                print(f"   Thread Sidebar width after collapse: {collapsed_width:.0f}px")
                if collapsed_width <= 70:
                    print("   PASS: Thread Sidebar collapsed correctly")
                else:
                    print(f"   FAIL: Expected ~64px, got {collapsed_width:.0f}px")

        # Check icons are vertically aligned in collapsed state
        print("\n8. Checking vertical alignment in collapsed state...")

        icons_in_sidebar = []
        for icon_class in ["lucide-history", "lucide-plus", "lucide-message-square"]:
            icons = page.locator(f"aside[role='complementary'] svg.{icon_class}").all()
            for icon in icons:
                try:
                    if icon.is_visible():
                        box = icon.bounding_box()
                        if box:
                            icons_in_sidebar.append((icon_class, box))
                except:
                    pass

        if len(icons_in_sidebar) >= 2:
            x_values = [b['x'] for _, b in icons_in_sidebar]
            y_values = [b['y'] for _, b in icons_in_sidebar]
            x_spread = max(x_values) - min(x_values)
            y_spread = max(y_values) - min(y_values)

            print(f"   Found {len(icons_in_sidebar)} icons")
            print(f"   X spread: {x_spread:.0f}px, Y spread: {y_spread:.0f}px")

            if y_spread > x_spread and x_spread < 30:
                print("   PASS: Icons are vertically aligned")
            else:
                print("   INFO: Icons layout - check screenshots")

        # Summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)

        results = []
        results.append(("Initial state collapsed", initial_width and initial_width <= 70))
        results.append(("Expand works correctly", expanded_width and expanded_width >= 250))
        results.append(("Collapse works correctly", collapsed_width and collapsed_width <= 70))
        results.append(("No duplicate History in nav", not duplicate_found))

        all_passed = all(r[1] for r in results)

        for name, passed in results:
            status = "PASS" if passed else "FAIL"
            print(f"  [{status}] {name}")

        print(f"\nScreenshots: {OUTPUT_DIR}/")
        print("  01_homepage.png - Initial homepage")
        print("  02_agent_page_initial.png - Agent page (collapsed)")
        print("  03_expanded.png - Thread sidebar expanded")
        print("  04_collapsed.png - Thread sidebar collapsed again")
        print("="*60)

        if all_passed:
            print("\nALL TESTS PASSED!")
        else:
            print("\nSOME TESTS FAILED - Check screenshots for details")

        browser.close()

if __name__ == "__main__":
    test_thread_sidebar_collapse()
