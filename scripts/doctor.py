from __future__ import annotations

import platform
import re
import shutil
import subprocess
import sys
import tomllib
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path


COMMAND_TIMEOUT_SECONDS = 15
VERSION_PATTERN = re.compile(r"(?<!\d)(\d+\.\d+\.\d+)(?!\d)")
SUPPORTED_PLATFORMS = {
    ("darwin", "arm64"): "macOS arm64",
    ("windows", "amd64"): "Windows x64",
    ("windows", "x86_64"): "Windows x64",
}


@dataclass(frozen=True)
class CommandResult:
    returncode: int
    stdout: str
    stderr: str


@dataclass(frozen=True)
class CheckResult:
    name: str
    ok: bool
    detail: str


Command = tuple[str, ...]
CommandRunner = Callable[[Command, Path], CommandResult]


def repository_root(script_path: Path | None = None) -> Path:
    path = script_path if script_path is not None else Path(__file__)
    return path.resolve().parent.parent


def load_expected_versions(repo_root: Path) -> dict[str, str]:
    with (repo_root / "mise.toml").open("rb") as config_file:
        config = tomllib.load(config_file)

    tools = config.get("tools")
    if not isinstance(tools, dict):
        raise ValueError("mise.toml does not define a tools table")

    versions: dict[str, str] = {}
    for tool in ("node", "python"):
        version = tools.get(tool)
        if not isinstance(version, str) or not version.strip():
            raise ValueError(f"mise.toml does not define {tool}")
        versions[tool] = version.strip()

    return versions


def run_command(command: Command, cwd: Path) -> CommandResult:
    executable = shutil.which(command[0])
    if executable is None:
        return CommandResult(returncode=127, stdout="", stderr="command not found")

    try:
        completed = subprocess.run(
            (executable, *command[1:]),
            cwd=cwd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=False,
            timeout=COMMAND_TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return CommandResult(returncode=124, stdout="", stderr="command timed out")
    except OSError:
        return CommandResult(returncode=127, stdout="", stderr="command unavailable")

    return CommandResult(
        returncode=completed.returncode,
        stdout=completed.stdout,
        stderr=completed.stderr,
    )


def extract_version(output: str) -> str | None:
    match = VERSION_PATTERN.search(output)
    return match.group(1) if match else None


def version_matches(output: str, expected_version: str) -> bool:
    return extract_version(output) == expected_version


def check_platform(system_name: str, machine_name: str) -> CheckResult:
    platform_key = (system_name.strip().lower(), machine_name.strip().lower())
    supported_label = SUPPORTED_PLATFORMS.get(platform_key)
    if supported_label is None:
        return CheckResult(
            "Platform",
            False,
            f"unsupported {system_name or 'unknown'} {machine_name or 'unknown'}",
        )
    return CheckResult("Platform", True, supported_label)


def check_repository(repo_root: Path, runner: CommandRunner) -> CheckResult:
    result = runner(("git", "rev-parse", "--is-inside-work-tree"), repo_root)
    if result.returncode != 0 or result.stdout.strip().lower() != "true":
        return CheckResult("Repository", False, "not recognized as a Git work tree")
    return CheckResult("Repository", True, "Git work tree detected")


def check_mise(
    repo_root: Path,
    expected_versions: dict[str, str],
    runner: CommandRunner,
) -> CheckResult:
    recognized: list[str] = []
    for tool in ("node", "python"):
        result = runner(("mise", "current", tool), repo_root)
        if result.returncode != 0:
            return CheckResult("mise", False, f"{tool} runtime not recognized")

        actual_version = extract_version(result.stdout)
        expected_version = expected_versions[tool]
        if actual_version != expected_version:
            actual_label = actual_version if actual_version is not None else "unknown"
            return CheckResult(
                "mise",
                False,
                f"{tool} expected {expected_version}, got {actual_label}",
            )
        recognized.append(f"{tool} {actual_version}")

    return CheckResult("mise", True, ", ".join(recognized))


def check_version_command(
    name: str,
    command: Command,
    expected_version: str,
    repo_root: Path,
    runner: CommandRunner,
) -> CheckResult:
    result = runner(command, repo_root)
    if result.returncode != 0:
        return CheckResult(
            name,
            False,
            f"command unavailable or exited with code {result.returncode}",
        )

    actual_version = extract_version(result.stdout)
    if actual_version is None:
        return CheckResult(name, False, "version output not recognized")
    if actual_version != expected_version:
        return CheckResult(
            name,
            False,
            f"expected {expected_version}, got {actual_version}",
        )
    return CheckResult(name, True, f"{actual_version} (expected {expected_version})")


def check_npm(repo_root: Path, runner: CommandRunner) -> CheckResult:
    result = runner(("npm", "--version"), repo_root)
    if result.returncode != 0:
        return CheckResult(
            "npm",
            False,
            f"command unavailable or exited with code {result.returncode}",
        )

    actual_version = extract_version(result.stdout)
    if actual_version is None:
        return CheckResult("npm", False, "version output not recognized")
    return CheckResult("npm", True, actual_version)


def check_python(expected_version: str, current_version: str) -> CheckResult:
    if not version_matches(current_version, expected_version):
        actual_version = extract_version(current_version) or "unknown"
        return CheckResult(
            "Python",
            False,
            f"expected {expected_version}, got {actual_version}",
        )
    return CheckResult(
        "Python",
        True,
        f"{current_version} (expected {expected_version})",
    )


def check_git_branch(repo_root: Path, runner: CommandRunner) -> CheckResult:
    result = runner(("git", "branch", "--show-current"), repo_root)
    if result.returncode != 0:
        return CheckResult(
            "Git",
            False,
            f"branch check exited with code {result.returncode}",
        )

    branch = result.stdout.strip()
    if "\n" in branch or "\r" in branch:
        return CheckResult("Git", False, "current branch output is malformed")
    if not branch:
        return CheckResult("Git", True, "detached HEAD")
    return CheckResult("Git", True, f"branch {branch}")


def run_checks(
    repo_root: Path,
    expected_versions: dict[str, str],
    runner: CommandRunner = run_command,
    current_python_version: str | None = None,
    current_system: str | None = None,
    current_machine: str | None = None,
) -> list[CheckResult]:
    python_version = current_python_version or platform.python_version()
    system_name = current_system or platform.system()
    machine_name = current_machine or platform.machine()
    return [
        check_platform(system_name, machine_name),
        check_repository(repo_root, runner),
        check_mise(repo_root, expected_versions, runner),
        check_version_command(
            name="Node",
            command=("node", "--version"),
            expected_version=expected_versions["node"],
            repo_root=repo_root,
            runner=runner,
        ),
        check_npm(repo_root, runner),
        check_python(expected_versions["python"], python_version),
        check_git_branch(repo_root, runner),
    ]


def exit_code_for(results: list[CheckResult]) -> int:
    return 0 if all(result.ok for result in results) else 1


def print_results(results: list[CheckResult]) -> None:
    for result in results:
        status = "OK" if result.ok else "FAIL"
        print(f"[{status}] {result.name}: {result.detail}")


def main() -> int:
    repo_root = repository_root()
    try:
        expected_versions = load_expected_versions(repo_root)
    except (OSError, tomllib.TOMLDecodeError, ValueError):
        print("[FAIL] Configuration: could not load runtime versions from mise.toml")
        return 1

    results = run_checks(repo_root, expected_versions)
    print_results(results)
    return exit_code_for(results)


if __name__ == "__main__":
    sys.exit(main())
