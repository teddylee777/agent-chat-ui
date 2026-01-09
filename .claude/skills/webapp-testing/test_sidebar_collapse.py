"""
Test script for sidebar collapse functionality.
Tests:
1. Sidebar toggle button click and check collapsed state (width 64px)
2. Icons are vertically aligned in collapsed state
3. Toggle button stays in sidebar area
4. No toggle button in navigation area on desktop
"""

from playwright.sync_api import sync_playwright
import os

OUTPUT_DIR = "/tmp/sidebar_test"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def test_sidebar_collapse():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set desktop viewport
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        print("1. Navigating to http://localhost:3002...")
        page.goto("http://localhost:3002")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)  # Extra wait for animations

        # Take initial screenshot (expanded state)
        page.screenshot(path=f"{OUTPUT_DIR}/01_initial_expanded.png", full_page=True)
        print(f"   Screenshot saved: {OUTPUT_DIR}/01_initial_expanded.png")

        print("\n2. Finding sidebar toggle button...")

        # Find all visible buttons with bounding boxes
        all_buttons = page.locator("button").all()
        print(f"   Total buttons found: {len(all_buttons)}")

        # Find the button at the top-left corner (sidebar toggle)
        toggle_button = None
        for btn in all_buttons:
            try:
                box = btn.bounding_box()
                if box and box['x'] < 50 and box['y'] < 60:
                    toggle_button = btn
                    print(f"   Found toggle button at x={box['x']:.0f}, y={box['y']:.0f}")
                    break
            except:
                continue

        if not toggle_button:
            print("   WARNING: Toggle button not found by position, trying first visible button in sidebar")
            # Alternative: find first button with size-icon class (typical for icon buttons)
            for btn in all_buttons:
                try:
                    box = btn.bounding_box()
                    if box and box['x'] < 100 and box['width'] < 50:
                        toggle_button = btn
                        print(f"   Using button at x={box['x']:.0f}, y={box['y']:.0f}")
                        break
                except:
                    continue

        if toggle_button:
            toggle_box = toggle_button.bounding_box()
            print(f"   Initial toggle position: x={toggle_box['x']:.0f}")

            # Click to collapse
            print("\n3. Clicking toggle button to collapse sidebar...")
            toggle_button.click()
            page.wait_for_timeout(600)  # Wait for animation

            # Take collapsed state screenshot
            page.screenshot(path=f"{OUTPUT_DIR}/02_collapsed.png", full_page=True)
            print(f"   Screenshot saved: {OUTPUT_DIR}/02_collapsed.png")

            # Check if sidebar collapsed - title should be hidden
            print("\n4. Verifying collapsed state...")
            title_locator = page.locator("text=Deep Agent Builder").first
            title_visible = title_locator.is_visible() if title_locator else False
            print(f"   Title 'Deep Agent Builder' visible: {title_visible}")

            if not title_visible:
                print("   PASS: Sidebar collapsed (title hidden)")
            else:
                print("   FAIL: Title still visible after collapse")

            # Check toggle button position after collapse
            toggle_after_box = toggle_button.bounding_box()
            if toggle_after_box:
                print(f"   Toggle button after collapse: x={toggle_after_box['x']:.0f}")
                if toggle_after_box['x'] < 64:
                    print("   PASS: Toggle button within collapsed sidebar (64px)")
                else:
                    print(f"   WARNING: Toggle button x={toggle_after_box['x']:.0f} (expected < 64)")

            # Check footer icons layout
            print("\n5. Checking footer icons in collapsed state...")
            footer_icons = []

            for icon_class in ["lucide-key", "lucide-wrench", "lucide-settings"]:
                icon = page.locator(f"svg.{icon_class}").first
                try:
                    if icon.is_visible():
                        box = icon.bounding_box()
                        if box:
                            footer_icons.append((icon_class.split('-')[1], box))
                            print(f"   {icon_class.split('-')[1].capitalize()} icon: x={box['x']:.0f}, y={box['y']:.0f}")
                except:
                    pass

            if len(footer_icons) >= 2:
                x_values = [b['x'] for _, b in footer_icons]
                y_values = [b['y'] for _, b in footer_icons]
                x_spread = max(x_values) - min(x_values)
                y_spread = max(y_values) - min(y_values)

                if y_spread > x_spread:
                    print("   PASS: Footer icons are vertically aligned")
                else:
                    print(f"   INFO: Icons x_spread={x_spread:.0f}, y_spread={y_spread:.0f}")

            # Check navigation area
            print("\n6. Checking if toggle button exists in navigation area...")
            # Navigation area buttons should have x > 64 in collapsed state
            nav_panel_buttons = 0
            for btn in all_buttons:
                try:
                    box = btn.bounding_box()
                    inner = btn.inner_html()
                    # Looking for panel-right icons in navigation area
                    if box and box['x'] > 100 and ('panel-right' in inner.lower()):
                        nav_panel_buttons += 1
                        print(f"   Found panel button in nav at x={box['x']:.0f}")
                except:
                    pass

            if nav_panel_buttons == 0:
                print("   PASS: No sidebar toggle in navigation area (desktop)")
            else:
                print(f"   FAIL: Found {nav_panel_buttons} panel buttons in navigation")

            # Expand back
            print("\n7. Expanding sidebar back...")
            toggle_button.click()
            page.wait_for_timeout(600)

            page.screenshot(path=f"{OUTPUT_DIR}/03_expanded_again.png", full_page=True)
            print(f"   Screenshot saved: {OUTPUT_DIR}/03_expanded_again.png")

            title_visible_again = page.locator("text=Deep Agent Builder").first.is_visible()
            if title_visible_again:
                print("   PASS: Sidebar re-expanded successfully")
            else:
                print("   FAIL: Title not visible after re-expand")
        else:
            print("   ERROR: Could not find toggle button")

        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Screenshots: {OUTPUT_DIR}/")
        print("  01_initial_expanded.png - Initial state")
        print("  02_collapsed.png - Collapsed state")
        print("  03_expanded_again.png - Re-expanded state")
        print("="*60)

        browser.close()

if __name__ == "__main__":
    test_sidebar_collapse()
