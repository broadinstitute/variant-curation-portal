#!/usr/bin/env python3

import subprocess
import sys


def run(cmd, check=lambda returncode: returncode == 0):
    sys.stdout.write(cmd)
    sys.stdout.flush()
    process = subprocess.run(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
    success = check(process.returncode)
    sys.stdout.write(" ✓\n" if success else " FAILED\n")
    return success


# Pylint's return code is a bit-ORed value.
# 1 = fatal, 2 = error, 4 = warning, 8 = refactor, 16 = convention, 32 = usage
def check_pylint(returncode):
    return (returncode & 0b111) == 0


check_statuses = [
    run("pylint --disable=fixme curation_portal", check=check_pylint),
    run("pylint tests/*", check=check_pylint),
    run("black --check curation_portal"),
    run("black --check tests"),
    run("yarn run eslint assets"),
]

exit_code = 0 if all(check_statuses) else 1
sys.exit(exit_code)
