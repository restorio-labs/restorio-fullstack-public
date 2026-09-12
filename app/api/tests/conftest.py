"""Global test configuration.

Keeps test collection deterministic regardless of developer shell env.
"""

import os

# Some local shells export DEBUG=release, but Settings expects a boolean.
os.environ["DEBUG"] = "false"
# Ensure production-only config guards do not interfere with unit tests.
os.environ.setdefault("ENV", "test")
