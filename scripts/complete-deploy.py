#!/usr/bin/env python3
"""One-shot: setup VPS + upload tarballs + deploy + verify."""
from __future__ import annotations

import getpass
import os
import subprocess
import sys
import time
from pathlib import Path

import paramiko

HOST = "185.205.203.116"
USER = "root"
KEY = Path.home() / ".ssh" / "id_ed25519_liobiz"
ROOT = Path(__file__).resolve().parent.parent
REMOTE_SCRIPT = Path(__file__).resolve().parent / "complete-deploy-remote.sh"


def run_local(cmd: list[str], cwd: Path = ROOT) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True)


def connect(password: str = "") -> paramiko.SSHClient:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    last_err: Exception | None = None
    for attempt in range(1, 16):
        try:
            if KEY.is_file():
                try:
                    client.connect(
                        HOST,
                        username=USER,
                        key_filename=str(KEY),
                        timeout=25,
                        banner_timeout=25,
                        auth_timeout=25,
                    )
                    print("Connected with SSH key")
                    return client
                except paramiko.AuthenticationException:
                    if not password:
                        raise
            if password:
                client.connect(
                    HOST,
                    username=USER,
                    password=password,
                    timeout=25,
                    banner_timeout=25,
                    auth_timeout=25,
                )
                print("Connected with password")
                return client
            raise paramiko.AuthenticationException("No auth method")
        except Exception as exc:
            last_err = exc
            print(f"Connect attempt {attempt}/15 failed: {exc}")
            time.sleep(4)
    raise SystemExit(f"Cannot connect to {HOST}: {last_err}")


def exec_script(client: paramiko.SSHClient, script: str) -> int:
    transport = client.get_transport()
    if transport:
        transport.set_keepalive(30)
    _, stdout, stderr = client.exec_command(f"bash -s << 'LIOBIZ_EOF'\n{script}\nLIOBIZ_EOF", get_pty=True)
    for line in stdout:
        print(line, end="")
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        print(err, file=sys.stderr)
    return stdout.channel.recv_exit_status()


def upload(client: paramiko.SSHClient, local: Path, remote: str) -> None:
    sftp = client.open_sftp()
    try:
        print(f"Upload {local.name} -> {remote}")
        sftp.put(str(local), remote)
    finally:
        sftp.close()


def main() -> int:
    password = os.environ.get("LIOBIZ_VPS_PASSWORD", "")
    if len(sys.argv) > 1 and sys.argv[1] == "--password-next":
        password = sys.argv[2] if len(sys.argv) > 2 else ""
    if not password:
        try:
            client = connect("")
        except SystemExit:
            if sys.stdin.isatty():
                password = getpass.getpass(f"SSH password for {USER}@{HOST}: ")
                client = connect(password)
            else:
                print("Set LIOBIZ_VPS_PASSWORD or run interactively", file=sys.stderr)
                return 1
    else:
        client = connect(password)

    try:
        print("=== LOCAL BUILD ===")
        run_local(["pnpm", "build"])
        deploy_tar = ROOT / "deploy-full.tar"
        next_tar = ROOT / "next-build.tar"
        for p in (deploy_tar, next_tar):
            if p.exists():
                p.unlink()
        run_local(
            [
                "tar",
                "-cf",
                "deploy-full.tar",
                "--exclude=node_modules",
                "--exclude=.next",
                "--exclude=.git",
                "--exclude=.deploy",
                "--exclude=data",
                "--exclude=header.mp4",
                "--exclude=docs/screenshots",
                "--exclude=public/uploads",
                "--exclude=.env.local",
                "--exclude=deploy-full.tar",
                "--exclude=next-build.tar",
                "-C",
                str(ROOT),
                ".",
            ]
        )
        run_local(["tar", "-cf", "next-build.tar", "-C", str(ROOT), ".next"])

        print("=== UPLOAD ===")
        upload(client, deploy_tar, "/tmp/deploy-full.tar")
        upload(client, next_tar, "/tmp/next-build.tar")

        print("=== REMOTE DEPLOY ===")
        remote = REMOTE_SCRIPT.read_text(encoding="utf-8")
        code = exec_script(client, remote)
        if code != 0:
            return code

        print("=== TEST KEY AUTH ===")
        client.close()
        time.sleep(2)
        client = connect("")
        _, stdout, _ = client.exec_command("curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/")
        code3000 = stdout.read().decode().strip()
        print(f"local3000 HTTP: {code3000}")
        return 0 if code3000 == "200" else 1
    finally:
        client.close()
        for name in ("deploy-full.tar", "next-build.tar"):
            p = ROOT / name
            if p.exists():
                p.unlink()


if __name__ == "__main__":
    raise SystemExit(main())
