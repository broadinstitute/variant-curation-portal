"""Django settings for local development."""

from .base import *  # pylint: disable=wildcard-import,unused-wildcard-import


DEBUG = True

# Log database queries
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"level": "DEBUG", "class": "logging.StreamHandler"}},
    "loggers": {"django": {"handlers": ["console"], "level": "DEBUG", "propagate": False}},
}
