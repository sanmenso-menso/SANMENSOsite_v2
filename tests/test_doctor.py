from __future__ import annotations

import tempfile
import unittest
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from unittest.mock import patch

from scripts import doctor


class FakeRunner:
    def __init__(self, responses: dict[tuple[str, ...], doctor.CommandResult]) -> None:
        self.responses = responses

    def __call__(
        self, command: tuple[str, ...], cwd: Path
    ) -> doctor.CommandResult:
        del cwd
        return self.responses.get(
            command,
            doctor.CommandResult(returncode=127, stdout="", stderr="not found"),
        )


class DoctorTests(unittest.TestCase):
    def test_repository_root_uses_script_location(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_root = Path(temp_dir) / "repo"
            script_path = repo_root / "scripts" / "doctor.py"

            detected_root = doctor.repository_root(script_path)

        self.assertEqual(detected_root, repo_root.resolve())

    def test_load_expected_versions_from_mise_toml(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_root = Path(temp_dir)
            (repo_root / "mise.toml").write_text(
                '[tools]\nnode = "24.11.1"\npython = "3.12.10"\n',
                encoding="utf-8",
            )

            versions = doctor.load_expected_versions(repo_root)

        self.assertEqual(
            versions,
            {"node": "24.11.1", "python": "3.12.10"},
        )

    def test_version_matches_normalized_output(self) -> None:
        self.assertTrue(doctor.version_matches("v24.11.1\n", "24.11.1"))
        self.assertTrue(doctor.version_matches("Python 3.12.10", "3.12.10"))
        self.assertFalse(doctor.version_matches("v24.10.0", "24.11.1"))
        self.assertFalse(doctor.version_matches("unknown", "24.11.1"))

    def test_supported_platforms_are_accepted(self) -> None:
        self.assertTrue(doctor.check_platform("Darwin", "arm64").ok)
        self.assertTrue(doctor.check_platform("Windows", "AMD64").ok)

    def test_unsupported_platform_is_rejected(self) -> None:
        result = doctor.check_platform("Linux", "x86_64")

        self.assertFalse(result.ok)
        self.assertEqual(result.detail, "unsupported Linux x86_64")

    def test_command_failure_is_reported_as_fail(self) -> None:
        runner = FakeRunner(
            {
                ("node", "--version"): doctor.CommandResult(
                    returncode=1,
                    stdout="",
                    stderr="failed",
                )
            }
        )

        result = doctor.check_version_command(
            name="Node",
            command=("node", "--version"),
            expected_version="24.11.1",
            repo_root=Path.cwd(),
            runner=runner,
        )

        self.assertFalse(result.ok)
        self.assertEqual(result.name, "Node")
        self.assertNotIn("failed", result.detail)

    def test_run_command_timeout_is_reported_as_failure(self) -> None:
        with (
            patch.object(doctor.shutil, "which", return_value="tool"),
            patch.object(
                doctor.subprocess,
                "run",
                side_effect=doctor.subprocess.TimeoutExpired(
                    cmd=("tool", "--version"),
                    timeout=doctor.COMMAND_TIMEOUT_SECONDS,
                ),
            ),
        ):
            result = doctor.run_command(("tool", "--version"), Path.cwd())

        self.assertEqual(result.returncode, 124)
        self.assertEqual(result.stderr, "command timed out")

    def test_run_command_oserror_is_reported_as_unavailable(self) -> None:
        with (
            patch.object(doctor.shutil, "which", return_value="tool"),
            patch.object(doctor.subprocess, "run", side_effect=OSError),
        ):
            result = doctor.run_command(("tool", "--version"), Path.cwd())

        self.assertEqual(result.returncode, 127)
        self.assertEqual(result.stderr, "command unavailable")

    def test_detached_head_is_accepted(self) -> None:
        runner = FakeRunner(
            {
                ("git", "branch", "--show-current"): doctor.CommandResult(
                    returncode=0,
                    stdout="",
                    stderr="",
                )
            }
        )

        result = doctor.check_git_branch(Path.cwd(), runner)

        self.assertTrue(result.ok)
        self.assertEqual(result.detail, "detached HEAD")

    def test_main_returns_nonzero_for_malformed_mise_toml(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_root = Path(temp_dir)
            (repo_root / "mise.toml").write_text("[tools\n", encoding="utf-8")
            output = StringIO()

            with (
                patch.object(doctor, "repository_root", return_value=repo_root),
                redirect_stdout(output),
            ):
                exit_code = doctor.main()

        self.assertNotEqual(exit_code, 0)
        self.assertEqual(
            output.getvalue().strip(),
            "[FAIL] Configuration: could not load runtime versions from mise.toml",
        )

    def test_all_checks_success_returns_zero(self) -> None:
        repo_root = Path.cwd()
        runner = FakeRunner(self.successful_responses())

        results = doctor.run_checks(
            repo_root=repo_root,
            expected_versions={"node": "24.11.1", "python": "3.12.10"},
            runner=runner,
            current_python_version="3.12.10",
            current_system="Darwin",
            current_machine="arm64",
        )

        self.assertTrue(all(result.ok for result in results))
        self.assertEqual(doctor.exit_code_for(results), 0)

    def test_required_check_failure_returns_nonzero(self) -> None:
        repo_root = Path.cwd()
        responses = self.successful_responses()
        responses[("node", "--version")] = doctor.CommandResult(
            returncode=1,
            stdout="",
            stderr="failed",
        )
        runner = FakeRunner(responses)

        results = doctor.run_checks(
            repo_root=repo_root,
            expected_versions={"node": "24.11.1", "python": "3.12.10"},
            runner=runner,
            current_python_version="3.12.10",
            current_system="Windows",
            current_machine="AMD64",
        )

        self.assertFalse(next(result for result in results if result.name == "Node").ok)
        self.assertNotEqual(doctor.exit_code_for(results), 0)

    @staticmethod
    def successful_responses() -> dict[tuple[str, ...], doctor.CommandResult]:
        return {
            ("git", "rev-parse", "--is-inside-work-tree"): doctor.CommandResult(
                returncode=0,
                stdout="true\n",
                stderr="",
            ),
            ("mise", "current", "node"): doctor.CommandResult(
                returncode=0,
                stdout="24.11.1\n",
                stderr="",
            ),
            ("mise", "current", "python"): doctor.CommandResult(
                returncode=0,
                stdout="3.12.10\n",
                stderr="",
            ),
            ("node", "--version"): doctor.CommandResult(
                returncode=0,
                stdout="v24.11.1\n",
                stderr="",
            ),
            ("npm", "--version"): doctor.CommandResult(
                returncode=0,
                stdout="11.6.2\n",
                stderr="",
            ),
            ("git", "branch", "--show-current"): doctor.CommandResult(
                returncode=0,
                stdout="chore/protocol-bootstrap\n",
                stderr="",
            ),
        }


if __name__ == "__main__":
    unittest.main()
