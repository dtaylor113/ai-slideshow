from __future__ import annotations

import tempfile
import textwrap
import unittest
from pathlib import Path
from unittest.mock import patch

from backend import main


class GenerationLogParsingTests(unittest.TestCase):
    def test_parse_single_entry_from_generation_log(self) -> None:
        sample_entry = textwrap.dedent(
            """
            ==============================================================================
            TIMESTAMP: 2025-10-30 15:04:05
            FILENAME: example.jpg
            ANALYSIS:
            Example analysis content line one.
            Example analysis content line two.

            IMAGE PROMPT:
            in the imaginative style of Example Artist

            PROMPT TEMPLATE:
            template payload

            GENERATION PROMPT:
            generation payload

            GENERATED FILENAME:
            gen_1730297045000_example.png

            GENERATION TIME:
            12.34s

            GENERATION TIMESTAMP MS:
            1730297045000
            ==============================================================================

            """
        )

        with tempfile.TemporaryDirectory() as tmpdir:
            log_path = Path(tmpdir) / "generation-log-DO-NOT-DELETE.txt"
            log_path.write_text(sample_entry, encoding="utf-8")

            with patch.object(main, "LOG_FILE", log_path):
                entries = main._parse_log_history()

        self.assertEqual(len(entries), 1)
        entry = entries[0]
        self.assertEqual(entry["original_filename"], "example.jpg")
        self.assertEqual(entry["generated_filename"], "gen_1730297045000_example.png")
        self.assertIn("Example Artist", entry["prompt"])
        self.assertEqual(entry["prompt_template"], "template payload")
        self.assertEqual(entry["generation_prompt"], "generation payload")
        self.assertEqual(entry["timestamp"], "2025-10-30 15:04:05")
        self.assertEqual(entry["generation_timestamp_ms"], 1730297045000)


if __name__ == "__main__":
    unittest.main()

