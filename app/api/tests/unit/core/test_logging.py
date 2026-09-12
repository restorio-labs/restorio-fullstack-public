import logging

from core.foundation.logging.logger import setup_logger


def test_setup_logger_creates_handler() -> None:
    name = "restorio-test-logger"

    logger = logging.getLogger(name)
    logger.handlers.clear()

    configured = setup_logger(name)

    assert configured is logger
    assert len(configured.handlers) == 1


def test_setup_logger_reuses_existing_logger() -> None:
    name = "restorio-test-logger-reuse"

    first = setup_logger(name)
    handler_count = len(first.handlers)

    second = setup_logger(name)

    assert second is first
    assert len(second.handlers) == handler_count
