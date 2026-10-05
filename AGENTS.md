# Architecture rules
- Homepage example results render the existing study results components with seeded example data, so homepage and researcher reports cannot diverge.
- Researcher and example pages share AppShell navigation; public participant links bypass it to preserve the standalone participant experience.
- The entry route opens Studies for signed-in users and seeded example results for visitors; informational copy and FAQ live at /home.
- Typography is defined in the root Tailwind font-size scale, not extended from defaults; legacy size names map to shared steps to prevent extra sizes.