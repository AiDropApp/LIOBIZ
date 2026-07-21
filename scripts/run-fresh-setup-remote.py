#!/usr/bin/env python3
"""Run fresh-server-setup.sh on VPS via SSH (password or key)."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import paramiko

HOST = "185.205.203.116"
USER = "root"
KEY = Path.home() / ".ssh" / "id_ed25519_liobiz"
SCRIPT = Path(__file__).resolve().parent / "fresh-server-setup.sh"


def main() -> int:
    if not SCRIPT.is_file():
        print(f"Missing script: {SCRIPT}", file=sys.stderr)
        return 1

    script = SCRIPT.read_text(encoding="utf-8")
    password = os.environ.get("LIOBIZ_VPS_PASSWORD", "")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        if KEY.is_file():
            try:
                client.connect(
                    HOST,
                    username=USER,
                    key_filename=str(KEY),
                    timeout=30,
                    banner_timeout=30,
                    auth_timeout=30,
                )
                print("Connected with SSH key")
            except paramiko.AuthenticationException:
                if not password:
                    print("Key auth failed; set LIOBIZ_VPS_PASSWORD env var", file=sys.stderr)
                    return 1
                client.connect(
                    HOST,
                    username=USER,
                    password=password,
                    timeout=30,
                    banner_timeout=30,
                    auth_timeout=30,
                )
                print("Connected with password")
        elif password:
            client.connect(
                HOST,
                username=USER,
                password=password,
                timeout=30,
                banner_timeout=30,
                auth_timeout=30,
            )
            print("Connected with password")
        else:
            print("No key and no LIOBIZ_VPS_PASSWORD", file=sys.stderr)
            return 1

        transport = client.get_transport()
        if transport is None:
            print("No transport", file=sys.stderr)
            return 1
        transport.set_keepalive(30)

        stdin, stdout, stderr = client.exec_command(f"bash -s << 'LIOBIZ_SETUP_EOF'\n{script}\nLIOBIZ_SETUP_EOF", get_pty=True)
        for line in stdout:
            print(line, end="")
        err = stderr.read().decode("utf-8", errors="replace")
        if err.strip():
            print(err, file=sys.stderr)
        code = stdout.channel.recv_exit_status()
        return code
    finally:
        client.close()


if __name__ == "__main__":
    raise SystemExit(main())
